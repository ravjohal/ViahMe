import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Users, DollarSign, Crown, Gift, Lightbulb, TrendingUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TRADITION_HIERARCHY, getSubTraditionsForMain, getAllSubTraditions, getMainTraditionByValue } from "@/lib/tradition-hierarchy";
import { useCeremonyTypesByTradition, useRegionalPricing, useAllCeremonyLineItems, calculateCeremonyTotalFromBreakdown, type CeremonyType } from "@/hooks/use-ceremony-types";

const customEventSchema = z.object({
  ceremonyTypeId: z.string().optional(), // UUID from ceremony_types table
  customName: z.string().optional(),
  guestCount: z.string().optional(),
});

const questionnaireSchema = z.object({
  tradition: z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'christian', 'jain', 'parsi', 'mixed', 'other']),
  subTradition: z.string().nullable().optional(),
  subTraditions: z.array(z.string()).nullable().optional(),
  role: z.enum(['bride', 'groom', 'planner']),
  weddingDate: z.string().optional(),
  flexibleDate: z.boolean().optional(),
  location: z.string().min(1, "Location is required"),
  customZipCode: z.string().optional(),
  guestCountEstimate: z.string().optional(),
  ceremonyGuestCount: z.string().optional(),
  receptionGuestCount: z.string().optional(),
  customEvents: z.array(customEventSchema).optional(),
  autoCreateCeremonies: z.boolean().optional(),
  totalBudget: z.string().optional(),
  budgetContribution: z.enum(['couple_only', 'both_families', 'mix']).optional(),
  partnerNewToTraditions: z.boolean().optional(),
  // Budget tracking mode - primary tracking approach
  budgetTrackingMode: z.enum(['category', 'ceremony']).optional(),
  // Legacy budget granularity preferences (kept for compatibility)
  showBudgetOverview: z.boolean().optional(),
  showBucketBudgets: z.boolean().optional(),
  showCeremonyBudgets: z.boolean().optional(),
});

import { Flame, Moon, Sparkles, Flower2, Church, Leaf, Heart, Star, BookOpen, Palette, Plus, Trash2 } from "lucide-react";

// Visual tradition cards with descriptions and vibes
const TRADITION_CARDS = [
  { 
    value: "sikh", 
    label: "Sikh", 
    description: "Anand Karaj at the Gurdwara",
    vibe: "Sacred ceremony around the Guru Granth Sahib with Lavaan",
    color: "from-orange-400 to-amber-500",
    Icon: BookOpen,
  },
  { 
    value: "hindu", 
    label: "Hindu", 
    description: "Vedic rituals with fire ceremony",
    vibe: "Saat Pheras around the sacred fire with mantras",
    color: "from-red-400 to-pink-500",
    Icon: Flame,
  },
  { 
    value: "muslim", 
    label: "Muslim", 
    description: "Nikah ceremony with Mahr",
    vibe: "Islamic traditions with Mehndi, Nikah, and Walima",
    color: "from-emerald-400 to-teal-500",
    Icon: Moon,
  },
  { 
    value: "gujarati", 
    label: "Gujarati", 
    description: "Garba, Pithi, and colorful celebrations",
    vibe: "Vibrant pre-wedding festivities with Dandiya nights",
    color: "from-yellow-400 to-orange-500",
    Icon: Palette,
  },
  { 
    value: "south_indian", 
    label: "South Indian", 
    description: "Muhurtham and temple traditions",
    vibe: "Kanjeevaram silk, Thali ceremony, and morning rituals",
    color: "from-purple-400 to-indigo-500",
    Icon: Flower2,
  },
  { 
    value: "christian", 
    label: "Christian", 
    description: "Church ceremony with Indian flair",
    vibe: "Western traditions blended with South Asian culture",
    color: "from-blue-400 to-cyan-500",
    Icon: Church,
  },
  { 
    value: "jain", 
    label: "Jain", 
    description: "Spiritual ceremonies with simplicity",
    vibe: "Traditional rituals emphasizing non-violence and purity",
    color: "from-lime-400 to-green-500",
    Icon: Leaf,
  },
  { 
    value: "parsi", 
    label: "Parsi", 
    description: "Zoroastrian wedding traditions",
    vibe: "Lagan ceremony with fire temple blessings",
    color: "from-amber-400 to-yellow-500",
    Icon: Sparkles,
  },
  { 
    value: "mixed", 
    label: "Mixed / Fusion", 
    description: "Blending two beautiful traditions",
    vibe: "Honoring both families with combined ceremonies",
    color: "from-pink-400 to-purple-500",
    Icon: Heart,
  },
  { 
    value: "other", 
    label: "Other", 
    description: "Unique celebration",
    vibe: "Create your own tradition",
    color: "from-gray-400 to-slate-500",
    Icon: Star,
  },
];

type QuestionnaireData = z.infer<typeof questionnaireSchema>;

interface OnboardingQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void;
}

const METRO_AREAS = [
  { value: "San Francisco Bay Area", label: "San Francisco Bay Area", desiPop: "High" },
  { value: "New York City", label: "New York City Metro", desiPop: "High" },
  { value: "Los Angeles", label: "Los Angeles Metro", desiPop: "High" },
  { value: "Chicago", label: "Chicago Metro", desiPop: "High" },
  { value: "Houston", label: "Houston Metro", desiPop: "High" },
  { value: "Dallas-Fort Worth", label: "Dallas-Fort Worth Metro", desiPop: "High" },
  { value: "Washington DC", label: "Washington DC Metro", desiPop: "High" },
  { value: "Seattle", label: "Seattle Metro", desiPop: "Medium" },
  { value: "Atlanta", label: "Atlanta Metro", desiPop: "Medium" },
  { value: "Philadelphia", label: "Philadelphia Metro", desiPop: "Medium" },
  { value: "Boston", label: "Boston Metro", desiPop: "Medium" },
  { value: "Detroit", label: "Detroit Metro", desiPop: "Medium" },
  { value: "Toronto", label: "Toronto (Canada)", desiPop: "High" },
  { value: "Vancouver", label: "Vancouver (Canada)", desiPop: "High" },
  { value: "Fresno", label: "Fresno / Central Valley", desiPop: "Medium" },
  { value: "Other", label: "Other (Enter ZIP Code)", desiPop: null },
];

const STEPS = [
  {
    id: 1,
    title: "Your Wedding Tradition",
    description: "What cultural celebrations will you honor?",
    icon: Gift,
    color: "from-orange-500 to-pink-500",
    bgColor: "bg-gradient-to-br from-orange-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-orange-500 to-pink-500",
  },
  {
    id: 2,
    title: "Your Role",
    description: "How are you involved in this celebration?",
    icon: Crown,
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-500",
  },
  {
    id: 3,
    title: "Wedding Details",
    description: "Tell us about your special day",
    icon: Calendar,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-gradient-to-br from-purple-50 to-indigo-50",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-500",
  },
  {
    id: 4,
    title: "Location & Scale",
    description: "Where and how big?",
    icon: MapPin,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    id: 5,
    title: "Budget Planning",
    description: "Financial considerations",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
  },
];

export function OnboardingQuestionnaire({ onComplete }: OnboardingQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      tradition: "sikh",
      subTradition: null,
      subTraditions: [],
      role: "bride",
      weddingDate: "2025-06-15",
      flexibleDate: false,
      location: "San Francisco Bay Area",
      customZipCode: "",
      guestCountEstimate: "300",
      ceremonyGuestCount: "",
      receptionGuestCount: "",
      customEvents: [],
      autoCreateCeremonies: true,
      totalBudget: "",
      budgetContribution: "both_families",
      partnerNewToTraditions: false,
      // Budget tracking mode - default to ceremony for detailed tracking
      budgetTrackingMode: "ceremony",
      // Budget granularity - default all to true for complete tracking
      showBudgetOverview: true,
      showBucketBudgets: true,
      showCeremonyBudgets: true,
    },
  });

  const selectedLocation = form.watch("location");
  const isFlexibleDate = form.watch("flexibleDate");

  const selectedMainTradition = form.watch("tradition");
  const selectedSubTraditions = form.watch("subTraditions") || [];

  const availableSubTraditions = useMemo(() => {
    if (selectedMainTradition === "mixed") {
      return getAllSubTraditions();
    }
    return getSubTraditionsForMain(selectedMainTradition);
  }, [selectedMainTradition]);

  const handleMainTraditionChange = (value: string) => {
    form.setValue("tradition", value as any);
    form.setValue("subTradition", null);
    form.setValue("subTraditions", []);
    // Reset ceremonies when tradition changes - will be populated from ceremonyTypes once loaded
    form.setValue("customEvents", []);
  };

  const handleSubTraditionMultiSelect = (subValue: string, checked: boolean) => {
    const current = form.getValues("subTraditions") || [];
    if (checked) {
      form.setValue("subTraditions", [...current, subValue]);
    } else {
      form.setValue("subTraditions", current.filter((v) => v !== subValue));
    }
  };

  // Custom event management helpers
  const customEvents = form.watch("customEvents") || [];
  const autoCreateCeremonies = form.watch("autoCreateCeremonies") ?? true;

  // Fetch ceremony types from database - the single source of truth (UUID-keyed)
  const { data: ceremonyTypes } = useCeremonyTypesByTradition(selectedMainTradition);
  const { data: regionalPricingData } = useRegionalPricing();
  const { data: lineItemsMap = {} } = useAllCeremonyLineItems();
  
  // Available ceremonies for the selected tradition - deduplicated by normalized name
  // This handles database duplicates like "Chunni Chadana" appearing twice or "Maiyan" vs "Mayian"
  const availableCeremonies = useMemo(() => {
    if (!ceremonyTypes) return [];
    
    // Normalize name for comparison (lowercase, remove spaces/special chars)
    const normalizeName = (name: string) => name.toLowerCase().replace(/[\s\/\-]/g, '');
    
    // Deduplicate by normalized name, keeping the one with better displayOrder or more complete data
    const seenNames = new Map<string, CeremonyType>();
    for (const ct of ceremonyTypes) {
      const normalized = normalizeName(ct.name);
      const existing = seenNames.get(normalized);
      if (!existing) {
        seenNames.set(normalized, ct);
      } else {
        // Keep the one with higher displayOrder (more specific) or better data
        // Higher displayOrder usually means more complete ceremony data
        if (ct.displayOrder > existing.displayOrder) {
          seenNames.set(normalized, ct);
        }
      }
    }
    
    return Array.from(seenNames.values());
  }, [ceremonyTypes]);
  
  // Build UUID lookup map for quick ceremony type access
  const ceremonyTypeById = useMemo(() => {
    const map: Record<string, CeremonyType> = {};
    if (ceremonyTypes) {
      for (const ct of ceremonyTypes) {
        map[ct.id] = ct;
      }
    }
    return map;
  }, [ceremonyTypes]);
  
  // Populate default ceremonies when ceremonyTypes loads or autoCreateCeremonies is enabled
  // Pre-populate only ceremonies marked as isDefaultPrepopulated, sorted by displayOrder
  useEffect(() => {
    if (autoCreateCeremonies && availableCeremonies && availableCeremonies.length > 0) {
      const currentEvents = form.getValues("customEvents") || [];
      if (currentEvents.length === 0) {
        // Filter to only ceremonies marked as default prepopulated, sorted by displayOrder
        const prepopulatedCeremonies = [...availableCeremonies]
          .filter(ct => ct.isDefaultPrepopulated)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        
        // If no ceremonies are marked as prepopulated, fall back to all ceremonies
        const ceremoniesToUse = prepopulatedCeremonies.length > 0 
          ? prepopulatedCeremonies 
          : [...availableCeremonies].sort((a, b) => a.displayOrder - b.displayOrder);
        
        const defaultEvents = ceremoniesToUse.map(ct => ({
          ceremonyTypeId: ct.id,
          customName: "",
          guestCount: "",
        }));
        form.setValue("customEvents", defaultEvents);
      }
    }
  }, [autoCreateCeremonies, availableCeremonies]);
  
  // Get regional multiplier based on selected location
  const regionalMultiplier = useMemo((): number => {
    if (!regionalPricingData) return 1.0;
    const locationToCity: Record<string, string> = {
      "San Francisco Bay Area": "bay_area",
      "New York City": "nyc",
      "Los Angeles": "la",
      "Chicago": "chicago",
      "Seattle": "seattle",
    };
    const cityKey = locationToCity[selectedLocation];
    // Default to 1.0 (no multiplier) for locations not in our pricing database
    if (!cityKey) return 1.0;
    const pricing = regionalPricingData.find(p => p.city === cityKey);
    // Ensure multiplier is a number (may be string from database)
    return pricing?.multiplier ? Number(pricing.multiplier) : 1.0;
  }, [regionalPricingData, selectedLocation]);
  
  // Get user's role (bride or groom) for messaging
  const userRole = form.watch("role");

  const handleAddEvent = () => {
    const current = form.getValues("customEvents") || [];
    // Find an unselected ceremony from the available ceremonies to suggest
    const selectedIds = new Set(current.map(e => e.ceremonyTypeId));
    const unselected = availableCeremonies.find(c => !selectedIds.has(c.id));
    const defaultCeremonyTypeId = unselected?.id || "";
    form.setValue("customEvents", [...current, { ceremonyTypeId: defaultCeremonyTypeId, customName: "", guestCount: "" }]);
  };

  const handleRemoveEvent = (index: number) => {
    const current = form.getValues("customEvents") || [];
    if (current.length > 1) {
      form.setValue("customEvents", current.filter((_, i) => i !== index));
    }
  };

  const handleEventChange = (index: number, field: "ceremonyTypeId" | "customName" | "guestCount", value: string) => {
    const current = form.getValues("customEvents") || [];
    const updated = current.map((event, i) => {
      if (i === index) {
        if (field === "ceremonyTypeId") {
          // If selecting a ceremony from dropdown, clear customName. If selecting "custom", keep customName.
          return { ...event, ceremonyTypeId: value, customName: value === "custom" ? event.customName : "" };
        }
        return { ...event, [field]: value };
      }
      return event;
    });
    form.setValue("customEvents", updated);
  };

  const onSubmit = (data: QuestionnaireData) => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Normalize tradition data based on main tradition type
      let normalizedSubTradition: string | null = null;
      let normalizedSubTraditions: string[] | null = null;
      
      if (data.tradition === "mixed") {
        // Mixed traditions: use subTraditions array, clear subTradition
        normalizedSubTradition = null;
        normalizedSubTraditions = data.subTraditions && data.subTraditions.length > 0 
          ? data.subTraditions 
          : null;
      } else if (data.tradition !== "other") {
        // Non-mixed, non-other traditions: use single subTradition, clear subTraditions
        normalizedSubTradition = data.subTradition || null;
        normalizedSubTraditions = null;
      }
      // "other" tradition has neither subTradition nor subTraditions
      
      // Transform data before passing to onComplete
      const transformedData = {
        ...data,
        subTradition: normalizedSubTradition,
        subTraditions: normalizedSubTraditions,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
        guestCountEstimate: data.guestCountEstimate && data.guestCountEstimate !== "" 
          ? Number(data.guestCountEstimate) 
          : undefined,
        ceremonyGuestCount: data.ceremonyGuestCount && data.ceremonyGuestCount !== "" 
          ? Number(data.ceremonyGuestCount) 
          : undefined,
        receptionGuestCount: data.receptionGuestCount && data.receptionGuestCount !== "" 
          ? Number(data.receptionGuestCount) 
          : undefined,
        totalBudget: data.totalBudget && data.totalBudget !== "" 
          ? data.totalBudget 
          : null,
      };
      onComplete(transformedData as any);
    }
  };

  const handleNext = async () => {
    // Validate only the current step's fields
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = !!form.getValues('tradition');
        break;
      case 2:
        isValid = !!form.getValues('role');
        break;
      case 3:
        isValid = !!form.getValues('weddingDate');
        break;
      case 4:
        isValid = !!form.getValues('location');
        break;
      case 5:
        isValid = true; // Budget is optional
        break;
      default:
        isValid = false;
    }
    
    if (isValid) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    } else {
      // Trigger validation for current field
      form.trigger();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep - 1];
  const CurrentIcon = currentStepData.icon;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-500 relative"
      style={{
        backgroundImage: `url(${new URL("@assets/generated_images/indian_wedding_couples_illustration.png", import.meta.url).href})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-pink-50/80 to-purple-50/80 backdrop-blur-sm" />
      <Card className="w-full max-w-4xl p-10 md:p-16 shadow-2xl border-4 border-orange-300 relative z-10 bg-white/95 backdrop-blur-md">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img 
                src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
                alt="Viah.me"
                className="h-32 w-auto mb-3 object-contain"
                data-testid="logo-viah"
              />
              <p className="text-2xl font-semibold text-orange-600 tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
                Welcome! Let's plan your perfect celebration
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1.5">
                {STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`h-3 rounded-full transition-all duration-300 shadow-md ${
                      idx + 1 === currentStep
                        ? `w-12 bg-gradient-to-r ${step.color}`
                        : idx + 1 < currentStep
                        ? `w-3 bg-gradient-to-r ${step.color} opacity-70`
                        : `w-3 bg-gradient-to-r ${step.color} opacity-30`
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-base font-semibold text-orange-600" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                <span>Step {currentStep}</span>
                <span>of</span>
                <span>{STEPS.length}</span>
              </div>
            </div>
          </div>
          <div className="relative h-3 w-full bg-orange-100 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out rounded-full shadow-lg"
              style={{ width: `${progress}%` }}
              data-testid="progress-questionnaire"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-2xl ${currentStepData.iconBg} shadow-lg`}>
                  <CurrentIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className={`text-4xl font-bold bg-gradient-to-r ${currentStepData.color} bg-clip-text text-transparent tracking-wide`} style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {currentStepData.title}
                  </h2>
                  <p className="text-muted-foreground text-lg italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {currentStepData.description}
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="tradition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Select Your Wedding Tradition</FormLabel>
                          <p className="text-sm text-muted-foreground mb-4">Click on the tradition that best describes your celebration</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" role="radiogroup" aria-label="Select wedding tradition">
                            {TRADITION_CARDS.map((tradition) => {
                              const TraditionIcon = tradition.Icon;
                              return (
                                <button
                                  type="button"
                                  key={tradition.value}
                                  onClick={() => handleMainTraditionChange(tradition.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleMainTraditionChange(tradition.value);
                                    }
                                  }}
                                  role="radio"
                                  aria-checked={field.value === tradition.value}
                                  className={`relative rounded-xl p-4 transition-all hover-elevate border-2 text-left ${
                                    field.value === tradition.value 
                                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                                      : 'border-transparent bg-muted/30 hover:border-muted-foreground/20'
                                  }`}
                                  data-testid={`card-tradition-${tradition.value}`}
                                >
                                  <div className="text-center space-y-2">
                                    <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${tradition.color} flex items-center justify-center`}>
                                      <TraditionIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm">{tradition.label}</h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{tradition.description}</p>
                                    </div>
                                  </div>
                                  {field.value === tradition.value && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Culture Bridge - Partner new to traditions */}
                    {selectedMainTradition && selectedMainTradition !== "other" && (
                      <FormField
                        control={form.control}
                        name="partnerNewToTraditions"
                        render={({ field }) => (
                          <FormItem className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id="partnerNew"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                                data-testid="checkbox-partner-new"
                              />
                              <div className="space-y-1">
                                <label htmlFor="partnerNew" className="font-semibold text-purple-900 dark:text-purple-100 cursor-pointer">
                                  Is one partner new to these traditions?
                                </label>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                  We'll generate helpful guides and email templates you can share with the other side of the family to explain ceremonies, dress codes, and etiquette.
                                </p>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedMainTradition === "mixed" && availableSubTraditions.length > 0 && (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          Select Traditions to Blend
                        </FormLabel>
                        <p className="text-sm text-muted-foreground mb-3">Choose all the traditions that will be part of your celebration. We'll create a combined timeline that honors both families.</p>
                        
                        {/* Mixed Tradition Guidance */}
                        <div className="p-3 mb-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                          <p className="text-sm text-purple-800">
                            <span className="font-semibold">Planning two ceremonies in one day?</span> We'll help you create a timeline that flows naturally. Many couples do a morning religious ceremony + evening reception, or back-to-back ceremonies with a transition period.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-background">
                          {availableSubTraditions.map((sub) => (
                            <div key={sub.value} className="flex items-center space-x-2 p-2 rounded hover-elevate">
                              <Checkbox
                                id={`sub-${sub.value}`}
                                checked={selectedSubTraditions.includes(sub.value)}
                                onCheckedChange={(checked) => handleSubTraditionMultiSelect(sub.value, !!checked)}
                                data-testid={`checkbox-${sub.value}`}
                              />
                              <label
                                htmlFor={`sub-${sub.value}`}
                                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {sub.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        {selectedSubTraditions.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Selected: {selectedSubTraditions.length} tradition{selectedSubTraditions.length > 1 ? 's' : ''}
                          </p>
                        )}
                        {selectedSubTraditions.length >= 2 && (
                          <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                            <p className="text-sm text-green-800">
                              Great! We'll create a combined checklist that includes tasks from both traditions, with guidance on how to merge ceremonies where appropriate.
                            </p>
                          </div>
                        )}
                      </FormItem>
                    )}

                    {/* Only show sub-tradition selector for Hindu and South Indian where regional variations meaningfully affect ceremonies */}
                    {(selectedMainTradition === "hindu" || selectedMainTradition === "south_indian") && availableSubTraditions.length > 0 && (
                      <FormField
                        control={form.control}
                        name="subTradition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                              Regional Tradition (Optional)
                            </FormLabel>
                            <p className="text-sm text-muted-foreground mb-2">
                              Different regions have unique ceremony variations - this helps us customize your planning
                            </p>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-sub-tradition" className="h-12">
                                  <SelectValue placeholder="Select specific tradition (optional)..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableSubTraditions.map((sub) => (
                                  <SelectItem key={sub.value} value={sub.value} data-testid={`option-sub-${sub.value}`}>
                                    {sub.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedMainTradition === "other" && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          We'll help you create a custom wedding experience. You can add specific cultural elements later in your planning dashboard.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-role" className="h-12">
                                <SelectValue placeholder="Select your role..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bride" data-testid="option-bride">Bride</SelectItem>
                              <SelectItem value="groom" data-testid="option-groom">Groom</SelectItem>
                              <SelectItem value="planner" data-testid="option-planner">Wedding Planner</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Your partner can be invited to collaborate after you set up the wedding.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="weddingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Wedding Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={isFlexibleDate}
                              data-testid="input-wedding-date"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="flexibleDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-flexible-date"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">
                              I'm flexible / looking for off-peak dates
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Looking for the best deal? Off-peak dates (weekdays, November-February) can save 20-40% on venue costs
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <>
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Metro Area</FormLabel>
                          <p className="text-sm text-muted-foreground mb-2">
                            Where will most of your wedding events take place? This helps us show you vendors in your area.
                          </p>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12" data-testid="select-location">
                                <SelectValue placeholder="Select your metro area" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {METRO_AREAS.map((area) => (
                                <SelectItem key={area.value} value={area.value} data-testid={`option-location-${area.value.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {area.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Dynamic Ceremony/Event Creation */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          Your Wedding Events
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          We've pre-populated typical ceremonies for your tradition. Feel free to add, remove, or customize. Guest counts are optional — we'll use typical defaults if left blank.
                        </p>
                        <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            These events are for your side of the family. You can add your partner's events too, or they can add their own after you invite them.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {customEvents.map((event, index) => {
                          const selectedCeremony = availableCeremonies.find(c => c.id === event.ceremonyTypeId);
                          return (
                            <div 
                              key={index} 
                              className="relative rounded-lg border bg-card p-3 pr-12"
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEvent(index)}
                                disabled={customEvents.length <= 1}
                                className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"
                                data-testid={`button-remove-event-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={event.ceremonyTypeId || ""}
                                    onValueChange={(value) => handleEventChange(index, "ceremonyTypeId", value)}
                                  >
                                    <SelectTrigger className="h-9 flex-1" data-testid={`select-ceremony-${index}`}>
                                      <SelectValue placeholder="Select ceremony">
                                        {selectedCeremony ? selectedCeremony.name : (event.ceremonyTypeId === "custom" ? "Custom Event" : "Select ceremony")}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableCeremonies.map((ceremony) => (
                                        <SelectItem 
                                          key={ceremony.id} 
                                          value={ceremony.id}
                                          data-testid={`option-ceremony-${ceremony.id}`}
                                        >
                                          <div className="flex flex-col items-start text-left">
                                            <span>{ceremony.name}</span>
                                            <span className="text-xs text-muted-foreground line-clamp-1">{ceremony.description}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="custom" data-testid="option-ceremony-custom">
                                        <div className="flex flex-col items-start text-left">
                                          <span className="font-medium">Custom Event</span>
                                          <span className="text-xs text-muted-foreground">Add your own</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    placeholder="Guests"
                                    title="Leave blank to use default guest count"
                                    value={event.guestCount || ""}
                                    onChange={(e) => handleEventChange(index, "guestCount", e.target.value)}
                                    data-testid={`input-event-guests-${index}`}
                                    className="h-9 w-20 text-center"
                                  />
                                </div>
                                
                                {selectedCeremony?.description && event.ceremonyTypeId !== "custom" && (
                                  <p className="text-xs text-muted-foreground text-left line-clamp-2 pl-1">
                                    {selectedCeremony.description}
                                  </p>
                                )}
                                
                                {event.ceremonyTypeId === "custom" && (
                                  <Input
                                    type="text"
                                    placeholder="Enter custom event name"
                                    value={event.customName || ""}
                                    onChange={(e) => handleEventChange(index, "customName", e.target.value)}
                                    data-testid={`input-custom-event-name-${index}`}
                                    className="h-9"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddEvent}
                        className="w-full"
                        data-testid="button-add-event"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Event
                      </Button>

                      {/* Auto-create ceremonies checkbox */}
                      <div className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="autoCreateCeremonies"
                            checked={autoCreateCeremonies}
                            onCheckedChange={(checked) => form.setValue("autoCreateCeremonies", !!checked)}
                            className="mt-1"
                            data-testid="checkbox-auto-create-ceremonies"
                          />
                          <div className="space-y-1 flex-1">
                            <label htmlFor="autoCreateCeremonies" className="font-semibold text-purple-900 dark:text-purple-100 cursor-pointer">
                              Auto-create traditional ceremonies
                            </label>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              We'll automatically add typical ceremonies for your tradition (like Sangeet, Mehndi, etc.) while skipping any you've already added above.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedLocation === "Other" && (
                      <FormField
                        control={form.control}
                        name="customZipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                              ZIP Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="e.g., 77001"
                                {...field}
                                maxLength={5}
                                data-testid="input-zip-code"
                                className="h-12"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Enter your ZIP code so we can show you nearby vendors
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                  </>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6">
                    {/* Overall Budget Estimate - Uses ceremony templates from database */}
                    {(() => {
                      // Include all events with a ceremonyTypeId selected (excluding empty/unselected ones)
                      const validEvents = customEvents.filter(e => 
                        e.ceremonyTypeId && e.ceremonyTypeId !== ""
                      );
                      
                      let totalLow = 0;
                      let totalHigh = 0;
                      let ceremonyCount = 0;

                      // Calculate totals from database ceremony types (UUID-only architecture)
                      validEvents.forEach(event => {
                        if (event.ceremonyTypeId && event.ceremonyTypeId !== "custom") {
                          // Look up ceremony type by UUID directly from database
                          const template = ceremonyTypeById[event.ceremonyTypeId];
                          
                          if (template) {
                            // Use database template with regional multiplier
                            const defaultGuests = Number(template.defaultGuests) || 150;
                            const parsedGuests = Number(event.guestCount) || 0;
                            const guestCount = parsedGuests > 0 ? parsedGuests : defaultGuests;
                            
                            // Look up line items directly by UUID
                            const breakdown = lineItemsMap[event.ceremonyTypeId] || [];
                            const costs = calculateCeremonyTotalFromBreakdown(breakdown, guestCount, regionalMultiplier);
                            totalLow += costs.low;
                            totalHigh += costs.high;
                            ceremonyCount++;
                          }
                        } else if (event.ceremonyTypeId === "custom" && event.customName) {
                          // Custom ceremony - use default estimates
                          const parsedGuests = Number(event.guestCount) || 0;
                          const guestCount = parsedGuests > 0 ? parsedGuests : 150;
                          const lowCost = Math.round(50 * guestCount * regionalMultiplier);
                          const highCost = Math.round(100 * guestCount * regionalMultiplier);
                          totalLow += lowCost;
                          totalHigh += highCost;
                          ceremonyCount++;
                        }
                      });

                      // Auto-set budget to minimum total if not already set
                      const currentBudget = form.watch("totalBudget");
                      if (totalLow > 0 && (!currentBudget || currentBudget === "")) {
                        setTimeout(() => {
                          form.setValue("totalBudget", totalLow.toString());
                        }, 0);
                      }

                      // Determine partner term based on user's role (handle planner role with neutral language)
                      const isPlanner = userRole === "planner";
                      const partnerTerm = isPlanner ? "them" : (userRole === "bride" ? "him" : "her");
                      const partnerSide = isPlanner ? "other" : (userRole === "bride" ? "groom" : "bride");

                      return (
                        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Your Estimated Wedding Budget</h4>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                Based on {ceremonyCount} {ceremonyCount === 1 ? "ceremony" : "ceremonies"} in {selectedLocation}
                              </p>
                            </div>
                          </div>
                          
                          {ceremonyCount > 0 ? (
                            <div className="space-y-4">
                              {/* Overall Total - Prominent Display */}
                              <div className="p-4 bg-white/80 dark:bg-white/10 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                <div className="text-center">
                                  <span className="text-sm text-emerald-600 dark:text-emerald-400 block mb-1">
                                    {isPlanner ? "Estimated Total for Selected Ceremonies" : "Estimated Total for Your Side"}
                                  </span>
                                  <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200" data-testid="text-budget-estimate">
                                    ${totalLow.toLocaleString()} - ${totalHigh.toLocaleString()}
                                  </span>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                    We recommend adding 10-15% buffer for unexpected costs
                                  </p>
                                </div>
                              </div>

                              {/* Partner Invitation Note - Show different message for planners */}
                              {!isPlanner && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700">
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-800 dark:text-amber-200">
                                      <p className="font-medium mb-1">This estimate is for your side only</p>
                                      <p className="text-xs text-amber-700 dark:text-amber-300">
                                        If you want to include your partner's estimates for {partnerSide}-side ceremonies, invite {partnerTerm} after creating your account. The invite link will be generated once you complete this onboarding.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Post-Registration Note */}
                              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="flex items-start gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-medium mb-1">Detailed breakdowns available after registration</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      Once you create your account, you'll be able to view ceremony estimates broken down by each expense category (venue, catering, decor, etc.) to help you plan more precisely.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 italic">
                              Add events in the previous step to see your budget estimate.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <FormField
                      control={form.control}
                      name="totalBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                            Total Budget (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="e.g., 50000"
                                {...field}
                                data-testid="input-budget"
                                className="h-12 pl-10"
                              />
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Don't worry if you're unsure—you can always adjust this later in the Budget section.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Budget Tracking Mode */}
                    <FormField
                      control={form.control}
                      name="budgetTrackingMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                            How would you like to track your budget?
                          </FormLabel>
                          <p className="text-sm text-muted-foreground mb-3">
                            Choose your preferred approach. You can change this anytime in wedding settings.
                          </p>
                          <div className="grid gap-3">
                            <button
                              type="button"
                              onClick={() => field.onChange("ceremony")}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                field.value === "ceremony"
                                  ? "border-primary bg-primary/5"
                                  : "border-muted hover-elevate"
                              }`}
                              data-testid="radio-budget-ceremony"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  field.value === "ceremony" ? "border-primary" : "border-muted-foreground"
                                }`}>
                                  {field.value === "ceremony" && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Track by Ceremony</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Detailed approach - plan costs per ceremony (Mehndi, Sangeet, Reception), then aggregate to categories.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    Best for multi-day celebrations with distinct budgets per event
                                  </p>
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("category")}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                field.value === "category"
                                  ? "border-primary bg-primary/5"
                                  : "border-muted hover-elevate"
                              }`}
                              data-testid="radio-budget-category"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  field.value === "category" ? "border-primary" : "border-muted-foreground"
                                }`}>
                                  {field.value === "category" && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Track by Category</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Simpler approach - track spending by type: Venue, Catering, Photography, Attire, etc.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    Best for couples who want straightforward budget tracking
                                  </p>
                                </div>
                              </div>
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                )}
              </form>
            </Form>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
            className="px-6"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            data-testid="button-next"
            className="px-8"
          >
            {currentStep === STEPS.length ? "Complete Setup" : "Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
