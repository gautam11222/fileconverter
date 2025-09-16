import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head } from '@/components/ui/head';
import { Shield, Zap, Users, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-about">
      <Head 
        title="About Us - Free Online File Converter"
        description="Learn about our mission to provide free, secure, and fast file conversion services. Trusted by millions of users worldwide."
        keywords="about, file converter, mission, secure conversion, free tools"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12" data-testid="hero-section">
            <h1 className="text-4xl font-bold mb-6" data-testid="text-hero-title">
              About FileConverter
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-description">
              We're on a mission to make file conversion simple, secure, and accessible to everyone. 
              No downloads, no subscriptions, no hassle.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="mb-8" data-testid="card-mission">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="text-mission-title">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-mission-description">
                We believe that file conversion should be free, fast, and secure. Our platform was built to solve 
                the everyday frustrations people face when trying to convert files between different formats. 
                Whether you're a student, professional, or just someone who needs to convert a file occasionally, 
                we've got you covered with our comprehensive suite of conversion tools.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card data-testid="card-feature-security">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" data-testid="icon-security" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-security-title">Security First</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-security-description">
                  All files are processed with enterprise-grade security and automatically deleted after conversion.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-speed">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" data-testid="icon-speed" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-speed-title">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-speed-description">
                  Our optimized servers and algorithms ensure your files are converted in seconds, not minutes.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-users">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" data-testid="icon-users" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-users-title">Trusted by Millions</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-users-description">
                  Over 10 million files converted and counting, with a 99.9% customer satisfaction rate.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-quality">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" data-testid="icon-quality" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-quality-title">Premium Quality</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-quality-description">
                  Advanced algorithms ensure your converted files maintain the highest quality possible.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Our Story */}
          <Card className="mb-8" data-testid="card-story">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="text-story-title">Our Story</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p data-testid="text-story-paragraph-1">
                  FileConverter was founded in 2020 when our team realized how frustrating it was to find reliable, 
                  free file conversion tools online. Most services were either expensive, required software downloads, 
                  or compromised on security and quality.
                </p>
                <p data-testid="text-story-paragraph-2">
                  We set out to build a better solution - one that would be completely free, work entirely in your 
                  browser, and never compromise on security or quality. After months of development and testing, 
                  we launched with support for the most common file conversions.
                </p>
                <p data-testid="text-story-paragraph-3">
                  Today, we support over 50 different file conversion types and serve millions of users worldwide. 
                  We're constantly adding new features and formats based on user feedback, and we remain committed 
                  to keeping our core service completely free.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Team Section */}
          <Card className="mb-8" data-testid="card-team">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="text-team-title">Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-team-description">
                We're a small but dedicated team of developers, designers, and customer support specialists 
                who are passionate about making technology more accessible. Our diverse backgrounds in software 
                engineering, user experience design, and digital security help us build tools that are both 
                powerful and easy to use.
              </p>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card data-testid="card-contact-cta">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4" data-testid="text-contact-title">
                Questions or Feedback?
              </h2>
              <p className="text-muted-foreground mb-6" data-testid="text-contact-description">
                We'd love to hear from you. Whether you have suggestions for new features, 
                need help with a conversion, or just want to say hello.
              </p>
              <a 
                href="/contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                data-testid="link-contact"
              >
                Get in Touch
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
