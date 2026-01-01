import { useState, useRef, useCallback, useEffect } from "react";
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
  Home,
  UserPlus,
  ChevronRight,
  Plus,
  Trash2,
  Utensils,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { GuestAssistantChat } from "@/components/guest-assistant-chat";
import { format } from "date-fns";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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

type WizardStep = "intro" | "family" | "guests" | "relationship" | "notes" | "review";

// Per-guest dietary info type
type GuestEntry = {
  name: string;
  dietary: string;
};

const wizardStepSchema = z.object({
  householdName: z.string().min(1, "Family name is required"),
  guestNames: z.array(z.string()).min(1, "At least one guest name is required"),
  desiDietaryType: z.string().optional(), // Kept for legacy compatibility
  relationshipTier: z.string().optional(),
  notes: z.string().optional(),
  submitterName: z.string().min(1, "Your name is required"),
  submitterRelation: z.string().min(1, "Your relationship is required"),
});

type WizardFormData = z.infer<typeof wizardStepSchema>;

// Bulk entry household type
type BulkHousehold = {
  householdName: string;
  mainContactName: string;
  guestCount: number;
  dietary: string;
};

export default function GuestCollector() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [guestInputs, setGuestInputs] = useState<GuestEntry[]>([{ name: "", dietary: "none" }]);
  const [sessionDietaryDefault, setSessionDietaryDefault] = useState("none"); // Remember last dietary selection
  const [submitterInfo, setSubmitterInfo] = useState({ name: "", relation: "" });
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  
  // Bulk entry mode state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkHouseholds, setBulkHouseholds] = useState<BulkHousehold[]>([
    { householdName: "", mainContactName: "", guestCount: 2, dietary: "none" }
  ]);

  const speechSupported = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const parseVoiceMutation = useMutation({
    mutationFn: async (voiceTranscript: string) => {
      const response = await apiRequest("POST", "/api/voice-to-guest", { transcript: voiceTranscript });
      return response.json();
    },
    onSuccess: (result: { names: string[]; householdName?: string }) => {
      if (result.names && result.names.length > 0) {
        const existingGuests = guestInputs.filter(g => g.name.trim() !== "");
        const newGuests: GuestEntry[] = result.names.map(name => ({
          name,
          dietary: sessionDietaryDefault, // Use remembered dietary default
        }));
        const allGuests = [...existingGuests, ...newGuests];
        setGuestInputs(allGuests.length > 0 ? allGuests : [{ name: "", dietary: sessionDietaryDefault }]);
        if (result.householdName && !form.getValues("householdName")) {
          form.setValue("householdName", result.householdName);
        }
        toast({
          title: `Found ${result.names.length} name${result.names.length > 1 ? "s" : ""}`,
          description: result.names.join(", "),
        });
      } else {
        toast({
          title: "No names found",
          description: "Please try again or type names manually",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Could not process speech",
        description: "Please try again or type names manually",
        variant: "destructive",
      });
    },
  });

  const startListening = useCallback(() => {
    if (!speechSupported) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported on this device",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "aborted") {
        toast({
          title: "Microphone error",
          description: "Please check microphone permissions",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    if (transcript.trim()) {
      setIsParsing(true);
      parseVoiceMutation.mutate(transcript, {
        onSettled: () => setIsParsing(false),
      });
    }
  }, [transcript, parseVoiceMutation]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const { data: linkInfo, isLoading, error } = useQuery<CollectorLinkInfo>({
    queryKey: ["/api/collector", token],
    enabled: !!token,
    retry: false,
  });

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardStepSchema),
    defaultValues: {
      householdName: "",
      guestNames: [],
      desiDietaryType: "none",
      relationshipTier: "friend",
      notes: "",
      submitterName: "",
      submitterRelation: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const validGuests = guestInputs.filter(g => g.name.trim() !== "");
      const filteredNames = validGuests.map(g => g.name);
      const guestDietaryInfo = validGuests.map(g => ({
        name: g.name,
        dietary: g.dietary,
      }));
      return apiRequest("POST", `/api/collector/${token}/submit`, {
        ...data,
        guestName: data.householdName, // For backward compatibility
        householdName: data.householdName,
        guestNames: filteredNames,
        guestCount: validGuests.length,
        guestDietaryInfo, // Per-guest dietary info
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ 
        title: "Family submitted!", 
        description: "Thank you for helping with the guest list." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to submit guests", 
        variant: "destructive" 
      });
    },
  });

  // Bulk submit mutation - submits multiple households at once
  const bulkSubmitMutation = useMutation({
    mutationFn: async () => {
      const validHouseholds = bulkHouseholds.filter(h => h.householdName.trim() !== "" && h.mainContactName.trim() !== "");
      const promises = validHouseholds.map(household => 
        apiRequest("POST", `/api/collector/${token}/submit`, {
          householdName: household.householdName,
          guestName: household.householdName, // For backward compatibility
          mainContactName: household.mainContactName,
          guestCount: household.guestCount,
          isBulkEntry: true,
          desiDietaryType: household.dietary,
          submitterName: submitterInfo.name,
          submitterRelation: submitterInfo.relation,
          relationshipTier: form.watch("relationshipTier") || "friend",
          notes: form.watch("notes") || "",
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      setSubmitted(true);
      toast({ 
        title: `${results.length} families submitted!`, 
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

  // Bulk entry helper functions
  const addBulkHousehold = () => {
    setBulkHouseholds([...bulkHouseholds, { 
      householdName: "", 
      mainContactName: "", 
      guestCount: 2, 
      dietary: sessionDietaryDefault 
    }]);
  };

  const removeBulkHousehold = (index: number) => {
    if (bulkHouseholds.length > 1) {
      setBulkHouseholds(bulkHouseholds.filter((_, i) => i !== index));
    }
  };

  const updateBulkHousehold = (index: number, field: keyof BulkHousehold, value: string | number) => {
    const updated = [...bulkHouseholds];
    updated[index] = { ...updated[index], [field]: value };
    setBulkHouseholds(updated);
    if (field === "dietary" && typeof value === "string") {
      setSessionDietaryDefault(value);
    }
  };

  // Steps depend on mode - bulk mode skips the detailed guests step
  const singleModeSteps: WizardStep[] = ["intro", "family", "guests", "relationship", "notes", "review"];
  const bulkModeSteps: WizardStep[] = ["intro", "family", "relationship", "notes", "review"];
  const steps = isBulkMode ? bulkModeSteps : singleModeSteps;
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercent = ((currentStepIndex) / (steps.length - 1)) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      if (currentStep === "intro") {
        form.setValue("submitterName", submitterInfo.name);
        form.setValue("submitterRelation", submitterInfo.relation);
      }
      if (currentStep === "guests" && !isBulkMode) {
        form.setValue("guestNames", guestInputs.filter(g => g.name.trim() !== "").map(g => g.name));
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
        if (isBulkMode) {
          // At least one valid bulk household (with household name and main contact)
          return bulkHouseholds.some(h => h.householdName.trim() !== "" && h.mainContactName.trim() !== "");
        }
        return form.watch("householdName").trim() !== "";
      case "guests":
        return guestInputs.some(g => g.name.trim() !== "");
      default:
        return true;
    }
  };

  const onSubmit = () => {
    if (isBulkMode) {
      bulkSubmitMutation.mutate();
    } else {
      const data = form.getValues();
      data.guestNames = guestInputs.filter(g => g.name.trim() !== "").map(g => g.name);
      submitMutation.mutate(data);
    }
  };

  const handleAddAnother = () => {
    form.reset();
    setGuestInputs([{ name: "", dietary: sessionDietaryDefault }]); // Keep remembered dietary default
    setBulkHouseholds([{ householdName: "", mainContactName: "", guestCount: 2, dietary: sessionDietaryDefault }]);
    setIsBulkMode(false);
    setCurrentStep("family");
    setSubmitted(false);
  };

  const addGuestInput = () => {
    setGuestInputs([...guestInputs, { name: "", dietary: sessionDietaryDefault }]); // Use remembered dietary default
  };

  const removeGuestInput = (index: number) => {
    if (guestInputs.length > 1) {
      setGuestInputs(guestInputs.filter((_, i) => i !== index));
    }
  };

  const updateGuestName = (index: number, name: string) => {
    const updated = [...guestInputs];
    updated[index] = { ...updated[index], name };
    setGuestInputs(updated);
  };

  const updateGuestDietary = (index: number, dietary: string) => {
    const updated = [...guestInputs];
    updated[index] = { ...updated[index], dietary };
    setGuestInputs(updated);
    // Remember this dietary selection for new guests
    setSessionDietaryDefault(dietary);
  };

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
                data-testid="button-add-another-family"
              >
                <Users className="w-5 h-5 mr-2" />
                Add Another Family
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
            <p className="text-xs text-muted-foreground text-center mt-1">
              Step {currentStepIndex} of {steps.length - 1}
            </p>
          </div>
        )}

        <Card className="border-pink-100 dark:border-pink-900/20 shadow-xl">
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); if (currentStep === "review") onSubmit(); }}>
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
                            <SelectItem value="parent" className="text-base py-3">Parent of Couple</SelectItem>
                            <SelectItem value="sibling" className="text-base py-3">Sibling</SelectItem>
                            <SelectItem value="grandparent" className="text-base py-3">Grandparent</SelectItem>
                            <SelectItem value="aunt_uncle" className="text-base py-3">Aunt / Uncle</SelectItem>
                            <SelectItem value="cousin" className="text-base py-3">Cousin</SelectItem>
                            <SelectItem value="friend" className="text-base py-3">Family Friend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {currentStep === "family" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Home className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">{isBulkMode ? "Add Multiple Families" : "Family Name"}</CardTitle>
                    <CardDescription className="text-base">
                      {isBulkMode ? "Add several families at once" : "What's this family's name?"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <Button
                        type="button"
                        variant={!isBulkMode ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 min-h-[40px]"
                        onClick={() => setIsBulkMode(false)}
                        data-testid="button-single-mode"
                      >
                        <User className="w-4 h-4 mr-2" />
                        One Family
                      </Button>
                      <Button
                        type="button"
                        variant={isBulkMode ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 min-h-[40px]"
                        onClick={() => setIsBulkMode(true)}
                        data-testid="button-bulk-mode"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Multiple
                      </Button>
                    </div>

                    {!isBulkMode ? (
                      /* Single family mode */
                      <FormField
                        control={form.control}
                        name="householdName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder='e.g., "The Sharma Family"'
                                className="min-h-[56px] text-lg text-center"
                                data-testid="input-household-name"
                              />
                            </FormControl>
                            <FormDescription className="text-center text-sm">
                              Enter the family name or household you're adding
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      /* Bulk entry mode */
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                          Just add family names, main contact, and guest count. Names can be added later!
                        </p>
                        {bulkHouseholds.map((household, index) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg border space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Family {index + 1}</span>
                              {bulkHouseholds.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBulkHousehold(index)}
                                  className="h-8 w-8 text-muted-foreground"
                                  data-testid={`button-remove-bulk-${index}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <Input
                              value={household.householdName}
                              onChange={(e) => updateBulkHousehold(index, "householdName", e.target.value)}
                              placeholder="Family name (e.g., The Sharma Family)"
                              className="min-h-[48px] text-base"
                              data-testid={`input-bulk-household-${index}`}
                            />
                            <Input
                              value={household.mainContactName}
                              onChange={(e) => updateBulkHousehold(index, "mainContactName", e.target.value)}
                              placeholder="Main contact name (for invitations)"
                              className="min-h-[48px] text-base"
                              data-testid={`input-bulk-contact-${index}`}
                            />
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Guests</Label>
                                <Select
                                  value={String(household.guestCount)}
                                  onValueChange={(v) => updateBulkHousehold(index, "guestCount", parseInt(v))}
                                >
                                  <SelectTrigger className="min-h-[44px]" data-testid={`select-bulk-count-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                      <SelectItem key={n} value={String(n)}>{n} guest{n > 1 ? "s" : ""}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Dietary</Label>
                                <Select
                                  value={household.dietary}
                                  onValueChange={(v) => updateBulkHousehold(index, "dietary", v)}
                                >
                                  <SelectTrigger className="min-h-[44px]" data-testid={`select-bulk-dietary-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DESI_DIETARY_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addBulkHousehold}
                          className="w-full min-h-[48px] text-base"
                          data-testid="button-add-bulk-household"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Add Another Family
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          {bulkHouseholds.filter(h => h.householdName.trim() && h.mainContactName.trim()).length} family(ies) ready to submit
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              {currentStep === "guests" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Who's Invited?</CardTitle>
                    <CardDescription className="text-base">
                      Add names and dietary needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {speechSupported && (
                      <div className="flex flex-col items-center gap-3 p-4 bg-muted/50 rounded-lg">
                        <Button
                          type="button"
                          variant={isListening ? "destructive" : "outline"}
                          size="lg"
                          onClick={isListening ? stopListening : startListening}
                          disabled={isParsing}
                          className="min-h-[56px] min-w-[56px] rounded-full"
                          data-testid="button-voice-input"
                        >
                          {isParsing ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : isListening ? (
                            <MicOff className="w-6 h-6" />
                          ) : (
                            <Mic className="w-6 h-6" />
                          )}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                          {isParsing 
                            ? "Processing..." 
                            : isListening 
                              ? "Listening... Tap to stop" 
                              : "Tap to speak names"}
                        </p>
                        {isListening && transcript && (
                          <p className="text-sm text-center font-medium animate-pulse">
                            "{transcript}"
                          </p>
                        )}
                      </div>
                    )}
                    {guestInputs.map((guest, index) => (
                      <div key={index} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                        <div className="flex gap-2 items-center">
                          <Input 
                            value={guest.name}
                            onChange={(e) => updateGuestName(index, e.target.value)}
                            placeholder={`Guest ${index + 1} name`}
                            className="min-h-[48px] text-base flex-1"
                            data-testid={`input-guest-name-${index}`}
                          />
                          {guestInputs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGuestInput(index)}
                              className="min-h-[48px] min-w-[48px] text-muted-foreground"
                              data-testid={`button-remove-guest-${index}`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Select 
                            value={guest.dietary} 
                            onValueChange={(v) => updateGuestDietary(index, v)}
                          >
                            <SelectTrigger className="min-h-[44px] text-sm flex-1" data-testid={`select-dietary-${index}`}>
                              <SelectValue placeholder="Dietary..." />
                            </SelectTrigger>
                            <SelectContent>
                              {DESI_DIETARY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-sm py-2">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addGuestInput}
                      className="w-full min-h-[48px] text-base"
                      data-testid="button-add-guest"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Another Person
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      {guestInputs.filter(g => g.name.trim()).length} guest(s) added
                    </p>
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
                      How is this family related?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <FormField
                      control={form.control}
                      name="relationshipTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-2"
                            >
                              {RELATIONSHIP_TIERS.map((tier) => (
                                <label
                                  key={tier.value}
                                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    field.value === tier.value 
                                      ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20" 
                                      : "border-border hover-elevate"
                                  }`}
                                  data-testid={`radio-relationship-${tier.value}`}
                                >
                                  <RadioGroupItem value={tier.value} className="min-w-[20px] min-h-[20px]" />
                                  <div className="flex-1">
                                    <p className="font-medium text-base">{tier.label}</p>
                                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                                  </div>
                                </label>
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
                              placeholder="e.g., Dad's college roommate, lives in Chicago..."
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
                      Does everything look correct?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {isBulkMode ? (
                      /* Bulk mode review */
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground text-center">
                          {bulkHouseholds.filter(h => h.householdName.trim() && h.mainContactName.trim()).length} families to submit
                        </p>
                        {bulkHouseholds.filter(h => h.householdName.trim() && h.mainContactName.trim()).map((household, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-1">
                            <p className="font-medium">{household.householdName}</p>
                            <p className="text-sm text-muted-foreground">
                              Contact: {household.mainContactName} · {household.guestCount} guest{household.guestCount > 1 ? "s" : ""}
                              {household.dietary !== "none" && ` · ${DESI_DIETARY_OPTIONS.find(d => d.value === household.dietary)?.label}`}
                            </p>
                          </div>
                        ))}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2 mt-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Relationship</p>
                            <p className="text-base font-medium">
                              {RELATIONSHIP_TIERS.find(t => t.value === form.watch("relationshipTier"))?.label || "Friend"}
                            </p>
                          </div>
                          {form.watch("notes") && (
                            <div>
                              <p className="text-sm text-muted-foreground">Notes</p>
                              <p className="text-base">{form.watch("notes")}</p>
                            </div>
                          )}
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">Submitted by</p>
                            <p className="text-base font-medium">{submitterInfo.name}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single mode review */
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Family Name</p>
                          <p className="text-base font-medium">{form.watch("householdName")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Guests ({guestInputs.filter(g => g.name.trim()).length})</p>
                          <ul className="text-base space-y-1">
                            {guestInputs.filter(g => g.name.trim()).map((guest, i) => (
                              <li key={i} className="flex items-center justify-between gap-2 py-1">
                                <span className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  {guest.name}
                                </span>
                                {guest.dietary && guest.dietary !== "none" && (
                                  <span className="text-xs px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                                    {DESI_DIETARY_OPTIONS.find(d => d.value === guest.dietary)?.label}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Relationship</p>
                          <p className="text-base font-medium">
                            {RELATIONSHIP_TIERS.find(t => t.value === form.watch("relationshipTier"))?.label || "Friend"}
                          </p>
                        </div>
                        {form.watch("notes") && (
                          <div>
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="text-base">{form.watch("notes")}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Submitted by</p>
                          <p className="text-base font-medium">{submitterInfo.name}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              )}

              <CardFooter className="flex gap-3 pt-4">
                {currentStep !== "intro" && (
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
                {currentStep !== "review" ? (
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
                ) : (
                  <Button
                    type="submit"
                    disabled={isBulkMode ? bulkSubmitMutation.isPending : submitMutation.isPending}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    data-testid="button-submit"
                  >
                    {(isBulkMode ? bulkSubmitMutation.isPending : submitMutation.isPending) ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {isBulkMode 
                          ? `Submit ${bulkHouseholds.filter(h => h.householdName.trim() && h.mainContactName.trim()).length} Families` 
                          : "Submit Family"
                        }
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

      {/* AI Guest Assistant - helps parents with questions about adding guests */}
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
