import { DemoLoan, DemoCovenant, DemoObligation, DemoIssue } from '../demo/DemoDataLoader';

export class IssueDetectionEngine {
  /**
   * Rule 1: Detect term mismatches across document versions
   */
  static detectTermMismatches(loan: DemoLoan): DemoIssue[] {
    const issues: DemoIssue[] = [];
    const docs = loan.documents;

    if (docs.length < 2) return issues;

    const doc1 = docs[0];
    const doc2 = docs[1];
    const terms1 = loan.extractedTerms[doc1.id];
    const terms2 = loan.extractedTerms[doc2.id];

    if (!terms1 || !terms2) return issues;

    // Check margin mismatch
    if (terms1.margin !== terms2.margin) {
      issues.push({
        id: `ISSUE-MISMATCH-${Date.now()}`,
        type: 'term-mismatch',
        severity: 'high',
        title: 'Margin Rate Mismatch Detected',
        detected: `Inconsistency found between ${doc1.name} and ${doc2.name}`,
        details: {
          field: 'Margin (bps over SOFR)',
          document1: {
            name: doc1.name,
            value: `${terms1.margin} bps`,
            section: 'Interest Rate Definition',
          },
          document2: {
            name: doc2.name,
            value: `${terms2.margin} bps`,
            section: 'Amended Interest Rate',
          },
        },
        whyItMatters:
          'This difference significantly impacts borrowing costs. Inconsistency could lead to incorrect billing or disputes.',
        nextSteps: [
          'Verify amendment was properly executed',
          'Update loan management system with current margin',
          'Calculate retroactive interest adjustment if needed',
        ],
        whoToNotify: ['Administrative Agent', 'Borrower CFO', 'Lender Credit Team'],
        status: 'open',
        createdDate: new Date().toISOString().split('T')[0],
        priority: 'high',
      });
    }

    // Check leverage ratio covenant changes
    if (terms1.leverageRatioMax !== terms2.leverageRatioMax) {
      issues.push({
        id: `ISSUE-COVENANT-CHANGE-${Date.now()}`,
        type: 'term-mismatch',
        severity: 'critical',
        title: 'Leverage Ratio Covenant Modified',
        detected: `Leverage ratio covenant changed from ${terms1.leverageRatioMax}x to ${terms2.leverageRatioMax}x`,
        details: {
          field: 'Maximum Leverage Ratio',
          document1: {
            name: doc1.name,
            value: `${terms1.leverageRatioMax}:1.00`,
            section: 'Financial Covenants',
          },
          document2: {
            name: doc2.name,
            value: `${terms2.leverageRatioMax}:1.00`,
            section: 'Amended Financial Covenants',
          },
        },
        whyItMatters:
          'Material change to financial covenant. Tighter covenant increases risk of future breach.',
        nextSteps: [
          'Review amendment rationale and lender concerns',
          'Assess borrower ability to comply with tighter covenant',
          'Update covenant monitoring thresholds',
        ],
        whoToNotify: ['Credit Officer', 'Risk Management', 'All Lenders'],
        status: 'open',
        createdDate: new Date().toISOString().split('T')[0],
        priority: 'high',
      });
    }

    return issues;
  }

  /**
   * Rule 2: Detect upcoming deadlines within threshold
   */
  static detectUpcomingDeadlines(
    obligations: DemoObligation[],
    thresholdDays: number = 14
  ): DemoIssue[] {
    const issues: DemoIssue[] = [];

    for (const obligation of obligations) {
      if (obligation.daysUntilDue <= thresholdDays && obligation.status !== 'submitted') {
        const severity =
          obligation.daysUntilDue <= 7
            ? 'high'
            : obligation.daysUntilDue <= 14
              ? 'medium'
              : 'low';

        issues.push({
          id: `ISSUE-DEADLINE-${obligation.id}`,
          type: 'upcoming-deadline',
          severity: severity as 'high' | 'medium' | 'low',
          title: `${obligation.title} Due in ${obligation.daysUntilDue} Days`,
          detected: `${obligation.frequency} reporting obligation deadline approaching`,
          details: {
            obligation: obligation.title,
            dueDate: obligation.dueDate,
            daysRemaining: obligation.daysUntilDue,
            prepared: false,
            deliverables: obligation.deliverables,
          },
          whyItMatters:
            'Late submission constitutes a technical default and may trigger default interest rates.',
          nextSteps: [
            `Contact ${obligation.recipient} immediately to initiate preparation`,
            'Request preliminary calculations',
            'Schedule review call',
            'Prepare extension request as backup if needed',
          ],
          whoToNotify: ['Borrower CFO', 'Administrative Agent Operations', 'Credit Officer'],
          status: 'open',
          createdDate: new Date().toISOString().split('T')[0],
          priority: severity === 'high' ? 'high' : 'medium',
        });
      }
    }

    return issues;
  }

  /**
   * Rule 3: Detect covenant risk based on proximity to threshold
   */
  static detectCovenantRisks(covenants: DemoCovenant[], loan: DemoLoan): DemoIssue[] {
    const issues: DemoIssue[] = [];

    for (const covenant of covenants) {
      if (covenant.type === 'financial' && covenant.status === 'at-risk') {
        const currentValue = covenant.currentValue;
        const threshold = parseFloat(covenant.threshold.split(':')[0]);
        const cushion = Math.abs(threshold - currentValue);
        const cushionPercentage = ((cushion / threshold) * 100).toFixed(1);

        issues.push({
          id: `ISSUE-COVENANT-${covenant.id}`,
          type: 'covenant-risk',
          severity: cushion < 0.1 ? 'critical' : 'medium',
          title: `${covenant.name} Approaching Limit`,
          detected: `Current ${covenant.name.toLowerCase()} is ${currentValue}, approaching maximum covenant of ${threshold} with ${covenant.trend} trend`,
          details: {
            covenant: covenant.name,
            currentValue: currentValue,
            threshold: threshold,
            cushion: cushion.toFixed(2),
            cushionPercentage: cushionPercentage + '%',
            trend: covenant.trend,
            projectedNextQuarter: (currentValue + (covenant.trend === 'increasing' ? 0.03 : 0)).toFixed(
              2
            ),
          },
          whyItMatters: `Breaching this covenant triggers an Event of Default, potentially allowing lenders to accelerate the loan and demand immediate repayment of $${(loan.facility.amount / 1000000).toFixed(0)}M facility.`,
          nextSteps: [
            'Request updated financial projections from Borrower',
            'Evaluate options: debt repayment, equity injection, or covenant amendment',
            'Prepare amendment proposal if breach appears likely',
            'Consider increasing monitoring frequency to monthly',
            'Document all discussions in credit file',
          ],
          whoToNotify: [
            'Credit Officer',
            'Risk Management',
            'Borrower CFO',
            'Lender Relationship Managers',
          ],
          status: 'open',
          createdDate: new Date().toISOString().split('T')[0],
          priority: cushion < 0.1 ? 'high' : 'medium',
        });
      }
    }

    return issues;
  }

  /**
   * Run all detection rules and return combined issues
   */
  static detectAllIssues(
    loan: DemoLoan,
    covenants: DemoCovenant[],
    obligations: DemoObligation[]
  ): DemoIssue[] {
    const termMismatches = this.detectTermMismatches(loan);
    const upcomingDeadlines = this.detectUpcomingDeadlines(obligations);
    const covenantRisks = this.detectCovenantRisks(covenants, loan);

    return [...termMismatches, ...upcomingDeadlines, ...covenantRisks];
  }
}
