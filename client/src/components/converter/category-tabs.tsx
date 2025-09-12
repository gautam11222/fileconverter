import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConversionCategory, categories } from '@/lib/conversion-tools';
import { FileText, Image, Volume2, Video, Archive, Settings } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: ConversionCategory;
  onCategoryChange: (category: ConversionCategory) => void;
}

const iconMap = {
  'file-text': FileText,
  'image': Image,
  'volume-2': Volume2,
  'video': Video,
  'archive': Archive,
  'settings': Settings,
};

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="mb-8" data-testid="category-tabs">
      <div className="border-b border-border">
        <nav className="flex space-x-8 overflow-x-auto pb-0">
          {categories.map((category) => {
            const Icon = iconMap[category.icon as keyof typeof iconMap];
            const isActive = activeCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant="ghost"
                className={`
                  whitespace-nowrap border-b-2 rounded-none py-4 px-2 font-medium text-sm
                  ${isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                  }
                `}
                onClick={() => onCategoryChange(category.id)}
                data-testid={`button-category-${category.id}`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
