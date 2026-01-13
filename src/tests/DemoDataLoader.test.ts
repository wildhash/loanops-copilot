import { describe, it, expect } from 'vitest';
import { DemoDataLoader } from '../demo/DemoDataLoader';

describe('DemoDataLoader', () => {
  describe('getLoan', () => {
    it('should load demo loan data', () => {
      const loan = DemoDataLoader.getLoan();

      expect(loan).toBeDefined();
      expect(loan.loanId).toBe('LOAN-2024-001');
      expect(loan.loanName).toContain('TechCorp');
      expect(loan.borrower.name).toBeDefined();
      expect(loan.facility.amount).toBe(50000000);
    });

    it('should include multiple documents', () => {
      const loan = DemoDataLoader.getLoan();

      expect(loan.documents).toBeDefined();
      expect(loan.documents.length).toBeGreaterThanOrEqual(2);
      expect(loan.documents[0].id).toBeDefined();
    });

    it('should include extracted terms for each document', () => {
      const loan = DemoDataLoader.getLoan();

      for (const doc of loan.documents) {
        expect(loan.extractedTerms[doc.id]).toBeDefined();
        expect(loan.extractedTerms[doc.id].margin).toBeDefined();
      }
    });
  });

  describe('getCovenants', () => {
    it('should load covenant data', () => {
      const covenants = DemoDataLoader.getCovenants();

      expect(covenants).toBeDefined();
      expect(covenants.length).toBeGreaterThanOrEqual(4);
    });

    it('should include required covenant fields', () => {
      const covenants = DemoDataLoader.getCovenants();
      const firstCovenant = covenants[0];

      expect(firstCovenant.id).toBeDefined();
      expect(firstCovenant.name).toBeDefined();
      expect(firstCovenant.type).toBeDefined();
      expect(firstCovenant.plainEnglish).toBeDefined();
      expect(firstCovenant.recommendation).toBeDefined();
    });

    it('should include at least one at-risk covenant', () => {
      const covenants = DemoDataLoader.getCovenants();
      const atRiskCovenants = covenants.filter((c) => c.status === 'at-risk');

      expect(atRiskCovenants.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getObligations', () => {
    it('should load obligation data', () => {
      const obligations = DemoDataLoader.getObligations();

      expect(obligations).toBeDefined();
      expect(obligations.length).toBeGreaterThan(0);
    });

    it('should include required obligation fields', () => {
      const obligations = DemoDataLoader.getObligations();
      const firstObligation = obligations[0];

      expect(firstObligation.id).toBeDefined();
      expect(firstObligation.title).toBeDefined();
      expect(firstObligation.dueDate).toBeDefined();
      expect(firstObligation.deliverables).toBeDefined();
      expect(Array.isArray(firstObligation.deliverables)).toBe(true);
    });

    it('should include at least one due-soon obligation', () => {
      const obligations = DemoDataLoader.getObligations();
      const dueSoon = obligations.filter((o) => o.status === 'due-soon');

      expect(dueSoon.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getIssues', () => {
    it('should load issue seed data', () => {
      const issues = DemoDataLoader.getIssues();

      expect(issues).toBeDefined();
      expect(issues.length).toBeGreaterThanOrEqual(2);
    });

    it('should include required issue fields', () => {
      const issues = DemoDataLoader.getIssues();
      const firstIssue = issues[0];

      expect(firstIssue.id).toBeDefined();
      expect(firstIssue.type).toBeDefined();
      expect(firstIssue.title).toBeDefined();
      expect(firstIssue.detected).toBeDefined();
      expect(firstIssue.whyItMatters).toBeDefined();
      expect(firstIssue.nextSteps).toBeDefined();
      expect(Array.isArray(firstIssue.nextSteps)).toBe(true);
      expect(firstIssue.whoToNotify).toBeDefined();
      expect(Array.isArray(firstIssue.whoToNotify)).toBe(true);
    });

    it('should include different issue types', () => {
      const issues = DemoDataLoader.getIssues();
      const issueTypes = new Set(issues.map((i) => i.type));

      expect(issueTypes.size).toBeGreaterThanOrEqual(2);
      expect(issueTypes.has('term-mismatch')).toBe(true);
    });
  });

  describe('getAuditLog', () => {
    it('should load audit log data', () => {
      const auditLog = DemoDataLoader.getAuditLog();

      expect(auditLog).toBeDefined();
      expect(auditLog.length).toBeGreaterThanOrEqual(8);
    });

    it('should include required audit event fields', () => {
      const auditLog = DemoDataLoader.getAuditLog();
      const firstEvent = auditLog[0];

      expect(firstEvent.id).toBeDefined();
      expect(firstEvent.timestamp).toBeDefined();
      expect(firstEvent.type).toBeDefined();
      expect(firstEvent.description).toBeDefined();
      expect(firstEvent.user).toBeDefined();
    });

    it('should have events in chronological order', () => {
      const auditLog = DemoDataLoader.getAuditLog();

      for (let i = 1; i < auditLog.length; i++) {
        const prevTime = new Date(auditLog[i - 1].timestamp).getTime();
        const currTime = new Date(auditLog[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe('getHealthScore', () => {
    it('should calculate health score', () => {
      const health = DemoDataLoader.getHealthScore();

      expect(health).toBeDefined();
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(health.status).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(health.explanation).toBeDefined();
    });

    it('should return warning or critical status when issues exist', () => {
      const health = DemoDataLoader.getHealthScore();
      const issues = DemoDataLoader.getIssues();
      const openIssues = issues.filter((i) => i.status === 'open');

      if (openIssues.length > 0) {
        expect(['warning', 'critical']).toContain(health.status);
      }
    });

    it('should have lower score with more high-severity issues', () => {
      const health = DemoDataLoader.getHealthScore();
      const issues = DemoDataLoader.getIssues();
      const highSeverityIssues = issues.filter(
        (i) => (i.severity === 'high' || i.severity === 'critical') && i.status === 'open'
      );

      if (highSeverityIssues.length > 0) {
        expect(health.score).toBeLessThan(90);
      }
    });
  });
});
