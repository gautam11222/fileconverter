import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/types/converter';
import { File, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FilePreviewProps {
  files: FileUpload[];
  onRemoveFile: (fileId: string) => void;
}

export function FilePreview({ files, onRemoveFile }: FilePreviewProps) {
  if (files.length === 0) {
    return null;
  }

  const getStatusBadge = (status: FileUpload['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" data-testid="badge-pending">Pending</Badge>;
      case 'uploading':
        return <Badge variant="outline" data-testid="badge-uploading">Uploading</Badge>;
      case 'uploaded':
        return <Badge variant="secondary" data-testid="badge-uploaded">Uploaded</Badge>;
      case 'processing':
        return <Badge variant="secondary" data-testid="badge-processing">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-accent" data-testid="badge-completed">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" data-testid="badge-failed">Failed</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-unknown">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent" data-testid="icon-check" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" data-testid="icon-error" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-8" data-testid="file-preview">
      <h3 className="text-lg font-semibold mb-4" data-testid="text-selected-files">Selected Files</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((fileUpload) => (
          <Card key={fileUpload.id} className="file-preview" data-testid={`card-file-${fileUpload.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <File className="h-6 w-6 text-primary" data-testid={`icon-file-${fileUpload.id}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" data-testid={`text-filename-${fileUpload.id}`}>
                    {fileUpload.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`text-filesize-${fileUpload.id}`}>
                    {formatBytes(fileUpload.file.size)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(fileUpload.status)}
                    {getStatusIcon(fileUpload.status)}
                  </div>
                  {fileUpload.error && (
                    <div className="text-xs text-destructive mt-1" data-testid={`text-error-${fileUpload.id}`}>
                      {fileUpload.error}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(fileUpload.id)}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid={`button-remove-${fileUpload.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
