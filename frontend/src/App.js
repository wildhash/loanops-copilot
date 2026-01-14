import { useState, useEffect, useCallback, useRef } from 'react';
import '@/App.css';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  TrendingUp,
  Shield,
  Activity,
  Upload,
  RefreshCw,
  ChevronRight,
  Building2,
  DollarSign,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
  FileCheck,
  GitCompare,
  History,
  Zap,
  Target,
  Briefcase,
  Loader2,
  ArrowRight,
  ArrowDown,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Health Score Circle Component
const HealthScoreCircle = ({ score, status }) => {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: getColor() }}>{score}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{status}</span>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    compliant: { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Compliant' },
    at_risk: { icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'At Risk' },
    breached: { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Breached' },
    pending: { icon: Clock, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Pending' },
    submitted: { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Submitted' },
    overdue: { icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Overdue' },
  };

  const { icon: Icon, color, label } = config[status] || config.pending;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
};

// Risk Level Badge
const RiskBadge = ({ level }) => {
  const config = {
    critical: { color: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' },
    high: { color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-500' },
    medium: { color: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-500' },
    low: { color: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
  };

  const { color, dot } = config[level] || config.low;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {level?.charAt(0).toUpperCase() + level?.slice(1)}
    </div>
  );
};

// Significance Badge for version comparison
const SignificanceBadge = ({ level }) => {
  const config = {
    critical: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical' },
    high: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'High' },
    medium: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Medium' },
    low: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Low' },
  };

  const { color, label } = config[level] || config.low;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendUp }) => (
  <div className="metric-card p-5" data-testid={`metric-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="p-2.5 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 mt-3 text-xs ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
        <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
        {trend}
      </div>
    )}
  </div>
);

// Covenant Card Component
const CovenantCard = ({ covenant }) => (
  <div className={`covenant-card p-4 ${covenant.status}`} data-testid={`covenant-${covenant.id}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">{covenant.type}</Badge>
          <RiskBadge level={covenant.risk_level} />
        </div>
        <h4 className="font-semibold text-base">{covenant.name}</h4>
        <p className="text-sm text-muted-foreground mt-1">{covenant.description}</p>
        {covenant.explanation && (
          <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            💡 {covenant.explanation}
          </p>
        )}
      </div>
      <div className="text-right">
        <StatusBadge status={covenant.status} />
        {covenant.threshold && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Threshold</p>
            <p className="font-mono text-sm font-medium">{covenant.threshold}</p>
          </div>
        )}
        {covenant.current_value && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="font-mono text-sm font-medium text-primary">{covenant.current_value}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Risk Factor Card Component
const RiskFactorCard = ({ risk }) => (
  <div className="p-4 rounded-lg bg-muted/30 border border-border" data-testid={`risk-${risk.id}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <RiskBadge level={risk.severity} />
          <Badge variant="outline" className="text-xs">{risk.category}</Badge>
        </div>
        <h4 className="font-semibold">{risk.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
        <div className="mt-3 p-3 bg-background/50 rounded border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Impact</p>
          <p className="text-sm">{risk.impact}</p>
        </div>
        <div className="mt-2 p-3 bg-primary/5 rounded border border-primary/20">
          <p className="text-xs text-primary mb-1">Recommendation</p>
          <p className="text-sm">{risk.recommendation}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold text-muted-foreground">{risk.score}</div>
        <div className="text-xs text-muted-foreground">Risk Score</div>
      </div>
    </div>
  </div>
);

// Audit Event Component
const AuditEvent = ({ event, isLast }) => {
  const icons = {
    document_upload: FileText,
    covenant_extracted: Shield,
    risk_detected: AlertTriangle,
    status_change: Activity,
    analysis_complete: CheckCircle,
  };
  const Icon = icons[event.event_type] || Activity;

  return (
    <div className="timeline-item" data-testid={`audit-${event.id}`}>
      <div className="timeline-dot flex items-center justify-center">
        <Icon className="w-2.5 h-2.5 text-background" />
      </div>
      <div className="pl-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{event.title}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(event.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
        <span className="text-xs text-muted-foreground">by {event.user}</span>
      </div>
    </div>
  );
};

// Version Comparison Difference Card
const DifferenceCard = ({ diff }) => {
  const bgClass = diff.significance === 'critical' ? 'diff-removed' : 
                   diff.significance === 'high' ? 'diff-changed' : 
                   diff.significance === 'medium' ? 'diff-changed' : '';
  
  return (
    <div className={`p-4 rounded-lg border border-border ${bgClass}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="font-medium text-sm capitalize">{diff.field.replace('_', ' ')}</span>
        <SignificanceBadge level={diff.significance} />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 mb-1">Previous Value</p>
          <p className="font-mono text-sm">{diff.old_value}</p>
        </div>
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-1">New Value</p>
          <p className="font-mono text-sm">{diff.new_value}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3">{diff.explanation}</p>
    </div>
  );
};

// Main App Component
function App() {
  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [covenants, setCovenants] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [demoLoaded, setDemoLoaded] = useState(false);
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Comparison state
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState({ doc1: null, doc2: null });
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);

  const loadDemoData = useCallback(async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/demo/load`);
      setDemoLoaded(true);
      await fetchDashboard('demo-loan-001');
    } catch (error) {
      console.error('Error loading demo:', error);
      toast.error('Failed to load demo data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = async (loanId) => {
    try {
      const [dashboardRes, auditRes, docsRes] = await Promise.all([
        axios.get(`${API}/loans/${loanId}/dashboard`),
        axios.get(`${API}/loans/${loanId}/audit`),
        axios.get(`${API}/loans/${loanId}/documents`),
      ]);
      
      setLoan(dashboardRes.data.loan);
      setMetrics(dashboardRes.data.metrics);
      setCovenants(dashboardRes.data.covenants);
      setObligations(dashboardRes.data.obligations);
      setRiskFactors(dashboardRes.data.risk_factors);
      setAuditEvents(auditRes.data.events);
      setDocuments(docsRes.data.documents);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const refreshData = async () => {
    if (loan?.id) {
      setLoading(true);
      await fetchDashboard(loan.id);
      setLoading(false);
      toast.success('Data refreshed');
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !loan) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        await axios.post(`${API}/loans/${loan.id}/documents/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      }

      toast.success(`${files.length} document(s) uploaded successfully`);
      setUploadDialogOpen(false);
      await fetchDashboard(loan.id);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAnalyzeDocument = async (documentId) => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/documents/${documentId}/analyze`);
      toast.success(`Analysis complete! ${response.data.covenants_created} covenants extracted`);
      await fetchDashboard(loan.id);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze document');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCompareVersions = async () => {
    if (!selectedDocs.doc1 || !selectedDocs.doc2 || !loan) return;
    
    setComparing(true);
    try {
      const response = await axios.post(`${API}/compare-versions`, {
        loan_id: loan.id,
        doc1_id: selectedDocs.doc1,
        doc2_id: selectedDocs.doc2
      });
      setComparisonResult(response.data);
      toast.success('Version comparison complete');
    } catch (error) {
      console.error('Comparison error:', error);
      toast.error('Failed to compare versions');
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    loadDemoData();
  }, [loadDemoData]);

  // Landing Page when no loan loaded
  if (!demoLoaded && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-2xl text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-6">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">LoanOps Copilot</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Intelligent loan operations assistant for syndicated loan management.
            Track covenants, monitor compliance, and prevent operational risk.
          </p>
          <Button size="lg" onClick={loadDemoData} className="gradient-primary text-white px-8" data-testid="load-demo-btn">
            <Zap className="w-5 h-5 mr-2" />
            Open Demo Loan
          </Button>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading loan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App flex min-h-screen">
      <Toaster richColors position="top-right" />
      
      {/* Sidebar */}
      <aside className="sidebar flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">LoanOps</h1>
              <p className="text-xs text-muted-foreground">Copilot</p>
            </div>
          </div>
        </div>
        
        {loan && (
          <div className="p-5 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">Active Loan</p>
            <h2 className="font-semibold text-sm truncate" data-testid="loan-name">{loan.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{loan.borrower}</p>
            <div className="mt-3 flex items-center gap-2">
              <HealthScoreCircle score={loan.health_score} status={loan.health_status} />
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'covenants', icon: Shield, label: 'Covenants' },
              { id: 'obligations', icon: Calendar, label: 'Obligations' },
              { id: 'risks', icon: AlertTriangle, label: 'Risk Analysis' },
              { id: 'documents', icon: FileText, label: 'Documents' },
              { id: 'compare', icon: GitCompare, label: 'Compare Versions' },
              { id: 'audit', icon: History, label: 'Audit Trail' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
        
        <div className="p-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content flex-1 overflow-auto">
        {/* Header */}
        <header className="app-header sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'dashboard' && 'Overview of loan health and key metrics'}
              {activeTab === 'covenants' && 'Financial and operational covenant tracking'}
              {activeTab === 'obligations' && 'Reporting requirements and deadlines'}
              {activeTab === 'risks' && 'Risk factors and recommendations'}
              {activeTab === 'documents' && 'Uploaded loan documents'}
              {activeTab === 'compare' && 'Compare document versions and detect changes'}
              {activeTab === 'audit' && 'Complete activity history'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Loan Document</DialogTitle>
                  <DialogDescription>
                    Upload PDF or Word documents for analysis. AI will extract covenants and key terms.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div 
                    className="upload-area p-8 text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="font-medium mb-2">Uploading...</p>
                        <Progress value={uploadProgress} className="w-full" />
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium mb-2">Click to select files</p>
                        <p className="text-sm text-muted-foreground">
                          Supports PDF, DOC, DOCX
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && metrics && (
            <div className="space-y-6 animate-fadeIn">
              {/* Loan Info Card */}
              {loan && (
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{loan.name}</CardTitle>
                        <CardDescription>{loan.loan_type?.replace('_', ' ').toUpperCase() || 'Term Loan'}</CardDescription>
                      </div>
                      <StatusBadge status={loan.status === 'active' ? 'compliant' : loan.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Borrower
                        </p>
                        <p className="font-medium text-sm mt-1">{loan.borrower}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Facility
                        </p>
                        <p className="font-medium text-sm mt-1">
                          {loan.currency} {(loan.facility_amount / 1000000).toFixed(0)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="w-3 h-3" /> Margin
                        </p>
                        <p className="font-medium text-sm mt-1">{loan.margin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Maturity
                        </p>
                        <p className="font-medium text-sm mt-1">{loan.maturity_date || 'N/A'}</p>
                      </div>
                    </div>
                    {loan.syndicate_members?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <Users className="w-3 h-3" /> Syndicate Members
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{loan.agent_bank} (Agent)</Badge>
                          {loan.syndicate_members.map((member, i) => (
                            <Badge key={i} variant="outline">{member}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Covenants"
                  value={metrics.total_covenants}
                  subtitle={`${metrics.compliant_covenants} compliant`}
                  icon={Shield}
                />
                <MetricCard
                  title="At Risk"
                  value={metrics.at_risk_covenants}
                  subtitle="Approaching threshold"
                  icon={AlertTriangle}
                />
                <MetricCard
                  title="Obligations"
                  value={metrics.pending_obligations}
                  subtitle="Pending submission"
                  icon={Calendar}
                />
                <MetricCard
                  title="Risk Alerts"
                  value={metrics.critical_risks + metrics.high_risks}
                  subtitle={`${metrics.critical_risks} critical`}
                  icon={AlertCircle}
                />
              </div>

              {/* Quick View Sections */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Covenants Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Covenant Status</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('covenants')}>
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {covenants.slice(0, 3).map(cov => (
                        <div key={cov.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{cov.name}</p>
                            <p className="text-xs text-muted-foreground">{cov.type}</p>
                          </div>
                          <StatusBadge status={cov.status} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Obligations */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Upcoming Obligations</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('obligations')}>
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {obligations.filter(o => o.status !== 'submitted').slice(0, 3).map(obl => (
                        <div key={obl.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{obl.name}</p>
                            <p className="text-xs text-muted-foreground">Due: {obl.due_date}</p>
                          </div>
                          <StatusBadge status={obl.status} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('audit')}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {auditEvents.slice(0, 4).map((event, i) => (
                      <AuditEvent key={event.id} event={event} isLast={i === 3} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Covenants Tab */}
          {activeTab === 'covenants' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-2xl font-bold text-emerald-400">{covenants.filter(c => c.status === 'compliant').length}</p>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-400">{covenants.filter(c => c.status === 'at_risk').length}</p>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-2xl font-bold text-red-400">{covenants.filter(c => c.status === 'breached').length}</p>
                  <p className="text-sm text-muted-foreground">Breached</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
                  <p className="text-2xl font-bold text-slate-400">{covenants.filter(c => c.status === 'pending').length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>

              {/* Covenant Cards */}
              <div className="space-y-4">
                {covenants.map(covenant => (
                  <CovenantCard key={covenant.id} covenant={covenant} />
                ))}
              </div>
            </div>
          )}

          {/* Obligations Tab */}
          {activeTab === 'obligations' && (
            <div className="space-y-4 animate-fadeIn">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reporting Obligations</CardTitle>
                  <CardDescription>Track required submissions and deadlines</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Obligation</th>
                        <th>Type</th>
                        <th>Frequency</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obligations.map(obl => (
                        <tr key={obl.id} data-testid={`obligation-${obl.id}`}>
                          <td>
                            <p className="font-medium">{obl.name}</p>
                            <p className="text-xs text-muted-foreground">{obl.description}</p>
                          </td>
                          <td><Badge variant="outline">{obl.type.replace('_', ' ')}</Badge></td>
                          <td className="capitalize">{obl.frequency}</td>
                          <td className="font-mono text-sm">{obl.due_date}</td>
                          <td><StatusBadge status={obl.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Risk Analysis Tab */}
          {activeTab === 'risks' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Risk Score Overview */}
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-8">
                    <HealthScoreCircle score={loan?.health_score || 0} status={loan?.health_status || 'unknown'} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Overall Risk Assessment</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Based on analysis of {covenants.length} covenants, {obligations.length} obligations, 
                        and {documents.length} documents.
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Critical Risks</p>
                          <p className="text-xl font-bold text-red-400">{riskFactors.filter(r => r.severity === 'critical').length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">High Risks</p>
                          <p className="text-xl font-bold text-amber-400">{riskFactors.filter(r => r.severity === 'high').length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Medium/Low</p>
                          <p className="text-xl font-bold text-blue-400">{riskFactors.filter(r => ['medium', 'low'].includes(r.severity)).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              <div className="space-y-4">
                {riskFactors.length > 0 ? (
                  riskFactors.map(risk => (
                    <RiskFactorCard key={risk.id} risk={risk} />
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Active Risk Factors</h3>
                    <p className="text-muted-foreground">All covenants and obligations are within acceptable parameters.</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Upload Area */}
              <div 
                className="upload-area p-8 text-center cursor-pointer"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Upload Loan Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop PDF or Word documents, or click to browse
                </p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              </div>

              {/* Document List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Uploaded Documents</CardTitle>
                  <CardDescription>{documents.length} documents in this facility</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Version</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc.id} data-testid={`document-${doc.id}`}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-primary/10">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.filename}</p>
                                <p className="text-xs text-muted-foreground">{doc.file_type}</p>
                              </div>
                            </div>
                          </td>
                          <td><Badge variant="outline">v{doc.version}</Badge></td>
                          <td className="text-sm text-muted-foreground">
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </td>
                          <td className="text-sm text-muted-foreground">
                            {new Date(doc.upload_date).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleAnalyzeDocument(doc.id)}
                                disabled={analyzing}
                              >
                                {analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileCheck className="w-4 h-4 mr-1" />}
                                Analyze
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDocs({ ...selectedDocs, doc1: doc.id });
                                  setActiveTab('compare');
                                }}
                              >
                                <GitCompare className="w-4 h-4 mr-1" /> Compare
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Compare Versions Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-6 animate-fadeIn">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Version Comparison</CardTitle>
                  <CardDescription>Select two document versions to compare and detect inconsistencies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Document 1 Selection */}
                    <div>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                        First Document (Baseline)
                      </p>
                      <div className="space-y-2">
                        {documents.map(doc => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocs({ ...selectedDocs, doc1: doc.id })}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedDocs.doc1 === doc.id 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-border hover:border-blue-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.filename}</p>
                                <p className="text-xs text-muted-foreground">Version {doc.version}</p>
                              </div>
                              {selectedDocs.doc1 === doc.id && (
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Document 2 Selection */}
                    <div>
                      <p className="text-sm font-medium mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">2</span>
                        Second Document (Comparison)
                      </p>
                      <div className="space-y-2">
                        {documents.map(doc => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocs({ ...selectedDocs, doc2: doc.id })}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedDocs.doc2 === doc.id 
                                ? 'border-emerald-500 bg-emerald-500/10' 
                                : 'border-border hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.filename}</p>
                                <p className="text-xs text-muted-foreground">Version {doc.version}</p>
                              </div>
                              {selectedDocs.doc2 === doc.id && (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Button 
                      onClick={handleCompareVersions}
                      disabled={!selectedDocs.doc1 || !selectedDocs.doc2 || comparing}
                      className="gradient-primary text-white"
                    >
                      {comparing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Comparing...
                        </>
                      ) : (
                        <>
                          <GitCompare className="w-4 h-4 mr-2" />
                          Compare Selected Documents
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Results */}
              {comparisonResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Comparison Results</CardTitle>
                    <CardDescription>
                      {comparisonResult.differences.length} differences detected between versions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Baseline</p>
                        <p className="font-medium">{comparisonResult.doc1?.filename}</p>
                        <Badge variant="outline">v{comparisonResult.doc1?.version}</Badge>
                      </div>
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Comparison</p>
                        <p className="font-medium">{comparisonResult.doc2?.filename}</p>
                        <Badge variant="outline">v{comparisonResult.doc2?.version}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {comparisonResult.differences.map((diff, index) => (
                        <DifferenceCard key={index} diff={diff} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fadeIn">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Log</CardTitle>
                  <CardDescription>Complete audit trail for compliance and review</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-0">
                      {auditEvents.map((event, i) => (
                        <AuditEvent key={event.id} event={event} isLast={i === auditEvents.length - 1} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
