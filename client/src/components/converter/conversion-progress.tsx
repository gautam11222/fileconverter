import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/types/converter';

interface ConversionProgressProps {
  files: FileUpload[];
}

export function ConversionProgress({ files }: ConversionProgressProps) {
  const processingFiles = files.filter(file => 
    file.status === 'processing' || file.status === 'uploading'
  );

  if (processingFiles.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8" data-testid="conversion-progress">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-converting-files">
          Converting Files...
        </h3>
        <div className="space-y-4">
          {processingFiles.map((file) => (
            <div key={file.id} className="progress-item" data-testid={`progress-${file.id}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate" data-testid={`text-progress-filename-${file.id}`}>
                  {file.file.name}
                </span>
                <span className="text-xs text-muted-foreground" data-testid={`text-progress-status-${file.id}`}>
                  {file.status === 'processing' ? 'Converting...' : 'Uploading...'}
                </span>
              </div>
              <Progress 
                value={file.progress} 
                className="w-full h-2"
                data-testid={`progress-bar-${file.id}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span data-testid={`text-progress-percent-${file.id}`}>{file.progress}%</span>
                <span data-testid={`text-progress-time-${file.id}`}>
                  {file.progress < 100 ? `${Math.ceil((100 - file.progress) / 10)} min remaining` : 'Complete'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
