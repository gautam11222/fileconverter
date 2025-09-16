import { useEffect } from 'react';

interface HeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function Head({
  title,
  description,
  keywords,
  ogUrl = 'https://4555221c-4ab6-4642-bf67-189ac600d628-00-2t8khqm5yn2rh.kirk.replit.dev',
  ogTitle,
  ogDescription,
}: HeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Set meta tags
    setMetaTag('description', description);
    
    if (keywords) {
      setMetaTag('keywords', keywords);
    }

    // Set Open Graph tags
    setMetaTag('og:title', ogTitle || title, 'property');
    setMetaTag('og:description', ogDescription || description, 'property');
    setMetaTag('og:url', ogUrl, 'property');
    setMetaTag('og:type', 'website', 'property');

    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', ogUrl);

  }, [title, description, keywords, ogUrl, ogTitle, ogDescription]);

  return null;
}