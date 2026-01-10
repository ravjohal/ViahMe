import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vendor, ServicePackage, InsertServicePackage } from "@shared/schema";
import { insertServicePackageSchema, VENDOR_CATEGORIES } from "@shared/schema";
import { useLocation, Link } from "wouter";
import { Package, Plus, Edit, Trash2, CheckCircle, Settings, X } from "lucide-react";
import { useTraditions } from "@/hooks/use-traditions";

export default function VendorPackages() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [packageFormData, setPackageFormData] = useState<Partial<InsertServicePackage>>({
    name: "",
    description: "",
    price: "0",
    traditions: [],
    categories: [],
    features: [],
    isActive: true,
  });
  const [newFeature, setNewFeature] = useState("");
  const [packageFormErrors, setPackageFormErrors] = useState<Record<string, string>>({});

  const { data: currentVendor, isLoading: vendorsLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
    enabled: !!user && user.role === "vendor",
  });

  const { data: traditions = [], isLoading: traditionsLoading } = useTraditions();

  const vendorId = currentVendor?.id;
  const hasProfile = !!currentVendor;

  const { data: servicePackages = [], isLoading: packagesLoading } = useQuery<ServicePackage[]>({
    queryKey: [`/api/service-packages/vendor/${vendorId}`],
    enabled: !!vendorId,
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: InsertServicePackage) => {
      const validated = insertServicePackageSchema.parse(data);
      const response = await apiRequest("POST", "/api/service-packages", validated);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-packages/vendor/${vendorId}`] });
      toast({
        title: "Package Created",
        description: "Your service package has been created successfully.",
      });
      setPackageDialogOpen(false);
      resetPackageForm();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error?.message || "Failed to create service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertServicePackage> }) => {
      const validated = insertServicePackageSchema.partial().parse(data);
      const response = await apiRequest("PATCH", `/api/service-packages/${id}`, validated);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-packages/vendor/${vendorId}`] });
      toast({
        title: "Package Updated",
        description: "Your service package has been updated successfully.",
      });
      setPackageDialogOpen(false);
      resetPackageForm();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/service-packages/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-packages/vendor/${vendorId}`] });
      toast({
        title: "Package Deleted",
        description: "Your service package has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validatePackageForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!packageFormData.name?.trim()) {
      errors.name = "Package name is required";
    }
    
    if (!packageFormData.price || parseFloat(packageFormData.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }
    
    if (!packageFormData.traditions?.length) {
      errors.traditions = "Select at least one wedding tradition";
    }
    
    if (!packageFormData.categories?.length) {
      errors.categories = "Select at least one service category";
    }
    
    setPackageFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetPackageForm = () => {
    setEditingPackage(null);
    setPackageFormData({
      name: "",
      description: "",
      price: "",
      traditions: [],
      categories: [],
      features: [],
      isActive: true,
    });
    setNewFeature("");
    setPackageFormErrors({});
  };

  const openPackageDialog = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageFormData({
        name: pkg.name,
        description: pkg.description || "",
        price: pkg.price,
        traditions: pkg.traditions || [],
        categories: pkg.categories || [],
        features: (pkg.features as string[]) || [],
        isActive: pkg.isActive ?? true,
      });
    } else {
      resetPackageForm();
    }
    setPackageDialogOpen(true);
  };

  const handleSavePackage = () => {
    if (!vendorId) return;
    
    if (!validatePackageForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const packageData: InsertServicePackage = {
      vendorId,
      name: packageFormData.name?.trim() || "",
      description: packageFormData.description?.trim() || "",
      price: packageFormData.price || "0",
      traditions: packageFormData.traditions || [],
      categories: packageFormData.categories || [],
      features: packageFormData.features || [],
      isActive: packageFormData.isActive ?? true,
      sortOrder: editingPackage?.sortOrder || servicePackages.length,
    };

    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: packageData });
    } else {
      createPackageMutation.mutate(packageData);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setPackageFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setPackageFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const toggleTradition = (tradition: string) => {
    setPackageFormData(prev => {
      const traditions = prev.traditions || [];
      if (traditions.includes(tradition)) {
        return { ...prev, traditions: traditions.filter(t => t !== tradition) };
      } else {
        return { ...prev, traditions: [...traditions, tradition] };
      }
    });
  };

  const toggleCategory = (category: string) => {
    setPackageFormData(prev => {
      const categories = prev.categories || [];
      if (categories.includes(category)) {
        return { ...prev, categories: categories.filter(c => c !== category) };
      } else {
        return { ...prev, categories: [...categories, category] };
      }
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background flex items-center justify-center">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  if (user.role !== "vendor") {
    setLocation("/dashboard");
    return null;
  }

  const activePackages = servicePackages.filter(p => p.isActive);
  const inactivePackages = servicePackages.filter(p => !p.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
      <VendorHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Service Packages</h1>
            <p className="text-muted-foreground mt-1">Create bundled service offerings for different wedding traditions</p>
          </div>
          <Button 
            onClick={() => openPackageDialog()}
            disabled={!hasProfile}
            data-testid="button-create-package"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Packages</p>
                <p className="text-2xl font-bold" data-testid="stat-active-packages">{activePackages.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/10">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive Packages</p>
                <p className="text-2xl font-bold" data-testid="stat-inactive-packages">{inactivePackages.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {!hasProfile ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create Your Profile First</h3>
            <p className="text-muted-foreground mb-4">
              You need to set up your vendor profile before creating service packages.
            </p>
            <Link href="/vendor-dashboard?edit=profile">
              <Button className="rounded-full">
                <Settings className="w-4 h-4 mr-2" />
                Set Up Profile
              </Button>
            </Link>
          </Card>
        ) : packagesLoading || vendorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : servicePackages.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Service Packages Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Create bundled service packages to offer couples complete wedding solutions tailored to their cultural traditions.
            </p>
            <Button onClick={() => openPackageDialog()} data-testid="button-create-first-package">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Package
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicePackages.map((pkg) => (
              <Card key={pkg.id} className="p-6" data-testid={`card-package-${pkg.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg" data-testid={`text-package-name-${pkg.id}`}>{pkg.name}</h4>
                      {!pkg.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="font-mono text-2xl font-bold text-primary mt-1" data-testid={`text-package-price-${pkg.id}`}>
                      ${parseFloat(pkg.price).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openPackageDialog(pkg)}
                      data-testid={`button-edit-package-${pkg.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deletePackageMutation.mutate(pkg.id)}
                      disabled={deletePackageMutation.isPending}
                      data-testid={`button-delete-package-${pkg.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-sm text-muted-foreground mb-3" data-testid={`text-package-desc-${pkg.id}`}>
                    {pkg.description}
                  </p>
                )}

                {pkg.traditions && pkg.traditions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Traditions:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.traditions.map((tradition) => (
                        <Badge key={tradition} variant="outline" className="text-xs">
                          {tradition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Includes:</p>
                    <ul className="text-sm space-y-1">
                      {(pkg.features as string[]).slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {(pkg.features as string[]).length > 4 && (
                        <li className="text-muted-foreground text-xs">
                          +{(pkg.features as string[]).length - 4} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Edit Package" : "Create Service Package"}</DialogTitle>
            <DialogDescription>
              Define a bundled service offering for couples
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="package-name">Package Name *</Label>
                <Input
                  id="package-name"
                  placeholder="e.g., Premium Photography Package"
                  value={packageFormData.name || ""}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={packageFormErrors.name ? "border-destructive" : ""}
                  data-testid="input-package-name"
                />
                {packageFormErrors.name && (
                  <p className="text-sm text-destructive mt-1">{packageFormErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="package-price">Price (USD) *</Label>
                <Input
                  id="package-price"
                  type="number"
                  placeholder="0.00"
                  value={packageFormData.price || ""}
                  onChange={(e) => setPackageFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={packageFormErrors.price ? "border-destructive" : ""}
                  data-testid="input-package-price"
                />
                {packageFormErrors.price && (
                  <p className="text-sm text-destructive mt-1">{packageFormErrors.price}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="package-description">Description</Label>
              <Textarea
                id="package-description"
                placeholder="Describe what's included in this package..."
                value={packageFormData.description || ""}
                onChange={(e) => setPackageFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                data-testid="input-package-description"
              />
            </div>

            <div>
              <Label className="mb-2 block">Wedding Traditions *</Label>
              <div className="flex flex-wrap gap-2">
                {traditionsLoading ? (
                  <span className="text-sm text-muted-foreground">Loading traditions...</span>
                ) : traditions.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No traditions available</span>
                ) : (
                  traditions.map((tradition) => (
                    <Badge
                      key={tradition.id}
                      variant={packageFormData.traditions?.includes(tradition.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTradition(tradition.id)}
                      data-testid={`badge-tradition-${tradition.id}`}
                    >
                      {tradition.displayName}
                    </Badge>
                  ))
                )}
              </div>
              {packageFormErrors.traditions && (
                <p className="text-sm text-destructive mt-1">{packageFormErrors.traditions}</p>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Service Categories *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {VENDOR_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={packageFormData.categories?.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                      data-testid={`checkbox-category-${category}`}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                      {category.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
              {packageFormErrors.categories && (
                <p className="text-sm text-destructive mt-1">{packageFormErrors.categories}</p>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Package Features</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a feature (e.g., 8 hours of coverage)"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  data-testid="input-new-feature"
                />
                <Button type="button" variant="outline" onClick={addFeature} data-testid="button-add-feature">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {packageFormData.features && packageFormData.features.length > 0 && (
                <div className="space-y-2">
                  {packageFormData.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFeature(idx)}
                        data-testid={`button-remove-feature-${idx}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="package-active">Active</Label>
                <p className="text-sm text-muted-foreground">Make this package visible to couples</p>
              </div>
              <Switch
                id="package-active"
                checked={packageFormData.isActive}
                onCheckedChange={(checked) => setPackageFormData(prev => ({ ...prev, isActive: checked }))}
                data-testid="switch-package-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePackage}
              disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
              data-testid="button-save-package"
            >
              {editingPackage ? "Update Package" : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
