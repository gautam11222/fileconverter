import { Link } from 'wouter';
import { ArrowRightLeft, Twitter, Facebook, Linkedin } from 'lucide-react';
import AdBanner from '@/components/common/ad-banner';

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Footer Ad Banner */}
        <AdBanner slot="9841611554" />

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
              <li><Link href="/pdf-to-word">PDF to Word</Link></li>
              <li><Link href="/jpg-to-png">JPG to PNG</Link></li>
              <li><Link href="/mp4-to-mp3">MP4 to MP3</Link></li>
              <li><Link href="/word-to-pdf">Word to PDF</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/documents">Document Converter</Link></li>
              <li><Link href="/tools/images">Image Converter</Link></li>
              <li><Link href="/tools/audio">Audio Converter</Link></li>
              <li><Link href="/tools/video">Video Converter</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service">Terms of Service</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2024 FileConverter. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#"><Twitter className="h-5 w-5" /></a>
            <a href="#"><Facebook className="h-5 w-5" /></a>
            <a href="#"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
