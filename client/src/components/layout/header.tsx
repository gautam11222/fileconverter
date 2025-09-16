import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/use-theme';
import { Menu, ArrowRightLeft, Sun, Moon } from 'lucide-react';
import AdBanner from '@/components/common/ad-banner'; // ✅ Correct default import

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('en');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <ArrowRightLeft className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">FileConverter</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-home-nav">
              Home
            </Link>
            <Link href="/tools" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-tools">
              Tools
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-about">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-contact">
              Contact
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-16" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="es">ES</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="de">DE</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col space-y-4 mt-4">
                  <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-mobile-home">
                    Home
                  </Link>
                  <Link href="/tools" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-mobile-tools">
                    Tools
                  </Link>
                  <Link href="/about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-mobile-about">
                    About
                  </Link>
                  <Link href="/contact" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors" data-testid="link-mobile-contact">
                    Contact
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Top Ad Banner - DISABLED: Replace with real slot ID */}
      {/* <div className="container mx-auto px-4 py-2">
        <AdBanner slot="REPLACE_WITH_REAL_SLOT_ID" format="auto" className="block w-full" data-testid="ad-header" />
      </div> */}
    </header>
  );
}
