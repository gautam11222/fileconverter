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
import AdBanner from '@/components/common/ad-banner'; // ✅ AdBanner component

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('en');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowRightLeft className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">FileConverter</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground">Home</Link>
            <Link href="/tools" className="text-sm font-medium text-foreground/80 hover:text-foreground">Tools</Link>
            <Link href="/about" className="text-sm font-medium text-foreground/80 hover:text-foreground">About</Link>
            <Link href="/contact" className="text-sm font-medium text-foreground/80 hover:text-foreground">Contact</Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="es">ES</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="de">DE</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col space-y-4 mt-4">
                  <Link href="/">Home</Link>
                  <Link href="/tools">Tools</Link>
                  <Link href="/about">About</Link>
                  <Link href="/contact">Contact</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Top Header Ad */}
      <AdBanner slot="4397713188" />
    </header>
  );
}
