import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Building2, CheckCircle2, AlertCircle, MapPin, Phone, Mail, Globe, Loader2, Map } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface MetroArea {
  id: string;
  slug: string;
  value: string;
  label: string;
}
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@shared/schema";

const claimFormSchema = z.object({
  usernameEmail: z.string().email("Please enter a valid email address"),
  businessEmail: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  businessDescription: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]),
  areasServed: z.array(z.string()).min(1, "Please select at least one area you serve"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export default function ClaimProfile() {
  const [, params] = useRoute("/claim-profile/:token");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState(false);
  const [claimComplete, setClaimComplete] = useState(false);

  const token = params?.token;

  const { data: vendorData, isLoading, error } = useQuery<{ vendor: Vendor & { email?: string; areasServed?: string[] }; valid: boolean; expired?: boolean; claimantEmail?: string }>({
    queryKey: ["/api/vendors/claim/verify", token],
    queryFn: async () => {
      if (!token) throw new Error("No claim token provided");
      const response = await fetch(`/api/vendors/claim/verify?token=${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid or expired claim link");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const { data: metroAreas = [] } = useQuery<MetroArea[]>({
    queryKey: ["/api/metro-areas"],
  });

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      usernameEmail: "",
      businessEmail: "",
      phone: vendorData?.vendor?.phone || "",
      password: "",
      confirmPassword: "",
      businessDescription: vendorData?.vendor?.description || "",
      website: vendorData?.vendor?.website || "",
      priceRange: (vendorData?.vendor?.priceRange as any) || "$$",
      areasServed: [],
    },
  });

  useEffect(() => {
    if (vendorData?.vendor) {
      // Pre-populate both email fields with the claimant email (the email they submitted when claiming)
      const claimantEmail = vendorData.claimantEmail || vendorData.vendor.email || "";
      form.setValue("usernameEmail", claimantEmail);
      form.setValue("businessEmail", claimantEmail);
      form.setValue("phone", vendorData.vendor.phone || "");
      form.setValue("businessDescription", vendorData.vendor.description || "");
      form.setValue("website", vendorData.vendor.website || "");
      form.setValue("priceRange", (vendorData.vendor.priceRange as any) || "$$");
      form.setValue("areasServed", vendorData.vendor.areasServed || []);
    }
  }, [vendorData, form]);

  const claimMutation = useMutation({
    mutationFn: async (data: ClaimFormValues) => {
      // Process website URL - add https:// if not present
      let processedWebsite = data.website || null;
      if (processedWebsite && !processedWebsite.startsWith('http://') && !processedWebsite.startsWith('https://')) {
        processedWebsite = 'https://' + processedWebsite;
      }
      
      const response = await apiRequest("POST", `/api/vendors/claim/complete`, {
        token,
        usernameEmail: data.usernameEmail, // Login email
        businessEmail: data.businessEmail, // Business contact email
        phone: data.phone,
        password: data.password,
        description: data.businessDescription,
        website: processedWebsite,
        priceRange: data.priceRange,
        areasServed: data.areasServed,
      });
      return response.json();
    },
    onSuccess: () => {
      setClaimComplete(true);
      toast({
        title: "Profile claimed successfully!",
        description: "You can now log in to manage your business profile.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim failed",
        description: error.message || "Unable to complete profile claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClaimFormValues) => {
    claimMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying your claim link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !vendorData?.valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Claim Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {vendorData?.expired 
                  ? "This claim link has expired. Please request a new one by visiting your profile on Viah.me."
                  : "This claim link is invalid or has already been used."}
              </AlertDescription>
            </Alert>
            <Button onClick={() => setLocation("/vendors")} className="w-full" data-testid="button-browse-vendors">
              Browse Vendor Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Profile Claimed Successfully!
            </CardTitle>
            <CardDescription>
              Your business profile on Viah.me is now verified and under your control.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <p className="font-medium">What's next?</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Log in to your vendor dashboard</li>
                  <li>Add photos and portfolio items</li>
                  <li>Set your availability calendar</li>
                  <li>Respond to couple inquiries</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => setLocation("/vendor-login")} className="w-full" data-testid="button-vendor-login">
              Log In to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendor = vendorData.vendor;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold">Claim Your Business Profile</h1>
          <p className="text-muted-foreground">
            Verify your ownership and take control of your Viah.me listing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {vendor.name}
            </CardTitle>
            <CardDescription>
              Review your current listing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {vendor.categories?.map((cat: string) => (
                <Badge key={cat} variant="outline">{cat.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Badge>
              ))}
              {vendor.priceRange && (
                <Badge variant="secondary">{vendor.priceRange}</Badge>
              )}
            </div>
            
            <div className="grid gap-3 text-sm">
              {vendor.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location}</span>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {vendor.website}
                  </a>
                </div>
              )}
            </div>

            {vendor.description && (
              <p className="text-sm text-muted-foreground border-l-2 pl-4 italic">
                {vendor.description}
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Provide your contact details and create your vendor account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="usernameEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@email.com" 
                            {...field} 
                            data-testid="input-claim-username-email"
                          />
                        </FormControl>
                        <FormDescription>
                          This will be your login email for Viah.me
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@business.com" 
                            {...field} 
                            data-testid="input-claim-business-email"
                          />
                        </FormControl>
                        <FormDescription>
                          Displayed on your public profile for inquiries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone *</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          {...field} 
                          data-testid="input-claim-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Create Password *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Min. 8 characters" 
                            {...field} 
                            data-testid="input-claim-password"
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
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm password" 
                            {...field} 
                            data-testid="input-claim-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://yourbusiness.com" 
                            {...field} 
                            data-testid="input-claim-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Range *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-claim-price-range">
                              <SelectValue placeholder="Select price range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="$">$ - Budget Friendly</SelectItem>
                            <SelectItem value="$$">$$ - Moderate</SelectItem>
                            <SelectItem value="$$$">$$$ - Premium</SelectItem>
                            <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="businessDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your services, experience, and what makes your business special for South Asian weddings..."
                          rows={4}
                          {...field} 
                          value={field.value || ""}
                          data-testid="textarea-claim-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areasServed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        Areas Served *
                      </FormLabel>
                      <FormDescription>
                        Select all metro areas where you provide services
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {metroAreas.map((area) => (
                          <label
                            key={area.id}
                            className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer transition-all hover-elevate ${
                              field.value?.includes(area.value)
                                ? "border-primary bg-primary/10"
                                : ""
                            }`}
                            data-testid={`area-${area.value}`}
                          >
                            <Checkbox
                              checked={field.value?.includes(area.value)}
                              onCheckedChange={(checked) => {
                                const currentAreas = field.value || [];
                                if (checked) {
                                  field.onChange([...currentAreas, area.value]);
                                } else {
                                  field.onChange(currentAreas.filter((a: string) => a !== area.value));
                                }
                              }}
                            />
                            <span className="text-sm">{area.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    By claiming this profile, you confirm that you are authorized to represent this business. 
                    Your profile will display a verified badge after completion.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={claimMutation.isPending}
                  data-testid="button-complete-claim"
                >
                  {claimMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Claiming Profile...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Claim & Verify Profile
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
