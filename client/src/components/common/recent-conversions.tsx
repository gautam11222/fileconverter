import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Check } from 'lucide-react';

interface RecentConversion {
  id: string;
  fileName: string;
  fromFormat: string;
  toFormat: string;
  status: 'completed' | 'processing';
}

// Mock data for demonstration
const mockConversions: RecentConversion[] = [
  {
    id: '1',
    fileName: 'document',
    fromFormat: 'pdf',
    toFormat: 'docx',
    status: 'completed',
  },
  {
    id: '2',
    fileName: 'image',
    fromFormat: 'jpg',
    toFormat: 'png',
    status: 'completed',
  },
  {
    id: '3',
    fileName: 'audio',
    fromFormat: 'mp3',
    toFormat: 'wav',
    status: 'completed',
  },
];

export function RecentConversions() {
  return (
    <Card data-testid="card-recent-conversions">
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <Clock className="mr-2 h-4 w-4 text-primary" />
          Recent Conversions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {mockConversions.map((conversion) => (
            <div 
              key={conversion.id}
              className="flex items-center justify-between p-2 bg-muted rounded"
              data-testid={`conversion-${conversion.id}`}
            >
              <span data-testid={`text-conversion-${conversion.id}`}>
                {conversion.fileName}.{conversion.fromFormat} → {conversion.fileName}.{conversion.toFormat}
              </span>
              {conversion.status === 'completed' && (
                <Check className="h-4 w-4 text-accent" data-testid={`icon-completed-${conversion.id}`} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
