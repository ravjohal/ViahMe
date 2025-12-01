import { useState } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VendorSetupData {
  name: string;
  categories: string[];
  preferredWeddingTraditions: string[];
  location: string;
  email: string;
  phone: string;
  priceRange: string;
  description: string;
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
  { id: 4, title: "Location", label: "Address" },
  { id: 5, title: "Contact", label: "Email & Phone" },
  { id: 6, title: "Pricing", label: "Price Range" },
  { id: 7, title: "Details", label: "Description" },
];

export function VendorSetupWizard({ initialData, onComplete, onCancel }: VendorSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VendorSetupData>({
    name: initialData?.name || "",
    categories: initialData?.categories || [],
    preferredWeddingTraditions: initialData?.preferredWeddingTraditions || [],
    location: initialData?.location || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    priceRange: initialData?.priceRange || "$",
    description: initialData?.description || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        if (!formData.location.trim()) newErrors.location = "Address is required";
        break;
      case 5:
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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select all services you provide</p>
            <div className="grid grid-cols-2 gap-3">
              {VENDOR_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <Checkbox
                    id={`wizard-category-${category}`}
                    checked={formData.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          categories: [...formData.categories, category],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          categories: formData.categories.filter((c) => c !== category),
                        });
                      }
                    }}
                    data-testid={`checkbox-wizard-category-${category}`}
                  />
                  <Label htmlFor={`wizard-category-${category}`} className="font-normal cursor-pointer text-sm">
                    {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
            {errors.categories && <p className="text-sm text-destructive">{errors.categories}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Which wedding types do you specialize in?</p>
            <div className="grid grid-cols-2 gap-3">
              {(["sikh", "hindu", "muslim", "gujarati", "south_indian", "mixed", "general"] as const).map(
                (tradition) => (
                  <div key={tradition} className="flex items-center gap-2">
                    <Checkbox
                      id={`wizard-tradition-${tradition}`}
                      checked={formData.preferredWeddingTraditions.includes(tradition)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            preferredWeddingTraditions: [
                              ...formData.preferredWeddingTraditions,
                              tradition,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            preferredWeddingTraditions: formData.preferredWeddingTraditions.filter(
                              (t) => t !== tradition
                            ),
                          });
                        }
                      }}
                      data-testid={`checkbox-wizard-tradition-${tradition}`}
                    />
                    <Label
                      htmlFor={`wizard-tradition-${tradition}`}
                      className="font-normal cursor-pointer text-sm"
                    >
                      {tradition === "south_indian"
                        ? "South Indian"
                        : tradition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                  </div>
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Leave blank to work with all traditions</p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Business Address</Label>
              <AddressAutocomplete
                value={formData.location}
                onChange={(address) => setFormData({ ...formData, location: address })}
                placeholder="Enter your business address"
                testid="input-wizard-location"
              />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="business@example.com"
                data-testid="input-wizard-email"
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
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

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="priceRange">Price Range</Label>
              <Select value={formData.priceRange} onValueChange={(value) => setFormData({ ...formData, priceRange: value })}>
                <SelectTrigger id="priceRange" data-testid="select-wizard-price-range">
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

      case 7:
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
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-xs text-muted-foreground">{STEPS[currentStep - 1]?.label}</span>
        </div>
        <div className="flex gap-2">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step.id === currentStep
                  ? "bg-primary"
                  : step.id < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
              data-testid={`progress-step-${step.id}`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1]?.label}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
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
