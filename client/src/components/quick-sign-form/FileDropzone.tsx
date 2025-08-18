import { Upload } from 'lucide-react';

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  isDragActive: boolean;
  getRootProps: () => any;
  getInputProps: () => any;
}

export function FileDropzone({ onDrop, isDragActive, getRootProps, getInputProps }: FileDropzoneProps) {
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
      {isDragActive ? (
        <p className="text-sm text-muted-foreground">Déposez les fichiers XML ici...</p>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Glissez-déposez plusieurs fichiers XML ici, ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground">
            Prend en charge les fichiers XML jusqu'à 10MB chacun
          </p>
        </div>
      )}
    </div>
  );
}
