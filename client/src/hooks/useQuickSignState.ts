import { useState, useCallback } from 'react';
import { ProcessingFile, QuickSignState, WorkflowResult } from '../types/quickSign';

export function useQuickSignState() {
  const [state, setState] = useState<QuickSignState>({
    files: [],
    isProcessing: false,
    currentStep: '',
    progress: 0,
    downloadUrl: null,
    cancelled: false,
    results: undefined,
  });

  const updateState = useCallback((updates: Partial<QuickSignState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const processingFiles: ProcessingFile[] = newFiles.map(file => ({
      file,
      status: 'pending',
    }));
    
    setState(prev => ({
      ...prev,
      files: [...prev.files, ...processingFiles],
      // Reset previous results when adding new files
      downloadUrl: null,
      results: undefined,
      cancelled: false,
    }));
  }, []);

  const removeFile = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  }, []);

  const updateFileStatus = useCallback((index: number, status: ProcessingFile['status'], error?: string) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map((file, i) => 
        i === index ? { ...file, status, error } : file
      ),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      files: [],
      isProcessing: false,
      currentStep: '',
      progress: 0,
      downloadUrl: null,
      cancelled: false,
      results: undefined,
    });
  }, []);

  const setResults = useCallback((results: WorkflowResult) => {
    setState(prev => ({ ...prev, results }));
  }, []);

  return {
    state,
    updateState,
    addFiles,
    removeFile,
    updateFileStatus,
    resetForm,
    setResults,
  };
}