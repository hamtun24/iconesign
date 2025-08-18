export class FileValidator {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['text/xml', 'application/xml'];
  private static readonly ALLOWED_EXTENSIONS = ['.xml'];

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum autorisé: 10MB`,
      };
    }

    // Check file type
    const hasValidType = this.ALLOWED_TYPES.includes(file.type);
    const hasValidExtension = this.ALLOWED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      return {
        valid: false,
        error: 'Format de fichier non supporté. Seuls les fichiers XML sont acceptés',
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Le fichier est vide',
      };
    }

    return { valid: true };
  }

  static validateFiles(files: File[]): { 
    validFiles: File[]; 
    invalidFiles: Array<{ file: File; error: string }> 
  } {
    const validFiles: File[] = [];
    const invalidFiles: Array<{ file: File; error: string }> = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error! });
      }
    });

    return { validFiles, invalidFiles };
  }
}