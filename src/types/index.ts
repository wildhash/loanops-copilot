export interface LoanDocument {
  id: string;
  name: string;
  path: string;
  size: number;
  uploadDate: Date;
  type: 'pdf' | 'doc' | 'docx';
  version?: string;
  extractedData?: ExtractedData;
}

export interface ExtractedData {
  keyTerms: KeyTerm[];
  covenants: Covenant[];
  parties: Party[];
  financialTerms: FinancialTerm[];
  reportingObligations: ReportingObligation[];
}

export interface KeyTerm {
  term: string;
  value: string;
  category: string;
  confidence: number;
  location: string;
  explanation: string;
}

export interface Covenant {
  id: string;
  type: 'financial' | 'operational' | 'negative' | 'affirmative';
  description: string;
  threshold?: string;
  frequency?: string;
  testDate?: Date;
  status: 'compliant' | 'at-risk' | 'breached' | 'pending';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  location: string;
}

export interface Party {
  name: string;
  role: 'borrower' | 'lender' | 'agent' | 'guarantor';
  jurisdiction?: string;
}

export interface FinancialTerm {
  term: string;
  amount: number;
  currency: string;
  description: string;
}

export interface ReportingObligation {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as-needed';
  dueDate?: Date;
  lastSubmitted?: Date;
  status: 'current' | 'due-soon' | 'overdue' | 'submitted';
  recipient: string;
}

export interface VersionDifference {
  type: 'added' | 'removed' | 'modified';
  section: string;
  oldValue?: string;
  newValue?: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
}

export interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
}

export interface LoanHealth {
  loanId: string;
  overallHealth: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  metrics: {
    documentCompliance: number;
    covenantAdherence: number;
    reportingTimeliness: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  alerts: Alert[];
  lastUpdated: Date;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}
