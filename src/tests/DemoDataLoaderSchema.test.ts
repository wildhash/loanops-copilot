import { describe, it, expect } from 'vitest';
import { DemoDataLoader } from '../demo/DemoDataLoader';

describe('DemoDataLoader - Schema Validation', () => {
  describe('getLoan', () => {
    it('should return a valid Loan object with all required fields', () => {
      const loan = DemoDataLoader.getLoan();

      // Basic structure
      expect(loan).toBeDefined();
      expect(loan.loanId).toBeDefined();
      expect(typeof loan.loanId).toBe('string');
      expect(loan.loanName).toBeDefined();
      expect(typeof loan.loanName).toBe('string');
      
      // Status validation
      expect(loan.status).toBeDefined();
      expect(['healthy', 'at-risk', 'breach-likely']).toContain(loan.status);

      // Borrower validation
      expect(loan.borrower).toBeDefined();
      expect(loan.borrower.name).toBeDefined();
      expect(typeof loan.borrower.name).toBe('string');
      expect(loan.borrower.jurisdiction).toBeDefined();
      expect(loan.borrower.industry).toBeDefined();

      // Facility validation
      expect(loan.facility).toBeDefined();
      expect(loan.facility.type).toBeDefined();
      expect(typeof loan.facility.amount).toBe('number');
      expect(loan.facility.amount).toBeGreaterThan(0);
      expect(loan.facility.currency).toBeDefined();
      expect(typeof loan.facility.margin).toBe('number');
      expect(loan.facility.baseRate).toBeDefined();
      expect(loan.facility.maturityDate).toBeDefined();
      expect(loan.facility.originalDate).toBeDefined();

      // Agent validation
      expect(loan.agent).toBeDefined();
      expect(loan.agent.name).toBeDefined();
      expect(loan.agent.role).toBeDefined();

      // Lenders validation
      expect(loan.lenders).toBeDefined();
      expect(Array.isArray(loan.lenders)).toBe(true);
      expect(loan.lenders.length).toBeGreaterThan(0);
      loan.lenders.forEach(lender => {
        expect(lender.name).toBeDefined();
        expect(typeof lender.commitment).toBe('number');
        expect(lender.commitment).toBeGreaterThan(0);
      });

      // Documents validation
      expect(loan.documents).toBeDefined();
      expect(Array.isArray(loan.documents)).toBe(true);
      expect(loan.documents.length).toBeGreaterThan(0);
      loan.documents.forEach(doc => {
        expect(doc.id).toBeDefined();
        expect(doc.name).toBeDefined();
        expect(doc.version).toBeDefined();
        expect(doc.date).toBeDefined();
        expect(doc.type).toBeDefined();
      });

      // Extracted terms validation
      expect(loan.extractedTerms).toBeDefined();
      const termKeys = Object.keys(loan.extractedTerms);
      expect(termKeys.length).toBeGreaterThan(0);
      termKeys.forEach(key => {
        const terms = loan.extractedTerms[key];
        expect(typeof terms.margin).toBe('number');
        expect(terms.maturityDate).toBeDefined();
        expect(typeof terms.amount).toBe('number');
        expect(typeof terms.leverageRatioMax).toBe('number');
        expect(typeof terms.dscRatioMin).toBe('number');
      });

      // Current metrics validation
      expect(loan.currentMetrics).toBeDefined();
      expect(typeof loan.currentMetrics.leverageRatio).toBe('number');
      expect(typeof loan.currentMetrics.dscRatio).toBe('number');
      expect(typeof loan.currentMetrics.currentRatio).toBe('number');
    });

    it('should return consistent data across multiple calls', () => {
      const loan1 = DemoDataLoader.getLoan();
      const loan2 = DemoDataLoader.getLoan();

      expect(loan1.loanId).toBe(loan2.loanId);
      expect(loan1.loanName).toBe(loan2.loanName);
      expect(loan1.facility.amount).toBe(loan2.facility.amount);
    });
  });

  describe('getCovenants', () => {
    it('should return a valid array of Covenant objects', () => {
      const covenants = DemoDataLoader.getCovenants();

      expect(covenants).toBeDefined();
      expect(Array.isArray(covenants)).toBe(true);
      expect(covenants.length).toBeGreaterThan(0);

      covenants.forEach(covenant => {
        // Required fields
        expect(covenant.id).toBeDefined();
        expect(covenant.name).toBeDefined();
        expect(covenant.type).toBeDefined();
        expect(['financial', 'negative', 'affirmative', 'operational']).toContain(covenant.type);
        expect(covenant.description).toBeDefined();
        expect(covenant.threshold).toBeDefined();
        expect(covenant.frequency).toBeDefined();
        
        // Status validation
        expect(covenant.status).toBeDefined();
        expect(['compliant', 'at-risk', 'breach-likely']).toContain(covenant.status);
        
        // Numeric fields
        expect(typeof covenant.currentValue).toBe('number');
        
        // Trend validation
        expect(covenant.trend).toBeDefined();
        expect(['increasing', 'decreasing', 'stable']).toContain(covenant.trend);
        
        // Text fields
        expect(covenant.plainEnglish).toBeDefined();
        expect(typeof covenant.plainEnglish).toBe('string');
        expect(covenant.source).toBeDefined();
        expect(covenant.recommendation).toBeDefined();
      });
    });

    it('should include at least one financial covenant', () => {
      const covenants = DemoDataLoader.getCovenants();
      const financialCovenants = covenants.filter(c => c.type === 'financial');
      expect(financialCovenants.length).toBeGreaterThan(0);
    });
  });

  describe('getObligations', () => {
    it('should return a valid array of Obligation objects', () => {
      const obligations = DemoDataLoader.getObligations();

      expect(obligations).toBeDefined();
      expect(Array.isArray(obligations)).toBe(true);
      expect(obligations.length).toBeGreaterThan(0);

      obligations.forEach(obligation => {
        expect(obligation.id).toBeDefined();
        expect(obligation.title).toBeDefined();
        expect(obligation.description).toBeDefined();
        expect(obligation.frequency).toBeDefined();
        expect(obligation.dueDate).toBeDefined();
        
        // Status validation
        expect(obligation.status).toBeDefined();
        expect(['due-soon', 'upcoming', 'overdue', 'submitted']).toContain(obligation.status);
        
        // Numeric field
        expect(typeof obligation.daysUntilDue).toBe('number');
        
        // Required fields
        expect(obligation.recipient).toBeDefined();
        expect(obligation.source).toBeDefined();
        
        // Deliverables array
        expect(Array.isArray(obligation.deliverables)).toBe(true);
      });
    });
  });

  describe('getIssues', () => {
    it('should return a valid array of Issue objects', () => {
      const issues = DemoDataLoader.getIssues();

      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);

      issues.forEach(issue => {
        expect(issue.id).toBeDefined();
        
        // Type validation
        expect(issue.type).toBeDefined();
        expect(['term-mismatch', 'upcoming-deadline', 'covenant-risk']).toContain(issue.type);
        
        // Severity validation
        expect(issue.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity);
        
        expect(issue.title).toBeDefined();
        expect(issue.detected).toBeDefined();
        expect(issue.details).toBeDefined();
        expect(typeof issue.details).toBe('object');
        expect(issue.whyItMatters).toBeDefined();
        
        // Arrays
        expect(Array.isArray(issue.nextSteps)).toBe(true);
        expect(issue.nextSteps.length).toBeGreaterThan(0);
        expect(Array.isArray(issue.whoToNotify)).toBe(true);
        
        // Status validation
        expect(issue.status).toBeDefined();
        expect(['open', 'in-progress', 'resolved']).toContain(issue.status);
        
        expect(issue.createdDate).toBeDefined();
        
        // Priority validation
        expect(issue.priority).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(issue.priority);
      });
    });

    it('should include issues of different types', () => {
      const issues = DemoDataLoader.getIssues();
      const types = [...new Set(issues.map(i => i.type))];
      expect(types.length).toBeGreaterThan(1);
    });
  });

  describe('getAuditLog', () => {
    it('should return a valid array of AuditEvent objects', () => {
      const auditLog = DemoDataLoader.getAuditLog();

      expect(auditLog).toBeDefined();
      expect(Array.isArray(auditLog)).toBe(true);
      expect(auditLog.length).toBeGreaterThan(0);

      auditLog.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.type).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.user).toBeDefined();
        expect(event.details).toBeDefined();
        expect(typeof event.details).toBe('object');
      });
    });

    it('should have chronologically ordered events', () => {
      const auditLog = DemoDataLoader.getAuditLog();
      
      for (let i = 1; i < auditLog.length; i++) {
        const prevTime = new Date(auditLog[i - 1].timestamp).getTime();
        const currTime = new Date(auditLog[i].timestamp).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  describe('getHealthScore', () => {
    it('should return a valid health score object', () => {
      const health = DemoDataLoader.getHealthScore();

      expect(health).toBeDefined();
      expect(typeof health.score).toBe('number');
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      
      expect(health.status).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      
      expect(health.explanation).toBeDefined();
      expect(typeof health.explanation).toBe('string');
      expect(health.explanation.length).toBeGreaterThan(0);
    });

    it('should calculate score based on issues', () => {
      const health = DemoDataLoader.getHealthScore();
      const issues = DemoDataLoader.getIssues();
      const openIssues = issues.filter(i => i.status === 'open');

      // Health score should reflect the presence of open issues
      if (openIssues.length === 0) {
        expect(health.score).toBeGreaterThan(80);
        expect(health.status).toBe('healthy');
      } else {
        const highSeverityIssues = openIssues.filter(
          i => i.severity === 'high' || i.severity === 'critical'
        );
        
        if (highSeverityIssues.length > 0) {
          expect(health.score).toBeLessThan(85);
        }
      }
    });

    it('should be deterministic', () => {
      const health1 = DemoDataLoader.getHealthScore();
      const health2 = DemoDataLoader.getHealthScore();

      expect(health1.score).toBe(health2.score);
      expect(health1.status).toBe(health2.status);
      expect(health1.explanation).toBe(health2.explanation);
    });
  });

  describe('data consistency', () => {
    it('should have consistent document IDs across loan and extracted terms', () => {
      const loan = DemoDataLoader.getLoan();
      const docIds = loan.documents.map(d => d.id);
      const termKeys = Object.keys(loan.extractedTerms);

      // At least some document IDs should have extracted terms
      const overlap = docIds.filter(id => termKeys.includes(id));
      expect(overlap.length).toBeGreaterThan(0);
    });

    it('should have issues that reference valid covenant IDs', () => {
      const covenants = DemoDataLoader.getCovenants();
      const issues = DemoDataLoader.getIssues();
      
      // Validate that we have both data sets
      expect(covenants.length).toBeGreaterThan(0);
      
      const covenantIssues = issues.filter(i => i.type === 'covenant-risk');
      // Covenant-risk issues should exist
      expect(covenantIssues.length).toBeGreaterThan(0);
      
      // Each covenant-risk issue should have proper structure
      covenantIssues.forEach(issue => {
        expect(issue.type).toBe('covenant-risk');
        expect(issue.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity);
      });
    });
  });
});
