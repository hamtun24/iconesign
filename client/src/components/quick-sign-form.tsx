import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, Zap, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// Import refactored components
import { FileDropzone } from './quick-sign-form/FileDropzone';
import { FilesList } from './quick-sign-form/FilesList';
import { QuickSignProgress } from './quick-sign-form/QuickSignProgress';
import { QuickSignActions } from './quick-sign-form/QuickSignActions';
import { ProcessingSummary } from './ProcessingSummary';

// Import custom hooks
import { useQuickSignState } from '../hooks/useQuickSignState';
import { useQuickSignProcessor } from '../hooks/useQuickSignProcessor';
import { TrackingService } from '../services/trackingService';

export function QuickSignForm() {
  const {
    state,
    updateState,
    addFiles,
    removeFile,
    updateFileStatus,
    resetForm,
  } = useQuickSignState();

  const { processQuickSign, cancelOperation } = useQuickSignProcessor({
    files: state.files,
    updateState,
    updateFileStatus: (index, status, message) => {
      updateFileStatus(index, status);
      // Add message handling if needed
      if (message) {
        console.log(`File ${index}: ${status} - ${message}`);
      }
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate files before adding
    const validFiles = acceptedFiles.filter(file => {
      const isXml = file.type === 'text/xml' || file.type === 'application/xml' || file.name.toLowerCase().endsWith('.xml');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isXml && isValidSize;
    });

    if (validFiles.length !== acceptedFiles.length) {
      // Show warning about rejected files
      const rejectedCount = acceptedFiles.length - validFiles.length;
      console.warn(`${rejectedCount} files were rejected (invalid type or size)`);
    }

    addFiles(validFiles);
    await TrackingService.trackFileUpload(validFiles);
  }, [addFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const downloadResults = async () => {
    if (state.downloadUrl) {
      const link = document.createElement('a');
      link.href = state.downloadUrl;
      link.download = `quick-sign-results-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const successCount = state.files.filter(f => f.status === 'success').length;
      await TrackingService.trackDownload(state.files.length, successCount);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Signature rapide - Traitement par lot
        </CardTitle>
        <CardDescription>
          Téléchargez plusieurs fichiers XML pour une signature et validation automatiques. 
          Recevez les fichiers signés et les rapports de validation dans une archive ZIP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <FileDropzone
          onDrop={onDrop}
          isDragActive={isDragActive}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />

        {/* Files List */}
        {state.files.length > 0 && (
          <FilesList
            files={state.files}
            isProcessing={state.isProcessing}
            removeFile={removeFile}
            resetForm={resetForm}
          />
        )}

        {/* Progress Bar */}
        {state.isProcessing && (
          <>
            <QuickSignProgress
              currentStep={state.currentStep}
              progress={state.progress}
            />
            <div className="flex justify-end">
              <button
                className="text-xs text-red-600 hover:text-red-800 underline"
                onClick={cancelOperation}
                disabled={!state.isProcessing}
                type="button"
              >
                Annuler le traitement
              </button>
            </div>
          </>
        )}

        {/* Processing Summary */}
        {state.results && (
          <ProcessingSummary summary={state.results.summary} />
        )}

        {/* Status Messages */}
        {state.downloadUrl && !state.cancelled && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Le traitement est terminé ! Vos fichiers signés et rapports de validation sont prêts à être téléchargés.
            </AlertDescription>
          </Alert>
        )}
        
        {state.cancelled && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Le traitement a été annulé. Certains fichiers peuvent avoir été traités.
            </AlertDescription>
          </Alert>
        )}

        {state.results && state.results.summary.failed > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              {state.results.summary.failed} fichier(s) n'ont pas pu être traités complètement. 
              Consultez les détails dans l'archive téléchargée.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <QuickSignActions
          files={state.files}
          isProcessing={state.isProcessing}
          processQuickSign={processQuickSign}
          downloadUrl={state.downloadUrl}
          downloadResults={downloadResults}
        />

        {/* Feature Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Signature automatique par lot de tous les fichiers selon la norme XAdES-B</p>
          <p>• Sauvegarde automatique sur le serveur TTN</p>
          <p>• Validation de chaque fichier signé pour conformité ANCE</p>
          <p>• Téléchargement ZIP avec XML signés, rapports de validation et résumé détaillé</p>
        </div>
      </CardContent>
    </Card>
  );
}