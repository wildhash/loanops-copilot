// Fixture for RiskAnalyzer tests
import { Covenant, ReportingObligation, VersionDifference } from '../../types';

export const mockCovenantCompliant: Covenant = {
  id: 'COV-TEST-001',
  type: 'financial',
  description: 'Debt Service Coverage Ratio must be at least 1.20x',
  threshold: '1.20x',
  frequency: 'quarterly',
  status: 'compliant',
  riskLevel: 'low',
  explanation: 'This covenant ensures the borrower generates sufficient cash flow to service debt',
  location: 'Section 6.11 - Financial Covenants'
};

export const mockCovenantAtRisk: Covenant = {
  id: 'COV-TEST-002',
  type: 'financial',
  description: 'Maximum Leverage Ratio not to exceed 3.50:1.00',
  threshold: '3.50:1.00',
  frequency: 'quarterly',
  status: 'at-risk',
  riskLevel: 'high',
  explanation: 'This covenant limits the amount of debt relative to EBITDA',
  location: 'Section 6.12 - Financial Covenants'
};

export const mockCovenantBreached: Covenant = {
  id: 'COV-TEST-003',
  type: 'financial',
  description: 'Minimum Liquidity Requirement of $5.0M',
  threshold: '$5.0M',
  frequency: 'quarterly',
  status: 'breached',
  riskLevel: 'critical',
  explanation: 'This covenant ensures the borrower maintains adequate cash reserves',
  location: 'Section 6.13 - Financial Covenants'
};

export const mockReportingObligationOverdue: ReportingObligation = {
  id: 'REP-TEST-001',
  title: 'Quarterly Financial Statements',
  description: 'Provide quarterly financial statements within 45 days of quarter end',
  frequency: 'quarterly',
  status: 'overdue',
  recipient: 'Administrative Agent',
};

export const mockReportingObligationDueSoon: ReportingObligation = {
  id: 'REP-TEST-002',
  title: 'Annual Compliance Certificate',
  description: 'Provide annual compliance certificate within 90 days of fiscal year end',
  frequency: 'annually',
  status: 'due-soon',
  recipient: 'All Lenders',
};

export const mockVersionDifferenceCritical: VersionDifference = {
  type: 'modified',
  section: 'Section 2.1 - Interest Rate',
  oldValue: 'SOFR + 225 bps',
  newValue: 'SOFR + 325 bps',
  significance: 'critical',
  explanation: 'Material change to pricing increases borrowing costs by 100 bps'
};

export const mockVersionDifferenceHigh: VersionDifference = {
  type: 'modified',
  section: 'Section 7.1 - Maturity Date',
  oldValue: 'December 31, 2026',
  newValue: 'June 30, 2026',
  significance: 'high',
  explanation: 'Maturity date shortened by 6 months, reducing flexibility'
};

export const mockLoanRiskDataLow = {
  covenants: [mockCovenantCompliant],
  reportingObligations: [],
  differences: []
};

export const mockLoanRiskDataMedium = {
  covenants: [mockCovenantCompliant, mockCovenantAtRisk],
  reportingObligations: [mockReportingObligationDueSoon],
  differences: []
};

export const mockLoanRiskDataHigh = {
  covenants: [mockCovenantCompliant, mockCovenantAtRisk, mockCovenantBreached],
  reportingObligations: [mockReportingObligationOverdue],
  differences: [mockVersionDifferenceHigh]
};

export const mockLoanRiskDataCritical = {
  covenants: [mockCovenantBreached],
  reportingObligations: [mockReportingObligationOverdue],
  differences: [mockVersionDifferenceCritical]
};
