import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Calendar, Heart, MapPin, Users, DollarSign, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const questionnaireSchema = z.object({
  tradition: z.enum(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general']),
  role: z.enum(['bride', 'groom', 'planner']),
  weddingDate: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  guestCountEstimate: z.string().optional(),
  totalBudget: z.string().optional(),
});

type QuestionnaireData = z.infer<typeof questionnaireSchema>;

interface OnboardingQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void;
}

const STEPS = [
  {
    id: 1,
    title: "Cultural Framework",
    description: "What traditions will you observe?",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Your Role",
    description: "How are you involved in this celebration?",
    icon: Heart,
  },
  {
    id: 3,
    title: "Wedding Details",
    description: "Tell us about your special day",
    icon: Calendar,
  },
  {
    id: 4,
    title: "Location & Scale",
    description: "Where and how big?",
    icon: MapPin,
  },
  {
    id: 5,
    title: "Budget Planning",
    description: "Financial considerations",
    icon: DollarSign,
  },
];

export function OnboardingQuestionnaire({ onComplete }: OnboardingQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      tradition: undefined,
      role: undefined,
      weddingDate: "",
      location: "",
      guestCountEstimate: undefined,
      totalBudget: "",
    },
  });

  const onSubmit = (data: QuestionnaireData) => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Transform data before passing to onComplete
      const transformedData = {
        ...data,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
        guestCountEstimate: data.guestCountEstimate && data.guestCountEstimate !== "" 
          ? Number(data.guestCountEstimate) 
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
  const CurrentIcon = STEPS[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 md:p-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <img 
                src={new URL("@assets/viah-logo.png", import.meta.url).href}
                alt="Viah.me"
                className="h-32 w-auto mb-3 object-contain"
                data-testid="logo-viah"
              />
              <p className="text-lg text-muted-foreground">Welcome! Let's plan your perfect celebration</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono font-semibold">Step {currentStep}</span>
              <span>/</span>
              <span className="font-mono">{STEPS.length}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-questionnaire" />
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
                <div className="p-3 rounded-xl bg-primary/10">
                  <CurrentIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  <p className="text-muted-foreground">
                    {STEPS[currentStep - 1].description}
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {currentStep === 1 && (
                  <FormField
                    control={form.control}
                    name="tradition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Wedding Tradition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tradition" className="h-12">
                              <SelectValue placeholder="Select your tradition..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sikh" data-testid="option-sikh">
                              <div className="flex flex-col">
                                <span className="font-semibold">Sikh Wedding</span>
                                <span className="text-xs text-muted-foreground">Anand Karaj ceremony at Gurdwara</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="hindu" data-testid="option-hindu">
                              <div className="flex flex-col">
                                <span className="font-semibold">Hindu Wedding</span>
                                <span className="text-xs text-muted-foreground">Pheras ceremony with Vedic rituals</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="muslim" data-testid="option-muslim">
                              <div className="flex flex-col">
                                <span className="font-semibold">Muslim Wedding</span>
                                <span className="text-xs text-muted-foreground">Nikah ceremony with Walima</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="gujarati" data-testid="option-gujarati">
                              <div className="flex flex-col">
                                <span className="font-semibold">Gujarati Wedding</span>
                                <span className="text-xs text-muted-foreground">Garba night with traditional Pheras</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="south_indian" data-testid="option-south-indian">
                              <div className="flex flex-col">
                                <span className="font-semibold">South Indian Wedding</span>
                                <span className="text-xs text-muted-foreground">Muhurtham with Saptapadi</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="mixed" data-testid="option-mixed">
                              <div className="flex flex-col">
                                <span className="font-semibold">Mixed Tradition</span>
                                <span className="text-xs text-muted-foreground">Fusion of multiple cultural customs</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="general" data-testid="option-general">
                              <div className="flex flex-col">
                                <span className="font-semibold">General Indian Wedding</span>
                                <span className="text-xs text-muted-foreground">Custom celebration style</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentStep === 2 && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Your Role</FormLabel>
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
                )}

                {currentStep === 3 && (
                  <FormField
                    control={form.control}
                    name="weddingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Wedding Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-wedding-date"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentStep === 4 && (
                  <>
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., San Francisco Bay Area"
                              {...field}
                              data-testid="input-location"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guestCountEstimate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Estimated Guest Count (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 300"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-guest-count"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 5 && (
                  <FormField
                    control={form.control}
                    name="totalBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Total Budget (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 50000"
                            {...field}
                            data-testid="input-budget"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
