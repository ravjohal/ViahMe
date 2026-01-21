import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronRight, ChevronLeft, Briefcase, MapPin, DollarSign, FileText, Phone, Check } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";
import type { Vendor, MetroArea } from "@shared/schema";

const VENDOR_CATEGORIES = [
  { value: "makeup_artist", label: "Makeup Artist" },
  { value: "dj", label: "DJ" },
  { value: "dhol_player", label: "Dhol Player" },
  { value: "turban_tier", label: "Turban Tier" },
  { value: "mehndi_artist", label: "Mehndi Artist" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "caterer", label: "Caterer" },
  { value: "banquet_hall", label: "Banquet Hall" },
  { value: "gurdwara", label: "Gurdwara" },
  { value: "temple", label: "Temple" },
  { value: "decorator", label: "Decorator" },
  { value: "florist", label: "Florist" },
  { value: "horse_rental", label: "Horse Rental" },
  { value: "sword_rental", label: "Sword Rental" },
  { value: "tent_service", label: "Tent Service" },
  { value: "limo_service", label: "Limo Service" },
  { value: "mobile_food", label: "Mobile Food Vendor" },
  { value: "baraat_band", label: "Baraat Band" },
  { value: "pandit", label: "Pandit (Hindu Priest)" },
  { value: "mandap_decorator", label: "Mandap Decorator" },
  { value: "haldi_supplies", label: "Haldi Supplies" },
  { value: "pooja_items", label: "Pooja Items" },
  { value: "astrologer", label: "Vedic Astrologer" },
  { value: "garland_maker", label: "Garland Maker" },
  { value: "wedding_planner", label: "Wedding Planner" },
  { value: "invitation_designer", label: "Invitation Designer" },
  { value: "jeweler", label: "Jeweler" },
  { value: "clothing_boutique", label: "Clothing Boutique" },
  { value: "entertainment", label: "Entertainment" },
  { value: "travel_agent", label: "Travel Agent" },
  { value: "other", label: "Other" },
];

const CULTURAL_SPECIALTIES = [
  "Sikh",
  "Hindu",
  "Muslim",
  "Gujarati",
  "South Indian",
  "Punjabi",
  "Bengali",
  "Maharashtrian",
  "Rajasthani",
  "Mixed/Fusion",
  "General",
];

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

const STEPS = [
  { id: 1, title: "Services", icon: Briefcase },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Pricing", icon: DollarSign },
  { id: 4, title: "About", icon: FileText },
  { id: 5, title: "Contact", icon: Phone },
];

export default function VendorOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [categories, setCategories] = useState<string[]>([]);
  const [areasServed, setAreasServed] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");
  const [culturalSpecialties, setCulturalSpecialties] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");

  // Fetch current vendor profile
  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
  });

  // Fetch metro areas
  const { data: metroAreas = [] } = useQuery<MetroArea[]>({
    queryKey: ["/api/metro-areas"],
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (vendor) {
      if (vendor.categories?.length) setCategories(vendor.categories);
      if (vendor.areasServed?.length) setAreasServed(vendor.areasServed);
      if (vendor.priceRange) setPriceRange(vendor.priceRange);
      if (vendor.culturalSpecialties?.length) setCulturalSpecialties(vendor.culturalSpecialties);
      if (vendor.description) setDescription(vendor.description);
      if (vendor.phone) setPhone(vendor.phone);
      if (vendor.website) setWebsite(vendor.website);
      if (vendor.instagram) setInstagram(vendor.instagram);
    }
  }, [vendor]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      if (!vendor) throw new Error("Vendor not found");
      const response = await apiRequest("PATCH", `/api/vendors/${vendor.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error.message,
      });
    },
  });

  const handleNext = async () => {
    // Save current step data
    let updateData: Partial<Vendor> = {};
    
    switch (currentStep) {
      case 1:
        if (categories.length === 0) {
          toast({ variant: "destructive", title: "Please select at least one service category" });
          return;
        }
        updateData = { categories };
        break;
      case 2:
        if (areasServed.length === 0) {
          toast({ variant: "destructive", title: "Please select at least one area you serve" });
          return;
        }
        updateData = { areasServed, city: areasServed[0] };
        break;
      case 3:
        if (!priceRange) {
          toast({ variant: "destructive", title: "Please select your price range" });
          return;
        }
        updateData = { priceRange, culturalSpecialties };
        break;
      case 4:
        updateData = { description };
        break;
      case 5:
        updateData = { 
          phone: phone || null, 
          website: website || null, 
          instagram: instagram || null 
        };
        break;
    }

    try {
      await updateMutation.mutateAsync(updateData as Partial<Vendor>);
      
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding
        toast({
          title: "Profile complete!",
          description: "Your vendor profile is ready. You can now manage your business on Viah.me",
        });
        setLocation("/vendor-dashboard");
      }
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAreaToggle = (area: string) => {
    setAreasServed(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setCulturalSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Vendor Profile Not Found</CardTitle>
            <CardDescription>Please register as a vendor first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/vendor-register")} className="w-full">
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src={logoUrl} alt="Viah.me" className="h-16 mx-auto object-contain" />
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? "text-primary" : isCompleted ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-600 text-white dark:bg-green-500"
                        : "bg-muted"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-purple-100">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentStep === 1 && "What services do you offer?"}
              {currentStep === 2 && "Where do you provide services?"}
              {currentStep === 3 && "Pricing & Specialties"}
              {currentStep === 4 && "Tell us about your business"}
              {currentStep === 5 && "Contact Information"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Select all the services you provide for South Asian weddings"}
              {currentStep === 2 && "Select all the metro areas where you offer your services"}
              {currentStep === 3 && "Help couples understand your pricing and cultural expertise"}
              {currentStep === 4 && "Write a description that showcases your unique offerings"}
              {currentStep === 5 && "How can couples reach you? (Optional - you can add later)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Categories */}
            {currentStep === 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VENDOR_CATEGORIES.map((cat) => (
                  <div
                    key={cat.value}
                    onClick={() => handleCategoryToggle(cat.value)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      categories.includes(cat.value)
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    }`}
                    data-testid={`category-${cat.value}`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={categories.includes(cat.value)} />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Areas Served */}
            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {metroAreas.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => handleAreaToggle(area.value)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      areasServed.includes(area.value)
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    }`}
                    data-testid={`area-${area.value}`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={areasServed.includes(area.value)} />
                      <span className="text-sm font-medium">{area.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Pricing & Specialties */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Price Range</Label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger data-testid="select-price-range">
                      <SelectValue placeholder="Select your price range" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Cultural Specialties (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the traditions you specialize in
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CULTURAL_SPECIALTIES.map((specialty) => (
                      <div
                        key={specialty}
                        onClick={() => handleSpecialtyToggle(specialty)}
                        className={`px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm ${
                          culturalSpecialties.includes(specialty)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted hover:border-primary/50"
                        }`}
                        data-testid={`specialty-${specialty}`}
                      >
                        {specialty}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Description */}
            {currentStep === 4 && (
              <div>
                <Label htmlFor="description" className="text-base font-semibold mb-3 block">
                  Business Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell couples about your business, experience, and what makes you unique..."
                  className="min-h-[200px] resize-none"
                  data-testid="textarea-description"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Mention your experience, unique offerings, and why couples should choose you
                </p>
              </div>
            )}

            {/* Step 5: Contact */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    data-testid="input-website"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram Handle</Label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourbusiness"
                    data-testid="input-instagram"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || updateMutation.isPending}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={updateMutation.isPending}
                className="bg-primary"
                data-testid="button-next"
              >
                {updateMutation.isPending ? (
                  "Saving..."
                ) : currentStep === 5 ? (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/vendor-dashboard")}
            className="text-muted-foreground"
            data-testid="button-skip"
          >
            Skip for now - I'll complete this later
          </Button>
        </div>
      </div>
    </div>
  );
}
