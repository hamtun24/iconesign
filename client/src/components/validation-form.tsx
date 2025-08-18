import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { FileUpload } from "../components/ui/file-upload";
import { Loader2, Download, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { trackUserAction } from "../utils/actionTracker";

export function ValidationForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResultBlob, setValidationResultBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      const startTime = Date.now();
      
      try {
        // Track validation start
        await trackUserAction({
          type: 'validation',
          data: {
            action: 'validation_started',
            file_name: file.name,
            file_size: file.size,
            timestamp: new Date().toISOString()
          }
        });

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/validation/validate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const blob = await response.blob();
        
        // Track successful validation
        await trackUserAction({
          type: 'validation',
          data: {
            action: 'validation_success',
            file_name: file.name,
            file_size: file.size,
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        });

        return blob;
      } catch (error) {
        // Track validation error
        await trackUserAction({
          type: 'validation',
          data: {
            action: 'validation_error',
            file_name: file.name,
            file_size: file.size,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        });
        
        throw error;
      }
    },
    onSuccess: (blob) => {
      setValidationResultBlob(blob);
      toast({
        title: "Validation Complete",
        description: "Signature validation report is ready for download!",
      });
    },
    onError: (error) => {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      try {
        // Track file selection
        await trackUserAction({
          type: 'validation',
          data: {
            action: 'file_selected',
            file_name: file.name,
            file_size: file.size,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('Failed to track file selection:', error);
      }
    }
  };

  const handleValidate = () => {
    if (!selectedFile) return;
    validateMutation.mutate(selectedFile);
  };

  const handleDownload = async () => {
    if (!validationResultBlob || !selectedFile) return;

    try {
      // Track download action
      await trackUserAction({
        type: 'validation',
        data: {
          action: 'report_downloaded',
          file_name: selectedFile.name,
          timestamp: new Date().toISOString()
        }
      });

      const url = URL.createObjectURL(validationResultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-result-${selectedFile.name.replace(/\.[^.]+$/, '')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to track download action:', error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResultBlob(null);
    validateMutation.reset();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5" />
          <span>Validation de signature</span>
        </CardTitle>
        <CardDescription>
          Téléchargez un fichier XML signé pour valider sa signature numérique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload
          accept=".xml"
          onFileSelect={handleFileSelect}
          disabled={validateMutation.isPending}
        />

        {validateMutation.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validateMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {validationResultBlob && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Le rapport de validation a été généré et est prêt à être téléchargé.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={handleValidate}
            disabled={!selectedFile || validateMutation.isPending}
            className="flex-1"
          >
            {validateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validation en cours...
              </>
            ) : (
              "Valider la signature"
            )}
          </Button>

          {validationResultBlob && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger le rapport
            </Button>
          )}

          {(selectedFile || validationResultBlob) && (
            <Button
              onClick={handleReset}
              variant="ghost"
              disabled={validateMutation.isPending}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Valide les signatures numériques XAdES-B et autres standards</p>
          <p>• Vérifie la validité du certificat et la chaîne de confiance</p>
          <p>• Vérifie l'intégrité et l'authenticité de la signature</p>
          <p>• Génère un rapport de validation détaillé au format JSON</p>
        </div>
      </CardContent>
    </Card>
  );
}