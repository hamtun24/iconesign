import { useCallback, useRef } from 'react';
import { ProcessingFile, QuickSignState, WorkflowResult } from '../types/quickSign';
import { WorkflowService } from '../services/workflow-service';

interface UseQuickSignProcessorProps {
  files: ProcessingFile[];
  updateState: (updates: Partial<QuickSignState>) => void;
  updateFileStatus: (index: number, status: ProcessingFile['status'], message?: string) => void;
}

export function useQuickSignProcessor({
  files,
  updateState,
  updateFileStatus,
}: UseQuickSignProcessorProps) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const processQuickSign = useCallback(async () => {
    if (files.length === 0) return;

    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      updateState({
        isProcessing: true,
        cancelled: false,
        currentStep: 'Initialisation du traitement...',
        progress: 0,
        downloadUrl: null,
      });

      // Reset all file statuses to pending
      files.forEach((_, index) => {
        updateFileStatus(index, 'pending');
      });

      const onStatusUpdate = (index: number, status: ProcessingFile['status'], message?: string) => {
        if (signal.aborted) return;

        updateFileStatus(index, status, message);
        
        // Calculate progress based on file statuses
        const completedFiles = files.filter(f => f.status === 'success' || f.status === 'error').length;
        const progress = Math.round((completedFiles / files.length) * 100);
        
        let currentStep = 'Traitement en cours...';
        if (status === 'signing') currentStep = 'Signature des fichiers...';
        else if (status === 'saving') currentStep = 'Sauvegarde sur le serveur TTN...';
        else if (status === 'validating') currentStep = 'Validation des signatures...';
        else if (completedFiles === files.length) currentStep = 'Création du package de téléchargement...';

        updateState({ 
          progress, 
          currentStep: message || currentStep 
        });
      };

      const results: WorkflowResult = await WorkflowService.processFiles(
        files,
        signal,
        onStatusUpdate
      );

      if (!signal.aborted) {
        updateState({
          isProcessing: false,
          currentStep: 'Traitement terminé',
          progress: 100,
          downloadUrl: results.downloadUrl,
          results,
        });
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateState({
          isProcessing: false,
          cancelled: true,
          currentStep: 'Traitement annulé',
        });
      } else {
        console.error('Processing error:', error);
        updateState({
          isProcessing: false,
          currentStep: 'Erreur lors du traitement',
        });
        
        // Mark all pending files as error
        files.forEach((file, index) => {
          if (file.status === 'pending') {
            updateFileStatus(index, 'error', 'Traitement interrompu');
          }
        });
      }
    }
  }, [files, updateState, updateFileStatus]);

  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    processQuickSign,
    cancelOperation,
  };
}

// services/trackingService.ts
export class TrackingService {
  static async trackFileUpload(files: File[]): Promise<void> {
    try {
      console.log(`Files uploaded: ${files.length} files`, {
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        fileTypes: [...new Set(files.map(f => f.type))],
      });
      
      // Here you could send analytics to your backend
      // await fetch('/api/analytics/file-upload', { ... });
    } catch (error) {
      console.warn('Failed to track file upload:', error);
    }
  }

  static async trackDownload(totalFiles: number, successCount: number): Promise<void> {
    try {
      console.log('Download initiated', {
        totalFiles,
        successCount,
        successRate: Math.round((successCount / totalFiles) * 100),
      });
      
      // Here you could send analytics to your backend
      // await fetch('/api/analytics/download', { ... });
    } catch (error) {
      console.warn('Failed to track download:', error);
    }
  }

  static async trackProcessingStart(fileCount: number): Promise<void> {
    try {
      console.log('Processing started', { fileCount });
      
      // Here you could send analytics to your backend
      // await fetch('/api/analytics/processing-start', { ... });
    } catch (error) {
      console.warn('Failed to track processing start:', error);
    }
  }

  static async trackProcessingComplete(
    totalFiles: number, 
    signed: number, 
    saved: number, 
    validated: number
  ): Promise<void> {
    try {
      console.log('Processing completed', {
        totalFiles,
        signed,
        saved,
        validated,
        successRate: Math.round((Math.min(signed, saved, validated) / totalFiles) * 100),
      });
      
      // Here you could send analytics to your backend
      // await fetch('/api/analytics/processing-complete', { ... });
    } catch (error) {
      console.warn('Failed to track processing complete:', error);
    }
  }
}