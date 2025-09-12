interface AdBannerProps {
  size: '728x90' | '300x250' | '320x100';
  label: string;
  className?: string;
}

export function AdBanner({ size, label, className = '', ...props }: AdBannerProps) {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case '728x90':
        return 'h-[90px]';
      case '300x250':
        return 'h-[250px]';
      case '320x100':
        return 'h-[100px]';
      default:
        return 'h-24';
    }
  };

  return (
    <div 
      className={`ad-banner ${getSizeClasses(size)} ${className}`}
      {...props}
    >
      <div className="text-xs">Advertisement</div>
      <div className="text-sm mt-1">{size} {label}</div>
    </div>
  );
}
