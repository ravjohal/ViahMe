import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "viah_cookie_consent";

export function CookieConsentBanner() {
  const [, setLocation] = useLocation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-300"
      data-testid="cookie-consent-banner"
    >
      <Card className="max-w-4xl mx-auto p-4 sm:p-6 shadow-lg border-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <Cookie className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">We use cookies</p>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                By clicking "Accept", you consent to our use of cookies. See our{" "}
                <button 
                  onClick={() => setLocation("/privacy-policy")}
                  className="text-orange-600 hover:underline"
                  data-testid="link-privacy-policy"
                >
                  Privacy Policy
                </button>
                {" "}for more details.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex-1 sm:flex-none"
              data-testid="button-decline-cookies"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1 sm:flex-none bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
              data-testid="button-accept-cookies"
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="shrink-0 hidden sm:flex"
              data-testid="button-close-cookie-banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
