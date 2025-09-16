import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Head } from '@/components/ui/head';
import { CategoryTabs } from '@/components/converter/category-tabs';
import { ToolGrid } from '@/components/converter/tool-grid';
import { FileUploadZone } from '@/components/converter/file-upload-zone';
import { FilePreview } from '@/components/converter/file-preview';
import { ConversionProgress } from '@/components/converter/conversion-progress';
import { DownloadArea } from '@/components/converter/download-area';
import AdBanner from '@/components/common/ad-banner';  // ✅ updated import (default export)
import { RecentConversions } from '@/components/common/recent-conversions';
import { FeaturesSection } from '@/components/common/features-section';
import { FAQSection } from '@/components/common/faq-section';
import { getToolsByCategory } from '@/lib/conversion-tools';
import { useFileConverter } from '@/hooks/use-file-converter';
import { ConversionCategory, ConversionSettings } from '@/types/converter';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<ConversionCategory>('documents');
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
    resetConverter,
  } = useFileConverter();

  const handleConvert = () => {
    if (!conversionSettings.targetFormat) {
      alert('Please select a target format');
      return;
    }
    convertFiles(conversionSettings);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-home">
      <Head
        title="Free Online File Converter - Convert PDF, Images, Audio, Video, Documents (50+ Tools)"
        description="Convert files online for free. Support 50+ formats including PDF to Word, JPG to PNG, MP3 to WAV, MP4 to AVI. Fast, secure, no registration required."
        keywords="file converter, PDF converter, image converter, audio converter, video converter, online converter, free converter, PDF to Word, JPG to PNG, MP4 to MP3"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-32 space-y-6">
              {/* ✅ Sidebar AdSense block - DISABLED: Replace with real slot ID */}
              {/* <AdBanner
                slot="REPLACE_WITH_REAL_SLOT_ID"
                format="auto"
                className="block w-full"
                data-testid="ad-sidebar"
              /> */}
              <RecentConversions />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Hero Section */}
            <div className="text-center mb-12" data-testid="hero-section">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="text-hero-title">
                Free Online File Converter
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
                Convert PDF, Images, Audio, Video, Documents (50+ Tools). Fast, secure, and completely free. No registration required.
              </p>
            </div>

            {/* Category Tabs */}
            <CategoryTabs 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {/* Tool Grid */}
            <ToolGrid tools={getToolsByCategory(activeCategory)} />

            {/* File Upload Area */}
            <FileUploadZone 
              onFilesAdded={addFiles}
              disabled={isConverting}
            />

            {/* File Preview */}
            <FilePreview 
              files={files}
              onRemoveFile={removeFile}
            />

            {/* Conversion Settings */}
            {files.length > 0 && (
              <Card className="mb-6" data-testid="card-conversion-settings">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium" data-testid="text-conversion-settings">Conversion Settings</h4>
                    <Button variant="link" className="text-sm" data-testid="button-advanced-options">
                      Advanced Options
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2" data-testid="label-convert-to">
                        Convert to:
                      </Label>
                      <Select 
                        value={conversionSettings.targetFormat}
                        onValueChange={(value) => 
                          setConversionSettings(prev => ({ ...prev, targetFormat: value }))
                        }
                      >
                        <SelectTrigger className="w-full" data-testid="select-target-format">
                          <SelectValue placeholder="Select format..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="docx">Word (DOCX)</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="jpg">JPG</SelectItem>
                          <SelectItem value="mp3">MP3</SelectItem>
                          <SelectItem value="mp4">MP4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2" data-testid="label-quality">
                        Quality:
                      </Label>
                      <Select 
                        value={conversionSettings.quality}
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setConversionSettings(prev => ({ ...prev, quality: value }))
                        }
                      >
                        <SelectTrigger className="w-full" data-testid="select-quality">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2" data-testid="label-options">
                        Options:
                      </Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="compress"
                            checked={conversionSettings.compress}
                            onCheckedChange={(checked) => 
                              setConversionSettings(prev => ({ ...prev, compress: !!checked }))
                            }
                            data-testid="checkbox-compress"
                          />
                          <Label htmlFor="compress" className="text-sm">Compress</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="email"
                            checked={conversionSettings.emailResult}
                            onCheckedChange={(checked) => 
                              setConversionSettings(prev => ({ ...prev, emailResult: !!checked }))
                            }
                            data-testid="checkbox-email"
                          />
                          <Label htmlFor="email" className="text-sm">Email result</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Convert Button */}
            {files.length > 0 && (
              <div className="text-center mb-8">
                <Button 
                  className="bg-accent text-accent-foreground px-8 py-3 text-lg font-semibold hover:bg-accent/90"
                  onClick={handleConvert}
                  disabled={isConverting || !conversionSettings.targetFormat}
                  data-testid="button-convert-files"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Convert Files
                </Button>
              </div>
            )}

            {/* Progress Area */}
            <ConversionProgress files={files} />

            {/* Download Area */}
            <DownloadArea files={files} />

            {/* Features Section */}
            <FeaturesSection />

            {/* ✅ Middle AdSense block - DISABLED: Replace with real slot ID */}
            <div className="my-8">
              {/* <AdBanner
                slot="REPLACE_WITH_REAL_SLOT_ID"
                format="auto"
                className="block w-full"
                data-testid="ad-content"
              /> */}
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
