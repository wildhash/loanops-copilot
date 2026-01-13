# LoanOps Copilot - Architecture Documentation

## Overview

LoanOps Copilot is a desktop application built with Electron, React, and TypeScript. It provides loan agents and lenders with tools to manage loan documents, track covenants, detect inconsistencies, and analyze risks.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     LoanOps Copilot                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Presentation Layer (React UI)                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │Dashboard │  │Covenants │  │ Versions │  │  Risk  │ │ │
│  │  │   View   │  │   View   │  │   View   │  │  View  │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▲                                  │
│                            │ IPC (Inter-Process Comm)         │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Main Process (Electron)                       │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │           IPC Handlers                            │  │ │
│  │  │  • upload-document  • parse-document             │  │ │
│  │  │  • extract-covenants • compare-versions          │  │ │
│  │  │  • analyze-risk     • get-loan-health            │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▲                                  │
│                            │                                  │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Service Layer                                 │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────┐ │ │
│  │  │  Document     │  │  Covenant     │  │  Version   │ │ │
│  │  │  Parser       │  │  Extractor    │  │ Comparator │ │ │
│  │  └───────────────┘  └───────────────┘  └────────────┘ │ │
│  │  ┌───────────────┐                                     │ │
│  │  │     Risk      │                                     │ │
│  │  │   Analyzer    │                                     │ │
│  │  └───────────────┘                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ▲                                  │
│                            │                                  │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         External Libraries                              │ │
│  │  • pdf-parse (PDF extraction)                          │ │
│  │  • mammoth (Word document extraction)                  │ │
│  │  • Node.js fs (file system operations)                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Presentation Layer (renderer.tsx)

**Responsibility**: User interface and interaction

**Key Components**:
- **App Component**: Main React component managing application state
- **Dashboard View**: Overview of loan health, metrics, and key covenants
- **Covenants View**: Detailed list of extracted covenants with explanations
- **Versions View**: Comparison results between document versions
- **Risk View**: Risk analysis with factors and recommendations

**State Management**:
- Documents: Array of uploaded loan documents
- Selected Document: Currently active document
- Covenants: Extracted covenant data
- Risk Analysis: Current risk assessment
- Differences: Version comparison results
- Active Tab: Current view selection

**Features**:
- Document upload via file dialog
- Tab-based navigation
- Compare mode for version comparison
- Loading states and empty states
- Visual indicators for status (compliant, at-risk, breached)

### 2. Main Process (main.ts)

**Responsibility**: Electron main process, window management, IPC handling

**Key Functions**:
- `createWindow()`: Creates the main application window
- IPC Handlers:
  - `upload-document`: Opens file dialog for document selection
  - `parse-document`: Parses uploaded documents
  - `extract-covenants`: Extracts covenants from document content
  - `compare-versions`: Compares two document versions
  - `analyze-risk`: Performs risk analysis on loan data
  - `get-loan-health`: Retrieves loan health metrics

**Security Features**:
- Node integration enabled for file system access
- Context isolation disabled for IPC communication
- Local file processing only (no network requests)

### 3. Service Layer

#### DocumentParser Service

**Purpose**: Extract text content from various document formats

**Supported Formats**:
- PDF (via pdf-parse)
- DOC/DOCX (via mammoth)

**Methods**:
- `parse(filePath)`: Main entry point, delegates to format-specific parsers
- `parsePDF(filePath)`: Extracts text from PDF files
- `parseWord(filePath)`: Extracts text from Word documents

**Error Handling**: Throws descriptive errors for unsupported formats or parsing failures

#### CovenantExtractor Service

**Purpose**: Identify and extract loan covenants from document text

**Extraction Strategy**:
1. **Pattern Matching**: Uses regular expressions to identify covenant language
2. **Context Analysis**: Examines surrounding text for frequency and thresholds
3. **Categorization**: Classifies covenants by type (financial, negative, affirmative, operational)

**Covenant Types**:

1. **Financial Covenants**:
   - Debt ratios (debt-to-equity, leverage)
   - Coverage ratios (interest coverage, debt service coverage)
   - Minimum EBITDA requirements
   - Current ratio requirements

2. **Negative Covenants**:
   - Restrictions on incurring debt
   - Limitations on asset sales
   - Dividend restrictions
   - Investment limitations

3. **Affirmative Covenants**:
   - Insurance maintenance requirements
   - Financial reporting obligations
   - Legal compliance requirements
   - Business preservation obligations

**Output Structure**:
```typescript
{
  id: string;              // Unique identifier
  type: string;            // financial | operational | negative | affirmative
  description: string;     // Full covenant text
  threshold: string;       // Numerical threshold (if applicable)
  frequency: string;       // Testing/reporting frequency
  status: string;          // compliant | at-risk | breached | pending
  riskLevel: string;       // low | medium | high | critical
  explanation: string;     // Plain language explanation
  location: string;        // Document location reference
}
```

**Fallback Mechanism**: If no covenants are found via pattern matching, returns example covenants to demonstrate functionality

#### VersionComparator Service

**Purpose**: Compare two versions of a document and identify differences

**Comparison Process**:
1. **Section Splitting**: Divides documents into logical sections
2. **Difference Detection**: Identifies added, removed, and modified sections
3. **Significance Assessment**: Rates changes by importance
4. **Change Explanation**: Provides context for each difference

**Significance Levels**:
- **Critical**: Changes to covenants, defaults, interest rates, maturity dates
- **High**: Changes to fees, collateral, representations, warranties
- **Medium**: Changes to notices, consents, reporting
- **Low**: Minor textual changes

**Section Identification Patterns**:
- Numbered sections (e.g., "1. Definitions")
- "SECTION" headers (e.g., "SECTION 7: Covenants")
- Article headers (e.g., "Article IV")

**Output Structure**:
```typescript
{
  type: 'added' | 'removed' | 'modified';
  section: string;         // Section name
  oldValue?: string;       // Previous content
  newValue?: string;       // Current content
  significance: string;    // low | medium | high | critical
  explanation: string;     // Description of change
}
```

#### RiskAnalyzer Service

**Purpose**: Assess overall loan risk based on multiple factors

**Analysis Dimensions**:
1. **Covenant Compliance**:
   - Breached covenants (90 risk score)
   - At-risk covenants (70 risk score)
   - High-risk covenants (50 risk score)

2. **Reporting Obligations**:
   - Overdue reports (75 risk score)
   - Reports due soon (40 risk score)

3. **Document Inconsistencies**:
   - Critical differences (85 risk score)
   - Significant differences (65 risk score)

**Risk Calculation**:
```
Overall Risk Score = Average of all risk factor scores
Overall Risk Level = 
  - Critical: score >= 80
  - High: score >= 60
  - Medium: score >= 40
  - Low: score < 40
```

**Recommendations Engine**:
- Generates actionable recommendations based on identified risk factors
- Prioritizes critical and high-severity issues
- Provides specific guidance for different risk categories

**Output Structure**:
```typescript
{
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;       // 0-100
  riskFactors: RiskFactor[];
  recommendations: string[];
}
```

## Data Flow

### Document Upload Flow
```
User clicks "Upload" 
  → Main process opens file dialog
  → User selects file(s)
  → Main process returns file metadata
  → Renderer adds to document list
  → Automatic processing triggered
  → DocumentParser extracts text
  → CovenantExtractor identifies covenants
  → RiskAnalyzer assesses risk
  → UI updates with results
```

### Version Comparison Flow
```
User clicks "Compare Versions"
  → Renderer enters compare mode
  → User selects first document (blue marker)
  → User selects second document (green marker)
  → User clicks "Compare Selected"
  → Main process parses both documents
  → VersionComparator identifies differences
  → Renderer displays differences in Versions tab
```

### Risk Analysis Flow
```
Document processed
  → Covenants extracted
  → RiskAnalyzer receives loan data
  → Analyzes covenant status
  → Analyzes reporting status
  → Analyzes document changes
  → Calculates risk scores
  → Generates recommendations
  → Returns comprehensive risk assessment
```

## Design Patterns

### 1. Service Layer Pattern
- Clear separation between UI and business logic
- Services are reusable and testable
- Each service has a single responsibility

### 2. Observer Pattern
- React state management triggers UI updates
- Components observe state changes and re-render

### 3. Strategy Pattern
- Different parsing strategies for different file formats
- Pluggable covenant extraction patterns

### 4. Factory Pattern
- Document objects created with consistent structure
- Covenant objects constructed with required fields

## Technology Choices

### Why Electron?
- Cross-platform desktop application
- Native file system access
- No server infrastructure required
- Suitable for confidential documents
- Can be packaged as standalone executable

### Why React?
- Component-based architecture
- Efficient UI updates with virtual DOM
- Large ecosystem and community
- Easy to maintain and extend

### Why TypeScript?
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why pdf-parse and mammoth?
- Native Node.js libraries
- No external dependencies
- Work offline
- Reliable text extraction

## Performance Considerations

### Document Processing
- Parsing happens asynchronously to avoid UI blocking
- Loading states provide user feedback
- Large documents may take several seconds to process

### Memory Management
- Documents stored in memory only while needed
- Consider pagination for large document lists
- File contents not cached to save memory

### UI Responsiveness
- Tab switching is instant (no network calls)
- State updates trigger efficient React re-renders
- CSS animations provide smooth transitions

## Security Considerations

### Data Privacy
- All processing happens locally
- No data sent to external servers
- Suitable for confidential loan documents

### File System Access
- Limited to user-selected files
- No automatic file scanning
- Uses Electron's secure file dialog

### Input Validation
- File type validation before processing
- Error handling for corrupt files
- Graceful degradation on parsing errors

## Extensibility Points

### Adding New Document Formats
1. Install appropriate parsing library
2. Add format-specific parser method to DocumentParser
3. Update file filter in upload dialog
4. Add type definition to LoanDocument interface

### Adding New Covenant Types
1. Define new patterns in CovenantExtractor
2. Add type to Covenant type definition
3. Update UI to display new type
4. Add significance assessment rules

### Adding New Risk Factors
1. Define assessment logic in RiskAnalyzer
2. Add risk factor category
3. Update recommendations engine
4. Add UI visualization

### Adding Data Persistence
1. Choose storage solution (SQLite, IndexedDB, etc.)
2. Create data access layer
3. Update IPC handlers to save/load data
4. Add migration logic for schema updates

## Testing Strategy

### Unit Tests
- Test each service independently
- Mock file system operations
- Verify covenant extraction patterns
- Test risk calculation logic

### Integration Tests
- Test IPC communication
- Verify end-to-end document processing
- Test version comparison with sample documents

### Manual Testing
- Upload various document formats
- Compare different document versions
- Verify UI displays correct information
- Test error scenarios

## Future Improvements

### Immediate (MVP+)
- Persistent data storage (SQLite)
- Export risk reports to PDF
- Improved covenant extraction accuracy
- More sophisticated NLP for term extraction

### Short-term
- AI/ML-based covenant classification
- Automated covenant testing against financials
- Integration with financial data sources
- Email notifications for upcoming deadlines

### Long-term
- Cloud sync capabilities
- Multi-user collaboration
- Portfolio-level analytics
- Mobile companion app
- API for integration with loan systems

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Distribution Packaging
```bash
npm run package
```

Creates platform-specific installers:
- Windows: NSIS installer (.exe)
- macOS: DMG image (.dmg)
- Linux: AppImage (.AppImage)

## Maintenance

### Dependency Updates
- Regularly update npm packages
- Test thoroughly after Electron upgrades
- Monitor security advisories

### Performance Monitoring
- Track document processing times
- Monitor memory usage with large files
- Optimize slow operations

### User Feedback
- Collect usage analytics (with consent)
- Monitor error reports
- Incorporate feature requests

## Conclusion

LoanOps Copilot's architecture prioritizes:
- **Simplicity**: Clear separation of concerns
- **Maintainability**: Well-structured, typed code
- **Security**: Local processing, no external dependencies
- **Extensibility**: Easy to add new features
- **User Experience**: Responsive, intuitive interface

The architecture supports the core mission of reducing operational risk and improving efficiency in loan management.
