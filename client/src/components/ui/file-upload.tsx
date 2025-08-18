import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onFileSelect: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = ".xml",
  maxSize = 10 * 1024 * 1024, // 10MB
  onFileSelect,
  className,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    if (accept && !file.name.toLowerCase().endsWith(accept.replace(".", ""))) {
      alert(`Please select a ${accept} file`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive && !disabled ? "border-primary bg-primary/5" : "border-border",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
            selectedFile && "border-primary bg-primary/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />

          {selectedFile ? (
            <div className="flex items-center justify-center space-x-3">
              <File className="h-8 w-8 text-primary" />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium text-foreground">
                  Drop your XML file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: {maxSize / (1024 * 1024)}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
