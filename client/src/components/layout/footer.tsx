import { Link } from 'wouter';
import { ArrowRightLeft, Twitter, Facebook, Linkedin } from 'lucide-react';
import AdBanner from '@/components/common/ad-banner'; // ✅ Correct default import

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Bottom Ad Banner */}
        <div className="mb-8">
          <AdBanner slot="7289012346" format="auto" className="block w-full" data-testid="ad-footer" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <ArrowRightLeft className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">FileConverter</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The fastest and most secure online file converter. Convert between 50+ formats for free.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Popular Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-to-word" className="text-muted-foreground hover:text-foreground">PDF to Word</Link></li>
              <li><Link href="/jpg-to-png" className="text-muted-foreground hover:text-foreground">JPG to PNG</Link></li>
              <li><Link href="/mp4-to-mp3" className="text-muted-foreground hover:text-foreground">MP4 to MP3</Link></li>
              <li><Link href="/word-to-pdf" className="text-muted-foreground hover:text-foreground">Word to PDF</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/documents" className="text-muted-foreground hover:text-foreground">Document Converter</Link></li>
              <li><Link href="/tools/images" className="text-muted-foreground hover:text-foreground">Image Converter</Link></li>
              <li><Link href="/tools/audio" className="text-muted-foreground hover:text-foreground">Audio Converter</Link></li>
              <li><Link href="/tools/video" className="text-muted-foreground hover:text-foreground">Video Converter</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2024 FileConverter. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-foreground"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-foreground"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
