import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { VendorSetupWizard, type VendorSetupData } from "@/components/vendor-setup-wizard";
import { Link } from "wouter";
import logoUrl from "@assets/viah-logo_1763669612969.png";

const STORAGE_KEY = "pending_vendor_data";

export default function VendorOnboarding() {
  const [, setLocation] = useLocation();
  const [initialData, setInitialData] = useState<Partial<VendorSetupData>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setInitialData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved vendor data:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleWizardComplete = (data: VendorSetupData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setLocation("/vendor-register");
  };

  const handleWizardCancel = () => {
    setLocation("/");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <Link href="/" data-testid="link-logo-home">
            <img
              src={logoUrl}
              alt="Viah.me"
              className="h-16 mx-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <h2 className="text-2xl font-bold mt-4">Set Up Your Business Profile</h2>
          <p className="text-muted-foreground mt-2">
            Tell us about your business to help couples find you
          </p>
        </div>

        <VendorSetupWizard
          initialData={initialData}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
          persistToStorage={true}
          storageKey={STORAGE_KEY}
        />
      </div>
    </div>
  );
}
