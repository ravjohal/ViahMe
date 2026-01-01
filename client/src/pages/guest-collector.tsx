import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Heart,
  Users,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  MapPin,
  Utensils,
  Minus,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import { GuestAssistantChat } from "@/components/guest-assistant-chat";
import { format } from "date-fns";

type CollectorLinkInfo = {
  id: string;
  name: string;
  side: string;
  createdByName?: string;
  weddingInfo?: {
    partner1Name: string;
    partner2Name: string;
    weddingDate?: string;
  };
};

const DESI_DIETARY_OPTIONS = [
  { value: "none", label: "No dietary restrictions", description: "Standard menu is fine" },
  { value: "strict_vegetarian", label: "Strict Vegetarian", description: "No meat, fish, or eggs" },
  { value: "jain", label: "Jain", description: "No root vegetables, no eggs" },
  { value: "swaminarayan", label: "Swaminarayan", description: "Strictly vegetarian, no onion/garlic" },
  { value: "eggless", label: "Eggless Vegetarian", description: "Vegetarian, no eggs" },
  { value: "halal", label: "Halal", description: "Halal meat only" },
];

const RELATIONSHIP_TIERS = [
  { value: "immediate_family", label: "Immediate Family", description: "Parents, siblings, grandparents" },
  { value: "extended_family", label: "Extended Family", description: "Aunts, uncles, cousins" },
  { value: "friend", label: "Close Friend", description: "Family friends" },
  { value: "parents_friend", label: "Parent's Friend", description: "Friend of parents" },
];

type WizardStep = "intro" | "family" | "relationship" | "notes" | "review";

type FamilyDraft = {
  id: string;
  householdName: string;
  mainContactName: string;
  guestPhone: string;
  guestEmail: string;
  fullAddress: string;
  contactStreet: string;
  contactCity: string;
  contactState: string;
  contactPostalCode: string;
  contactCountry: string;
  guestCount: number;
  desiDietaryType: string;
  relationshipTier: string;
  notes: string;
};

type AddressSuggestion = {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  place_id: string;
};

const familyFormSchema = z.object({
  householdName: z.string().min(1, "Family name is required"),
  mainContactName: z.string().min(1, "Contact name is required"),
  guestPhone: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
  fullAddress: z.string().optional(),
  contactStreet: z.string().optional(),
  contactCity: z.string().optional(),
  contactState: z.string().optional(),
  contactPostalCode: z.string().optional(),
  contactCountry: z.string().optional(),
  guestCount: z.number().min(1, "At least 1 guest").max(50, "Max 50 guests"),
  desiDietaryType: z.string().optional(),
  relationshipTier: z.string().optional(),
  notes: z.string().optional(),
  submitterName: z.string().min(1, "Your name is required"),
  submitterRelation: z.string().min(1, "Your relationship is required"),
});

type FamilyFormData = z.infer<typeof familyFormSchema>;

function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
}: {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressSuggestion) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.features) {
        const formattedSuggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
          formatted: feature.properties.formatted,
          street: feature.properties.street 
            ? `${feature.properties.housenumber || ''} ${feature.properties.street}`.trim()
            : feature.properties.address_line1,
          city: feature.properties.city || feature.properties.town || feature.properties.village,
          state: feature.properties.state,
          postcode: feature.properties.postcode,
          country: feature.properties.country,
          place_id: feature.properties.place_id,
        }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Address autocomplete error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.formatted);
    onAddressSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="min-h-[48px] text-base pl-10"
          data-testid="input-address"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              className="w-full text-left px-4 py-3 hover-elevate border-b last:border-b-0 text-sm"
              onClick={() => handleSelectSuggestion(suggestion)}
              data-testid={`address-suggestion-${index}`}
            >
              {suggestion.formatted}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

type PreviousSubmission = {
  id: string;
  householdName: string;
  mainContactName: string;
  guestCount: number;
  relationshipTier: string;
  createdAt: string;
  status: string;
};

function getOrCreateSessionId(token: string): string {
  const storageKey = `collector_session_${token}`;
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

export default function GuestCollector() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [submitterInfo, setSubmitterInfo] = useState({ name: "", relation: "" });
  const [familiesDraft, setFamiliesDraft] = useState<FamilyDraft[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (token) {
      setSessionId(getOrCreateSessionId(token));
    }
  }, [token]);

  const { data: linkInfo, isLoading, error } = useQuery<CollectorLinkInfo>({
    queryKey: ["/api/collector", token],
    enabled: !!token,
    retry: false,
  });

  const { data: previousSubmissions = [], isLoading: loadingPrevious } = useQuery<PreviousSubmission[]>({
    queryKey: ["/api/collector", token, "my-submissions", sessionId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/collector/${token}/my-submissions?sessionId=${sessionId}`);
      return res.json();
    },
    enabled: !!token && !!sessionId,
  });

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      householdName: "",
      mainContactName: "",
      guestPhone: "",
      guestEmail: "",
      fullAddress: "",
      contactStreet: "",
      contactCity: "",
      contactState: "",
      contactPostalCode: "",
      contactCountry: "",
      guestCount: 2,
      desiDietaryType: "none",
      relationshipTier: "friend",
      notes: "",
      submitterName: "",
      submitterRelation: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (families: FamilyDraft[]) => {
      const promises = families.map(family => 
        apiRequest("POST", `/api/collector/${token}/submit`, {
          ...family,
          guestName: family.householdName,
          submitterName: submitterInfo.name,
          submitterRelation: submitterInfo.relation,
          isBulkEntry: false,
          submissionSessionId: sessionId,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      setSubmitted(true);
      toast({ 
        title: `${results.length} ${results.length === 1 ? 'family' : 'families'} submitted!`, 
        description: "Thank you for helping with the guest list." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to submit families", 
        variant: "destructive" 
      });
    },
  });

  const steps: WizardStep[] = ["intro", "family", "relationship", "notes", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercent = ((currentStepIndex) / (steps.length - 1)) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      if (currentStep === "intro") {
        form.setValue("submitterName", submitterInfo.name);
        form.setValue("submitterRelation", submitterInfo.relation);
      }
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "intro":
        return submitterInfo.name.trim() !== "" && submitterInfo.relation !== "";
      case "family":
        return form.watch("householdName").trim() !== "" && form.watch("mainContactName").trim() !== "";
      case "review":
        return familiesDraft.length > 0;
      default:
        return true;
    }
  };

  const addFamilyToDraft = () => {
    const data = form.getValues();
    const newFamily: FamilyDraft = {
      id: crypto.randomUUID(),
      householdName: data.householdName,
      mainContactName: data.mainContactName,
      guestPhone: data.guestPhone || "",
      guestEmail: data.guestEmail || "",
      fullAddress: data.fullAddress || "",
      contactStreet: data.contactStreet || "",
      contactCity: data.contactCity || "",
      contactState: data.contactState || "",
      contactPostalCode: data.contactPostalCode || "",
      contactCountry: data.contactCountry || "",
      guestCount: data.guestCount,
      desiDietaryType: data.desiDietaryType || "none",
      relationshipTier: data.relationshipTier || "friend",
      notes: data.notes || "",
    };

    if (editingIndex !== null) {
      const updated = [...familiesDraft];
      updated[editingIndex] = newFamily;
      setFamiliesDraft(updated);
      setEditingIndex(null);
    } else {
      setFamiliesDraft([...familiesDraft, newFamily]);
    }

    form.reset({
      householdName: "",
      mainContactName: "",
      guestPhone: "",
      guestEmail: "",
      fullAddress: "",
      contactStreet: "",
      contactCity: "",
      contactState: "",
      contactPostalCode: "",
      contactCountry: "",
      guestCount: 2,
      desiDietaryType: "none",
      relationshipTier: "friend",
      notes: "",
      submitterName: submitterInfo.name,
      submitterRelation: submitterInfo.relation,
    });

    setCurrentStep("review");
    toast({
      title: editingIndex !== null ? "Family updated" : "Family added",
      description: `${newFamily.householdName} has been ${editingIndex !== null ? 'updated' : 'added to your list'}`,
    });
  };

  const editFamily = (index: number) => {
    const family = familiesDraft[index];
    form.reset({
      householdName: family.householdName,
      mainContactName: family.mainContactName,
      guestPhone: family.guestPhone,
      guestEmail: family.guestEmail,
      fullAddress: family.fullAddress,
      contactStreet: family.contactStreet,
      contactCity: family.contactCity,
      contactState: family.contactState,
      contactPostalCode: family.contactPostalCode,
      contactCountry: family.contactCountry,
      guestCount: family.guestCount,
      desiDietaryType: family.desiDietaryType,
      relationshipTier: family.relationshipTier,
      notes: family.notes,
      submitterName: submitterInfo.name,
      submitterRelation: submitterInfo.relation,
    });
    setEditingIndex(index);
    setCurrentStep("family");
  };

  const removeFamily = (index: number) => {
    setFamiliesDraft(familiesDraft.filter((_, i) => i !== index));
  };

  const onSubmitAll = () => {
    submitMutation.mutate(familiesDraft);
  };

  const handleAddAnother = () => {
    form.reset({
      householdName: "",
      mainContactName: "",
      guestPhone: "",
      guestEmail: "",
      fullAddress: "",
      contactStreet: "",
      contactCity: "",
      contactState: "",
      contactPostalCode: "",
      contactCountry: "",
      guestCount: 2,
      desiDietaryType: "none",
      relationshipTier: "friend",
      notes: "",
      submitterName: submitterInfo.name,
      submitterRelation: submitterInfo.relation,
    });
    setFamiliesDraft([]);
    setCurrentStep("family");
    setSubmitted(false);
  };

  const startAddingAnotherFamily = () => {
    form.reset({
      householdName: "",
      mainContactName: "",
      guestPhone: "",
      guestEmail: "",
      fullAddress: "",
      contactStreet: "",
      contactCity: "",
      contactState: "",
      contactPostalCode: "",
      contactCountry: "",
      guestCount: 2,
      desiDietaryType: "none",
      relationshipTier: "friend",
      notes: "",
      submitterName: submitterInfo.name,
      submitterRelation: submitterInfo.relation,
    });
    setEditingIndex(null);
    setCurrentStep("family");
  };

  const incrementGuestCount = () => {
    const current = form.watch("guestCount");
    if (current < 50) {
      form.setValue("guestCount", current + 1);
    }
  };

  const decrementGuestCount = () => {
    const current = form.watch("guestCount");
    if (current > 1) {
      form.setValue("guestCount", current - 1);
    }
  };

  const handleAddressSelect = (address: AddressSuggestion) => {
    form.setValue("contactStreet", address.street || "");
    form.setValue("contactCity", address.city || "");
    form.setValue("contactState", address.state || "");
    form.setValue("contactPostalCode", address.postcode || "");
    form.setValue("contactCountry", address.country || "");
  };

  const totalGuestCount = familiesDraft.reduce((sum, f) => sum + f.guestCount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !linkInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">Link Not Available</CardTitle>
            <CardDescription className="text-base">
              This guest submission link is no longer active, has expired, or doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact the couple for a new link if you'd like to suggest guests.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Thank You!
            </CardTitle>
            <CardDescription className="text-base">
              Your guest suggestions have been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {linkInfo.weddingInfo?.partner1Name} & {linkInfo.weddingInfo?.partner2Name} will review your suggestions 
              and include them in their guest list planning.
            </p>
            <div className="pt-4">
              <Button 
                onClick={handleAddAnother}
                className="w-full min-h-[48px] text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                data-testid="button-add-more-families"
              >
                <Users className="w-5 h-5 mr-2" />
                Add More Families
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-6 px-4 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 
            className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {linkInfo.weddingInfo?.partner1Name} & {linkInfo.weddingInfo?.partner2Name}
          </h1>
          {linkInfo.weddingInfo?.weddingDate && (
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1 text-sm">
              <Calendar className="w-4 h-4" />
              {format(new Date(linkInfo.weddingInfo.weddingDate), "MMMM d, yyyy")}
            </p>
          )}
        </div>

        {currentStep !== "intro" && (
          <div className="mb-4">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Step {currentStepIndex} of {steps.length - 1}
              </p>
              {familiesDraft.length > 0 && currentStep !== "review" && (
                <p className="text-xs font-medium text-pink-600">
                  {familiesDraft.length} {familiesDraft.length === 1 ? 'family' : 'families'} ready
                </p>
              )}
            </div>
          </div>
        )}

        <Card className="border-pink-100 dark:border-pink-900/20 shadow-xl">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              {currentStep === "intro" && (
                <>
                  <CardHeader className="text-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-pink-500" />
                      Welcome!
                    </CardTitle>
                    <CardDescription className="text-base">
                      Help build the guest list for the {linkInfo.side}'s side
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Your Name</Label>
                        <Input 
                          value={submitterInfo.name}
                          onChange={(e) => setSubmitterInfo({ ...submitterInfo, name: e.target.value })}
                          placeholder="Enter your name"
                          className="min-h-[48px] text-base mt-2"
                          data-testid="input-submitter-name"
                        />
                      </div>
                      <div>
                        <Label className="text-base font-medium">Your Relationship</Label>
                        <Select 
                          value={submitterInfo.relation} 
                          onValueChange={(v) => setSubmitterInfo({ ...submitterInfo, relation: v })}
                        >
                          <SelectTrigger className="min-h-[48px] text-base mt-2" data-testid="select-submitter-relation">
                            <SelectValue placeholder="How are you related?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mother" className="text-base py-3">Mother</SelectItem>
                            <SelectItem value="father" className="text-base py-3">Father</SelectItem>
                            <SelectItem value="aunt" className="text-base py-3">Aunt</SelectItem>
                            <SelectItem value="uncle" className="text-base py-3">Uncle</SelectItem>
                            <SelectItem value="sibling" className="text-base py-3">Sibling</SelectItem>
                            <SelectItem value="grandparent" className="text-base py-3">Grandparent</SelectItem>
                            <SelectItem value="cousin" className="text-base py-3">Cousin</SelectItem>
                            <SelectItem value="family_friend" className="text-base py-3">Family Friend</SelectItem>
                            <SelectItem value="other" className="text-base py-3">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {previousSubmissions.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-pink-100 dark:border-pink-900/20">
                        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Families You Already Added
                        </h3>
                        <div className="space-y-2">
                          {previousSubmissions.map((sub) => (
                            <div 
                              key={sub.id} 
                              className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30"
                              data-testid={`previous-submission-${sub.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-green-800 dark:text-green-200">
                                    {sub.householdName || sub.mainContactName}
                                  </p>
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    {sub.guestCount} {sub.guestCount === 1 ? 'guest' : 'guests'} • {RELATIONSHIP_TIERS.find(t => t.value === sub.relationshipTier)?.label || 'Guest'}
                                  </p>
                                </div>
                                <span 
                                  className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded"
                                  data-testid={`status-submission-${sub.id}`}
                                >
                                  {sub.status === 'pending' ? 'Pending review' : sub.status === 'approved' ? 'Approved' : 'Declined'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                          Want to add more families? Continue below.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {currentStep === "family" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">
                      {editingIndex !== null ? "Edit Family" : "Add a Family"}
                    </CardTitle>
                    <CardDescription className="text-base">
                      Tell us about the family you want to invite
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-4">
                    <FormField
                      control={form.control}
                      name="householdName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Family Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              placeholder="e.g., The Sharma Family"
                              className="min-h-[48px] text-base"
                              data-testid="input-household-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Main Contact Person *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              placeholder="Who should receive invitations?"
                              className="min-h-[48px] text-base"
                              data-testid="input-main-contact"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="guestPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="tel"
                                placeholder="Phone number"
                                className="min-h-[48px] text-base"
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="guestEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="email"
                                placeholder="Email address"
                                className="min-h-[48px] text-base"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fullAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Mailing Address</FormLabel>
                          <FormControl>
                            <AddressAutocomplete
                              value={field.value || ""}
                              onChange={field.onChange}
                              onAddressSelect={handleAddressSelect}
                              placeholder="Start typing an address..."
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Type to search or enter address manually
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Number of Family Members Invited
                          </FormLabel>
                          <div className="flex items-center justify-center gap-4 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={decrementGuestCount}
                              disabled={field.value <= 1}
                              className="h-12 w-12"
                              data-testid="button-decrement-count"
                            >
                              <Minus className="w-5 h-5" />
                            </Button>
                            <span className="text-3xl font-bold w-16 text-center" data-testid="text-guest-count">
                              {field.value}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={incrementGuestCount}
                              disabled={field.value >= 50}
                              className="h-12 w-12"
                              data-testid="button-increment-count"
                            >
                              <Plus className="w-5 h-5" />
                            </Button>
                          </div>
                          <FormDescription className="text-center text-sm">
                            Include all family members who will attend
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="desiDietaryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Utensils className="w-4 h-4" />
                            Dietary Preference
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="min-h-[48px] text-base" data-testid="select-dietary">
                                <SelectValue placeholder="Select dietary preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DESI_DIETARY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="py-3">
                                  <div>
                                    <span className="text-base">{option.label}</span>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {currentStep === "relationship" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">How Close?</CardTitle>
                    <CardDescription className="text-base">
                      This helps with seating and priority
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <FormField
                      control={form.control}
                      name="relationshipTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-3"
                            >
                              {RELATIONSHIP_TIERS.map((tier) => (
                                <Label
                                  key={tier.value}
                                  htmlFor={tier.value}
                                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[64px] ${
                                    field.value === tier.value 
                                      ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" 
                                      : "border-muted hover-elevate"
                                  }`}
                                  data-testid={`radio-tier-${tier.value}`}
                                >
                                  <RadioGroupItem value={tier.value} id={tier.value} />
                                  <div className="flex-1">
                                    <p className="font-medium text-base">{tier.label}</p>
                                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                                  </div>
                                </Label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {currentStep === "notes" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Any Notes?</CardTitle>
                    <CardDescription className="text-base">
                      Add any helpful context (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="e.g., Dad's college roommate, lives in Chicago, very close family..."
                              className="min-h-[120px] text-base resize-none"
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormDescription className="text-center text-sm">
                            This helps the couple understand the relationship
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {currentStep === "review" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <CardTitle className="text-xl">Review & Submit</CardTitle>
                    <CardDescription className="text-base">
                      {familiesDraft.length === 0 
                        ? "Add families to your list before submitting"
                        : `${familiesDraft.length} ${familiesDraft.length === 1 ? 'family' : 'families'} · ${totalGuestCount} total guests`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {familiesDraft.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">No families added yet</p>
                        <Button
                          type="button"
                          onClick={startAddingAnotherFamily}
                          className="min-h-[48px] text-base"
                          data-testid="button-add-first-family"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Add a Family
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {familiesDraft.map((family, index) => (
                            <div 
                              key={family.id} 
                              className="bg-muted/50 rounded-lg p-4 relative"
                              data-testid={`family-card-${index}`}
                            >
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editFamily(index)}
                                  className="h-8 w-8"
                                  data-testid={`button-edit-family-${index}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFamily(index)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  data-testid={`button-remove-family-${index}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="space-y-2 pr-16">
                                <p className="font-medium text-base">{family.householdName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Contact: {family.mainContactName} · {family.guestCount} guest{family.guestCount > 1 ? "s" : ""}
                                </p>
                                {family.fullAddress && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {family.fullAddress}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-xs px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                                    {RELATIONSHIP_TIERS.find(t => t.value === family.relationshipTier)?.label || "Friend"}
                                  </span>
                                  {family.desiDietaryType && family.desiDietaryType !== "none" && (
                                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                                      {DESI_DIETARY_OPTIONS.find(d => d.value === family.desiDietaryType)?.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-200">Have more families to add?</p>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                You can add as many families as you want before submitting. They'll all be sent together.
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={startAddingAnotherFamily}
                            className="w-full min-h-[48px] text-base bg-blue-600 hover:bg-blue-700 text-white"
                            data-testid="button-add-another"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Another Family
                          </Button>
                        </div>

                        <div className="border-t pt-4 mt-4">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm text-muted-foreground">Submitted by</p>
                            <p className="text-base font-medium">{submitterInfo.name}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </>
              )}

              <CardFooter className="flex gap-3 pt-4">
                {currentStep !== "intro" && currentStep !== "review" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="min-h-[48px] flex-1 text-base"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    Back
                  </Button>
                )}
                {currentStep === "intro" && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    data-testid="button-next"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                )}
                {(currentStep === "family" || currentStep === "relationship") && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    data-testid="button-next"
                  >
                    Next
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                )}
                {currentStep === "notes" && (
                  <Button
                    type="button"
                    onClick={addFamilyToDraft}
                    disabled={!form.watch("householdName") || !form.watch("mainContactName")}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    data-testid="button-add-to-list"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    {editingIndex !== null ? "Update Family" : "Add to List"}
                  </Button>
                )}
                {currentStep === "review" && familiesDraft.length > 0 && (
                  <Button
                    type="button"
                    onClick={onSubmitAll}
                    disabled={submitMutation.isPending}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    data-testid="button-submit-all"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit {familiesDraft.length} {familiesDraft.length === 1 ? 'Family' : 'Families'}
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Viah.me - South Asian Wedding Planning
        </p>
      </div>

      {!submitted && (
        <GuestAssistantChat
          context={{
            coupleName: linkInfo?.weddingInfo
              ? `${linkInfo.weddingInfo.partner1Name} & ${linkInfo.weddingInfo.partner2Name}`
              : undefined,
            weddingDate: linkInfo?.weddingInfo?.weddingDate,
            submitterName: submitterInfo.name || undefined,
            currentStep,
          }}
        />
      )}
    </div>
  );
}
