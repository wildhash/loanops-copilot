import { describe, it, expect } from 'vitest';
import { IssueDetectionEngine } from '../services/IssueDetectionEngine';
import { DemoDataLoader } from '../demo/DemoDataLoader';

describe('IssueDetectionEngine', () => {
  describe('detectTermMismatches', () => {
    it('should detect margin mismatch between document versions', () => {
      const loan = DemoDataLoader.getLoan();
      const issues = IssueDetectionEngine.detectTermMismatches(loan);

      expect(issues.length).toBeGreaterThan(0);
      
      const marginMismatch = issues.find((i) => i.title.includes('Margin'));
      expect(marginMismatch).toBeDefined();
      expect(marginMismatch?.type).toBe('term-mismatch');
      expect(marginMismatch?.severity).toBe('high');
    });

    it('should detect leverage ratio covenant changes', () => {
      const loan = DemoDataLoader.getLoan();
      const issues = IssueDetectionEngine.detectTermMismatches(loan);

      const covenantChange = issues.find((i) => i.title.includes('Leverage Ratio'));
      expect(covenantChange).toBeDefined();
      expect(covenantChange?.type).toBe('term-mismatch');
      expect(covenantChange?.severity).toBe('critical');
    });

    it('should return empty array if less than 2 documents', () => {
      const loan = DemoDataLoader.getLoan();
      const singleDocLoan = { ...loan, documents: [loan.documents[0]] };
      const issues = IssueDetectionEngine.detectTermMismatches(singleDocLoan);

      expect(issues).toEqual([]);
    });
  });

  describe('detectUpcomingDeadlines', () => {
    it('should detect obligations due within 7 days as high severity', () => {
      const obligations = DemoDataLoader.getObligations();
      const issues = IssueDetectionEngine.detectUpcomingDeadlines(obligations, 14);

      const dueSoonIssues = issues.filter((i) => i.severity === 'high');
      expect(dueSoonIssues.length).toBeGreaterThan(0);
      
      const firstIssue = dueSoonIssues[0];
      expect(firstIssue.type).toBe('upcoming-deadline');
      expect(firstIssue.details.daysRemaining).toBeLessThanOrEqual(7);
    });

    it('should not flag submitted obligations', () => {
      const obligations = DemoDataLoader.getObligations();
      const submittedObligation = {
        ...obligations[0],
        status: 'submitted' as const,
        daysUntilDue: 5,
      };
      const issues = IssueDetectionEngine.detectUpcomingDeadlines([submittedObligation]);

      expect(issues).toEqual([]);
    });

    it('should detect obligations within custom threshold', () => {
      const obligations = [
        {
          id: 'TEST-OBL',
          title: 'Test Obligation',
          description: 'Test',
          frequency: 'Monthly',
          dueDate: '2024-10-20',
          status: 'due-soon' as const,
          daysUntilDue: 10,
          recipient: 'Test Recipient',
          source: 'Test Source',
          deliverables: ['Test deliverable'],
        },
      ];
      
      const issues = IssueDetectionEngine.detectUpcomingDeadlines(obligations, 14);
      expect(issues.length).toBe(1);
      
      const noIssues = IssueDetectionEngine.detectUpcomingDeadlines(obligations, 7);
      expect(noIssues.length).toBe(0);
    });
  });

  describe('detectCovenantRisks', () => {
    it('should detect at-risk financial covenants', () => {
      const loan = DemoDataLoader.getLoan();
      const covenants = DemoDataLoader.getCovenants();
      const issues = IssueDetectionEngine.detectCovenantRisks(covenants, loan);

      expect(issues.length).toBeGreaterThan(0);
      
      const firstIssue = issues[0];
      expect(firstIssue.type).toBe('covenant-risk');
      expect(['medium', 'high', 'critical']).toContain(firstIssue.severity);
    });

    it('should calculate cushion correctly', () => {
      const loan = DemoDataLoader.getLoan();
      const covenants = DemoDataLoader.getCovenants();
      const issues = IssueDetectionEngine.detectCovenantRisks(covenants, loan);

      const leverageIssue = issues.find((i) => i.title.includes('Leverage'));
      if (leverageIssue) {
        expect(leverageIssue.details.cushion).toBeDefined();
        expect(leverageIssue.details.cushionPercentage).toBeDefined();
        expect(parseFloat(leverageIssue.details.cushion)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should mark critical severity for very small cushion', () => {
      const loan = DemoDataLoader.getLoan();
      const criticalCovenant = {
        id: 'COV-CRITICAL',
        name: 'Critical Test Covenant',
        type: 'financial' as const,
        description: 'Test',
        threshold: '3.00:1.00',
        frequency: 'Quarterly',
        nextDueDate: '2024-12-31',
        status: 'at-risk' as const,
        currentValue: 2.98, // Very close to 3.00 threshold
        trend: 'increasing' as const,
        plainEnglish: 'Test',
        source: 'Test',
        recommendation: 'Test',
      };

      const issues = IssueDetectionEngine.detectCovenantRisks([criticalCovenant], loan);
      expect(issues[0]?.severity).toBe('critical');
    });
  });

  describe('detectAllIssues', () => {
    it('should combine all issue types', () => {
      const loan = DemoDataLoader.getLoan();
      const covenants = DemoDataLoader.getCovenants();
      const obligations = DemoDataLoader.getObligations();

      const allIssues = IssueDetectionEngine.detectAllIssues(loan, covenants, obligations);

      expect(allIssues.length).toBeGreaterThan(0);
      
      const issueTypes = new Set(allIssues.map((i) => i.type));
      expect(issueTypes.size).toBeGreaterThan(1); // Should have multiple types
    });

    it('should generate consistent issue IDs', () => {
      const loan = DemoDataLoader.getLoan();
      const covenants = DemoDataLoader.getCovenants();
      const obligations = DemoDataLoader.getObligations();

      const allIssues = IssueDetectionEngine.detectAllIssues(loan, covenants, obligations);
      const ids = allIssues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size); // All IDs should be unique
    });
  });
});
