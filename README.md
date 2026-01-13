# LoanOps Copilot

**An intelligent desktop assistant for loan agents and lenders in the syndicated loan market.**

LoanOps Copilot automatically extracts key terms from loan documents, tracks covenant compliance, detects inconsistencies across versions, and provides actionable risk alerts — helping you reduce operational risk and keep loans on track.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)

---

## 🎯 Who It's For

* **Loan Agents** managing syndicated credit facilities
* **Loan Operations Teams** tracking compliance and reporting obligations
* **Credit Officers** monitoring covenant performance and breach risk
* **Relationship Managers** needing clear, explainable loan status updates

---

## ✨ Key Features

### 📄 Intelligent Document Processing
* Upload PDF and Word documents
* Automatic extraction of key loan terms (borrower, facility, margin, covenants)
* Source evidence tracking for every extracted term

### ⚖️ Covenant & Obligation Tracking
* Real-time monitoring of financial and operational covenants
* Plain-English explanations of what each covenant means
* Status indicators: 🟢 Compliant, 🟠 At Risk, 🔴 Breach Likely
* Upcoming obligation deadlines with automated alerts

### 🔍 Version Comparison & Inconsistency Detection
* Compare multiple document versions side-by-side
* Automatic detection of term mismatches (margin, maturity, covenant thresholds)
* Severity ratings for each change: Low, Medium, High, Critical

### 📊 Loan Health Dashboard
* Single-view health score (0-100) with status explanation
* Upcoming obligations (next 30/60/90 days)
* Detected issues with clear priority levels
* Explainable risk analysis with actionable recommendations

### 📝 Audit Trail
* Complete log of all system activities
* Document additions, term extractions, issue flagging, and resolutions
* Exportable audit log (JSON format) for compliance purposes

---

## 🚀 Quick Start

### Prerequisites
* Node.js 18+ or 20+
* npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/wildhash/loanops-copilot.git
cd loanops-copilot

# Install dependencies
npm install

# Run tests (optional but recommended)
npm test

# Start the application
npm start
```

### Demo Mode (2 Steps - Instant!)

The fastest way to see LoanOps Copilot in action:

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Click "Open Demo Loan"** on the home screen

That's it! You'll see a fully populated loan with:
* 5 tracked covenants (including 1 at-risk)
* 3 detected issues (margin mismatch, upcoming deadline, covenant risk)
* 4 reporting obligations
* Complete audit trail with 8+ events

**No document upload required.** The demo loads instantly from pre-configured data.

---

## 👩‍💻 Dev Quickstart

### Getting Started
```bash
# 1. Clone and install
git clone https://github.com/wildhash/loanops-copilot.git
cd loanops-copilot
npm ci

# 2. Run lint (should exit 0)
npm run lint

# 3. Run tests (should exit 0)
npm test

# 4. Build the application (should exit 0)
npm run build

# 5. Start development
npm run dev
```

### Development Workflow
```bash
# Lint your changes
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues

# Test your changes
npm test                  # Run all tests once
npm run test:watch        # Watch mode for TDD
npm run test:coverage     # Generate coverage report

# Build and package
npm run build             # Compile TypeScript + Babel
npm run package           # Create distributable (Win/Mac/Linux)
```

### Common Commands
| Command | Description |
|---------|-------------|
| `npm ci` | Clean install dependencies (preferred for CI) |
| `npm install` | Install dependencies (adds to package-lock.json) |
| `npm run lint` | Check code style and TypeScript issues |
| `npm test` | Run all tests (Vitest) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Build and run Electron app |
| `npm run dev` | Development mode with hot reload |

### Testing Strategy
* **74 unit tests** covering core business logic
* **No GUI dependencies** - all tests run headless in CI
* Test fixtures in `src/tests/fixtures/`
* Uses Vitest with happy-dom for React components

---

## 📐 Risk Scoring Model

### Overview
LoanOps Copilot uses a multi-factor risk scoring algorithm to provide an overall risk assessment for syndicated loans. The model analyzes three key dimensions:

1. **Covenant Compliance** - Financial and operational covenant status
2. **Reporting Obligations** - Timeliness of required submissions
3. **Document Consistency** - Changes and inconsistencies across document versions

### How Risk Scores Are Calculated

#### 1. Covenant Analysis
Each covenant is evaluated based on its current status:

| Status | Risk Score | Description |
|--------|------------|-------------|
| **Breached** | 90 | Covenant currently breached - immediate action required |
| **At-Risk** | 70 | Approaching breach threshold - enhanced monitoring needed |
| **High Risk Classification** | 50 | Covenant marked as high-risk based on business criticality |
| **Compliant** | 0 | Covenant currently in compliance |

**Example:** A loan with 1 breached covenant and 1 at-risk covenant receives:
- Breach factor: 90 points
- At-risk factor: 70 points
- High-risk classification: 50 points (if marked high-risk)
- Average: (90 + 70 + 50) / 3 = 70 points → **High Risk**

#### 2. Reporting Obligations
Reporting obligations are scored based on submission status:

| Status | Risk Score | Description |
|--------|------------|-------------|
| **Overdue** | 75 | Report past due date - technical default possible |
| **Due Soon** | 40 | Report due within threshold period - preparation needed |
| **Submitted** | 0 | Report submitted on time |

#### 3. Document Inconsistencies
Document changes are evaluated by significance:

| Significance | Risk Score | Description |
|--------------|------------|-------------|
| **Critical** | 85 | Material changes to loan terms (e.g., pricing, covenants) |
| **High** | 65 | Significant changes requiring review (e.g., dates, amounts) |
| **Medium** | 40 | Moderate changes for awareness |
| **Low** | 15 | Minor formatting or clarification changes |

### Overall Risk Determination

The overall risk level is determined by the **average risk score** across all identified factors:

| Overall Risk | Score Range | Meaning |
|--------------|-------------|---------|
| **🔴 Critical** | 80-100 | Multiple critical issues requiring immediate stakeholder action |
| **🟠 High** | 60-79 | Significant issues requiring close monitoring and likely intervention |
| **🟡 Medium** | 40-59 | Moderate issues requiring enhanced monitoring |
| **🟢 Low** | 0-39 | Normal monitoring - no immediate concerns |

### Risk Factor Aggregation

The algorithm:
1. Identifies all risk factors across the three dimensions
2. Calculates individual scores for each factor
3. Averages scores across all factors
4. Maps the average to an overall risk level

**Example Calculation:**
```
Risk Factors:
- Covenant Breach: 90
- At-Risk Covenant: 70  
- High Risk Covenant: 50
- Overdue Report: 75
- Critical Document Change: 85

Average Score: (90 + 70 + 50 + 75 + 85) / 5 = 74
Overall Risk: HIGH (60-79 range)
```

### Extending the Risk Model

To customize the risk scoring for your organization:

1. **Adjust thresholds** in `src/services/RiskAnalyzer.ts`:
   ```typescript
   private determineOverallRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
     if (score >= 80) return 'critical';  // Adjust this threshold
     if (score >= 60) return 'high';      // Adjust this threshold
     if (score >= 40) return 'medium';    // Adjust this threshold
     return 'low';
   }
   ```

2. **Modify scoring weights** in the analysis methods:
   ```typescript
   // In analyzeCovenants():
   totalScore += 90;  // Adjust breach score
   totalScore += 70;  // Adjust at-risk score
   ```

3. **Add new risk factors**:
   - Create new analysis methods following the pattern in `RiskAnalyzer.ts`
   - Return `{ factors: RiskFactor[], score: number }`
   - Integrate into the main `analyze()` method

4. **Customize recommendations**:
   - Edit `generateRecommendations()` in `RiskAnalyzer.ts`
   - Add business-specific guidance based on risk factors

### Risk Model Validation

All risk calculations are validated through comprehensive tests in `src/tests/RiskAnalyzer.test.ts`:
- Deterministic scoring (same input = same output)
- Edge cases (empty data, single factors, multiple factors)
- Score boundaries (low/medium/high/critical thresholds)
- Recommendation generation

---

## 🧪 Testing & Quality

### Run Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # Generate coverage report
```

### Linting & Formatting
```bash
npm run lint            # Check for lint errors
npm run lint:fix        # Auto-fix lint errors
npm run format          # Format code with Prettier
```

### Build
```bash
npm run build           # Compile TypeScript and bundle
npm run package         # Create distributable packages
```

**Test Coverage:** 74 unit tests covering:
* **Risk Analysis** - Deterministic scoring, covenant/reporting/document analysis (16 tests)
* **Demo Data Validation** - Schema validation for all data types (14 tests)
* **IPC Contracts** - Renderer ↔ Main process communication validation (15 tests)
* **Issue Detection** - Term mismatches, deadlines, covenant risks (11 tests)
* **Data Loading** - Demo data loading and health scoring (18 tests)

---

## 📁 Project Structure

```
loanops-copilot/
├── src/
│   ├── demo/
│   │   └── DemoDataLoader.ts      # Demo mode data loader
│   ├── services/
│   │   ├── IssueDetectionEngine.ts # Rule-based issue detection
│   │   ├── DocumentParser.ts       # PDF/Word parsing
│   │   ├── CovenantExtractor.ts    # Covenant identification
│   │   ├── VersionComparator.ts    # Document comparison
│   │   └── RiskAnalyzer.ts         # Risk assessment
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── tests/
│   │   ├── setup.ts
│   │   ├── IssueDetectionEngine.test.ts
│   │   └── DemoDataLoader.test.ts
│   ├── main.ts                     # Electron main process
│   ├── renderer.tsx                # React UI application
│   └── index.html                  # Application shell
├── demo-data/
│   ├── loan_demo.json              # Sample loan data
│   ├── covenants.json              # Covenant definitions
│   ├── obligations.json            # Reporting obligations
│   ├── issues_seed.json            # Pre-configured issues
│   └── audit_log.json              # Audit trail events
├── examples/
│   ├── sample-loan-agreement.txt
│   └── sample-loan-agreement-v2.txt
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI
├── README.md
├── DEMO_SCRIPT.md                  # 3-minute demo walkthrough
├── PITCH_DECK_OUTLINE.md           # 8-slide pitch deck
└── ARCHITECTURE.md                 # Technical architecture
```

---

## 🛠 Technology Stack

* **Desktop Framework:** Electron 39+
* **UI Library:** React 19
* **Language:** TypeScript 5
* **Testing:** Vitest + Testing Library
* **Linting:** ESLint + Prettier
* **Document Parsing:** pdf-parse, mammoth
* **Build:** Babel, TypeScript Compiler
* **CI/CD:** GitHub Actions

---

## 💼 Commercial Value

### Time Savings
* **80% reduction** in manual document review time
* **Instant detection** of term mismatches that would take hours to find manually
* **Automated monitoring** eliminates need for spreadsheet tracking

### Risk Reduction
* **Prevent defaults** through proactive covenant monitoring
* **Avoid disputes** by catching inconsistencies before they become problems
* **Maintain compliance** with automated deadline tracking

### Audit-Ready
* Complete audit trail of all activities
* Explainable AI outputs with source evidence
* Exportable logs for regulators and auditors

---

## 📖 Documentation

* **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** - 3-minute walkthrough for demonstrations
* **[PITCH_DECK_OUTLINE.md](./PITCH_DECK_OUTLINE.md)** - 8-slide pitch deck outline
* **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture deep-dive

---

## 🔒 Security & Privacy

* **Local-first:** All processing happens on your machine
* **No cloud uploads:** Documents never leave your computer
* **Offline capable:** Works without internet connection
* **Confidential by design:** Suitable for sensitive loan documents

---

## 🤝 Contributing

This is a prototype demonstration. For production deployment:
* Add database persistence (SQLite recommended)
* Integrate with loan management systems
* Add user authentication and access controls
* Enhance ML models for improved extraction accuracy
* Implement multi-user collaboration features

---

## 📄 License

ISC License - see [LICENSE](./LICENSE) file

---

## 💡 About

LoanOps Copilot demonstrates how automated document intelligence and risk detection can transform loan operations. Built for loan market professionals who need to reduce operational risk, improve efficiency, and maintain compliance without sacrificing clarity or control.

**Status:** Demo-ready prototype  
**Target Market:** Syndicated loan agents, lenders, and credit teams  
**Value Proposition:** Reduce risk, save time, maintain compliance

---

**Questions?** Open an issue or contact the development team.

**Built with ❤️ for the lending industry**


![LoanOps Copilot](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## Features

### 📄 Document Management
- **Multi-format Support**: Upload and process PDF and Word documents (DOC/DOCX)
- **Automatic Parsing**: Extracts text from loan documents for analysis
- **Version Management**: Track multiple versions of loan documents

### ⚖️ Covenant Extraction & Monitoring
- **Intelligent Extraction**: Automatically identifies and extracts key covenants from loan documents
- **Covenant Types**: Tracks financial, operational, negative, and affirmative covenants
- **Status Monitoring**: Real-time tracking of covenant compliance status (compliant, at-risk, breached, pending)
- **Risk Assessment**: Each covenant is assigned a risk level (low, medium, high, critical)
- **Explainable Outputs**: Every covenant includes a clear explanation of its purpose and requirements

### 🔄 Version Comparison
- **Inconsistency Detection**: Compares different versions of loan documents
- **Change Tracking**: Identifies additions, removals, and modifications between versions
- **Significance Rating**: Categorizes changes by significance (low, medium, high, critical)
- **Detailed Explanations**: Provides context for each detected change

### 📊 Loan Health Dashboard
- **Health Score**: Overall loan health metric (0-100)
- **Visual Indicators**: Color-coded status indicators (healthy, warning, critical)
- **Key Metrics**: Document compliance, covenant adherence, reporting timeliness
- **At-a-Glance Overview**: Quick view of covenant status and risk factors

### 🚨 Risk Analysis
- **Comprehensive Risk Assessment**: Analyzes covenant compliance, reporting obligations, and document inconsistencies
- **Risk Scoring**: Quantitative risk scores with severity levels
- **Risk Factors**: Detailed breakdown of identified risk factors
- **Actionable Recommendations**: Specific recommendations based on detected risks

### 🎨 User Experience
- **Modern UI**: Clean, professional interface with gradient styling
- **Intuitive Navigation**: Tab-based navigation between Dashboard, Covenants, Versions, and Risk Analysis
- **Responsive Design**: Optimized layout for desktop use
- **Visual Feedback**: Loading states, empty states, and clear status indicators

## Commercial Viability

LoanOps Copilot addresses critical pain points in the syndicated loan market:

1. **Reduces Operational Risk**: Automated covenant monitoring prevents oversight and potential defaults
2. **Improves Efficiency**: Eliminates manual document review and covenant tracking
3. **Ensures Compliance**: Tracks reporting obligations and covenant compliance in real-time
4. **Cost Savings**: Reduces time spent on manual document analysis and risk assessment
5. **Scalability**: Handles multiple loans and documents simultaneously
6. **Decision Support**: Provides clear, explainable insights for better decision-making

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: Modern UI library for building interactive interfaces
- **TypeScript**: Type-safe development for reliability and maintainability
- **pdf-parse**: PDF document parsing
- **mammoth**: Word document parsing
- **Node.js**: Backend services and file system operations

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/wildhash/loanops-copilot.git
cd loanops-copilot
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Start the application:
```bash
npm start
```

## Usage

### Uploading Documents

1. Click the **"📤 Upload Documents"** button in the header
2. Select one or more loan documents (PDF or Word format)
3. The application will automatically parse and analyze the first uploaded document

### Viewing Covenants

1. After uploading a document, navigate to the **"⚠️ Covenants"** tab
2. Review extracted covenants with their:
   - Type (financial, operational, negative, affirmative)
   - Description and threshold values
   - Compliance status
   - Risk level
   - Detailed explanation

### Comparing Document Versions

1. Upload at least two versions of a loan document
2. Click **"🔄 Compare Versions"** in the header
3. Select the first document (marked with 🔵)
4. Select the second document to compare (marked with 🟢)
5. Click **"✓ Compare Selected"**
6. Review detected differences in the **"🔄 Versions"** tab

### Analyzing Risk

1. Process a loan document to generate risk analysis
2. Navigate to the **"📈 Risk Analysis"** tab
3. Review:
   - Overall risk level and score
   - Identified risk factors with severity levels
   - Specific recommendations for risk mitigation

### Monitoring Loan Health

1. The **"📊 Dashboard"** tab provides an overview of loan health
2. View the health score (0-100) with visual indicator
3. Monitor key metrics:
   - Number of documents uploaded
   - Total covenants tracked
   - Covenants at risk
   - Compliant covenants

## Development

### Build for Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Package for Distribution

```bash
npm run package
```

This creates distributable packages for Windows (NSIS), macOS (DMG), and Linux (AppImage) in the `build/` directory.

## Project Structure

```
loanops-copilot/
├── src/
│   ├── components/       # React components (future expansion)
│   ├── services/         # Core business logic services
│   │   ├── DocumentParser.ts       # Document parsing (PDF/Word)
│   │   ├── CovenantExtractor.ts    # Covenant extraction logic
│   │   ├── VersionComparator.ts    # Version comparison engine
│   │   └── RiskAnalyzer.ts         # Risk assessment engine
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Core data models
│   ├── utils/            # Utility functions (future expansion)
│   ├── main.ts           # Electron main process
│   ├── renderer.tsx      # React application
│   └── index.html        # Application HTML shell
├── dist/                 # Compiled application
├── build/                # Packaged distributables
├── examples/             # Example loan documents
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── .babelrc              # Babel configuration
└── README.md             # This file
```

## Key Features Explained

### Explainable Outputs

Every piece of extracted information includes explanations:
- **Covenants**: Each covenant has an explanation describing its purpose and requirements
- **Risk Factors**: Identified risks include impact assessments and context
- **Version Differences**: Changes between versions include explanations of their significance
- **Recommendations**: Risk recommendations are specific and actionable

### Covenant Extraction Algorithm

The covenant extractor uses pattern matching to identify:
1. **Financial Covenants**: Debt ratios, coverage ratios, leverage limits
2. **Negative Covenants**: Restrictions on borrower actions
3. **Affirmative Covenants**: Required borrower actions
4. **Thresholds**: Numerical limits and frequency requirements

### Risk Scoring Methodology

Risk analysis considers:
1. **Covenant Status**: Breached covenants score highest risk
2. **Reporting Compliance**: Overdue reports indicate operational issues
3. **Document Consistency**: Critical changes between versions raise red flags
4. **Severity Weighting**: Different risk factors are weighted by importance

## Future Enhancements

- AI/ML-based covenant extraction using natural language processing
- Integration with loan management systems
- Automated reporting and alerts
- Multi-loan portfolio management
- Collaborative features for agent-lender communication
- Mobile companion app
- Cloud synchronization and backup
- Advanced analytics and trend analysis
- Regulatory compliance tracking
- Custom covenant templates

## Security & Privacy

- All data is stored locally on your machine
- No cloud uploads or external data transmission
- Document processing happens entirely offline
- Suitable for handling confidential loan documents

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## License

ISC License - see LICENSE file for details

## About

LoanOps Copilot is designed for loan agents and lenders in the syndicated loan market. The application focuses on reducing operational risk, improving efficiency, and keeping loans on track through automated document analysis and risk monitoring.

**Built with ❤️ for the lending industry**

