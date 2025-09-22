import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import AdBanner from '@/components/common/ad-banner';
import { FileUploadZone } from '@/components/converter/file-upload-zone';
import { FilePreview } from '@/components/converter/file-preview';
import { ConversionProgress } from '@/components/converter/conversion-progress';
import { DownloadArea } from '@/components/converter/download-area';
import { FeaturesSection } from '@/components/common/features-section';
import { FAQSection } from '@/components/common/faq-section';
import { CategoryTabs } from '@/components/converter/category-tabs';
import { ToolGrid } from '@/components/converter/tool-grid';
import { getToolsByCategory } from '@/lib/conversion-tools';
import { useFileConverter } from '@/hooks/use-file-converter';
import { ConversionCategory, ConversionSettings } from '@/types/converter';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Top Ad Banner */}
        <AdBanner slot="9782326834" />

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Free Online File Converter</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Convert PDF, Images, Audio, Video, Documents (50+ Tools). Fast, secure, and free.
          </p>
        </div>

        <CategoryTabs 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <ToolGrid tools={getToolsByCategory(activeCategory)} />

        <FileUploadZone onFilesAdded={addFiles} disabled={isConverting} />
        <FilePreview files={files} onRemoveFile={removeFile} />

        {files.length > 0 && (
          <div className="text-center mb-8">
            <Button 
              className="bg-accent text-accent-foreground px-8 py-3 text-lg font-semibold hover:bg-accent/90"
              onClick={handleConvert}
              disabled={isConverting || !conversionSettings.targetFormat}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Convert Files
            </Button>
          </div>
        )}

        <ConversionProgress files={files} />
        <DownloadArea files={files} />

        {/* Middle Ad Banner */}
        <AdBanner slot="9047404635" />

        <FeaturesSection />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
