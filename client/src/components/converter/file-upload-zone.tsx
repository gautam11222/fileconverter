import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CloudUpload, Upload, CloudDownload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  disabled?: boolean;
}

export function FileUploadZone({ 
  onFilesAdded, 
  maxSize = 100 * 1024 * 1024, // 100MB 
  acceptedFileTypes,
  disabled = false 
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragOver(false);
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedFileTypes ? 
      Object.fromEntries(acceptedFileTypes.map(type => [type, []])) : 
      undefined,
    disabled,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  });

  return (
    <Card 
      className={cn(
        "border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragActive || isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      data-testid="file-upload-zone"
    >
      <CardContent className="p-8">
        <div {...getRootProps()} className="max-w-md mx-auto text-center">
          <input {...getInputProps()} data-testid="input-file-upload" />
          <CloudUpload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" data-testid="icon-cloud-upload" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-upload-title">
            Drop files here or click to upload
          </h3>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-upload-description">
            Supports multiple files. Maximum file size: {Math.round(maxSize / (1024 * 1024))}MB per file.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={disabled}
              data-testid="button-choose-files"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
            <Button 
              variant="secondary" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              disabled={disabled}
              data-testid="button-from-cloud"
            >
              <CloudDownload className="mr-2 h-4 w-4" />
              From Cloud
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
