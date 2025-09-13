import { useEffect } from "react";

interface AdBannerProps {
  slot: string;              // AdSense slot ID (from your AdSense dashboard)
  format?: string;           // Format type (e.g. "auto", "rectangle", etc.)
  className?: string;        // Extra Tailwind / CSS classes
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
}: AdBannerProps) {
  useEffect(() => {
    try {
      // Load the AdSense ad
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`ad-container my-4 flex justify-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7283553771090751"   // ✅ your publisher ID
        data-ad-slot={slot}                        // ✅ ad slot ID
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
