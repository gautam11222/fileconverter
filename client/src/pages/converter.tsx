import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { FileUploadZone } from '@/components/converter/file-upload-zone';
import { FilePreview } from '@/components/converter/file-preview';
import { ConversionProgress } from '@/components/converter/conversion-progress';
import { DownloadArea } from '@/components/converter/download-area';
import AdBanner from '@/components/common/ad-banner'; // ✅ updated import (default export)
import { RecentConversions } from '@/components/common/recent-conversions';
import { FeaturesSection } from '@/components/common/features-section';
import { FAQSection } from '@/components/common/faq-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFileConverter } from '@/hooks/use-file-converter';
import { getToolByPath } from '@/lib/conversion-tools';
import { ConversionSettings } from '@/types/converter';
import { Sparkles, FileText, Image, Volume2, Video, Archive, Settings } from 'lucide-react';

export default function Converter() {
  const [match, params] = useRoute('/:toolPath*');
  const [conversionSettings, setConversionSettings] = useState<ConversionSettings>({
    targetFormat: '',
    quality: 'medium',
    compress: false,
    emailResult: false,
  });

  const {
    files,
    isConverting,
    addFiles,
    removeFile,
    convertFiles,
  } = useFileConverter();

  const tool = getToolByPath(`/${params?.["toolPath*"]}`);

  useEffect(() => {
    if (tool) {
      setConversionSettings(prev => ({
        ...prev,
        targetFormat: tool.toFormat,
      }));
    }
  }, [tool]);

  if (!tool) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-converter-not-found">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Tool Not Found</h1>
              <p className="text-muted-foreground">The conversion tool you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleConvert = () => {
    convertFiles(conversionSettings);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documents': return FileText;
      case 'images': return Image;
      case 'audio': return Volume2;
      case 'video': return Video;
      case 'archives': return Archive;
      default: return Settings;
    }
  };

  const CategoryIcon = getCategoryIcon(tool.category);

  return (
    <div className="min-h-screen bg-background" data-testid={`page-converter-${tool.id}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-32 space-y-6">
              {/* ✅ Sidebar Ad */}
              <AdBanner
                slot="1234567890" // replace with your actual sidebar slot ID
                format="auto"
                className="block w-full"
                data-testid="ad-sidebar"
              />
              <RecentConversions />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Tool Header */}
            <Card className="mb-8" data-testid="card-tool-header">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CategoryIcon className={`h-8 w-8 ${tool.iconColor}`} data-testid="icon-tool-category" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-tool-title">{tool.name} Converter</CardTitle>
                    <CardDescription data-testid="text-tool-description">{tool.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Badge variant="outline" data-testid="badge-from-format">
                    From: {tool.fromFormat.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" data-testid="badge-to-format">
                    To: {tool.toFormat.toUpperCase()}
                  </Badge>
                  {tool.popular && (
                    <Badge className="bg-accent text-accent-foreground" data-testid="badge-popular">Popular</Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Tool Instructions */}
            <Card className="mb-8" data-testid="card-tool-instructions">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4" data-testid="text-how-to-title">
                  How to convert {tool.fromFormat.toUpperCase()} to {tool.toFormat.toUpperCase()}
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li data-testid="text-instruction-1">Upload your {tool.fromFormat.toUpperCase()} file using the drag & drop area or click "Choose Files"</li>
                  <li data-testid="text-instruction-2">Adjust conversion settings if needed (quality, compression, etc.)</li>
                  <li data-testid="text-instruction-3">Click "Convert Files" and wait for the conversion to complete</li>
                  <li data-testid="text-instruction-4">Download your converted {tool.toFormat.toUpperCase()} file instantly</li>
                </ol>
              </CardContent>
            </Card>

            {/* File Upload & Preview */}
            <FileUploadZone onFilesAdded={addFiles} disabled={isConverting} acceptedFileTypes={[`.${tool.fromFormat}`]} />
            <FilePreview files={files} onRemoveFile={removeFile} />

            {/* Convert Button */}
            {files.length > 0 && (
              <div className="text-center mb-8">
                <Button
                  className="bg-accent text-accent-foreground px-8 py-3 text-lg font-semibold hover:bg-accent/90"
                  onClick={handleConvert}
                  disabled={isConverting}
                  data-testid="button-convert-files"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Convert to {tool.toFormat.toUpperCase()}
                </Button>
              </div>
            )}

            {/* Progress & Download */}
            <ConversionProgress files={files} />
            <DownloadArea files={files} />

            {/* Tool-Specific Content */}
            <Card className="mb-8" data-testid="card-tool-details">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4" data-testid="text-about-tool">About {tool.name} Conversion</h2>
                <div className="prose text-sm text-muted-foreground max-w-none">
                  <p data-testid="text-tool-detail-1">Our {tool.name.toLowerCase()} converter provides fast, secure, and high-quality file conversion from {tool.fromFormat.toUpperCase()} to {tool.toFormat.toUpperCase()} format.</p>
                  <p data-testid="text-tool-detail-2">The conversion process is performed entirely in your browser or on our secure servers, ensuring your files remain private and are automatically deleted after conversion.</p>
                  <p data-testid="text-tool-detail-3">No software installation required - simply upload your files and download the converted results in seconds.</p>
                </div>
              </CardContent>
            </Card>

            {/* Features Section */}
            <FeaturesSection />

            {/* ✅ Middle Ad Banner */}
            <div className="my-8">
              <AdBanner
                slot="9876543210" // replace with your actual content slot ID
                format="auto"
                className="block w-full"
                data-testid="ad-content"
              />
            </div>

            {/* FAQ Section */}
            <FAQSection />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
