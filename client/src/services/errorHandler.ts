export class ErrorHandler {
  static handleApiError(error: any): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'Opération annulée';
      }
      
      if (error.message.includes('fetch')) {
        return 'Erreur de connexion au serveur';
      }
      
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Une erreur inconnue s\'est produite';
  }

  static logError(context: string, error: any): void {
    console.error(`[${context}]`, {
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  }

  static createErrorResponse(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }
}