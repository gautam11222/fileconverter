import { Card, CardContent } from '@/components/ui/card';
import { Lock, Zap, Smartphone } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Lock,
      title: '100% Secure',
      description: 'Your files are automatically deleted after conversion. We never store or share your data.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Our optimized servers process your files in seconds, not minutes.',
    },
    {
      icon: Smartphone,
      title: 'Works Anywhere',
      description: 'Convert files on any device - desktop, tablet, or smartphone.',
    },
  ];

  return (
    <Card data-testid="card-features">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8" data-testid="text-features-title">
          Why Choose Our File Converter?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center" data-testid={`feature-${index}`}>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary" data-testid={`icon-feature-${index}`} />
              </div>
              <h3 className="font-semibold mb-2" data-testid={`text-feature-title-${index}`}>
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`text-feature-description-${index}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
