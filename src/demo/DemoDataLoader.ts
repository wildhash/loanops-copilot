import loanDemo from '../../demo-data/loan_demo.json';
import covenants from '../../demo-data/covenants.json';
import obligations from '../../demo-data/obligations.json';
import issuesSeed from '../../demo-data/issues_seed.json';
import auditLog from '../../demo-data/audit_log.json';

export interface DemoLoan {
  loanId: string;
  loanName: string;
  status: 'healthy' | 'at-risk' | 'breach-likely';
  borrower: {
    name: string;
    jurisdiction: string;
    industry: string;
  };
  facility: {
    type: string;
    amount: number;
    currency: string;
    margin: number;
    baseRate: string;
    maturityDate: string;
    originalDate: string;
    lastAmendment: string;
  };
  agent: {
    name: string;
    role: string;
  };
  lenders: Array<{
    name: string;
    commitment: number;
  }>;
  governingLaw: string;
  documents: Array<{
    id: string;
    name: string;
    version: string;
    date: string;
    type: string;
  }>;
  extractedTerms: {
    [docId: string]: {
      margin: number;
      maturityDate: string;
      amount: number;
      leverageRatioMax: number;
      dscRatioMin: number;
    };
  };
  currentMetrics: {
    leverageRatio: number;
    dscRatio: number;
    currentRatio: number;
  };
}

export interface DemoCovenant {
  id: string;
  name: string;
  type: 'financial' | 'negative' | 'affirmative' | 'operational';
  description: string;
  threshold: string;
  frequency: string;
  nextDueDate: string | null;
  status: 'compliant' | 'at-risk' | 'breach-likely';
  currentValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  plainEnglish: string;
  source: string;
  recommendation: string;
}

export interface DemoObligation {
  id: string;
  title: string;
  description: string;
  frequency: string;
  dueDate: string;
  status: 'due-soon' | 'upcoming' | 'overdue' | 'submitted';
  daysUntilDue: number;
  recipient: string;
  source: string;
  deliverables: string[];
}

export interface DemoIssue {
  id: string;
  type: 'term-mismatch' | 'upcoming-deadline' | 'covenant-risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  detected: string;
  details: any;
  whyItMatters: string;
  nextSteps: string[];
  whoToNotify: string[];
  status: 'open' | 'in-progress' | 'resolved';
  createdDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  user: string;
  details: any;
}

export class DemoDataLoader {
  static getLoan(): DemoLoan {
    return loanDemo as DemoLoan;
  }

  static getCovenants(): DemoCovenant[] {
    return covenants as DemoCovenant[];
  }

  static getObligations(): DemoObligation[] {
    return obligations as DemoObligation[];
  }

  static getIssues(): DemoIssue[] {
    return issuesSeed as DemoIssue[];
  }

  static getAuditLog(): AuditEvent[] {
    return auditLog as AuditEvent[];
  }

  static getHealthScore(): {
    score: number;
    status: 'healthy' | 'warning' | 'critical';
    explanation: string;
  } {
    const loan = this.getLoan();
    const issues = this.getIssues();
    const openIssues = issues.filter((i) => i.status === 'open');
    const highSeverityIssues = openIssues.filter(
      (i) => i.severity === 'high' || i.severity === 'critical'
    );

    let score = 85;
    if (highSeverityIssues.length > 0) {
      score -= highSeverityIssues.length * 10;
    }
    if (openIssues.length > 0) {
      score -= openIssues.length * 5;
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let explanation = 'All covenants compliant, no critical issues';

    if (score < 60) {
      status = 'critical';
      explanation = `${highSeverityIssues.length} critical issues requiring immediate attention`;
    } else if (score < 80) {
      status = 'warning';
      explanation = `${openIssues.length} open issues including covenant risks and upcoming deadlines`;
    }

    return { score, status, explanation };
  }
}
