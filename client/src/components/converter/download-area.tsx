import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/types/converter';
import { Download, Eye, CheckCircle, Archive } from 'lucide-react';

interface DownloadAreaProps {
  files: FileUpload[];
}

export function DownloadArea({ files }: DownloadAreaProps) {
  const completedFiles = files.filter(file => 
    file.status === 'completed' && file.downloadUrl
  );

  if (completedFiles.length === 0) {
    return null;
  }

  const handleDownload = (file: FileUpload) => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, '_blank');
    }
  };

  const handleDownloadAll = () => {
    // Create a ZIP file with all converted files
    // TODO: Implement ZIP download functionality
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Card className="mb-8 bg-accent/10 border-accent/20" data-testid="download-area">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-accent flex items-center" data-testid="text-conversion-complete">
          <CheckCircle className="mr-2 h-5 w-5" />
          Conversion Complete!
        </h3>
        <div className="space-y-3">
          {completedFiles.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-3 bg-background rounded-lg"
              data-testid={`download-item-${file.id}`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-accent" data-testid={`icon-success-${file.id}`} />
                <div>
                  <div className="font-medium text-sm" data-testid={`text-converted-filename-${file.id}`}>
                    {file.convertedFileName || `${file.file.name}.converted`}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`text-converted-filesize-${file.id}`}>
                    {formatFileSize(file.file.size)}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  data-testid={`button-download-${file.id}`}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  data-testid={`button-preview-${file.id}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {completedFiles.length > 1 && (
          <div className="mt-4 text-center">
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleDownloadAll}
              data-testid="button-download-all"
            >
              <Archive className="mr-2 h-4 w-4" />
              Download All as ZIP
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
