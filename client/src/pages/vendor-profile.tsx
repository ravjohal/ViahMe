import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VendorHeader } from "@/components/vendor-header";
import { VendorSetupWizard } from "@/components/vendor-setup-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Pencil,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Globe
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTraditionLookup } from "@/hooks/use-traditions";
import type { Vendor } from "@shared/schema";

export default function VendorProfilePage() {
  const { toast } = useToast();
  const { getTraditionLabel } = useTraditionLookup();
  const [isEditing, setIsEditing] = useState(false);

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      if (!vendor) throw new Error("Vendor not found");
      return apiRequest("PATCH", `/api/vendors/${vendor.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your business profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (isPublished: boolean) => {
      if (!vendor) throw new Error("Vendor not found");
      return apiRequest("PATCH", `/api/vendors/${vendor.id}`, { isPublished });
    },
    onSuccess: (_, isPublished) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: isPublished ? "Profile Published" : "Profile Unpublished",
        description: isPublished 
          ? "Your profile is now visible to couples searching for vendors."
          : "Your profile is now hidden from search results.",
      });
    },
  });

  const handleWizardComplete = async (data: {
    name: string;
    categories: string[];
    preferredWeddingTraditions: string[];
    areasServed: string[];
    customCity?: string;
    location: string;
    email: string;
    phone: string;
    priceRange: string;
    description: string;
    logoUrl?: string;
    coverImageUrl?: string;
  }) => {
    let processedAreasServed = [...data.areasServed];
    if (processedAreasServed.includes('Other') && data.customCity?.trim()) {
      const customCityName = data.customCity.trim();
      processedAreasServed = processedAreasServed.map(area => 
        area === 'Other' ? customCityName : area
      );
    }
    
    updateVendorMutation.mutate({
      name: data.name,
      categories: data.categories,
      category: data.categories[0] || "other",
      preferredWeddingTraditions: data.preferredWeddingTraditions,
      areasServed: processedAreasServed,
      city: processedAreasServed[0] || null,
      location: data.location,
      email: data.email,
      phone: data.phone,
      priceRange: data.priceRange,
      description: data.description,
      logoUrl: data.logoUrl || null,
      coverImageUrl: data.coverImageUrl || null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <div className="container mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Vendor profile not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <div className="container mx-auto px-6 py-8 max-w-2xl">
          <VendorSetupWizard
            initialData={{
              name: vendor.name,
              categories: vendor.categories || [],
              preferredWeddingTraditions: vendor.preferredWeddingTraditions || [],
              areasServed: vendor.areasServed || [],
              location: vendor.location,
              email: vendor.email || "",
              phone: vendor.phone || "",
              priceRange: vendor.priceRange,
              description: vendor.description || "",
              logoUrl: vendor.logoUrl || "",
              coverImageUrl: vendor.coverImageUrl || "",
            }}
            onComplete={handleWizardComplete}
            onCancel={() => setIsEditing(false)}
            isEditing={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <VendorHeader />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Business Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business information and visibility
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Business Name</Label>
                  <p className="text-lg font-semibold" data-testid="text-profile-name">{vendor.name}</p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm text-muted-foreground">Service Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(vendor.categories || []).map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm text-muted-foreground">Wedding Traditions</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {vendor.preferredWeddingTraditions && vendor.preferredWeddingTraditions.length > 0 ? (
                      vendor.preferredWeddingTraditions.map((tradition) => (
                        <Badge key={tradition} variant="outline">
                          {getTraditionLabel(tradition)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">All traditions</span>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="mt-1">{vendor.description || "No description provided"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{vendor.email || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      <p className="font-medium">{vendor.phone || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Location</Label>
                      <p className="font-medium">{vendor.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Price Range</Label>
                      <p className="font-medium font-mono">{vendor.priceRange}</p>
                    </div>
                  </div>
                </div>
                
                {vendor.areasServed && vendor.areasServed.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Areas Served</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {vendor.areasServed.map((area) => (
                            <Badge key={area} variant="outline">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Visibility</CardTitle>
                <CardDescription>
                  Control whether your profile appears in search results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vendor.approvalStatus === 'pending' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-amber-600">Pending Approval</span>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Your profile is currently under review. Once approved, it will be automatically published and visible to couples searching for vendors.
                      </p>
                    </div>
                    <div className="flex items-center justify-between opacity-50">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Hidden</span>
                      </div>
                      <Switch
                        checked={false}
                        disabled={true}
                        data-testid="switch-publish-profile"
                      />
                    </div>
                  </div>
                ) : vendor.approvalStatus === 'rejected' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-destructive" />
                      <span className="font-medium text-destructive">Not Approved</span>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">
                        Your profile was not approved. Please contact support for more information.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {vendor.isPublished ? (
                          <>
                            <Eye className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">Hidden</span>
                          </>
                        )}
                      </div>
                      <Switch
                        checked={vendor.isPublished}
                        onCheckedChange={(checked) => togglePublishMutation.mutate(checked)}
                        disabled={togglePublishMutation.isPending}
                        data-testid="switch-publish-profile"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {vendor.isPublished 
                        ? "Your profile is visible to couples searching for vendors."
                        : "Your profile is hidden from search results. Toggle on to start receiving booking requests."
                      }
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile Views</span>
                  <span className="font-semibold">{vendor.viewCount || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-semibold">
                    {vendor.rating ? `${vendor.rating} / 5` : "No reviews yet"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviews</span>
                  <span className="font-semibold">{vendor.reviewCount || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verified</span>
                  {vendor.claimed ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Pending</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
