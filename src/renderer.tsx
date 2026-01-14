import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LoanDocument, Covenant, RiskAnalysis, VersionDifference, LoanHealth } from './types';
import { DemoIssue, DemoObligation } from './demo/DemoDataLoader';

const { ipcRenderer } = window.require('electron');

const App: React.FC = () => {
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LoanDocument | null>(null);
  const [covenants, setCovenants] = useState<Covenant[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [loanHealth, setLoanHealth] = useState<LoanHealth | null>(null);
  const [differences, setDifferences] = useState<VersionDifference[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'covenants' | 'versions' | 'risk'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [docToCompare, setDocToCompare] = useState<LoanDocument | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoIssues, setDemoIssues] = useState<DemoIssue[]>([]);
  const [demoObligations, setDemoObligations] = useState<DemoObligation[]>([]);

  useEffect(() => {
    // Load initial loan health data
    loadLoanHealth();
  }, []);

  const loadLoanHealth = async () => {
    try {
      const result = await ipcRenderer.invoke('get-loan-health', 'LOAN-001');
      if (result.success) {
        setLoanHealth(result.health);
      }
    } catch (error) {
      console.error('Error loading loan health:', error);
    }
  };

  const handleLoadDemoData = async () => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('load-demo-data');
      
      if (result.success) {
        const { data } = result;
        
        // Set demo mode flag
        setDemoMode(true);
        
        // Convert demo covenants to app covenants format
        const demoCovenants: Covenant[] = data.covenants.map((c: {
          id: string;
          type: 'financial' | 'negative' | 'affirmative' | 'operational';
          description: string;
          threshold: string;
          frequency: string;
          status: 'compliant' | 'at-risk' | 'breach-likely';
          plainEnglish: string;
          source: string;
        }) => ({
          id: c.id,
          type: c.type,
          description: c.description,
          threshold: c.threshold,
          frequency: c.frequency,
          status: c.status,
          riskLevel: c.status === 'breach-likely' ? 'critical' : c.status === 'at-risk' ? 'high' : 'low',
          explanation: c.plainEnglish,
          location: c.source
        }));
        
        setCovenants(demoCovenants);
        setDemoIssues(data.issues);
        setDemoObligations(data.obligations);
        
        // Create a mock document for demo
        const demoDoc: LoanDocument = {
          id: 'DEMO-DOC-001',
          name: 'Demo Loan Agreement.pdf',
          path: '/demo/loan_agreement.pdf',
          size: 1024000,
          uploadDate: new Date(),
          type: 'pdf',
          version: 'Demo v1.0'
        };
        
        setDocuments([demoDoc]);
        setSelectedDocument(demoDoc);
        
        // Set health score from demo data
        setLoanHealth({
          loanId: data.loan.loanId,
          overallHealth: data.healthScore.status,
          healthScore: data.healthScore.score,
          metrics: {
            documentCompliance: 90,
            covenantAdherence: 85,
            reportingTimeliness: 80,
            riskLevel: data.healthScore.status === 'critical' ? 'critical' : 
                       data.healthScore.status === 'warning' ? 'medium' : 'low'
          },
          alerts: [],
          lastUpdated: new Date()
        });
        
        // Generate risk analysis from demo issues
        const riskFactors = data.issues.map((issue: {
          type: string;
          title: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          whyItMatters: string;
        }) => ({
          category: issue.type,
          description: issue.title,
          severity: issue.severity,
          impact: issue.whyItMatters
        }));
        
        setRiskAnalysis({
          overallRisk: data.healthScore.status === 'critical' ? 'critical' : 
                       data.healthScore.status === 'warning' ? 'high' : 'low',
          riskScore: 100 - data.healthScore.score,
          riskFactors: riskFactors,
          recommendations: data.issues.flatMap((issue: { nextSteps?: string[] }) => issue.nextSteps || [])
        });
        
        setActiveTab('dashboard');
      } else {
        alert('Error loading demo data: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading demo data:', error);
      alert('Error loading demo data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    setLoading(true);
    try {
      const files = await ipcRenderer.invoke('upload-document');
      
      if (files && files.length > 0) {
        const newDocs: LoanDocument[] = files.map((file: { name: string; path: string; size: number }) => ({
          id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          path: file.path,
          size: file.size,
          uploadDate: new Date(),
          type: file.name.split('.').pop() as 'pdf' | 'doc' | 'docx'
        }));

        setDocuments([...documents, ...newDocs]);

        // Automatically process the first uploaded document
        if (newDocs.length > 0) {
          await processDocument(newDocs[0]);
        }
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Error uploading documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (doc: LoanDocument) => {
    setLoading(true);
    setSelectedDocument(doc);
    
    try {
      // Parse document
      const parseResult = await ipcRenderer.invoke('parse-document', doc.path);
      
      if (parseResult.success) {
        // Extract covenants
        const covenantResult = await ipcRenderer.invoke('extract-covenants', parseResult.content);
        
        if (covenantResult.success) {
          setCovenants(covenantResult.covenants);
          
          // Analyze risk
          const riskResult = await ipcRenderer.invoke('analyze-risk', {
            covenants: covenantResult.covenants,
            document: doc
          });
          
          if (riskResult.success) {
            setRiskAnalysis(riskResult.riskAnalysis);
          }
        }
      }
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareDocuments = async () => {
    if (!selectedDocument || !docToCompare) {
      alert('Please select two documents to compare');
      return;
    }

    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('compare-versions', selectedDocument.path, docToCompare.path);
      
      if (result.success) {
        setDifferences(result.differences);
        setActiveTab('versions');
      } else {
        alert('Error comparing documents: ' + result.error);
      }
    } catch (error) {
      console.error('Error comparing documents:', error);
      alert('Error comparing documents. Please try again.');
    } finally {
      setLoading(false);
      setCompareMode(false);
      setDocToCompare(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getHealthScoreClass = (score: number): string => {
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  const renderDashboard = () => {
    if (!selectedDocument && documents.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>Welcome to LoanOps Copilot</h3>
          <p>Get started by loading a demo loan or uploading your own documents</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={handleLoadDemoData}>
              🎯 Open Demo Loan
            </button>
            <button className="btn btn-secondary" onClick={handleUploadDocuments}>
              📤 Upload Documents
            </button>
          </div>
        </div>
      );
    }

    const healthScore = loanHealth?.healthScore || 85;
    const healthClass = getHealthScoreClass(healthScore);

    return (
      <div>
        <div className="card health-score">
          <h3>Loan Health Score</h3>
          <div className={`health-score-circle ${healthClass}`}>
            {healthScore}
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Overall loan health based on compliance, covenants, and risk factors
          </p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Documents</h4>
            <div className="value">{documents.length}</div>
          </div>
          <div className="metric-card">
            <h4>Covenants</h4>
            <div className="value">{covenants.length}</div>
          </div>
          <div className="metric-card">
            <h4>At Risk</h4>
            <div className="value" style={{ color: '#f5576c' }}>
              {covenants.filter(c => c.status === 'at-risk').length}
            </div>
          </div>
          <div className="metric-card">
            <h4>Compliant</h4>
            <div className="value" style={{ color: '#38ef7d' }}>
              {covenants.filter(c => c.status === 'compliant').length}
            </div>
          </div>
        </div>

        {selectedDocument && (
          <div className="card">
            <h3>📄 Currently Viewing</h3>
            <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '8px', marginTop: '12px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>{selectedDocument.name}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Size: {formatFileSize(selectedDocument.size)} • 
                Uploaded: {new Date(selectedDocument.uploadDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {covenants.length > 0 && (
          <div className="card">
            <h3>⚠️ Key Covenants Overview</h3>
            {covenants.slice(0, 3).map(covenant => (
              <div key={covenant.id} className={`covenant-item ${covenant.status}`}>
                <div className="covenant-header">
                  <div className="covenant-title">{covenant.id}</div>
                  <span className={`covenant-badge badge-${covenant.status}`}>
                    {covenant.status}
                  </span>
                </div>
                <div className="covenant-description">{covenant.description}</div>
              </div>
            ))}
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '12px', width: '100%' }}
              onClick={() => setActiveTab('covenants')}
            >
              View All Covenants
            </button>
          </div>
        )}

        {demoMode && demoIssues.length > 0 && (
          <div className="card">
            <h3>🚨 Top Issues</h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
              Detected issues requiring attention, ranked by severity
            </p>
            {demoIssues.map(issue => (
              <div key={issue.id} style={{ 
                padding: '16px', 
                background: '#f9f9f9', 
                borderRadius: '8px', 
                marginBottom: '12px',
                borderLeft: `4px solid ${
                  issue.severity === 'critical' ? '#dc3545' :
                  issue.severity === 'high' ? '#f5576c' :
                  issue.severity === 'medium' ? '#ffa500' : '#ffc107'
                }`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{issue.title}</div>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px',
                    fontWeight: 600,
                    background: issue.severity === 'critical' ? '#dc3545' :
                               issue.severity === 'high' ? '#f5576c' :
                               issue.severity === 'medium' ? '#ffa500' : '#ffc107',
                    color: 'white'
                  }}>
                    {issue.severity.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {issue.whyItMatters}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  <strong>Recommended Action:</strong> {issue.nextSteps[0]}
                </div>
              </div>
            ))}
          </div>
        )}

        {demoMode && demoObligations.length > 0 && (
          <div className="card">
            <h3>📅 Upcoming Obligations</h3>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
              {demoObligations.filter((o) => o.status === 'due-soon' || o.status === 'upcoming').length} obligations due in the next 30 days
            </p>
            {demoObligations
              .filter((o) => o.status === 'due-soon' || o.status === 'upcoming')
              .slice(0, 3)
              .map((obligation) => (
              <div key={obligation.id} style={{ 
                padding: '12px', 
                background: '#f0f9ff', 
                borderRadius: '6px', 
                marginBottom: '10px'
              }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                  {obligation.title}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <strong>Due:</strong> {new Date(obligation.dueDate).toLocaleDateString()} 
                  ({obligation.daysUntilDue} days remaining)
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <strong>Frequency:</strong> {obligation.frequency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCovenants = () => {
    if (covenants.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>No Covenants Extracted</h3>
          <p>Upload and process a loan document to extract covenants</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Loan Covenants</h2>
        <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
          Extracted covenants with compliance status and risk assessment. Each covenant includes
          an explanation to help you understand its purpose and requirements.
        </p>
        
        {covenants.map(covenant => (
          <div key={covenant.id} className={`covenant-item ${covenant.status}`}>
            <div className="covenant-header">
              <div className="covenant-title">
                {covenant.id} - {covenant.type.toUpperCase()}
              </div>
              <span className={`covenant-badge badge-${covenant.status}`}>
                {covenant.status}
              </span>
            </div>
            <div className="covenant-description">{covenant.description}</div>
            {covenant.threshold && (
              <div style={{ fontSize: '13px', color: '#555', marginTop: '8px' }}>
                <strong>Threshold:</strong> {covenant.threshold}
                {covenant.frequency && ` • Tested: ${covenant.frequency}`}
              </div>
            )}
            <div className="covenant-explanation">
              💡 {covenant.explanation}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
              {covenant.location}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderVersions = () => {
    if (differences.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🔄</div>
          <h3>No Version Comparison</h3>
          <p>Select two documents from the sidebar to compare versions and detect inconsistencies</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Version Differences</h2>
        <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
          Detected {differences.length} difference(s) between document versions. 
          Critical and high-significance changes are highlighted.
        </p>

        {differences.map((diff, index) => (
          <div key={index} className={`difference-item ${diff.type}`}>
            <div className="difference-header">
              <div style={{ fontWeight: 600, color: '#333' }}>{diff.section}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`difference-type type-${diff.type}`}>
                  {diff.type}
                </span>
                <span className={`covenant-badge badge-${diff.significance === 'critical' ? 'breached' : diff.significance === 'high' ? 'at-risk' : 'pending'}`}>
                  {diff.significance}
                </span>
              </div>
            </div>
            
            {diff.oldValue && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Previous:</div>
                <div style={{ fontSize: '13px', color: '#666', padding: '8px', background: '#fff0f0', borderRadius: '4px' }}>
                  {diff.oldValue}
                </div>
              </div>
            )}
            
            {diff.newValue && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Current:</div>
                <div style={{ fontSize: '13px', color: '#666', padding: '8px', background: '#f0fff0', borderRadius: '4px' }}>
                  {diff.newValue}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
              💡 {diff.explanation}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRiskAnalysis = () => {
    if (!riskAnalysis) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No Risk Analysis</h3>
          <p>Process a loan document to generate risk analysis</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Risk Analysis</h2>
        
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>Overall Risk Level</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '12px', textTransform: 'uppercase' }}>
                {riskAnalysis.overallRisk}
              </div>
            </div>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%',
              background: riskAnalysis.overallRisk === 'critical' ? '#fa709a' :
                         riskAnalysis.overallRisk === 'high' ? '#ffa500' :
                         riskAnalysis.overallRisk === 'medium' ? '#f5576c' : '#38ef7d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {riskAnalysis.riskScore}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3>🚨 Risk Factors</h3>
          {riskAnalysis.riskFactors.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', marginTop: '12px' }}>
              No significant risk factors identified
            </p>
          ) : (
            riskAnalysis.riskFactors.map((factor, index) => (
              <div key={index} className={`risk-factor ${factor.severity}`}>
                <div className="risk-factor-header">
                  <div className="risk-factor-title">{factor.category}</div>
                  <span className={`covenant-badge badge-${factor.severity === 'critical' ? 'breached' : factor.severity === 'high' ? 'at-risk' : 'pending'}`}>
                    {factor.severity}
                  </span>
                </div>
                <div className="risk-factor-description">{factor.description}</div>
                <div className="risk-factor-impact">
                  💡 {factor.impact}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>💡 Recommendations</h3>
          {riskAnalysis.recommendations.map((recommendation, index) => (
            <div key={index} className="recommendation-item">
              {recommendation}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div id="root">
      <div className="header">
        <h1>
          <div className="logo">L</div>
          LoanOps Copilot
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleUploadDocuments}
            disabled={loading}
          >
            📤 Upload Documents
          </button>
          {documents.length >= 2 && !compareMode && (
            <button 
              className="btn btn-secondary"
              onClick={() => setCompareMode(true)}
            >
              🔄 Compare Versions
            </button>
          )}
          {compareMode && (
            <button 
              className="btn btn-primary"
              onClick={handleCompareDocuments}
              disabled={!selectedDocument || !docToCompare}
            >
              ✓ Compare Selected
            </button>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <h2>📁 Documents</h2>
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px' }}>
              No documents uploaded yet
            </div>
          ) : (
            <div>
              {documents.map(doc => (
                <div 
                  key={doc.id} 
                  className="document-item"
                  onClick={() => {
                    if (compareMode) {
                      if (selectedDocument?.id !== doc.id) {
                        setDocToCompare(doc);
                      }
                    } else {
                      processDocument(doc);
                    }
                  }}
                  style={{
                    border: selectedDocument?.id === doc.id ? '2px solid #667eea' :
                           docToCompare?.id === doc.id ? '2px solid #38ef7d' : 'none'
                  }}
                >
                  <div className="document-name">
                    {compareMode && selectedDocument?.id === doc.id && '🔵 '}
                    {compareMode && docToCompare?.id === doc.id && '🟢 '}
                    {doc.name}
                  </div>
                  <div className="document-info">
                    {formatFileSize(doc.size)} • {doc.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {compareMode && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              background: '#f0f9ff', 
              borderRadius: '6px',
              fontSize: '12px',
              color: '#666'
            }}>
              <strong>Compare Mode</strong><br/>
              🔵 Selected: {selectedDocument?.name || 'None'}<br/>
              🟢 Compare with: {docToCompare?.name || 'None'}
            </div>
          )}
        </div>

        <div className="dashboard">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Processing document...</p>
            </div>
          ) : (
            <>
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  📊 Dashboard
                </button>
                <button 
                  className={`tab ${activeTab === 'covenants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('covenants')}
                >
                  ⚠️ Covenants ({covenants.length})
                </button>
                <button 
                  className={`tab ${activeTab === 'versions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('versions')}
                >
                  🔄 Versions ({differences.length})
                </button>
                <button 
                  className={`tab ${activeTab === 'risk' ? 'active' : ''}`}
                  onClick={() => setActiveTab('risk')}
                >
                  📈 Risk Analysis
                </button>
              </div>

              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'covenants' && renderCovenants()}
              {activeTab === 'versions' && renderVersions()}
              {activeTab === 'risk' && renderRiskAnalysis()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
