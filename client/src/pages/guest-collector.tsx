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
import { Checkbox } from "@/components/ui/checkbox";
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

type WeddingEvent = {
  id: string;
  name: string;
  type: string;
  date?: string;
};

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
  events?: WeddingEvent[];
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

type WizardStep = "intro" | "household" | "contact" | "members" | "events" | "notes" | "review";

type GuestMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dietaryRestriction: string;
};

type FamilyDraft = {
  id: string;
  householdName: string;
  fullAddress: string;
  contactStreet: string;
  contactCity: string;
  contactState: string;
  contactPostalCode: string;
  contactCountry: string;
  householdDietaryRestriction: string;
  mainContactEmail: string;
  mainContactPhone: string;
  memberCount: number;
  addMembersIndividually: boolean;
  members: GuestMember[];
  eventSuggestions: string[];
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
  fullAddress: z.string().optional(),
  contactStreet: z.string().optional(),
  contactCity: z.string().optional(),
  contactState: z.string().optional(),
  contactPostalCode: z.string().optional(),
  contactCountry: z.string().optional(),
  householdDietaryRestriction: z.string().optional(),
  mainContactEmail: z.string().optional(),
  mainContactPhone: z.string().optional(),
  memberCount: z.number().min(1, "At least 1 member required").default(1),
  addMembersIndividually: z.boolean().default(false),
  relationshipTier: z.string().optional(),
  notes: z.string().optional(),
  submitterName: z.string().min(1, "Your name is required"),
  submitterRelation: z.string().min(1, "Your relationship is required"),
});

type FamilyFormData = z.infer<typeof familyFormSchema>;

const DEFAULT_MEMBER: () => GuestMember = () => ({
  id: crypto.randomUUID(),
  name: "",
  email: "",
  phone: "",
  dietaryRestriction: "none",
});

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
      
      console.log("[AddressAutocomplete] Response:", data);
      
      if (data.features && data.features.length > 0) {
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
        console.log("[AddressAutocomplete] Formatted suggestions:", formattedSuggestions);
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        console.log("[AddressAutocomplete] No features in response or empty array");
        setSuggestions([]);
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

  const [currentMembers, setCurrentMembers] = useState<GuestMember[]>([DEFAULT_MEMBER()]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      householdName: "",
      fullAddress: "",
      contactStreet: "",
      contactCity: "",
      contactState: "",
      contactPostalCode: "",
      contactCountry: "",
      householdDietaryRestriction: "none",
      mainContactEmail: "",
      mainContactPhone: "",
      memberCount: 1,
      addMembersIndividually: false,
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
          members: JSON.stringify(family.members || []),
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

  const steps: WizardStep[] = ["intro", "household", "contact", "members", "events", "notes", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercent = ((currentStepIndex) / (steps.length - 1)) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      if (currentStep === "intro") {
        form.setValue("submitterName", submitterInfo.name);
        form.setValue("submitterRelation", submitterInfo.relation);
      }
      // Skip members step if not adding individually
      if (currentStep === "contact" && !form.watch("addMembersIndividually")) {
        setCurrentStep("events");
        return;
      }
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      // Skip members step when going back if not adding individually
      if (currentStep === "events" && !form.watch("addMembersIndividually")) {
        setCurrentStep("contact");
        return;
      }
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "intro":
        return submitterInfo.name.trim() !== "" && submitterInfo.relation !== "";
      case "household":
        return form.watch("householdName")?.trim() !== "" && (form.watch("memberCount") || 1) >= 1;
      case "contact":
        return true;
      case "members":
        return currentMembers.some(m => m.name.trim() !== "");
      case "events":
        return true;
      case "notes":
        return true;
      case "review":
        return familiesDraft.length > 0;
      default:
        return true;
    }
  };

  // Get valid members (those with non-empty names)
  const getValidMembers = () => currentMembers.filter(m => m.name.trim() !== "");

  const resetFormAndMembers = () => {
    form.reset({
      householdName: "",
      fullAddress: "",
      contactStreet: "",
      contactCity: "",
      contactState: "",
      contactPostalCode: "",
      contactCountry: "",
      householdDietaryRestriction: "none",
      mainContactEmail: "",
      mainContactPhone: "",
      memberCount: 1,
      addMembersIndividually: false,
      relationshipTier: "friend",
      notes: "",
      submitterName: submitterInfo.name,
      submitterRelation: submitterInfo.relation,
    });
    setCurrentMembers([DEFAULT_MEMBER()]);
    setSelectedEvents([]);
  };

  const addFamilyToDraft = () => {
    const data = form.getValues();
    const validMembers = getValidMembers();
    const newFamily: FamilyDraft = {
      id: crypto.randomUUID(),
      householdName: data.householdName,
      fullAddress: data.fullAddress || "",
      contactStreet: data.contactStreet || "",
      contactCity: data.contactCity || "",
      contactState: data.contactState || "",
      contactPostalCode: data.contactPostalCode || "",
      contactCountry: data.contactCountry || "",
      householdDietaryRestriction: data.householdDietaryRestriction || "none",
      mainContactEmail: data.mainContactEmail || "",
      mainContactPhone: data.mainContactPhone || "",
      memberCount: data.memberCount || 1,
      addMembersIndividually: data.addMembersIndividually || false,
      members: validMembers,
      eventSuggestions: selectedEvents,
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

    resetFormAndMembers();
    setCurrentStep("review");
    toast({
      title: editingIndex !== null ? "Family updated" : "Family added",
      description: `${newFamily.householdName} has been ${editingIndex !== null ? 'updated' : 'added to your list'}`,
    });
  };

  const addFamilyAndContinue = () => {
    const data = form.getValues();
    const validMembers = getValidMembers();
    const newFamily: FamilyDraft = {
      id: crypto.randomUUID(),
      householdName: data.householdName,
      fullAddress: data.fullAddress || "",
      contactStreet: data.contactStreet || "",
      contactCity: data.contactCity || "",
      contactState: data.contactState || "",
      contactPostalCode: data.contactPostalCode || "",
      contactCountry: data.contactCountry || "",
      householdDietaryRestriction: data.householdDietaryRestriction || "none",
      mainContactEmail: data.mainContactEmail || "",
      mainContactPhone: data.mainContactPhone || "",
      memberCount: data.memberCount || 1,
      addMembersIndividually: data.addMembersIndividually || false,
      members: validMembers,
      eventSuggestions: selectedEvents,
      relationshipTier: data.relationshipTier || "friend",
      notes: data.notes || "",
    };

    setFamiliesDraft([...familiesDraft, newFamily]);
    resetFormAndMembers();
    setCurrentStep("household");
    toast({
      title: "Family added!",
      description: `${newFamily.householdName} added. Now add another family.`,
    });
  };

  const editFamily = (index: number) => {
    const family = familiesDraft[index];
    form.reset({
      householdName: family.householdName,
      fullAddress: family.fullAddress,
      contactStreet: family.contactStreet,
      contactCity: family.contactCity,
      contactState: family.contactState,
      contactPostalCode: family.contactPostalCode,
      contactCountry: family.contactCountry,
      householdDietaryRestriction: family.householdDietaryRestriction || "none",
      mainContactEmail: family.mainContactEmail || "",
      mainContactPhone: family.mainContactPhone || "",
      memberCount: family.memberCount || 1,
      addMembersIndividually: family.addMembersIndividually || false,
      relationshipTier: family.relationshipTier,
      notes: family.notes,
      submitterName: submitterInfo.name,
      submitterRelation: submitterInfo.relation,
    });
    setCurrentMembers(family.members && family.members.length > 0 ? family.members : [DEFAULT_MEMBER()]);
    setSelectedEvents(family.eventSuggestions || []);
    setEditingIndex(index);
    setCurrentStep("household");
  };

  const removeFamily = (index: number) => {
    setFamiliesDraft(familiesDraft.filter((_, i) => i !== index));
  };

  const onSubmitAll = () => {
    submitMutation.mutate(familiesDraft);
  };

  const handleAddAnother = () => {
    resetFormAndMembers();
    setFamiliesDraft([]);
    setCurrentStep("household");
    setSubmitted(false);
  };

  const startAddingAnotherFamily = () => {
    resetFormAndMembers();
    setEditingIndex(null);
    setCurrentStep("household");
  };

  const addMember = () => {
    setCurrentMembers([...currentMembers, DEFAULT_MEMBER()]);
  };

  const removeMember = (index: number) => {
    if (currentMembers.length > 1) {
      setCurrentMembers(currentMembers.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof GuestMember, value: string) => {
    const updated = [...currentMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentMembers(updated);
  };

  const handleAddressSelect = (address: AddressSuggestion) => {
    form.setValue("contactStreet", address.street || "");
    form.setValue("contactCity", address.city || "");
    form.setValue("contactState", address.state || "");
    form.setValue("contactPostalCode", address.postcode || "");
    form.setValue("contactCountry", address.country || "");
  };

  const totalGuestCount = familiesDraft.reduce((sum, f) => {
    if (f.addMembersIndividually) {
      return sum + (f.members || []).length;
    }
    return sum + (f.memberCount || 1);
  }, 0);

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

              {currentStep === "household" && (
                <>
                  <CardHeader className="text-center">
                    {familiesDraft.length > 0 && editingIndex === null && (
                      <div className="mb-3 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm font-medium mx-auto">
                        <CheckCircle2 className="w-4 h-4" />
                        {familiesDraft.length} {familiesDraft.length === 1 ? 'family' : 'families'} added
                      </div>
                    )}
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">
                      {editingIndex !== null ? "Edit Family" : familiesDraft.length > 0 ? "Add Another Family" : "Add a Family"}
                    </CardTitle>
                    <CardDescription className="text-base">
                      Enter the household name, address, and dietary preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-4">
                    <FormField
                      control={form.control}
                      name="householdName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Family/Household Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              placeholder="e.g., The Sharma Family"
                              className="min-h-[48px] text-base"
                              data-testid="input-household-name"
                            />
                          </FormControl>
                          <FormDescription>
                            This is how they'll appear on the guest list
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Mailing Address
                          </FormLabel>
                          <FormControl>
                            <AddressAutocomplete
                              value={field.value || ""}
                              onChange={field.onChange}
                              onAddressSelect={handleAddressSelect}
                              placeholder="Start typing an address..."
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Optional - for save-the-dates and invitations
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="memberCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            How many people in this family? *
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => field.onChange(Math.max(1, (field.value || 1) - 1))}
                                disabled={(field.value || 1) <= 1}
                                data-testid="button-member-count-minus"
                              >
                                <Minus className="w-5 h-5" />
                              </Button>
                              <span className="text-3xl font-bold min-w-[3rem] text-center" data-testid="text-member-count">
                                {field.value || 1}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => field.onChange((field.value || 1) + 1)}
                                data-testid="button-member-count-plus"
                              >
                                <Plus className="w-5 h-5" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-sm">
                            Total number of guests in this household
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addMembersIndividually"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="h-6 w-6 mt-0.5"
                              data-testid="checkbox-add-individually"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base font-medium cursor-pointer">
                              Add members individually
                            </FormLabel>
                            <FormDescription className="text-sm">
                              Enter names and details for each person (optional)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="householdDietaryRestriction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Utensils className="w-4 h-4" />
                            Household Dietary Restriction
                          </FormLabel>
                          <Select value={field.value || "none"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="min-h-[48px] text-base" data-testid="select-household-dietary">
                                <SelectValue placeholder="Select dietary preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DESI_DIETARY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="py-2">
                                  <span className="text-base">{option.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-sm">
                            Does the whole household share a dietary restriction?
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {currentStep === "contact" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Main Point of Contact</CardTitle>
                    <CardDescription className="text-base">
                      How can the couple reach this family?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-4">
                    <FormField
                      control={form.control}
                      name="mainContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="email"
                              placeholder="email@example.com"
                              className="min-h-[48px] text-base"
                              data-testid="input-main-contact-email"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            For sending invitations and updates
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="tel"
                              placeholder="(555) 123-4567"
                              className="min-h-[48px] text-base"
                              data-testid="input-main-contact-phone"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            For WhatsApp or text updates (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </>
              )}

              {currentStep === "members" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Who's in This Family?</CardTitle>
                    <CardDescription className="text-base">
                      Add each guest who should receive an invite
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {currentMembers.map((member, index) => (
                      <Card key={member.id} className="p-4 relative" data-testid={`member-card-${index}`}>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Guest {index + 1}
                          </span>
                          {currentMembers.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMember(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              data-testid={`button-remove-member-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Full Name *</Label>
                            <Input
                              value={member.name}
                              onChange={(e) => updateMember(index, "name", e.target.value)}
                              placeholder="e.g., Raj Sharma"
                              className="min-h-[48px] text-base mt-1"
                              data-testid={`input-member-name-${index}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                              </Label>
                              <Input
                                type="email"
                                value={member.email}
                                onChange={(e) => updateMember(index, "email", e.target.value)}
                                placeholder="Email"
                                className="min-h-[48px] text-base mt-1"
                                data-testid={`input-member-email-${index}`}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Phone
                              </Label>
                              <Input
                                type="tel"
                                value={member.phone}
                                onChange={(e) => updateMember(index, "phone", e.target.value)}
                                placeholder="Phone"
                                className="min-h-[48px] text-base mt-1"
                                data-testid={`input-member-phone-${index}`}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-1">
                              <Utensils className="w-3 h-3" /> Dietary Restriction
                            </Label>
                            <Select
                              value={member.dietaryRestriction}
                              onValueChange={(value) => updateMember(index, "dietaryRestriction", value)}
                            >
                              <SelectTrigger className="min-h-[48px] text-base mt-1" data-testid={`select-dietary-${index}`}>
                                <SelectValue placeholder="Select dietary preference" />
                              </SelectTrigger>
                              <SelectContent>
                                {DESI_DIETARY_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="py-2">
                                    <span className="text-base">{option.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMember}
                      className="w-full min-h-[48px] text-base"
                      data-testid="button-add-member"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Another Person
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      {currentMembers.length} {currentMembers.length === 1 ? 'guest' : 'guests'} in this family
                    </p>
                  </CardContent>
                </>
              )}

              {currentStep === "events" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Which Events?</CardTitle>
                    <CardDescription className="text-base">
                      Suggest which events to invite this family to (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {linkInfo?.events && linkInfo.events.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          The couple will make the final decision. Your suggestions help them plan!
                        </p>
                        {linkInfo.events.map((event) => {
                          const isSelected = selectedEvents.includes(event.id);
                          return (
                            <Label
                              key={event.id}
                              htmlFor={`event-${event.id}`}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[64px] ${
                                isSelected 
                                  ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" 
                                  : "border-muted hover-elevate"
                              }`}
                              data-testid={`checkbox-event-${event.id}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                                } else {
                                  setSelectedEvents([...selectedEvents, event.id]);
                                }
                              }}
                            >
                              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                isSelected ? "border-pink-500 bg-pink-500" : "border-muted-foreground"
                              }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-base">{event.name}</p>
                                {event.date && (
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                                  </p>
                                )}
                              </div>
                            </Label>
                          );
                        })}
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          {selectedEvents.length === 0 
                            ? "No events selected - that's okay!"
                            : `${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'} suggested`
                          }
                        </p>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          The couple hasn't set up events yet.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          You can skip this step - they'll decide which events to invite guests to.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {currentStep === "notes" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Final Details</CardTitle>
                    <CardDescription className="text-base">
                      Add notes and choose how close they are to the couple
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-4">
                    <FormField
                      control={form.control}
                      name="relationshipTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            How close is this family?
                          </FormLabel>
                          <Select value={field.value || "friend"} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="min-h-[48px] text-base" data-testid="select-relationship-tier">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RELATIONSHIP_TIERS.map((tier) => (
                                <SelectItem key={tier.value} value={tier.value} className="py-2">
                                  <span className="text-base">{tier.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-sm">
                            This helps with seating and priority
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Any Notes?</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="e.g., Dad's college roommate, lives in Chicago, very close family..."
                              className="min-h-[100px] text-base resize-none"
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Optional - add any helpful context for the couple
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
                                  {family.addMembersIndividually 
                                    ? `${(family.members || []).length} ${(family.members || []).length === 1 ? 'guest' : 'guests'}`
                                    : `${family.memberCount || 1} ${(family.memberCount || 1) === 1 ? 'guest' : 'guests'}`
                                  }
                                </p>
                                {family.addMembersIndividually && (family.members || []).length > 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    {(family.members || []).map(m => m.name).join(', ')}
                                  </div>
                                )}
                                {family.fullAddress && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {family.fullAddress}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-xs px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                                    {RELATIONSHIP_TIERS.find(t => t.value === family.relationshipTier)?.label || "Friend"}
                                  </span>
                                  {family.addMembersIndividually && (family.members || []).some(m => m.dietaryRestriction && m.dietaryRestriction !== "none") && (
                                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                                      Dietary notes
                                    </span>
                                  )}
                                  {family.householdDietaryRestriction && family.householdDietaryRestriction !== "none" && (
                                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                                      {DESI_DIETARY_OPTIONS.find(d => d.value === family.householdDietaryRestriction)?.label || "Diet"}
                                    </span>
                                  )}
                                  {(family.eventSuggestions || []).length > 0 && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                      {(family.eventSuggestions || []).length} event{(family.eventSuggestions || []).length === 1 ? '' : 's'}
                                    </span>
                                  )}
                                </div>
                                {(family.eventSuggestions || []).length > 0 && linkInfo?.events && linkInfo.events.length > 0 && (() => {
                                  const eventNames = (family.eventSuggestions || [])
                                    .map(eventId => linkInfo.events?.find(e => e.id === eventId)?.name)
                                    .filter(Boolean);
                                  return eventNames.length > 0 ? (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <span className="font-medium">Events: </span>
                                      {eventNames.join(', ')}
                                    </div>
                                  ) : null;
                                })()}
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
                {(currentStep === "household" || currentStep === "contact" || currentStep === "members" || currentStep === "events") && (
                  <>
                    {currentStep === "household" && familiesDraft.length > 0 && !form.watch("householdName") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep("review")}
                        className="min-h-[48px] flex-1 text-base"
                        data-testid="button-skip-to-review"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                        Done ({familiesDraft.length})
                      </Button>
                    )}
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
                  </>
                )}
                {currentStep === "notes" && editingIndex !== null && (
                  <Button
                    type="button"
                    onClick={addFamilyToDraft}
                    disabled={!form.watch("householdName") || (form.watch("addMembersIndividually") && !currentMembers.some(m => m.name.trim() !== ""))}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    data-testid="button-update-family"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-1" />
                    Update Family
                  </Button>
                )}
                {currentStep === "notes" && editingIndex === null && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addFamilyAndContinue}
                      disabled={!form.watch("householdName") || (form.watch("addMembersIndividually") && !currentMembers.some(m => m.name.trim() !== ""))}
                      className="min-h-[48px] flex-1 text-base"
                      data-testid="button-add-and-continue"
                    >
                      <Plus className="w-5 h-5 mr-1" />
                      Add & Continue
                    </Button>
                    <Button
                      type="button"
                      onClick={addFamilyToDraft}
                      disabled={!form.watch("householdName") || (form.watch("addMembersIndividually") && !currentMembers.some(m => m.name.trim() !== ""))}
                      className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      data-testid="button-add-and-review"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-1" />
                      Done Adding
                    </Button>
                  </>
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
