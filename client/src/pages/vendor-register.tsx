import { useState, useEffect } from "react";
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
import { Briefcase, AlertTriangle, Building2, MapPin, Check, ChevronLeft, Tag } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";
import type { VendorSetupData } from "@/components/vendor-setup-wizard";

const STORAGE_KEY = "pending_vendor_data";

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

type ViewState = 'loading' | 'no-profile' | 'credentials' | 'duplicates';

const credentialsSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type CredentialsFormData = z.infer<typeof credentialsSchema>;

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function VendorRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>('loading');
  const [profileData, setProfileData] = useState<VendorSetupData | null>(null);
  const [duplicateData, setDuplicateData] = useState<DuplicateCheckResponse | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<CredentialsFormData | null>(null);

  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as VendorSetupData;
        setProfileData(data);
        if (data.email) {
          form.setValue("email", data.email);
        }
        setView('credentials');
      } catch (e) {
        console.error("Failed to parse saved vendor data:", e);
        setView('no-profile');
      }
    } else {
      setView('no-profile');
    }
  }, [form]);

  const checkEmailExistsMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/check-email-exists", { email });
      return await response.json() as { exists: boolean };
    },
  });

  const checkDuplicatesMutation = useMutation({
    mutationFn: async (data: { businessName: string; email: string; categories: string[] }) => {
      const response = await apiRequest("POST", "/api/auth/check-vendor-duplicates", data);
      return await response.json() as DuplicateCheckResponse;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: CredentialsFormData & Partial<VendorSetupData>) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        role: "vendor",
        businessName: data.name,
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
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: "Welcome to Viah.me!",
        description: "Your profile is live but unpublished until approved by our team.",
      });
      setLocation("/vendor-dashboard");
    },
    onError: (error: any) => {
      let errorMessage = "Registration failed";
      try {
        // Parse error message format: "400: {"error":"message"}"
        const match = error.message?.match(/^\d+:\s*(.+)$/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } else {
          errorMessage = error.message || errorMessage;
        }
      } catch {
        errorMessage = error.message || errorMessage;
      }
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
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: "Profile claimed successfully!",
        description: "Your claim is pending approval. You can now complete your profile.",
      });
      setLocation("/vendor-dashboard");
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

  const onSubmit = async (credentials: CredentialsFormData) => {
    if (!profileData) return;

    try {
      // First check if email already exists
      const emailCheck = await checkEmailExistsMutation.mutateAsync(credentials.email);
      if (emailCheck.exists) {
        toast({
          variant: "destructive",
          title: "Email already registered",
          description: "An account with this email already exists. Please use a different email or log in.",
        });
        return;
      }

      // Then check for duplicate vendors
      const duplicates = await checkDuplicatesMutation.mutateAsync({
        businessName: profileData.name,
        email: credentials.email,
        categories: profileData.categories || [],
      });

      if (duplicates.hasExactMatch || duplicates.potentialMatches.length > 0) {
        setDuplicateData(duplicates);
        setPendingCredentials(credentials);
        setView('duplicates');
      } else {
        registerMutation.mutate({
          ...credentials,
          ...profileData,
        });
      }
    } catch (error) {
      registerMutation.mutate({
        ...credentials,
        ...profileData,
      });
    }
  };

  const handleClaimVendor = (vendorId: string) => {
    if (!pendingCredentials) return;
    claimVendorMutation.mutate({
      vendorId,
      email: pendingCredentials.email,
      password: pendingCredentials.password,
    });
  };

  const handleProceedWithNewProfile = () => {
    if (!pendingCredentials || !profileData) return;
    registerMutation.mutate({
      ...pendingCredentials,
      ...profileData,
    });
  };

  const handleBackToCredentials = () => {
    setView('credentials');
    setDuplicateData(null);
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (view === 'no-profile') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" data-testid="link-logo-home">
            <img
              src={logoUrl}
              alt="Viah.me"
              className="h-20 mx-auto object-contain mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <Card>
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profile Setup Required</h2>
              <p className="text-muted-foreground mb-6">
                Please complete your business profile before creating an account.
              </p>
              <Button
                onClick={() => setLocation("/vendor-onboarding")}
                className="w-full"
                data-testid="button-go-to-onboarding"
              >
                Set Up Your Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'duplicates' && duplicateData && pendingCredentials && profileData) {
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
                  : `We found ${matchesToShow.length} potential match${matchesToShow.length > 1 ? 'es' : ''} for "${profileData.name}". Is one of these your business?`
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

                          {(match.vendor.city || match.vendor.location) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {match.vendor.city || match.vendor.location}
                              </span>
                            </div>
                          )}

                          {match.vendor.categories && match.vendor.categories.length > 0 && (
                            <div className="flex items-start gap-1 mb-2">
                              <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {match.vendor.categories.slice(0, 3).map((cat) => (
                                  <Badge key={cat} variant="secondary" className="text-xs">
                                    {formatCategory(cat)}
                                  </Badge>
                                ))}
                                {match.vendor.categories.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{match.vendor.categories.length - 3} more
                                  </Badge>
                                )}
                              </div>
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
                  onClick={handleBackToCredentials}
                  disabled={registerMutation.isPending || claimVendorMutation.isPending}
                  className="w-full"
                  data-testid="button-back-to-credentials"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
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
            <h1 className="font-display text-3xl font-bold text-foreground">
              Almost Done!
            </h1>
          </div>
          {profileData && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Creating account for:</p>
              <p className="font-semibold">{profileData.name}</p>
              {profileData.areasServed && profileData.areasServed.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Serving: {profileData.areasServed.map(area => 
                    area === "Other" && profileData.customCity 
                      ? profileData.customCity 
                      : area
                  ).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          disabled={registerMutation.isPending || checkEmailExistsMutation.isPending || checkDuplicatesMutation.isPending}
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
                          disabled={registerMutation.isPending || checkEmailExistsMutation.isPending || checkDuplicatesMutation.isPending}
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
                          disabled={registerMutation.isPending || checkEmailExistsMutation.isPending || checkDuplicatesMutation.isPending}
                          data-testid="input-vendor-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={registerMutation.isPending || checkEmailExistsMutation.isPending || checkDuplicatesMutation.isPending}
                  className="w-full"
                  data-testid="button-vendor-register"
                >
                  {checkDuplicatesMutation.isPending
                    ? "Checking..."
                    : registerMutation.isPending
                    ? "Creating Account..."
                    : "Create Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  All new accounts are reviewed before approval
                </p>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => setLocation("/vendor-onboarding")}
                className="w-full"
                data-testid="button-edit-profile"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Edit Profile Details
              </Button>
            </div>

            <div className="mt-4 text-center">
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
