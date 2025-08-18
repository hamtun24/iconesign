import { config } from '../config/env';
import { ProcessingFile, BackendSigningResult } from '../types/quickSign';

export class SigningService {
  static async signFilesBatch(
    filesToSign: ProcessingFile[], 
    signal: AbortSignal,
    onStatusUpdate: (index: number, status: ProcessingFile['status']) => void
  ): Promise<BackendSigningResult[]> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    
    // Mark all files as signing
    filesToSign.forEach((_, index) => {
      onStatusUpdate(index, 'signing');
    });

    const formData = new FormData();
    filesToSign.forEach(({ file }) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/signature/sign`, {
        method: 'POST',
        body: formData,
        signal,
        headers: {
          // Don't set Content-Type for FormData - browser will set it with boundary
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage: string;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Signing response:', result);
      
      // Convert backend response to expected format
      const backendResults = Array.isArray(result) ? result : [result];
      const signingResults: BackendSigningResult[] = backendResults.map((item: any) => ({
        success: item.success || false,
        signedXml: item.signedXml || '',
        filename: item.originalFileName || '',
        error: item.error
      }));
      
      return signingResults;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      console.error('Signing failed:', error);
      throw new Error(`Signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async validateSignedFile(
    signedXml: string, 
    originalFileName: string, 
    signal: AbortSignal
  ): Promise<{ isValid: boolean; report?: string; error?: string }> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    
    try {
      const formData = new FormData();
      const signedBlob = new Blob([signedXml], { type: 'application/xml' });
      const signedFile = new File([signedBlob], `signed-${originalFileName}`, { 
        type: 'application/xml' 
      });
      formData.append('file', signedFile);

      const response = await fetch(`${config.apiBaseUrl}/api/validation/validate`, {
        method: 'POST',
        body: formData,
        signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage: string;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return {
        isValid: result.valid || false,
        report: result.report || result.validationReport,
        error: result.error
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      console.error(`Validation failed for ${originalFileName}:`, error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }
}