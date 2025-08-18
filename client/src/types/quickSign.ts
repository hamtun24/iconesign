// types/quickSign.ts

export interface ProcessingFile {
  file: File;
  status: 'pending' | 'signing' | 'saving' | 'validating' | 'success' | 'error';
  error?: string;
  progress?: number;
}

export interface BackendSigningResult {
  filename: string;
  success: boolean;
  signedXml?: string;
  error?: string;
  size?: number;
  originalSize?: number;
}

export interface ValidationResult {
  fileName: string;
  isValid: boolean;
  report?: string;
  error?: string;
}

export interface TtnSaveResult {
  fileName: string;
  success: boolean;
  response?: any;
  error?: string;
}

export interface WorkflowSummary {
  total: number;
  signed: number;
  saved: number;
  validated: number;
  failed: number;
}

export interface WorkflowResult {
  signedFiles: BackendSigningResult[];
  validationResults: ValidationResult[];
  ttnResults: TtnSaveResult[];
  downloadUrl: string | null;
  summary: WorkflowSummary;
}

export interface QuickSignState {
  files: ProcessingFile[];
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  downloadUrl: string | null;
  cancelled: boolean;
  results?: WorkflowResult;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SigningApiResponse {
  success: boolean;
  results: BackendSigningResult[];
  error?: string;
}

export interface ValidationApiResponse {
  valid: boolean;
  report?: string;
  validationReport?: string;
  error?: string;
}

export interface DownloadPackageResponse {
  downloadUrl: string;
  expiresAt: string;
}