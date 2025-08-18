import { useRef } from 'react';

export function useCancellableOperation() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const startOperation = async (operation: (signal: AbortSignal) => Promise<void>) => {
    abortControllerRef.current = new AbortController();
    try {
      await operation(abortControllerRef.current.signal);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // Cancelled
      } else {
        throw error;
      }
    }
  };

  const cancelOperation = () => {
    abortControllerRef.current?.abort();
  };

  return { startOperation, cancelOperation, abortControllerRef };
}