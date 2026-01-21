import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENDOR_CATEGORIES } from "@shared/schema";
import type { MetroArea } from "@shared/schema";
import { ChevronLeft, ChevronRight, Upload, X, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTraditions } from "@/hooks/use-traditions";
import { useQuery } from "@tanstack/react-query";

export interface VendorSetupData {
  name: string;
  categories: string[];
  preferredWeddingTraditions: string[];
  areasServed: string[];
  location: string;
  email: string;
  phone: string;
  priceRange: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

interface VendorSetupWizardProps {
  initialData?: Partial<VendorSetupData>;
  onComplete: (data: VendorSetupData) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: "Business Info", label: "Name & Services" },
  { id: 2, title: "Services", label: "Service Categories" },
  { id: 3, title: "Traditions", label: "Wedding Types" },
  { id: 4, title: "Areas Served", label: "Service Areas" },
  { id: 5, title: "Location", label: "Address" },
  { id: 6, title: "Contact", label: "Email & Phone" },
  { id: 7, title: "Pricing", label: "Price Range" },
  { id: 8, title: "Branding", label: "Logo & Cover Image" },
  { id: 9, title: "Details", label: "Description" },
];

export function VendorSetupWizard({ initialData, onComplete, onCancel }: VendorSetupWizardProps) {
  const { toast } = useToast();
  const { data: traditions = [], isLoading: traditionsLoading } = useTraditions();
  const [currentStep, setCurrentStep] = useState(1);
  const fallbackMetroAreas: MetroArea[] = [
    { id: 1, value: "bay-area", label: "San Francisco Bay Area" },
    { id: 2, value: "nyc", label: "New York City" },
    { id: 3, value: "la", label: "Los Angeles" },
    { id: 4, value: "chicago", label: "Chicago" },
    { id: 5, value: "seattle", label: "Seattle" },
  ];
  const { data: fetchedMetroAreas = [], isLoading: metroAreasLoading } = useQuery<MetroArea[]>({
    queryKey: ["/api/metro-areas"],
  });
  const metroAreas = fetchedMetroAreas.length > 0 ? fetchedMetroAreas : fallbackMetroAreas;

  const [formData, setFormData] = useState<VendorSetupData>({
    name: initialData?.name || "",
    categories: initialData?.categories || [],
    preferredWeddingTraditions: initialData?.preferredWeddingTraditions || [],
    areasServed: initialData?.areasServed || [],
    location: initialData?.location || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    priceRange: initialData?.priceRange || "$",
    description: initialData?.description || "",
    logoUrl: initialData?.logoUrl || "",
    coverImageUrl: initialData?.coverImageUrl || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverCover, setDragOverCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setDragOverLogo(true);
    else setDragOverCover(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setDragOverLogo(false);
    else setDragOverCover(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'cover') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setDragOverLogo(false);
    else setDragOverCover(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file, type);
      } else {
        toast({
          title: "Invalid File",
          description: "Please drop an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Business name is required";
        break;
      case 2:
        if (formData.categories.length === 0) {
          newErrors.categories = "Select at least one service category";
        }
        break;
      case 4:
        if (formData.areasServed.length === 0) {
          newErrors.areasServed = "Select at least one service area";
        }
        break;
      case 5:
        if (!formData.location.trim()) newErrors.location = "Address is required";
        break;
      case 6:
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (formData.email && !formData.email.includes("@")) newErrors.email = "Valid email required";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(formData);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
    setUploading(true);

    try {
      // Get upload URL and object path from object storage
      const urlResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL, objectPath } = await urlResponse.json();

      // Upload file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Use the objectPath returned by the API (e.g., /objects/uploads/{uuid})
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logoUrl: objectPath }));
      } else {
        setFormData(prev => ({ ...prev, coverImageUrl: objectPath }));
      }

      toast({
        title: "Image Uploaded",
        description: `Your ${type === 'logo' ? 'logo' : 'cover image'} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const isLastStep = currentStep === STEPS.length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your business name"
                data-testid="input-wizard-name"
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select all service categories that apply to your business</p>
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2">
              {VENDOR_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={formData.categories.includes(cat)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, categories: [...formData.categories, cat] });
                      } else {
                        setFormData({
                          ...formData,
                          categories: formData.categories.filter((c) => c !== cat),
                        });
                      }
                    }}
                    data-testid={`checkbox-category-${cat}`}
                  />
                  <span className="text-sm">
                    {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
            {errors.categories && <p className="text-sm text-destructive">{errors.categories}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select wedding traditions you specialize in (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              {traditionsLoading ? (
                <p className="text-sm text-muted-foreground col-span-2">Loading traditions...</p>
              ) : traditions.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">No traditions available</p>
              ) : (
                traditions.map((tradition) => (
                  <label
                    key={tradition.id}
                    className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={formData.preferredWeddingTraditions.includes(tradition.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            preferredWeddingTraditions: [...formData.preferredWeddingTraditions, tradition.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            preferredWeddingTraditions: formData.preferredWeddingTraditions.filter(
                              (t) => t !== tradition.id
                            ),
                          });
                        }
                      }}
                      data-testid={`checkbox-tradition-${tradition.id}`}
                    />
                    <span className="text-sm">{tradition.displayName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select all metro areas where you provide services</p>
            {metroAreasLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-2">
              {metroAreas.map((area) => (
                <label
                  key={area.id}
                  className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer transition-all hover-elevate ${
                    formData.areasServed.includes(area.value)
                      ? "border-primary bg-primary/10"
                      : ""
                  }`}
                  data-testid={`area-${area.value}`}
                >
                  <Checkbox
                    checked={formData.areasServed.includes(area.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          areasServed: [...formData.areasServed, area.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          areasServed: formData.areasServed.filter((a) => a !== area.value),
                        });
                      }
                    }}
                  />
                  <span className="text-sm">{area.label}</span>
                </label>
              ))}
            </div>
            )}
            {errors.areasServed && <p className="text-sm text-destructive">{errors.areasServed}</p>}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Business Address</Label>
              <AddressAutocomplete
                value={formData.location}
                onChange={(value) => setFormData({ ...formData, location: value })}
                placeholder="Enter your business address"
                data-testid="input-wizard-location"
              />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@yourbusiness.com"
                data-testid="input-wizard-email"
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Business Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                data-testid="input-wizard-phone"
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="priceRange">Price Range</Label>
              <Select
                value={formData.priceRange}
                onValueChange={(value) => setFormData({ ...formData, priceRange: value })}
              >
                <SelectTrigger data-testid="select-wizard-price">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - Budget Friendly</SelectItem>
                  <SelectItem value="$$">$$ - Moderate</SelectItem>
                  <SelectItem value="$$$">$$$ - Premium</SelectItem>
                  <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Business Logo</Label>
              <p className="text-sm text-muted-foreground mb-3">Upload your business logo (recommended: square, at least 200x200px)</p>
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'logo');
                }}
              />
              
              {formData.logoUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo preview" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => handleDragOver(e, 'logo')}
                  onDragLeave={(e) => handleDragLeave(e, 'logo')}
                  onDrop={(e) => handleDrop(e, 'logo')}
                  onClick={() => logoInputRef.current?.click()}
                  className={`w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    dragOverLogo 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                  } ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}
                  data-testid="dropzone-logo"
                >
                  <Upload className={`w-6 h-6 mb-2 ${dragOverLogo ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    {uploadingLogo ? "Uploading..." : "Drop or click"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Cover Image</Label>
              <p className="text-sm text-muted-foreground mb-3">Upload a background image for your profile (recommended: 1200x400px)</p>
              
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'cover');
                }}
              />
              
              {formData.coverImageUrl ? (
                <div className="relative">
                  <img 
                    src={formData.coverImageUrl} 
                    alt="Cover preview" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: "" }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => handleDragOver(e, 'cover')}
                  onDragLeave={(e) => handleDragLeave(e, 'cover')}
                  onDrop={(e) => handleDrop(e, 'cover')}
                  onClick={() => coverInputRef.current?.click()}
                  className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    dragOverCover 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                  } ${uploadingCover ? "opacity-50 pointer-events-none" : ""}`}
                  data-testid="dropzone-cover"
                >
                  <Image className={`w-6 h-6 mb-2 ${dragOverCover ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    {uploadingCover ? "Uploading..." : "Drop or click to upload cover image"}
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">Images are optional - you can add them later from your profile settings.</p>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell couples about your business, experience, and specialties"
                rows={4}
                data-testid="textarea-wizard-description"
              />
              <p className="text-xs text-muted-foreground mt-1">Optional but recommended</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Steps - Fixed at top */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-xs text-muted-foreground">{STEPS[currentStep - 1]?.label}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 h-2 rounded-full transition-colors cursor-pointer ${
                step.id === currentStep
                  ? "bg-primary"
                  : step.id < currentStep
                    ? "bg-primary/50 hover:bg-primary/70"
                    : "bg-muted hover:bg-muted-foreground/30"
              }`}
              title={step.label}
              data-testid={`progress-step-${step.id}`}
            />
          ))}
        </div>
        <div className="flex gap-1 flex-wrap mt-2">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${
                step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
              }`}
              data-testid={`step-label-${step.id}`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content - Fixed height to keep buttons in same place */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1]?.label}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[320px]">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation - Fixed at bottom */}
      <div className="flex gap-3 justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          data-testid="button-wizard-cancel"
        >
          Cancel
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            data-testid="button-wizard-prev"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            data-testid={`button-wizard-${isLastStep ? "complete" : "next"}`}
          >
            {isLastStep ? (
              <>
                Complete Setup
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
