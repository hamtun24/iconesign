import { Button } from '../../components/ui/button';
import { Zap, Download } from 'lucide-react';

import type { ProcessingFile } from '../../types/quickSign';

interface QuickSignActionsProps {
  files: ProcessingFile[];
  isProcessing: boolean;
  processQuickSign: () => void;
  downloadUrl: string | null;
  downloadResults: () => void;
}

export function QuickSignActions({
  files,
  isProcessing,
  processQuickSign,
  downloadUrl,
  downloadResults,
}: QuickSignActionsProps) {
  return (
    <div className="flex gap-3">
      <Button
        onClick={processQuickSign}
        disabled={files.length === 0 || isProcessing}
        className="flex-1"
      >
        {isProcessing ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Traitement en cours...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Signature rapide & validation ({files.length} fichiers)
          </>
        )}
      </Button>
      {downloadUrl && (
        <Button onClick={downloadResults} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Télécharger les résultats
        </Button>
      )}
    </div>
  );
}
