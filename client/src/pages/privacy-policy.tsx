import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img 
            src={logoUrl} 
            alt="Viah.me" 
            className="h-12 object-contain cursor-pointer hover-elevate" 
            onClick={() => setLocation("/")}
            data-testid="img-logo"
          />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <h1 
          className="text-3xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
          data-testid="text-page-title"
        >
          Privacy Policy
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last Updated:</strong> January 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>
              Viah.me ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              wedding planning platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium">Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and contact information (email, phone number)</li>
              <li>Wedding details (date, venue, tradition preferences)</li>
              <li>Partner information</li>
              <li>Guest list information</li>
              <li>Payment information (processed securely by third-party providers)</li>
            </ul>

            <h3 className="text-lg font-medium">Automatically Collected Information</h3>
            <p>When you use our Service, we may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (pages visited, features used)</li>
              <li>IP address and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our Service</li>
              <li>Personalize your experience</li>
              <li>Connect you with wedding vendors</li>
              <li>Process transactions and send related information</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Analyze usage patterns to improve our Service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Vendors:</strong> When you express interest in or book a vendor's services</li>
              <li><strong>Service Providers:</strong> Third parties that help us operate our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale</li>
            </ul>
            <p>We do not sell your personal information to third parties for marketing purposes.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience. You can control cookie 
              preferences through your browser settings. For more details, see our cookie consent options 
              when you first visit our site.
            </p>
            <p>Types of cookies we use:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential:</strong> Required for basic site functionality</li>
              <li><strong>Analytics:</strong> Help us understand how visitors use our site</li>
              <li><strong>Preferences:</strong> Remember your settings and choices</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information. However, no method of transmission over the Internet is 100% secure, and 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed 
              to provide services. Wedding-related data may be retained for up to 3 years after your 
              wedding date unless you request earlier deletion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under 18 years of age. We do not knowingly 
              collect personal information from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes 
              via email or through the Service. Your continued use after changes indicates acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at{" "}
              <a href="mailto:privacy@viah.me" className="text-orange-600 hover:underline">
                privacy@viah.me
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Viah.me. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
