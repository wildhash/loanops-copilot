from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import json
import aiofiles
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'loanops_copilot')]

# LLM API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="LoanOps Copilot API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class Covenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    type: str  # financial, operational, negative, affirmative
    name: str
    description: str
    threshold: Optional[str] = None
    current_value: Optional[str] = None
    status: str = "pending"  # compliant, at_risk, breached, pending
    risk_level: str = "low"  # low, medium, high, critical
    explanation: str = ""
    due_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Obligation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    type: str  # financial_report, compliance_certificate, audit_report, notice
    name: str
    description: str
    frequency: str  # monthly, quarterly, annually, one_time
    due_date: str
    status: str = "pending"  # submitted, pending, overdue
    submitted_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    filename: str
    file_type: str
    file_size: int
    version: int = 1
    content_preview: Optional[str] = None
    extracted_terms: Optional[Dict[str, Any]] = None
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RiskFactor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    category: str  # covenant, reporting, document, market
    severity: str  # low, medium, high, critical
    title: str
    description: str
    impact: str
    recommendation: str
    score: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuditEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    event_type: str  # document_upload, covenant_extracted, risk_detected, status_change, analysis_complete
    title: str
    description: str
    user: str = "System"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Optional[Dict[str, Any]] = None

class Loan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    borrower: str
    facility_amount: float
    currency: str = "USD"
    margin: str = ""
    maturity_date: str = ""
    agent_bank: str = ""
    syndicate_members: List[str] = []
    loan_type: str = ""  # term_loan, revolving_credit, bridge_loan
    status: str = "active"  # active, closed, defaulted
    health_score: int = 100
    health_status: str = "healthy"  # healthy, warning, critical
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VersionComparison(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loan_id: str
    doc1_id: str
    doc2_id: str
    differences: List[Dict[str, Any]] = []
    comparison_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== REQUEST/RESPONSE MODELS ==============

class LoanCreate(BaseModel):
    name: str
    borrower: str
    facility_amount: float
    currency: str = "USD"
    margin: str = ""
    maturity_date: str = ""
    agent_bank: str = ""
    loan_type: str = ""

class CovenantCreate(BaseModel):
    loan_id: str
    type: str
    name: str
    description: str
    threshold: Optional[str] = None
    due_date: Optional[str] = None

class ObligationCreate(BaseModel):
    loan_id: str
    type: str
    name: str
    description: str
    frequency: str
    due_date: str

class AnalyzeDocumentRequest(BaseModel):
    loan_id: str
    document_id: str

class CompareVersionsRequest(BaseModel):
    loan_id: str
    doc1_id: str
    doc2_id: str

# ============== HELPER FUNCTIONS ==============

def serialize_datetime(obj):
    """Convert datetime objects to ISO format strings"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def serialize_doc(doc: dict) -> dict:
    """Serialize a MongoDB document for JSON response"""
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

async def add_audit_event(loan_id: str, event_type: str, title: str, description: str, metadata: dict = None):
    """Add an audit event to the database"""
    event = AuditEvent(
        loan_id=loan_id,
        event_type=event_type,
        title=title,
        description=description,
        metadata=metadata
    )
    doc = event.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.audit_events.insert_one(doc)

async def calculate_loan_health(loan_id: str) -> tuple:
    """Calculate loan health score based on covenants, obligations, and risks"""
    covenants = await db.covenants.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    obligations = await db.obligations.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    risks = await db.risk_factors.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    
    score = 100
    
    # Covenant impact
    for cov in covenants:
        if cov.get('status') == 'breached':
            score -= 25
        elif cov.get('status') == 'at_risk':
            score -= 10
    
    # Obligation impact
    for obl in obligations:
        if obl.get('status') == 'overdue':
            score -= 15
    
    # Risk factor impact
    for risk in risks:
        if risk.get('severity') == 'critical':
            score -= 20
        elif risk.get('severity') == 'high':
            score -= 10
        elif risk.get('severity') == 'medium':
            score -= 5
    
    score = max(0, min(100, score))
    
    if score >= 80:
        status = "healthy"
    elif score >= 50:
        status = "warning"
    else:
        status = "critical"
    
    return score, status

# ============== AI ANALYSIS FUNCTIONS ==============

async def analyze_document_with_ai(document_content: str, loan_id: str) -> dict:
    """Use AI to extract terms and covenants from document"""
    if not EMERGENT_LLM_KEY:
        logger.warning("No EMERGENT_LLM_KEY set, using mock analysis")
        return get_mock_analysis()
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"doc-analysis-{uuid.uuid4()}",
            system_message="""You are an expert loan document analyst. Extract key information from loan documents.
            Return your analysis as a JSON object with the following structure:
            {
                "borrower": "company name",
                "facility_amount": number,
                "currency": "USD/EUR/GBP",
                "margin": "percentage or description",
                "maturity_date": "YYYY-MM-DD",
                "agent_bank": "bank name",
                "loan_type": "term_loan/revolving_credit/bridge_loan",
                "covenants": [
                    {
                        "type": "financial/operational/negative/affirmative",
                        "name": "covenant name",
                        "description": "detailed description",
                        "threshold": "specific threshold value",
                        "risk_level": "low/medium/high",
                        "explanation": "plain English explanation of what this means"
                    }
                ],
                "key_terms": {
                    "interest_rate": "description",
                    "payment_frequency": "description",
                    "prepayment_terms": "description"
                }
            }"""
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(
            text=f"Please analyze this loan document and extract all key terms, covenants, and obligations:\n\n{document_content[:8000]}"
        )
        
        response = await chat.send_message(user_message)
        
        # Try to parse JSON from response
        try:
            # Find JSON in response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            logger.warning("Could not parse AI response as JSON, using mock data")
            
        return get_mock_analysis()
        
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return get_mock_analysis()

def get_mock_analysis() -> dict:
    """Return mock analysis data for demo purposes"""
    return {
        "borrower": "Extracted from document",
        "facility_amount": 0,
        "currency": "USD",
        "margin": "SOFR + applicable margin",
        "covenants": [],
        "key_terms": {}
    }

# ============== DEMO DATA ==============

DEMO_LOAN = {
    "id": "demo-loan-001",
    "name": "Acme Corp Senior Secured Credit Facility",
    "borrower": "Acme Corporation Ltd.",
    "facility_amount": 250000000,
    "currency": "USD",
    "margin": "SOFR + 2.75%",
    "maturity_date": "2028-06-15",
    "agent_bank": "Global Bank PLC",
    "syndicate_members": ["First National Bank", "Capital Partners Ltd", "Investment Bank Corp", "Regional Finance Co"],
    "loan_type": "term_loan",
    "status": "active",
    "health_score": 72,
    "health_status": "warning"
}

DEMO_COVENANTS = [
    {
        "id": "cov-001",
        "loan_id": "demo-loan-001",
        "type": "financial",
        "name": "Leverage Ratio",
        "description": "Total Debt to EBITDA ratio must not exceed threshold",
        "threshold": "≤ 4.0x",
        "current_value": "3.8x",
        "status": "compliant",
        "risk_level": "medium",
        "explanation": "The company must maintain a debt-to-EBITDA ratio of 4.0x or less. Currently at 3.8x, providing a 5% buffer before breach.",
        "due_date": "2025-03-31"
    },
    {
        "id": "cov-002",
        "loan_id": "demo-loan-001",
        "type": "financial",
        "name": "Interest Coverage Ratio",
        "description": "EBITDA to Interest Expense must exceed minimum threshold",
        "threshold": "≥ 3.0x",
        "current_value": "3.2x",
        "status": "at_risk",
        "risk_level": "high",
        "explanation": "Interest coverage is approaching the minimum threshold. A decline in EBITDA or increase in interest rates could trigger a breach.",
        "due_date": "2025-03-31"
    },
    {
        "id": "cov-003",
        "loan_id": "demo-loan-001",
        "type": "financial",
        "name": "Minimum Liquidity",
        "description": "Maintain minimum cash and available credit",
        "threshold": "≥ $25M",
        "current_value": "$42M",
        "status": "compliant",
        "risk_level": "low",
        "explanation": "The borrower must maintain at least $25 million in liquidity (cash plus available credit lines). Currently well above threshold.",
        "due_date": None
    },
    {
        "id": "cov-004",
        "loan_id": "demo-loan-001",
        "type": "negative",
        "name": "Restricted Payments",
        "description": "Limitations on dividends and share repurchases",
        "threshold": "Max $10M annually",
        "current_value": "$8.5M YTD",
        "status": "compliant",
        "risk_level": "low",
        "explanation": "Dividend payments and share repurchases are limited to $10 million per fiscal year. Current spend leaves $1.5M capacity.",
        "due_date": "2025-12-31"
    },
    {
        "id": "cov-005",
        "loan_id": "demo-loan-001",
        "type": "affirmative",
        "name": "Insurance Maintenance",
        "description": "Maintain adequate insurance coverage on all material assets",
        "threshold": "Coverage ≥ 100% of asset value",
        "current_value": "115% coverage",
        "status": "compliant",
        "risk_level": "low",
        "explanation": "The borrower must maintain insurance on all material assets equal to at least their replacement value. Currently exceeds requirement.",
        "due_date": None
    }
]

DEMO_OBLIGATIONS = [
    {
        "id": "obl-001",
        "loan_id": "demo-loan-001",
        "type": "financial_report",
        "name": "Quarterly Financial Statements",
        "description": "Unaudited financial statements within 45 days of quarter end",
        "frequency": "quarterly",
        "due_date": "2025-02-14",
        "status": "pending"
    },
    {
        "id": "obl-002",
        "loan_id": "demo-loan-001",
        "type": "compliance_certificate",
        "name": "Covenant Compliance Certificate",
        "description": "Officer certificate confirming covenant compliance",
        "frequency": "quarterly",
        "due_date": "2025-02-14",
        "status": "pending"
    },
    {
        "id": "obl-003",
        "loan_id": "demo-loan-001",
        "type": "audit_report",
        "name": "Annual Audited Financials",
        "description": "Audited financial statements within 90 days of fiscal year end",
        "frequency": "annually",
        "due_date": "2025-03-31",
        "status": "pending"
    },
    {
        "id": "obl-004",
        "loan_id": "demo-loan-001",
        "type": "notice",
        "name": "Material Event Notice",
        "description": "Notification of any material adverse change within 5 business days",
        "frequency": "one_time",
        "due_date": "As needed",
        "status": "submitted"
    }
]

DEMO_RISK_FACTORS = [
    {
        "id": "risk-001",
        "loan_id": "demo-loan-001",
        "category": "covenant",
        "severity": "high",
        "title": "Interest Coverage Ratio At Risk",
        "description": "ICR at 3.2x is only 6.7% above the 3.0x minimum threshold",
        "impact": "A breach could trigger cross-default provisions and accelerate repayment",
        "recommendation": "Monitor monthly EBITDA trends and consider hedging interest rate exposure",
        "score": 70
    },
    {
        "id": "risk-002",
        "loan_id": "demo-loan-001",
        "category": "reporting",
        "severity": "medium",
        "title": "Upcoming Compliance Deadline",
        "description": "Q4 2024 compliance certificate due in 21 days",
        "impact": "Late submission could constitute a technical default",
        "recommendation": "Begin preparation of compliance certificate immediately",
        "score": 45
    },
    {
        "id": "risk-003",
        "loan_id": "demo-loan-001",
        "category": "market",
        "severity": "medium",
        "title": "Interest Rate Exposure",
        "description": "Floating rate loan exposed to SOFR increases",
        "impact": "Each 25bp rate increase reduces interest coverage by approximately 0.1x",
        "recommendation": "Consider interest rate swap or cap to lock in current rates",
        "score": 40
    }
]

DEMO_AUDIT_EVENTS = [
    {
        "id": "audit-001",
        "loan_id": "demo-loan-001",
        "event_type": "document_upload",
        "title": "Credit Agreement Uploaded",
        "description": "Initial credit agreement document uploaded for analysis",
        "user": "John Smith",
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    },
    {
        "id": "audit-002",
        "loan_id": "demo-loan-001",
        "event_type": "covenant_extracted",
        "title": "5 Covenants Identified",
        "description": "AI analysis extracted 5 covenants from credit agreement",
        "user": "System",
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    },
    {
        "id": "audit-003",
        "loan_id": "demo-loan-001",
        "event_type": "status_change",
        "title": "ICR Status Changed to At-Risk",
        "description": "Interest Coverage Ratio dropped below warning threshold",
        "user": "System",
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    },
    {
        "id": "audit-004",
        "loan_id": "demo-loan-001",
        "event_type": "risk_detected",
        "title": "High Risk Alert Generated",
        "description": "System detected elevated risk due to covenant proximity to breach",
        "user": "System",
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    },
    {
        "id": "audit-005",
        "loan_id": "demo-loan-001",
        "event_type": "analysis_complete",
        "title": "Risk Analysis Updated",
        "description": "Comprehensive risk analysis completed with 3 risk factors identified",
        "user": "System",
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    }
]

DEMO_DOCUMENTS = [
    {
        "id": "doc-001",
        "loan_id": "demo-loan-001",
        "filename": "Acme_Credit_Agreement_v1.pdf",
        "file_type": "application/pdf",
        "file_size": 2456789,
        "version": 1,
        "content_preview": "CREDIT AGREEMENT dated as of June 15, 2023...",
        "upload_date": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    },
    {
        "id": "doc-002",
        "loan_id": "demo-loan-001",
        "filename": "Acme_Credit_Agreement_v2.pdf",
        "file_type": "application/pdf",
        "file_size": 2567890,
        "version": 2,
        "content_preview": "AMENDED AND RESTATED CREDIT AGREEMENT...",
        "upload_date": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
    }
]

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "LoanOps Copilot API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ---- Loans ----

@api_router.get("/loans")
async def get_loans():
    """Get all loans"""
    loans = await db.loans.find({}, {"_id": 0}).to_list(100)
    return {"loans": loans}

@api_router.get("/loans/{loan_id}")
async def get_loan(loan_id: str):
    """Get a specific loan by ID"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

@api_router.post("/loans")
async def create_loan(loan_data: LoanCreate):
    """Create a new loan"""
    loan = Loan(**loan_data.model_dump())
    doc = loan.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.loans.insert_one(doc)
    
    await add_audit_event(
        loan.id, "document_upload", "Loan Created",
        f"New loan '{loan.name}' created for {loan.borrower}"
    )
    
    return loan

@api_router.put("/loans/{loan_id}")
async def update_loan(loan_id: str, updates: dict):
    """Update a loan"""
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.loans.update_one({"id": loan_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Loan not found")
    return {"message": "Loan updated successfully"}

@api_router.delete("/loans/{loan_id}")
async def delete_loan(loan_id: str):
    """Delete a loan and all associated data"""
    await db.loans.delete_one({"id": loan_id})
    await db.covenants.delete_many({"loan_id": loan_id})
    await db.obligations.delete_many({"loan_id": loan_id})
    await db.documents.delete_many({"loan_id": loan_id})
    await db.risk_factors.delete_many({"loan_id": loan_id})
    await db.audit_events.delete_many({"loan_id": loan_id})
    return {"message": "Loan deleted successfully"}

# ---- Demo Data ----

@api_router.post("/demo/load")
async def load_demo_data():
    """Load demo data for demonstration"""
    # Clear ALL existing demo data thoroughly
    await db.loans.delete_many({"id": "demo-loan-001"})
    await db.covenants.delete_many({"loan_id": "demo-loan-001"})
    await db.obligations.delete_many({"loan_id": "demo-loan-001"})
    await db.documents.delete_many({"loan_id": "demo-loan-001"})
    await db.risk_factors.delete_many({"loan_id": "demo-loan-001"})
    await db.audit_events.delete_many({"loan_id": "demo-loan-001"})
    await db.version_comparisons.delete_many({"loan_id": "demo-loan-001"})
    
    # Insert demo loan
    demo_loan = DEMO_LOAN.copy()
    demo_loan['created_at'] = datetime.now(timezone.utc).isoformat()
    demo_loan['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.loans.insert_one(demo_loan)
    
    # Insert demo covenants
    for cov in DEMO_COVENANTS:
        cov_copy = cov.copy()
        cov_copy['created_at'] = datetime.now(timezone.utc).isoformat()
        cov_copy['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.covenants.insert_one(cov_copy)
    
    # Insert demo obligations
    for obl in DEMO_OBLIGATIONS:
        obl_copy = obl.copy()
        obl_copy['created_at'] = datetime.now(timezone.utc).isoformat()
        await db.obligations.insert_one(obl_copy)
    
    # Insert demo risk factors
    for risk in DEMO_RISK_FACTORS:
        risk_copy = risk.copy()
        risk_copy['created_at'] = datetime.now(timezone.utc).isoformat()
        await db.risk_factors.insert_one(risk_copy)
    
    # Insert demo audit events
    for event in DEMO_AUDIT_EVENTS:
        await db.audit_events.insert_one(event.copy())
    
    # Insert demo documents
    for doc in DEMO_DOCUMENTS:
        await db.documents.insert_one(doc.copy())
    
    return {
        "message": "Demo data loaded successfully",
        "loan_id": "demo-loan-001",
        "covenants_count": len(DEMO_COVENANTS),
        "obligations_count": len(DEMO_OBLIGATIONS),
        "risk_factors_count": len(DEMO_RISK_FACTORS)
    }

# ---- Covenants ----

@api_router.get("/loans/{loan_id}/covenants")
async def get_covenants(loan_id: str):
    """Get all covenants for a loan"""
    covenants = await db.covenants.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    return {"covenants": covenants}

@api_router.post("/covenants")
async def create_covenant(covenant_data: CovenantCreate):
    """Create a new covenant"""
    covenant = Covenant(**covenant_data.model_dump())
    doc = covenant.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.covenants.insert_one(doc)
    
    await add_audit_event(
        covenant.loan_id, "covenant_extracted", f"Covenant Added: {covenant.name}",
        f"New {covenant.type} covenant added: {covenant.description}"
    )
    
    # Recalculate loan health
    score, status = await calculate_loan_health(covenant.loan_id)
    await db.loans.update_one(
        {"id": covenant.loan_id},
        {"$set": {"health_score": score, "health_status": status}}
    )
    
    return covenant

@api_router.put("/covenants/{covenant_id}")
async def update_covenant(covenant_id: str, updates: dict):
    """Update a covenant status"""
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.covenants.update_one({"id": covenant_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Covenant not found")
    
    # Get covenant to find loan_id
    covenant = await db.covenants.find_one({"id": covenant_id}, {"_id": 0})
    if covenant:
        await add_audit_event(
            covenant['loan_id'], "status_change", f"Covenant Updated: {covenant['name']}",
            f"Status changed to {updates.get('status', 'updated')}"
        )
        
        # Recalculate loan health
        score, status = await calculate_loan_health(covenant['loan_id'])
        await db.loans.update_one(
            {"id": covenant['loan_id']},
            {"$set": {"health_score": score, "health_status": status}}
        )
    
    return {"message": "Covenant updated successfully"}

# ---- Obligations ----

@api_router.get("/loans/{loan_id}/obligations")
async def get_obligations(loan_id: str):
    """Get all obligations for a loan"""
    obligations = await db.obligations.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    return {"obligations": obligations}

@api_router.post("/obligations")
async def create_obligation(obligation_data: ObligationCreate):
    """Create a new obligation"""
    obligation = Obligation(**obligation_data.model_dump())
    doc = obligation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.obligations.insert_one(doc)
    
    await add_audit_event(
        obligation.loan_id, "document_upload", f"Obligation Added: {obligation.name}",
        f"New {obligation.type} obligation due {obligation.due_date}"
    )
    
    return obligation

@api_router.put("/obligations/{obligation_id}")
async def update_obligation(obligation_id: str, updates: dict):
    """Update an obligation"""
    result = await db.obligations.update_one({"id": obligation_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return {"message": "Obligation updated successfully"}

# ---- Documents ----

@api_router.get("/loans/{loan_id}/documents")
async def get_documents(loan_id: str):
    """Get all documents for a loan"""
    documents = await db.documents.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    return {"documents": documents}

@api_router.post("/loans/{loan_id}/documents/upload")
async def upload_document(loan_id: str, file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Upload a document for a loan"""
    # Save file temporarily
    upload_dir = Path("/tmp/loanops_uploads")
    upload_dir.mkdir(exist_ok=True)
    
    file_path = upload_dir / f"{uuid.uuid4()}_{file.filename}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Get version number
    existing_docs = await db.documents.count_documents({"loan_id": loan_id})
    version = existing_docs + 1
    
    # Create document record
    document = Document(
        loan_id=loan_id,
        filename=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        version=version,
        content_preview=content[:500].decode('utf-8', errors='ignore') if content else None
    )
    
    doc = document.model_dump()
    doc['upload_date'] = doc['upload_date'].isoformat()
    doc['file_path'] = str(file_path)
    await db.documents.insert_one(doc)
    
    await add_audit_event(
        loan_id, "document_upload", f"Document Uploaded: {file.filename}",
        f"Version {version} uploaded ({len(content)} bytes)"
    )
    
    return {"document": doc, "message": "Document uploaded successfully"}

@api_router.post("/documents/{document_id}/analyze")
async def analyze_document(document_id: str):
    """Analyze a document using AI to extract terms and covenants"""
    document = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Read document content
    file_path = document.get('file_path')
    content = ""
    
    if file_path and Path(file_path).exists():
        async with aiofiles.open(file_path, 'r', errors='ignore') as f:
            content = await f.read()
    elif document.get('content_preview'):
        content = document['content_preview']
    
    if not content:
        return {"message": "No content to analyze", "extracted_terms": {}}
    
    # Analyze with AI
    analysis = await analyze_document_with_ai(content, document['loan_id'])
    
    # Update document with extracted terms
    await db.documents.update_one(
        {"id": document_id},
        {"$set": {"extracted_terms": analysis}}
    )
    
    # Create covenants from analysis
    covenants_created = 0
    for cov_data in analysis.get('covenants', []):
        covenant = Covenant(
            loan_id=document['loan_id'],
            type=cov_data.get('type', 'financial'),
            name=cov_data.get('name', 'Extracted Covenant'),
            description=cov_data.get('description', ''),
            threshold=cov_data.get('threshold'),
            risk_level=cov_data.get('risk_level', 'medium'),
            explanation=cov_data.get('explanation', '')
        )
        doc = covenant.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.covenants.insert_one(doc)
        covenants_created += 1
    
    await add_audit_event(
        document['loan_id'], "analysis_complete", "AI Analysis Complete",
        f"Extracted {covenants_created} covenants from {document['filename']}"
    )
    
    return {
        "message": "Analysis complete",
        "extracted_terms": analysis,
        "covenants_created": covenants_created
    }

# ---- Risk Factors ----

@api_router.get("/loans/{loan_id}/risks")
async def get_risk_factors(loan_id: str):
    """Get all risk factors for a loan"""
    risks = await db.risk_factors.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    return {"risk_factors": risks}

@api_router.post("/loans/{loan_id}/analyze-risks")
async def analyze_risks(loan_id: str):
    """Analyze risks for a loan based on current covenants and obligations"""
    covenants = await db.covenants.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    obligations = await db.obligations.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    
    # Clear existing risk factors
    await db.risk_factors.delete_many({"loan_id": loan_id})
    
    risks_created = []
    
    # Analyze covenants
    for cov in covenants:
        if cov.get('status') == 'breached':
            risk = RiskFactor(
                loan_id=loan_id,
                category="covenant",
                severity="critical",
                title=f"{cov['name']} Breached",
                description=f"Covenant {cov['name']} is in breach status",
                impact="May trigger cross-default provisions and loan acceleration",
                recommendation="Immediate stakeholder communication and remediation plan required",
                score=90
            )
            doc = risk.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.risk_factors.insert_one(doc)
            risks_created.append(doc)
            
        elif cov.get('status') == 'at_risk':
            risk = RiskFactor(
                loan_id=loan_id,
                category="covenant",
                severity="high",
                title=f"{cov['name']} At Risk",
                description=f"Covenant {cov['name']} is approaching breach threshold",
                impact="Potential breach could trigger default provisions",
                recommendation=f"Monitor closely and prepare mitigation strategy",
                score=70
            )
            doc = risk.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.risk_factors.insert_one(doc)
            risks_created.append(doc)
    
    # Analyze obligations
    today = datetime.now(timezone.utc).date()
    for obl in obligations:
        if obl.get('status') == 'overdue':
            risk = RiskFactor(
                loan_id=loan_id,
                category="reporting",
                severity="high",
                title=f"Overdue: {obl['name']}",
                description=f"Required {obl['type']} is past due date",
                impact="Technical default may be triggered",
                recommendation="Submit required documentation immediately",
                score=75
            )
            doc = risk.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.risk_factors.insert_one(doc)
            risks_created.append(doc)
    
    # Recalculate loan health
    score, status = await calculate_loan_health(loan_id)
    await db.loans.update_one(
        {"id": loan_id},
        {"$set": {"health_score": score, "health_status": status}}
    )
    
    await add_audit_event(
        loan_id, "analysis_complete", "Risk Analysis Complete",
        f"Identified {len(risks_created)} risk factors"
    )
    
    return {
        "message": "Risk analysis complete",
        "risks_identified": len(risks_created),
        "loan_health_score": score,
        "loan_health_status": status
    }

# ---- Version Comparison ----

@api_router.post("/compare-versions")
async def compare_versions(request: CompareVersionsRequest):
    """Compare two document versions and detect differences"""
    doc1 = await db.documents.find_one({"id": request.doc1_id}, {"_id": 0})
    doc2 = await db.documents.find_one({"id": request.doc2_id}, {"_id": 0})
    
    if not doc1 or not doc2:
        raise HTTPException(status_code=404, detail="One or both documents not found")
    
    # Mock comparison results (in production, would use AI)
    differences = [
        {
            "field": "margin",
            "old_value": "SOFR + 2.50%",
            "new_value": "SOFR + 2.75%",
            "significance": "high",
            "explanation": "Pricing margin increased by 25 basis points"
        },
        {
            "field": "leverage_covenant",
            "old_value": "4.5x",
            "new_value": "4.0x",
            "significance": "critical",
            "explanation": "Maximum leverage ratio tightened from 4.5x to 4.0x"
        },
        {
            "field": "maturity_date",
            "old_value": "2028-06-15",
            "new_value": "2028-06-15",
            "significance": "low",
            "explanation": "No change to maturity date"
        }
    ]
    
    comparison = VersionComparison(
        loan_id=request.loan_id,
        doc1_id=request.doc1_id,
        doc2_id=request.doc2_id,
        differences=differences
    )
    
    doc = comparison.model_dump()
    doc['comparison_date'] = doc['comparison_date'].isoformat()
    await db.version_comparisons.insert_one(doc)
    
    await add_audit_event(
        request.loan_id, "analysis_complete", "Version Comparison Complete",
        f"Compared {doc1['filename']} with {doc2['filename']}: {len(differences)} differences found"
    )
    
    return {
        "comparison_id": comparison.id,
        "differences": differences,
        "doc1": {"id": doc1['id'], "filename": doc1['filename'], "version": doc1['version']},
        "doc2": {"id": doc2['id'], "filename": doc2['filename'], "version": doc2['version']}
    }

@api_router.get("/loans/{loan_id}/comparisons")
async def get_comparisons(loan_id: str):
    """Get all version comparisons for a loan"""
    comparisons = await db.version_comparisons.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    return {"comparisons": comparisons}

# ---- Audit Trail ----

@api_router.get("/loans/{loan_id}/audit")
async def get_audit_trail(loan_id: str):
    """Get audit trail for a loan"""
    events = await db.audit_events.find(
        {"loan_id": loan_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return {"events": events}

@api_router.get("/loans/{loan_id}/dashboard")
async def get_dashboard(loan_id: str):
    """Get dashboard summary for a loan"""
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    covenants = await db.covenants.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    obligations = await db.obligations.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    risks = await db.risk_factors.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    documents = await db.documents.find({"loan_id": loan_id}, {"_id": 0}).to_list(100)
    
    # Calculate metrics
    total_covenants = len(covenants)
    compliant_covenants = len([c for c in covenants if c.get('status') == 'compliant'])
    at_risk_covenants = len([c for c in covenants if c.get('status') == 'at_risk'])
    breached_covenants = len([c for c in covenants if c.get('status') == 'breached'])
    
    pending_obligations = len([o for o in obligations if o.get('status') == 'pending'])
    overdue_obligations = len([o for o in obligations if o.get('status') == 'overdue'])
    
    critical_risks = len([r for r in risks if r.get('severity') == 'critical'])
    high_risks = len([r for r in risks if r.get('severity') == 'high'])
    
    return {
        "loan": loan,
        "metrics": {
            "total_covenants": total_covenants,
            "compliant_covenants": compliant_covenants,
            "at_risk_covenants": at_risk_covenants,
            "breached_covenants": breached_covenants,
            "pending_obligations": pending_obligations,
            "overdue_obligations": overdue_obligations,
            "critical_risks": critical_risks,
            "high_risks": high_risks,
            "total_documents": len(documents)
        },
        "covenants": covenants,
        "obligations": obligations,
        "risk_factors": risks
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
