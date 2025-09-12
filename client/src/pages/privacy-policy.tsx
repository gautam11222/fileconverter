import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-privacy-policy">
      <title>Privacy Policy - Free Online File Converter</title>
      <meta name="description" content="Our privacy policy explains how we collect, use, and protect your data when using our file conversion services." />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card data-testid="card-privacy-policy">
            <CardHeader>
              <CardTitle className="text-3xl" data-testid="text-privacy-title">Privacy Policy</CardTitle>
              <p className="text-muted-foreground" data-testid="text-privacy-updated">
                Last updated: December 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section data-testid="section-introduction">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-intro-title">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-intro-content">
                  FileConverter ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our file 
                  conversion services.
                </p>
              </section>

              <section data-testid="section-information-collection">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-collection-title">Information We Collect</h2>
                <div className="space-y-3">
                  <div data-testid="subsection-files">
                    <h3 className="text-lg font-medium mb-2" data-testid="text-files-title">Files You Upload</h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-files-content">
                      When you use our conversion services, we temporarily store your files on our secure servers 
                      for the sole purpose of performing the conversion. All files are automatically deleted within 
                      24 hours of upload.
                    </p>
                  </div>
                  <div data-testid="subsection-usage-data">
                    <h3 className="text-lg font-medium mb-2" data-testid="text-usage-title">Usage Data</h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-usage-content">
                      We collect anonymous usage statistics such as the types of conversions performed, 
                      file sizes, and general location data (country level) to improve our services.
                    </p>
                  </div>
                  <div data-testid="subsection-technical-data">
                    <h3 className="text-lg font-medium mb-2" data-testid="text-technical-title">Technical Data</h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-technical-content">
                      We automatically collect certain technical information including IP addresses, browser types, 
                      device information, and access times for security and analytical purposes.
                    </p>
                  </div>
                </div>
              </section>

              <section data-testid="section-how-we-use">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-use-title">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground" data-testid="list-how-we-use">
                  <li data-testid="text-use-conversion">To provide file conversion services</li>
                  <li data-testid="text-use-improve">To improve and optimize our platform</li>
                  <li data-testid="text-use-security">To ensure security and prevent abuse</li>
                  <li data-testid="text-use-analytics">To analyze usage patterns and performance</li>
                  <li data-testid="text-use-support">To provide customer support</li>
                </ul>
              </section>

              <section data-testid="section-data-security">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-security-title">Data Security</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-security-content">
                  We implement appropriate technical and organizational security measures to protect your information 
                  against unauthorized access, alteration, disclosure, or destruction. All data transmission is 
                  encrypted using SSL/TLS protocols.
                </p>
              </section>

              <section data-testid="section-file-deletion">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-deletion-title">File Deletion</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-deletion-content">
                  Your uploaded files and converted results are automatically deleted from our servers within 24 hours. 
                  We do not permanently store any of your files or their contents.
                </p>
              </section>

              <section data-testid="section-cookies">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-cookies-title">Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-cookies-content">
                  We use essential cookies to ensure proper functionality of our services. We also use analytics 
                  cookies (Google Analytics) to understand how our services are used. You can disable cookies in 
                  your browser settings, though this may affect functionality.
                </p>
              </section>

              <section data-testid="section-third-parties">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-third-parties-title">Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-third-parties-content">
                  We use Google Analytics for usage analytics and Google AdSense for advertising. These services 
                  have their own privacy policies and may collect additional information.
                </p>
              </section>

              <section data-testid="section-your-rights">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-rights-title">Your Rights</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground" data-testid="list-your-rights">
                  <li data-testid="text-right-access">Right to access your personal data</li>
                  <li data-testid="text-right-rectification">Right to rectify inaccurate data</li>
                  <li data-testid="text-right-erasure">Right to request data deletion</li>
                  <li data-testid="text-right-portability">Right to data portability</li>
                  <li data-testid="text-right-object">Right to object to processing</li>
                </ul>
              </section>

              <section data-testid="section-changes">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-changes-title">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-changes-content">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                  the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section data-testid="section-contact">
                <h2 className="text-xl font-semibold mb-3" data-testid="text-section-contact-title">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-section-contact-content">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us 
                  through our contact page or email us at privacy@fileconverter.com.
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
