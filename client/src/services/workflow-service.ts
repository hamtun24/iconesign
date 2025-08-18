import { SigningService } from './signingService';
import { ProcessingFile, BackendSigningResult, WorkflowResult } from '../types/quickSign';


export class WorkflowService {
  private static readonly API_BASE = '';

  static async processFiles(
    files: ProcessingFile[],
    signal: AbortSignal,
    onStatusUpdate: (index: number, status: ProcessingFile['status'], message?: string) => void
  ): Promise<WorkflowResult> {
    const results: WorkflowResult = {
      signedFiles: [],
      validationResults: [],
      ttnResults: [],
      downloadUrl: null,
      summary: {
        total: files.length,
        signed: 0,
        saved: 0,
        validated: 0,
        failed: 0
      }
    };

    try {
      // Step 1: Sign all files
      onStatusUpdate(-1, 'signing', 'Starting batch signing...');
      
      const signedFiles = await SigningService.signFilesBatch(files, signal, onStatusUpdate);
      results.signedFiles = signedFiles;
      results.summary.signed = signedFiles.filter(f => f.success).length;

      // Step 2: Save signed files to TTN server
      files.forEach((_, index) => {
        onStatusUpdate(index, "saving", 'Saving to TTN server...');
      });

      const ttnResults = await this.saveToTtnServer(signedFiles, signal);
      results.ttnResults = ttnResults;
      results.summary.saved = ttnResults.filter(r => r.success).length;

      // Step 3: Validate saved files
      files.forEach((_, index) => {
        onStatusUpdate(index, 'validating', 'Validating signatures...');
      });

      const validationResults = await this.validateSignedFiles(
        signedFiles, 
        signal, 
        onStatusUpdate
      );
      results.validationResults = validationResults;
      results.summary.validated = validationResults.filter(r => r.isValid).length;

      // Step 4: Create download package
      onStatusUpdate(-1, 'success', 'Creating download package...');
      results.downloadUrl = await this.createDownloadPackage(results, signal);

      // Calculate failures
      results.summary.failed = results.summary.total - 
        Math.min(results.summary.signed, results.summary.saved, results.summary.validated);

      return results;
    } catch (error) {
      console.error('Workflow processing failed:', error);
      throw error;
    }
  }

  private static async saveToTtnServer(
    signedFiles: BackendSigningResult[],
    signal: AbortSignal
  ): Promise<Array<{ fileName: string; success: boolean; response?: any; error?: string }>> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const results: Array<{ fileName: string; success: boolean; response?: any; error?: string }> = [];

    for (const signedFile of signedFiles) {
      if (!signedFile.success || !signedFile.signedXml) {
        results.push({
          fileName: signedFile.filename,
          success: false,
          error: 'File was not successfully signed'
        });
        continue;
      }

      try {
          const formData = new FormData();
        const xmlBlob = new Blob([signedFile.signedXml], { type: "application/xml" });
        formData.append('invoiceFile', xmlBlob, signedFile.filename);

        formData.append('arg0', 'ICONEFE');
        formData.append('arg1', 'V@xP!8mK#z73Lq9W');
        formData.append('arg2', '0786415L');
        console.log('FormData:', formData.get('invoiceFile'));
        console.log('FormData:', formData.get('arg0'));
        console.log('FormData:', formData.get('arg1'));
        console.log('FormData:', formData.get('arg2'));

        const response = await fetch(`http://localhost:3000/api/efact/save`, {
          method: 'POST',
          body: formData,
          signal
        });
       
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            error: `HTTP ${response.status}: ${response.statusText}` 
          }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const saveResult = await response.json();
        results.push({
          fileName: signedFile.filename,
          success: true,
          response: saveResult
        });

      } catch (error) {
        console.error(`Failed to save file ${signedFile.filename}:`, error);
        results.push({
          fileName: signedFile.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private static async validateSignedFiles(
    signedFiles: BackendSigningResult[],
    signal: AbortSignal,
    onStatusUpdate: (index: number, status: ProcessingFile['status'], message?: string) => void
  ): Promise<Array<{ fileName: string; isValid: boolean; report?: string; error?: string }>> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const validationResults: Array<{ fileName: string; isValid: boolean; report?: string; error?: string }> = [];

    for (let i = 0; i < signedFiles.length; i++) {
      const signedFile = signedFiles[i];
      
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      try {
        if (signedFile.success && signedFile.signedXml) {
          const validationResult = await SigningService.validateSignedFile(
            signedFile.signedXml,
            signedFile.filename,
            signal
          );
          
          validationResults.push({
            fileName: signedFile.filename,
            isValid: validationResult.isValid,
            report: validationResult.report,
            error: validationResult.error
          });
          
          const status = validationResult.isValid ? 'success' : 'error';
          const message = validationResult.isValid 
            ? 'Processing completed successfully' 
            : `Validation failed: ${validationResult.error}`;
          
          onStatusUpdate(i, status, message);
        } else {
          validationResults.push({
            fileName: signedFile.filename,
            isValid: false,
            error: signedFile.error || 'File was not successfully signed'
          });
          onStatusUpdate(i, 'error', 'File signing failed');
        }
      } catch (error) {
        validationResults.push({
          fileName: signedFile.filename,
          isValid: false,
          error: error instanceof Error ? error.message : 'Validation failed'
        });
        onStatusUpdate(i, 'error', 'Validation failed');
      }
    }

    return validationResults;
  }

  private static async createDownloadPackage(
    results: WorkflowResult,
    signal: AbortSignal
  ): Promise<string | null> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
      const response = await fetch(`${this.API_BASE}/api/download/create-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedFiles: results.signedFiles,
          validationResults: results.validationResults,
          ttnResults: results.ttnResults,
          summary: results.summary
        }),
        signal
      });

      if (!response.ok) {
        console.error('Failed to create download package');
        return null;
      }

      const result = await response.json();
      return result.downloadUrl || null;
    } catch (error) {
      console.error('Error creating download package:', error);
      return null;
    }
  }
}