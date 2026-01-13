# LoanOps Copilot

An AI-powered desktop copilot that helps loan agents and lenders track documents, monitor covenants, and prevent operational risk across syndicated loans.

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

