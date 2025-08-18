import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { FileUpload } from "../components/ui/file-upload";
import { Loader2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { trackUserAction } from "../utils/actionTracker";



export function XmlSignForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signedXmlBlob, setSignedXmlBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const signMutation = useMutation({
    mutationFn: async (file: File) => {
      const startTime = Date.now();
      
      try {
        // Track signing start
        await trackUserAction({
          type: 'simplesign',
          data: {
            action: 'signing_started',
            file_name: file.name,
            file_size: file.size,
            timestamp: new Date().toISOString()
          }
        });

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`api/signature/sign`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const blob = await response.blob();
        
        // Track successful signing
        await trackUserAction({
          type: 'simplesign',
          data: {
            action: 'signing_success',
            file_name: file.name,
            file_size: file.size,
            processing_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        });

        return blob;
      } catch (error) {
        // Track signing error
        await trackUserAction({
          type: 'simplesign',
          data: {
            action: 'signing_error',
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
      setSignedXmlBlob(blob);
      toast({
        title: "Success",
        description: "XML file has been signed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Signing Failed",
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
          type: 'simplesign',
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

  const handleSign = async () => {
    if (!selectedFile) return;

    try {
      // Use the mutation to handle signing with tracking
      signMutation.mutate(selectedFile);
    } catch (error) {
      console.error('Failed to initiate signing:', error);
    }

    // Alternative signing method (commented out - keeping for reference)
    /*
    const reader = new FileReader();
    reader.onload = () => {
      const xmlContent = reader.result as string;

      const payload = {
        documentContent: xmlContent,
        documentName: selectedFile.name,
        mimeType: "text/xml",
        // certificateAlias: "myAlias",     // optional
        // certificatePin: "myPin",         // optional
      };

      axios
        .post("http://localhost:8000/api/v1/sign", payload, {
          headers: { "Content-Type": "application/json" },
          responseType: "blob",
        })
        .then((response) => {
          setSignedXmlBlob(new Blob([response.data], { type: "application/xml" }));
          toast({
            title: "XML Signed",
            description: "Your XML file has been signed successfully.",
          });
        })
        .catch((error) => {
          toast({
            title: "Signing Error",
            description:
              error.response?.data?.message || error.message || "Failed to sign the XML file.",
            variant: "destructive",
          });
        });
    };

    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the selected XML file.",
        variant: "destructive",
      });
    };
    */
  };

  const handleDownload = async () => {
    if (!signedXmlBlob || !selectedFile) return;

    try {
      // Track download action
      await trackUserAction({
        type: 'simplesign',
        data: {
          action: 'signed_file_downloaded',
          file_name: selectedFile.name,
          timestamp: new Date().toISOString()
        }
      });

      const url = URL.createObjectURL(signedXmlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed-${selectedFile.name}`;
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
    setSignedXmlBlob(null);
    signMutation.reset();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Signature numérique XML</span>
        </CardTitle>
        <CardDescription>
          Téléchargez un fichier XML pour le signer selon la norme XAdES-B (signature enveloppée)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload
          accept=".xml"
          onFileSelect={handleFileSelect}
          disabled={signMutation.isPending}
        />

        {signMutation.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {signMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {signedXmlBlob && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Votre fichier XML a été signé avec succès et est prêt à être téléchargé.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={handleSign}
            disabled={!selectedFile || signMutation.isPending}
            className="flex-1"
          >
            {signMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signature en cours...
              </>
            ) : (
              "Signer le XML"
            )}
          </Button>

          {signedXmlBlob && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger le XML signé
            </Button>
          )}

          {(selectedFile || signedXmlBlob) && (
            <Button
              onClick={handleReset}
              variant="ghost"
              disabled={signMutation.isPending}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Prend en charge les fichiers XML jusqu'à 10MB</p>
          <p>• Utilise la norme XAdES-B (signature enveloppée)</p>
          <p>• Intégration avec l'autorité de certification TunTrust</p>
          <p>• Algorithme SHA-256 avec signature RSA-SHA256</p>
        </div>
      </CardContent>
    </Card>
  );
}