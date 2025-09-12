import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { ConversionTool } from '@/types/converter';
import { 
  FileText, Image, Volume2, Video, Archive, Settings,
  FileImage, Music, Play, Folder, Eye, Mic, MessageCircle,
  Book, BookOpen, Smartphone, Film, SquareFunction, 
  Headphones, Radio, Disc, Minimize, Globe, Minimize2,
  FileSpreadsheet, Presentation, FileCode, FileType
} from 'lucide-react';

interface ToolGridProps {
  tools: ConversionTool[];
}

const iconMap = {
  'file-text': FileText,
  'file-pdf': FileImage,
  'file-word': FileText,
  'file-excel': FileSpreadsheet,
  'file-powerpoint': Presentation,
  'file-alt': FileCode,
  'file-csv': FileType,
  'image': Image,
  'vector-square': SquareFunction,
  'smartphone': Smartphone,
  'film': Film,
  'compress': Minimize,
  'volume-2': Volume2,
  'music': Music,
  'headphones': Headphones,
  'radio': Radio,
  'mic': Mic,
  'message-circle': MessageCircle,
  'video': Video,
  'play': Play,
  'minimize-2': Minimize2,
  'globe': Globe,
  'archive': Archive,
  'folder': Folder,
  'disc': Disc,
  'minimize': Minimize,
  'eye': Eye,
  'book': Book,
  'book-open': BookOpen,
  'settings': Settings,
};

export function ToolGrid({ tools }: ToolGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8" data-testid="tool-grid">
      {tools.map((tool) => {
        const Icon = iconMap[tool.icon as keyof typeof iconMap] || FileText;
        
        return (
          <Link 
            key={tool.id} 
            href={tool.path}
            data-testid={`link-tool-${tool.id}`}
          >
            <Card className="hover:shadow-md transition-all hover:scale-105 cursor-pointer">
              <CardContent className="p-4">
                <div className="text-center">
                  <Icon className={`mx-auto mb-2 h-6 w-6 ${tool.iconColor}`} data-testid={`icon-${tool.id}`} />
                  <div className="text-xs text-muted-foreground" data-testid={`text-tool-name-${tool.id}`}>
                    {tool.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
