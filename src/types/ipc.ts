// IPC channels and payload types for Electron communication

export interface UploadDocumentResult {
  path: string;
  name: string;
  size: number;
}

export interface ParseDocumentResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface ExtractCovenantsResult {
  success: boolean;
  covenants?: unknown[];
  error?: string;
}

export interface CompareVersionsResult {
  success: boolean;
  differences?: unknown[];
  error?: string;
}

export interface AnalyzeRiskResult {
  success: boolean;
  riskAnalysis?: unknown;
  error?: string;
}

export interface GetLoanHealthResult {
  success: boolean;
  health?: {
    overall: string;
    score: number;
    metrics: {
      documentCompliance: number;
      covenantAdherence: number;
      reportingTimeliness: number;
      riskLevel: string;
    };
  };
  error?: string;
}
