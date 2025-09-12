import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'Is the file conversion really free?',
    answer: 'Yes! Our basic conversion service is completely free. We support this through non-intrusive advertisements. Premium features like batch processing and cloud storage integration require a subscription.',
  },
  {
    id: '2',
    question: 'What file formats do you support?',
    answer: 'We support over 50 file formats including PDF, Word, Excel, PowerPoint, JPG, PNG, MP3, MP4, ZIP, and many more. Check our conversion tools above for the complete list.',
  },
  {
    id: '3',
    question: 'How secure are my files?',
    answer: 'Your files are processed on secure servers with SSL encryption. All files are automatically deleted within 24 hours of upload, and we never access or store your personal data.',
  },
  {
    id: '4',
    question: 'What is the maximum file size?',
    answer: 'Free users can upload files up to 100MB per file. Premium subscribers can convert files up to 1GB in size.',
  },
];

export function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <Card data-testid="card-faq">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8" data-testid="text-faq-title">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div key={item.id} className="border-b border-border pb-4" data-testid={`faq-item-${item.id}`}>
              <button 
                className="flex items-center justify-between w-full text-left font-medium py-2"
                onClick={() => toggleItem(item.id)}
                data-testid={`button-faq-${item.id}`}
              >
                <span data-testid={`text-faq-question-${item.id}`}>{item.question}</span>
                {openItems.includes(item.id) ? (
                  <ChevronUp className="h-4 w-4" data-testid={`icon-chevron-up-${item.id}`} />
                ) : (
                  <ChevronDown className="h-4 w-4" data-testid={`icon-chevron-down-${item.id}`} />
                )}
              </button>
              {openItems.includes(item.id) && (
                <div className="mt-2 text-sm text-muted-foreground" data-testid={`text-faq-answer-${item.id}`}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
