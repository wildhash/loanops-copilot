// Core loan-related types for the application

export interface Loan {
  loanId: string;
  loanName: string;
  status: 'healthy' | 'at-risk' | 'breach-likely';
  borrower: Party;
  facility: Facility;
  agent: Agent;
  lenders: Lender[];
  governingLaw: string;
  documents: DocumentRef[];
  extractedTerms?: Record<string, ExtractedTerms>;
  currentMetrics?: LoanMetrics;
  covenants?: unknown[];
  reportingObligations?: unknown[];
  differences?: unknown[];
}

export interface Party {
  name: string;
  jurisdiction?: string;
  industry?: string;
}

export interface Facility {
  type: string;
  amount: number;
  currency: string;
  margin: number;
  baseRate: string;
  maturityDate: string;
  originalDate: string;
  lastAmendment: string;
}

export interface Agent {
  name: string;
  role: string;
}

export interface Lender {
  name: string;
  commitment: number;
}

export interface DocumentRef {
  id: string;
  name: string;
  version: string;
  date: string;
  type: string;
}

export interface ExtractedTerms {
  margin: number;
  maturityDate: string;
  amount: number;
  leverageRatioMax: number;
  dscRatioMin: number;
}

export interface LoanMetrics {
  leverageRatio: number;
  dscRatio: number;
  currentRatio: number;
}

export interface Trade {
  id: string;
  date: Date;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
}

export interface EventLog {
  id: string;
  timestamp: Date;
  type: string;
  description: string;
  user: string;
  details?: unknown;
}
