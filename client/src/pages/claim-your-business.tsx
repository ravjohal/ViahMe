import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2,
  ArrowRight,
  Store,
  Loader2,
  AlertCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/viah-logo_1763669612969.png";
import type { Vendor } from "@shared/schema";

export default function ClaimYourBusiness() {
  const { toast } = useToast();
  const searchString = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [pendingAdminReview, setPendingAdminReview] = useState(false);
  const [preselectedVendorHandled, setPreselectedVendorHandled] = useState(false);
  
  // Form state for vendors without email
  const [claimantEmail, setClaimantEmail] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Get vendor ID from URL if provided (e.g., ?vendor=123)
  const vendorIdFromUrl = new URLSearchParams(searchString).get('vendor');

  // Fetch preselected vendor if ID is in URL
  const { data: preselectedVendor, isLoading: preselectedLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorIdFromUrl],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorIdFromUrl}`);
      if (!response.ok) throw new Error("Failed to fetch vendor");
      return response.json();
    },
    enabled: !!vendorIdFromUrl && !preselectedVendorHandled,
  });

  // Auto-open claim dialog when vendor is preselected from URL
  useEffect(() => {
    if (preselectedVendor && !preselectedVendor.claimed && !preselectedVendorHandled) {
      setSelectedVendor(preselectedVendor);
      setClaimDialogOpen(true);
      setPreselectedVendorHandled(true);
    }
  }, [preselectedVendor, preselectedVendorHandled]);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors/unclaimed", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/unclaimed?search=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch vendors");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const claimMutation = useMutation({
    mutationFn: async ({ vendorId, claimantData }: { vendorId: string; claimantData?: { claimantEmail: string; claimantName?: string; claimantPhone?: string; notes?: string } }) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/request-claim`, claimantData || {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pendingAdminReview) {
        setPendingAdminReview(true);
        toast({
          title: "Claim submitted for review!",
          description: "An admin will review your request and contact you via email.",
        });
      } else {
        setClaimSuccess(true);
        toast({
          title: "Claim request sent!",
          description: "Check your email for instructions to complete the claim.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Claim failed",
        description: error.message || "Unable to send claim request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleClaimClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setClaimDialogOpen(true);
    setClaimSuccess(false);
    setPendingAdminReview(false);
    // Reset form fields
    setClaimantEmail("");
    setClaimantName("");
    setClaimantPhone("");
    setNotes("");
  };

  const handleConfirmClaim = () => {
    if (selectedVendor) {
      // If vendor has email, just send claim request
      if (selectedVendor.email) {
        claimMutation.mutate({ vendorId: selectedVendor.id });
      } else {
        // Vendor has no email, require claimant's email for admin review
        if (!claimantEmail.trim()) {
          toast({
            title: "Email required",
            description: "Please provide your business email address.",
            variant: "destructive",
          });
          return;
        }
        claimMutation.mutate({
          vendorId: selectedVendor.id,
          claimantData: {
            claimantEmail: claimantEmail.trim(),
            claimantName: claimantName.trim() || undefined,
            claimantPhone: claimantPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        });
      }
    }
  };
  
  const vendorHasEmail = selectedVendor?.email;

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src={logoUrl} alt="Viah.me" className="h-10 object-contain cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/vendor-login">
              <Button variant="outline" data-testid="button-vendor-login">
                Vendor Login
              </Button>
            </Link>
            <Link href="/vendor-onboarding">
              <Button data-testid="button-vendor-register">
                Register New Business
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Claim Your Business Profile
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Is your business already listed on Viah.me? Search below to find and claim your profile 
              to manage your listing, respond to inquiries, and connect with couples.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Business
              </CardTitle>
              <CardDescription>
                Enter your business name to search our directory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  data-testid="input-search-business"
                />
              </div>

              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-sm text-muted-foreground text-center">
                  Enter at least 2 characters to search
                </p>
              )}

              {isLoading && debouncedQuery.length >= 2 && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              )}

              {!isLoading && debouncedQuery.length >= 2 && vendors.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No unclaimed businesses found matching "{debouncedQuery}". 
                    Your business might already be claimed, or you can{" "}
                    <Link href="/vendor-onboarding" className="text-primary font-medium hover:underline">
                      register as a new vendor
                    </Link>.
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && vendors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Found {vendors.length} unclaimed business{vendors.length !== 1 ? "es" : ""}
                  </p>
                  {vendors.map((vendor) => (
                    <Card 
                      key={vendor.id} 
                      className="hover-elevate cursor-pointer transition-all"
                      onClick={() => handleClaimClick(vendor)}
                      data-testid={`card-vendor-${vendor.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{vendor.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(vendor.categories?.[0] || 'vendor')}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              {vendor.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {vendor.location}
                                </span>
                              )}
                              {vendor.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {vendor.phone}
                                </span>
                              )}
                            </div>
                            {vendor.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {vendor.description}
                              </p>
                            )}
                          </div>
                          <Button size="sm" className="shrink-0" data-testid={`button-claim-${vendor.id}`}>
                            Claim
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Verify Ownership</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm you're the business owner through email or phone verification
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Manage Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Update photos, pricing, availability, and showcase your work
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Connect with Couples</h3>
                <p className="text-sm text-muted-foreground">
                  Receive booking requests and messages directly from engaged couples
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center space-y-4">
              <Building2 className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-semibold">Don't see your business?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                If your business isn't listed yet, you can register as a new vendor 
                and create your profile from scratch.
              </p>
              <Link href="/vendor-onboarding">
                <Button size="lg" data-testid="button-register-new">
                  Register New Business
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Claim {selectedVendor?.name}
            </DialogTitle>
            <DialogDescription>
              {(claimSuccess || pendingAdminReview) ? (
                pendingAdminReview 
                  ? "Your claim has been submitted for admin review."
                  : "Your claim request has been sent successfully!"
              ) : vendorHasEmail ? (
                "We'll send verification instructions to the email on file for this business."
              ) : (
                "Please provide your business email so we can verify your ownership."
              )}
            </DialogDescription>
          </DialogHeader>

          {!claimSuccess && !pendingAdminReview && selectedVendor && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium">{selectedVendor.name}</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedVendor.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {selectedVendor.location}
                    </p>
                  )}
                  {vendorHasEmail && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {selectedVendor.email?.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                    </p>
                  )}
                </div>
              </div>
              
              {vendorHasEmail ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A verification link will be sent to the email address above. 
                    If you don't have access, please contact support.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      No email is on file for this business. Please provide your business email address 
                      so our team can verify your ownership. This may take 1-2 business days.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="claimant-email">Business Email *</Label>
                      <Input
                        id="claimant-email"
                        type="email"
                        placeholder="your@business.com"
                        value={claimantEmail}
                        onChange={(e) => setClaimantEmail(e.target.value)}
                        required
                        data-testid="input-claimant-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claimant-name">Your Name</Label>
                      <Input
                        id="claimant-name"
                        placeholder="John Smith"
                        value={claimantName}
                        onChange={(e) => setClaimantName(e.target.value)}
                        data-testid="input-claimant-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claimant-phone">Phone Number</Label>
                      <Input
                        id="claimant-phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={claimantPhone}
                        onChange={(e) => setClaimantPhone(e.target.value)}
                        data-testid="input-claimant-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information to help verify your ownership..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="resize-none"
                        rows={2}
                        data-testid="input-notes"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {claimSuccess && (
            <div className="py-4">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Check your email for a verification link. The link will expire in 48 hours.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {pendingAdminReview && (
            <div className="py-4">
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Your claim has been submitted for review. We'll contact you at <span className="font-medium">{claimantEmail}</span> once 
                  your ownership is verified (usually within 1-2 business days).
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            {(claimSuccess || pendingAdminReview) ? (
              <Button onClick={() => setClaimDialogOpen(false)} data-testid="button-close-dialog">
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setClaimDialogOpen(false)} data-testid="button-cancel-claim">
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmClaim} 
                  disabled={claimMutation.isPending || (!vendorHasEmail && !claimantEmail.trim())}
                  data-testid="button-confirm-claim"
                >
                  {claimMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {vendorHasEmail ? "Sending..." : "Submitting..."}
                    </>
                  ) : vendorHasEmail ? (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Verification
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
