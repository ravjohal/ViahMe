import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";

export default function TermsOfService() {
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
          Terms of Service
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last Updated:</strong> January 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Viah.me ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p>
              Viah.me is a wedding planning platform designed specifically for South Asian weddings. 
              Our Service provides tools for managing multi-day celebrations, connecting with vendors, 
              tracking budgets, managing guest lists, and coordinating wedding-related activities.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information during registration</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload or transmit viruses or malicious code</li>
              <li>Harvest or collect user information without consent</li>
              <li>Use the Service to send spam or unsolicited messages</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Vendor Services</h2>
            <p>
              Viah.me connects couples with wedding vendors. We do not endorse, guarantee, or assume 
              responsibility for any services provided by third-party vendors. Any agreements between 
              users and vendors are solely between those parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Payment Terms</h2>
            <p>
              Certain features of the Service may require payment. All payments are processed securely 
              through our payment partners. Refund policies are outlined at the time of purchase.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Viah.me 
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. User Content</h2>
            <p>
              You retain ownership of content you upload to the Service. By uploading content, you grant 
              us a non-exclusive license to use, display, and distribute that content in connection with 
              providing the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
            <p>
              Viah.me shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages resulting from your use of or inability to use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of these Terms. 
              Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant 
              changes via email or through the Service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@viah.me" className="text-orange-600 hover:underline">
                legal@viah.me
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Viah.me is a brand operated by SSJ 8-11 LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
