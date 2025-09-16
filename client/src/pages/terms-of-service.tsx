import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Head } from '@/components/ui/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-terms-of-service">
      <Head
        title="Terms of Service - Free Online File Converter"
        description="Terms of service for using our free online file conversion platform. Please read these terms carefully before using our services."
        keywords="terms of service, file converter terms, usage terms, conversion platform rules"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card data-testid="card-terms-of-service">
            <CardHeader>
              <CardTitle className="text-3xl" data-testid="text-terms-title">Terms of Service</CardTitle>
              <p className="text-muted-foreground" data-testid="text-terms-updated">
                Last updated: December 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section data-testid="section-acceptance">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-acceptance-title">Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-acceptance-content">
                  By accessing and using FileConverter, you accept and agree to be bound by the terms and provision 
                  of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section data-testid="section-description">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-description-title">Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-description-content">
                  FileConverter provides free online file conversion services. We offer conversion between various 
                  file formats including documents, images, audio, video, and archive files. The service is provided 
                  "as is" without any warranties.
                </p>
              </section>

              <section data-testid="section-acceptable-use">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-use-title">Acceptable Use</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-use-intro">
                    You agree to use FileConverter only for lawful purposes and in accordance with these Terms. 
                    You agree not to use the service:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground" data-testid="list-prohibited-uses">
                    <li data-testid="text-prohibited-illegal">For any unlawful purpose or to solicit others to perform illegal acts</li>
                    <li data-testid="text-prohibited-harmful">To upload files containing viruses, malware, or other harmful code</li>
                    <li data-testid="text-prohibited-copyright">To violate any international, federal, provincial, or state regulations or laws</li>
                    <li data-testid="text-prohibited-abuse">To abuse, harass, threaten, impersonate, or intimidate others</li>
                    <li data-testid="text-prohibited-spam">To submit false or misleading information</li>
                    <li data-testid="text-prohibited-overload">To attempt to overload or crash our servers</li>
                  </ul>
                </div>
              </section>

              <section data-testid="section-file-content">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-content-title">File Content Responsibility</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-content-content">
                  You are solely responsible for the content of files you upload to our service. You warrant that 
                  you own or have the necessary rights to use any files you submit for conversion. We do not review, 
                  monitor, or examine the content of files uploaded to our service.
                </p>
              </section>

              <section data-testid="section-file-deletion">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-deletion-title">Automatic File Deletion</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-deletion-content">
                  All uploaded files and conversion results are automatically deleted from our servers within 24 hours. 
                  We recommend downloading your converted files promptly. We are not responsible for any data loss 
                  that may occur.
                </p>
              </section>

              <section data-testid="section-limitations">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-limitations-title">Service Limitations</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-limitations-intro">
                    Our service has the following limitations:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground" data-testid="list-limitations">
                    <li data-testid="text-limit-size">Maximum file size of 100MB per file for free users</li>
                    <li data-testid="text-limit-concurrent">Limited number of concurrent conversions</li>
                    <li data-testid="text-limit-formats">Support for specific file formats only</li>
                    <li data-testid="text-limit-availability">Service availability is not guaranteed 24/7</li>
                  </ul>
                </div>
              </section>

              <section data-testid="section-intellectual-property">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-ip-title">Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-ip-content">
                  The FileConverter service, including its original content, features, and functionality, is owned 
                  by FileConverter and is protected by international copyright, trademark, patent, trade secret, 
                  and other intellectual property laws.
                </p>
              </section>

              <section data-testid="section-disclaimer">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-disclaimer-title">Disclaimer of Warranties</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-disclaimer-content">
                  The information on this service is provided on an "as is" basis. To the fullest extent permitted 
                  by law, FileConverter excludes all representations, warranties, conditions, and terms whether 
                  express, implied, statutory, or otherwise.
                </p>
              </section>

              <section data-testid="section-limitation-liability">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-liability-title">Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-liability-content">
                  FileConverter shall not be liable for any indirect, incidental, special, consequential, or punitive 
                  damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                  resulting from your use of the service.
                </p>
              </section>

              <section data-testid="section-termination">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-termination-title">Termination</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-termination-content">
                  We may terminate or suspend your access to our service immediately, without prior notice or liability, 
                  for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
              </section>

              <section data-testid="section-governing-law">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-law-title">Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-law-content">
                  These Terms shall be interpreted and governed by the laws of the United States, without regard to 
                  its conflict of law provisions. Our failure to enforce any right or provision of these Terms will 
                  not be considered a waiver of those rights.
                </p>
              </section>

              <section data-testid="section-changes">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-changes-title">Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-changes-content">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section data-testid="section-contact-terms">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-contact-terms-title">Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-contact-terms-content">
                  If you have any questions about these Terms of Service, please contact us through our contact page 
                  or email us at legal@fileconverter.com.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
