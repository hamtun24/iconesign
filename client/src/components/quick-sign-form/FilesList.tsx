import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import type { ProcessingFile } from "../../types/quickSign";

interface FilesListProps {
  files: ProcessingFile[];
  isProcessing: boolean;
  removeFile: (index: number) => void;
  resetForm: () => void;
}

function getStatusIcon(status: ProcessingFile['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case 'signing':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'saving':
      return <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />;
    case 'validating':
      return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function getStatusBadge(status: ProcessingFile['status']) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">En attente</Badge>;
    case 'signing':
      return <Badge variant="default" className="bg-blue-100 text-blue-700">Signature...</Badge>;
    case 'saving':
      return <Badge variant="default" className="bg-purple-100 text-purple-700">Sauvegarde...</Badge>;
    case 'validating':
      return <Badge variant="default" className="bg-orange-100 text-orange-700">Validation...</Badge>;
    case 'success':
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Terminé</Badge>;
    case 'error':
      return <Badge variant="destructive">Échoué</Badge>;
  }
}

export function FilesList({ files, isProcessing, removeFile, resetForm }: FilesListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Fichiers sélectionnés ({files.length})</h3>
        {!isProcessing && (
          <Button variant="outline" size="sm" onClick={resetForm}>
            Tout effacer
          </Button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {files.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.file.size / 1024).toFixed(1)} KB
                  {item.error && (
                    <span className="text-red-500 ml-2">- {item.error}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(item.status)}
              {!isProcessing && item.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}