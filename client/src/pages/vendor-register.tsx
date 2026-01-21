import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Briefcase, AlertTriangle, Building2, MapPin, Check, ChevronLeft } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";
import { VendorSetupWizard, type VendorSetupData } from "@/components/vendor-setup-wizard";

interface VendorDuplicateMatch {
  vendor: {
    id: string;
    name: string;
    category: string | null;
    categories: string[] | null;
    city: string | null;
    location: string;
    email: string | null;
  };
  matchType: 'exact' | 'potential';
  matchReasons: string[];
  confidence: number;
}

interface DuplicateCheckResponse {
  hasExactMatch: boolean;
  exactMatch: VendorDuplicateMatch | null;
  potentialMatches: VendorDuplicateMatch[];
}

type ViewState = 'form' | 'duplicates' | 'wizard';

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    businessName: z.string().min(2, "Business name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function VendorRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>('form');
  const [duplicateData, setDuplicateData] = useState<DuplicateCheckResponse | null>(null);
  const [pendingFormData, setPendingFormData] = useState<RegisterFormData | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
    },
  });

  const checkDuplicatesMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/check-vendor-duplicates", {
        businessName: data.businessName,
        email: data.email,
        categories: [],
      });
      return await response.json() as DuplicateCheckResponse;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData & Partial<VendorSetupData>) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        role: "vendor",
        businessName: data.businessName,
        // Include wizard data
        categories: data.categories,
        preferredWeddingTraditions: data.preferredWeddingTraditions,
        areasServed: data.areasServed,
        location: data.location,
        phone: data.phone,
        priceRange: data.priceRange,
        description: data.description,
        logoUrl: data.logoUrl,
        coverImageUrl: data.coverImageUrl,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Viah.me!",
        description: "Your profile is live but unpublished until approved by our team.",
      });
      setLocation("/vendor-dashboard");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Registration failed";
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
      });
    },
  });

  const claimVendorMutation = useMutation({
    mutationFn: async ({ vendorId, email, password }: { vendorId: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/claim-vendor", {
        vendorId,
        email,
        password,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to claim profile");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile claimed successfully!",
        description: "Your claim is pending approval. You can now complete your profile.",
      });
      setLocation("/vendor-profile");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to claim profile";
      toast({
        variant: "destructive",
        title: "Claim failed",
        description: errorMessage,
      });
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const duplicates = await checkDuplicatesMutation.mutateAsync(data);
      
      if (duplicates.hasExactMatch || duplicates.potentialMatches.length > 0) {
        setDuplicateData(duplicates);
        setPendingFormData(data);
        setView('duplicates');
      } else {
        // No duplicates - go directly to wizard
        setPendingFormData(data);
        setView('wizard');
      }
    } catch (error) {
      // Error checking duplicates - still show wizard
      setPendingFormData(data);
      setView('wizard');
    }
  };

  const handleClaimVendor = (vendorId: string) => {
    if (!pendingFormData) return;
    claimVendorMutation.mutate({
      vendorId,
      email: pendingFormData.email,
      password: pendingFormData.password,
    });
  };

  const handleProceedWithNewProfile = () => {
    if (!pendingFormData) return;
    // Show the wizard instead of registering immediately
    setView('wizard');
  };

  const handleWizardComplete = (wizardData: VendorSetupData) => {
    if (!pendingFormData) return;
    // Combine registration data with wizard data and register
    registerMutation.mutate({
      ...pendingFormData,
      ...wizardData,
    });
  };

  const handleWizardCancel = () => {
    // Go back to duplicates view if there were duplicates, otherwise back to form
    if (duplicateData && (duplicateData.hasExactMatch || duplicateData.potentialMatches.length > 0)) {
      setView('duplicates');
    } else {
      setView('form');
      setPendingFormData(null);
    }
  };

  const handleBack = () => {
    setView('form');
    setDuplicateData(null);
  };

  // Wizard view - shown after user chooses to create new profile
  if (view === 'wizard' && pendingFormData) {
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
            <h2 className="text-2xl font-bold mt-4">Complete Your Business Profile</h2>
            <p className="text-muted-foreground mt-2">
              Tell us about your business to help couples find you
            </p>
          </div>
          
          <VendorSetupWizard
            initialData={{
              name: pendingFormData.businessName,
              email: pendingFormData.email,
            }}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
          
          {registerMutation.isPending && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-lg font-medium">Creating your account...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'duplicates' && duplicateData && pendingFormData) {
    const isExactMatch = duplicateData.hasExactMatch && duplicateData.exactMatch;
    const matchesToShow = isExactMatch 
      ? [duplicateData.exactMatch!] 
      : duplicateData.potentialMatches;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <Link href="/" data-testid="link-logo-home">
              <img
                src={logoUrl}
                alt="Viah.me"
                className="h-16 mx-auto object-contain mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <h2 className="text-xl font-semibold">
                  {isExactMatch ? "Profile Already Exists" : "Potential Matches Found"}
                </h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                {isExactMatch 
                  ? "We found an existing vendor profile that matches your business. Would you like to claim it?"
                  : `We found ${matchesToShow.length} potential match${matchesToShow.length > 1 ? 'es' : ''} for "${pendingFormData.businessName}". Is one of these your business?`
                }
              </p>

              <div className="space-y-3 mb-6">
                {matchesToShow.map((match, index) => (
                  <Card 
                    key={match.vendor.id} 
                    className="hover-elevate cursor-pointer"
                    data-testid={`card-duplicate-vendor-${index}`}
                    onClick={() => handleClaimVendor(match.vendor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate">{match.vendor.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(match.confidence * 100)}% match
                            </Badge>
                          </div>
                          
                          {match.vendor.city && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              <span>{match.vendor.city}</span>
                            </div>
                          )}

                          {match.vendor.categories && match.vendor.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {match.vendor.categories.slice(0, 3).map((cat) => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {match.vendor.email && (
                            <p className="text-xs text-muted-foreground mb-1">
                              To claim, register with: {match.vendor.email}
                            </p>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Match reasons: {match.matchReasons.join(", ")}
                          </div>
                        </div>

                        <Button 
                          size="sm"
                          disabled={claimVendorMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimVendor(match.vendor.id);
                          }}
                          data-testid={`button-claim-vendor-${index}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Claim
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {!isExactMatch && (
                  <Button
                    variant="outline"
                    onClick={handleProceedWithNewProfile}
                    disabled={registerMutation.isPending}
                    className="w-full"
                    data-testid="button-create-new-profile"
                  >
                    {registerMutation.isPending ? "Creating..." : "None of these - Create new profile"}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={registerMutation.isPending || claimVendorMutation.isPending}
                  className="w-full"
                  data-testid="button-back-to-form"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to registration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" data-testid="link-logo-home">
            <img
              src={logoUrl}
              alt="Viah.me"
              className="h-20 mx-auto object-contain mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl font-bold text-foreground">
              Vendor Registration
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Join Viah.me and connect with couples
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Business Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your Business Name"
                          disabled={registerMutation.isPending || checkDuplicatesMutation.isPending}
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@yourbusiness.com"
                          disabled={registerMutation.isPending || checkDuplicatesMutation.isPending}
                          data-testid="input-vendor-email"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        This will be your login email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Create a password (min 8 characters)"
                          disabled={registerMutation.isPending || checkDuplicatesMutation.isPending}
                          data-testid="input-vendor-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm your password"
                          disabled={registerMutation.isPending || checkDuplicatesMutation.isPending}
                          data-testid="input-vendor-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={registerMutation.isPending || checkDuplicatesMutation.isPending}
                  className="w-full"
                  data-testid="button-vendor-register"
                >
                  {checkDuplicatesMutation.isPending 
                    ? "Checking..." 
                    : registerMutation.isPending 
                    ? "Creating Account..." 
                    : "Create Vendor Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  All new accounts are reviewed before approval
                </p>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/vendor-login"
                  className="text-primary font-semibold hover:underline"
                  data-testid="link-vendor-login"
                >
                  Vendor Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Planning a wedding?{" "}
            <Link
              href="/onboarding"
              className="text-primary font-semibold hover:underline"
              data-testid="link-couple-onboarding"
            >
              Start Planning
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
