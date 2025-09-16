import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Head } from '@/components/ui/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you as soon as possible.",
        });
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: '',
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or use alternative contact methods.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-contact">
      <Head
        title="Contact Us - Free Online File Converter"
        description="Get in touch with our team for support, feedback, or business inquiries. We're here to help with all your file conversion needs."
        keywords="contact, support, help, feedback, file converter support, customer service"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12" data-testid="hero-section">
            <h1 className="text-4xl font-bold mb-6" data-testid="text-hero-title">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-description">
              Have questions, feedback, or need help? We'd love to hear from you. 
              Get in touch and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <Card data-testid="card-contact-info">
                  <CardHeader>
                    <CardTitle className="flex items-center" data-testid="text-contact-info-title">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Get in Touch
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3" data-testid="contact-email">
                      <Mail className="h-5 w-5 text-primary" data-testid="icon-email" />
                      <div>
                        <div className="font-medium" data-testid="text-email-label">Email</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-email-value">
                          support@fileconverter.com
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3" data-testid="contact-response">
                      <Phone className="h-5 w-5 text-primary" data-testid="icon-response" />
                      <div>
                        <div className="font-medium" data-testid="text-response-label">Response Time</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-response-value">
                          Usually within 24 hours
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3" data-testid="contact-location">
                      <MapPin className="h-5 w-5 text-primary" data-testid="icon-location" />
                      <div>
                        <div className="font-medium" data-testid="text-location-label">Location</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-location-value">
                          United States
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-faq-link">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2" data-testid="text-faq-title">
                      Frequently Asked Questions
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4" data-testid="text-faq-description">
                      Find answers to common questions about our file conversion services.
                    </p>
                    <Button variant="outline" size="sm" asChild data-testid="button-view-faq">
                      <a href="/#faq">View FAQ</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card data-testid="card-contact-form">
                <CardHeader>
                  <CardTitle data-testid="text-form-title">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-contact">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" data-testid="label-name">Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          data-testid="input-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" data-testid="label-email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" data-testid="label-category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="business">Business Inquiry</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subject" data-testid="label-subject">Subject *</Label>
                        <Input
                          id="subject"
                          type="text"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          required
                          data-testid="input-subject"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message" data-testid="label-message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={6}
                        required
                        placeholder="Please describe your question or issue in detail..."
                        data-testid="textarea-message"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isSubmitting}
                      data-testid="button-send-message"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Help Section */}
          <Card className="mt-12" data-testid="card-additional-help">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6" data-testid="text-help-title">
                Other Ways to Get Help
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div data-testid="help-documentation">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" data-testid="icon-help-docs" />
                  </div>
                  <h3 className="font-semibold mb-2" data-testid="text-docs-title">Documentation</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-docs-description">
                    Browse our comprehensive guides and tutorials for detailed instructions.
                  </p>
                </div>

                <div data-testid="help-community">
                  <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-accent" data-testid="icon-help-community" />
                  </div>
                  <h3 className="font-semibold mb-2" data-testid="text-community-title">Community Forum</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-community-description">
                    Connect with other users and get help from our community members.
                  </p>
                </div>

                <div data-testid="help-status">
                  <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-secondary-foreground" data-testid="icon-help-status" />
                  </div>
                  <h3 className="font-semibold mb-2" data-testid="text-status-title">Service Status</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-status-description">
                    Check our service status page for any ongoing issues or maintenance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
