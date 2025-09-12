import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Pages
import Home from "@/pages/home";
import Converter from "@/pages/converter";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      
      {/* Tool-specific routes */}
      <Route path="/pdf-to-word" component={Converter} />
      <Route path="/word-to-pdf" component={Converter} />
      <Route path="/pdf-to-excel" component={Converter} />
      <Route path="/excel-to-pdf" component={Converter} />
      <Route path="/pdf-to-ppt" component={Converter} />
      <Route path="/ppt-to-pdf" component={Converter} />
      <Route path="/pdf-to-txt" component={Converter} />
      <Route path="/excel-to-csv" component={Converter} />
      <Route path="/jpg-to-png" component={Converter} />
      <Route path="/png-to-jpg" component={Converter} />
      <Route path="/jpg-to-webp" component={Converter} />
      <Route path="/png-to-pdf" component={Converter} />
      <Route path="/svg-to-png" component={Converter} />
      <Route path="/heic-to-jpg" component={Converter} />
      <Route path="/gif-to-mp4" component={Converter} />
      <Route path="/image-compressor" component={Converter} />
      <Route path="/mp3-to-wav" component={Converter} />
      <Route path="/wav-to-mp3" component={Converter} />
      <Route path="/flac-to-mp3" component={Converter} />
      <Route path="/m4a-to-mp3" component={Converter} />
      <Route path="/ogg-to-mp3" component={Converter} />
      <Route path="/mp3-to-aac" component={Converter} />
      <Route path="/audio-to-text" component={Converter} />
      <Route path="/text-to-speech" component={Converter} />
      <Route path="/mp4-to-avi" component={Converter} />
      <Route path="/avi-to-mp4" component={Converter} />
      <Route path="/mp4-to-mov" component={Converter} />
      <Route path="/mp4-to-mkv" component={Converter} />
      <Route path="/mp4-to-webm" component={Converter} />
      <Route path="/mp4-to-gif" component={Converter} />
      <Route path="/extract-mp3-from-mp4" component={Converter} />
      <Route path="/compress-mp4" component={Converter} />
      <Route path="/zip-to-rar" component={Converter} />
      <Route path="/rar-to-zip" component={Converter} />
      <Route path="/zip-to-7z" component={Converter} />
      <Route path="/tar-to-zip" component={Converter} />
      <Route path="/iso-to-zip" component={Converter} />
      <Route path="/file-compressor" component={Converter} />
      <Route path="/image-to-text" component={Converter} />
      <Route path="/speech-to-text" component={Converter} />
      <Route path="/epub-to-pdf" component={Converter} />
      <Route path="/mobi-to-pdf" component={Converter} />
      
      {/* Tools page */}
      <Route path="/tools" component={Home} />
      
      {/* Category pages */}
      <Route path="/tools/:category" component={Home} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
