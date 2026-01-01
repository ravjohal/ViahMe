import { useState } from "react";
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

const familyFormSchema = z.object({
  householdName: z.string().min(1, "Family name is required"),
  mainContactName: z.string().min(1, "Contact name is required"),
  guestPhone: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
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

export default function GuestCollector() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [submitterInfo, setSubmitterInfo] = useState({ name: "", relation: "" });

  const { data: linkInfo, isLoading, error } = useQuery<CollectorLinkInfo>({
    queryKey: ["/api/collector", token],
    enabled: !!token,
    retry: false,
  });

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      householdName: "",
      mainContactName: "",
      guestPhone: "",
      guestEmail: "",
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
    mutationFn: async (data: FamilyFormData) => {
      return apiRequest("POST", `/api/collector/${token}/submit`, {
        ...data,
        guestName: data.householdName,
        isBulkEntry: false,
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
        description: error.message || "Failed to submit family", 
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
      default:
        return true;
    }
  };

  const onSubmit = () => {
    const data = form.getValues();
    submitMutation.mutate(data);
  };

  const handleAddAnother = () => {
    form.reset({
      householdName: "",
      mainContactName: "",
      guestPhone: "",
      guestEmail: "",
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
    setCurrentStep("family");
    setSubmitted(false);
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
              Your guest suggestion has been submitted successfully.
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
                  </CardContent>
                </>
              )}

              {currentStep === "family" && (
                <>
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-pink-500" />
                    </div>
                    <CardTitle className="text-xl">Family Information</CardTitle>
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

                    <div className="space-y-3">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Mailing Address
                      </Label>
                      <FormField
                        control={form.control}
                        name="contactStreet"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Street address"
                                className="min-h-[48px] text-base"
                                data-testid="input-street"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="contactCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="City"
                                  className="min-h-[48px] text-base"
                                  data-testid="input-city"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactState"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="State"
                                  className="min-h-[48px] text-base"
                                  data-testid="input-state"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="contactPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="ZIP / Postal code"
                                  className="min-h-[48px] text-base"
                                  data-testid="input-postal"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field}
                                  placeholder="Country"
                                  className="min-h-[48px] text-base"
                                  data-testid="input-country"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

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
                      Does everything look correct?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Family Name</p>
                        <p className="text-base font-medium">{form.watch("householdName")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Main Contact</p>
                        <p className="text-base font-medium">{form.watch("mainContactName")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Family Members</p>
                        <p className="text-base font-medium">{form.watch("guestCount")} guests</p>
                      </div>
                      {(form.watch("guestPhone") || form.watch("guestEmail")) && (
                        <div>
                          <p className="text-sm text-muted-foreground">Contact Info</p>
                          <p className="text-base">
                            {[form.watch("guestPhone"), form.watch("guestEmail")].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      )}
                      {(form.watch("contactStreet") || form.watch("contactCity")) && (
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-base">
                            {[
                              form.watch("contactStreet"),
                              form.watch("contactCity"),
                              form.watch("contactState"),
                              form.watch("contactPostalCode"),
                              form.watch("contactCountry"),
                            ].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      )}
                      {form.watch("desiDietaryType") && form.watch("desiDietaryType") !== "none" && (
                        <div>
                          <p className="text-sm text-muted-foreground">Dietary Preference</p>
                          <p className="text-base font-medium">
                            {DESI_DIETARY_OPTIONS.find(d => d.value === form.watch("desiDietaryType"))?.label}
                          </p>
                        </div>
                      )}
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
                    disabled={submitMutation.isPending}
                    className="min-h-[48px] flex-1 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Family
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
