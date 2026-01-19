import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";

export default function AcceptableUse() {
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
          style={{ fontFamily: "Cormorant Garamond, serif" }}
          data-testid="text-page-title"
        >
          Acceptable Use Policy
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Last Updated:</strong> January 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Purpose</h2>
            <p>
              This Acceptable Use Policy ("Policy") outlines the rules and
              guidelines for using Viah.me. By using our Service, you agree to
              comply with this Policy. Violations may result in suspension or
              termination of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Permitted Use</h2>
            <p>You may use Viah.me to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Plan and manage your wedding events</li>
              <li>Connect with and communicate with wedding vendors</li>
              <li>Manage guest lists and RSVPs</li>
              <li>Track budgets and expenses</li>
              <li>Create and share wedding websites</li>
              <li>
                Collaborate with partners, family members, and wedding planners
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Prohibited Activities</h2>
            <p>You may NOT use Viah.me to:</p>

            <h3 className="text-lg font-medium">Illegal Activities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Engage in any activity that violates applicable laws or
                regulations
              </li>
              <li>Facilitate money laundering or other financial crimes</li>
              <li>Infringe on intellectual property rights of others</li>
            </ul>

            <h3 className="text-lg font-medium">Harmful Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Upload or share content that is defamatory, obscene, or
                offensive
              </li>
              <li>
                Post content that promotes discrimination, harassment, or
                violence
              </li>
              <li>Share private information of others without their consent</li>
              <li>Upload malware, viruses, or other harmful code</li>
            </ul>

            <h3 className="text-lg font-medium">Fraudulent Behavior</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Impersonate another person or entity</li>
              <li>Create fake vendor profiles or reviews</li>
              <li>Provide false information during registration or booking</li>
              <li>Engage in phishing or social engineering attacks</li>
            </ul>

            <h3 className="text-lg font-medium">Platform Abuse</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Attempt to gain unauthorized access to systems or accounts
              </li>
              <li>
                Scrape or harvest data from the platform without permission
              </li>
              <li>
                Overwhelm the platform with automated requests (DoS attacks)
              </li>
              <li>Circumvent security measures or access restrictions</li>
              <li>Reverse engineer or decompile any part of the Service</li>
            </ul>

            <h3 className="text-lg font-medium">
              Spam and Unsolicited Communications
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Send bulk unsolicited messages to users or vendors</li>
              <li>
                Use the messaging system for advertising unrelated services
              </li>
              <li>Create multiple accounts for promotional purposes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Vendor Guidelines</h2>
            <p>Vendors using our platform must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Provide accurate and honest information about their services
              </li>
              <li>Maintain professional communication with couples</li>
              <li>Honor confirmed bookings and agreed-upon terms</li>
              <li>Respond to inquiries in a timely manner</li>
              <li>Keep their availability calendar up to date</li>
              <li>
                Not solicit couples to transact outside the platform to avoid
                fees
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Content Guidelines</h2>
            <p>All content uploaded to Viah.me should:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be relevant to wedding planning and related activities</li>
              <li>Respect copyright and intellectual property rights</li>
              <li>Be appropriate for all audiences</li>
              <li>
                Not contain personal identifying information of others without
                consent
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Reporting Violations</h2>
            <p>
              If you encounter content or behavior that violates this Policy,
              please report it to{" "}
              <a
                href="mailto:abuse@viah.me"
                className="text-orange-600 hover:underline"
              >
                abuse@viah.me
              </a>
              . We investigate all reports and take appropriate action.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Enforcement</h2>
            <p>Violations of this Policy may result in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Warning or notice of violation</li>
              <li>Temporary suspension of account access</li>
              <li>Permanent termination of account</li>
              <li>Removal of content</li>
              <li>Legal action where appropriate</li>
            </ul>
            <p>
              We reserve the right to take action at our discretion without
              prior notice for severe violations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
            <p>
              We may update this Policy at any time. Continued use of the
              Service after changes indicates your acceptance of the revised
              Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Contact Us</h2>
            <p>
              For questions about this Policy, contact us at{" "}
              <a
                href="mailto:legal@viah.me"
                className="text-orange-600 hover:underline"
              >
                legal@viah.me
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Viah.me is a brand operated by{" "}
            <a href="https://sevaaiservices.com">SSJ 8-11 LLC</a>. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
