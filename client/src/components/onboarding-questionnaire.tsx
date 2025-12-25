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
import { Calendar, MapPin, Users, DollarSign, Crown, Gift, Lightbulb, TrendingUp, Info } from "lucide-react";
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
      role: "bride",
      weddingDate: "2025-06-15",
      location: "San Francisco Bay Area",
      guestCountEstimate: "300",
      totalBudget: "50000",
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
                Welcome! Let's plan your perfect celebration 🎊
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
                  <FormField
                    control={form.control}
                    name="tradition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Wedding Tradition</FormLabel>
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
                )}

                {currentStep === 3 && (
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
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Location</FormLabel>
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
                          <FormLabel className="text-lg font-semibold tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
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
                  <div className="space-y-6">
                    {/* Budget Guidance Panel */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-full bg-emerald-100">
                          <Lightbulb className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-900 mb-1">Budget Planning Guide</h4>
                          <p className="text-sm text-emerald-700">
                            South Asian weddings typically involve multiple events over 3-5 days. Here's how to estimate your budget:
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-emerald-900">Per Guest Rule of Thumb:</span>
                            <span className="text-emerald-700 ml-1">
                              Budget $150-$300 per guest for a traditional celebration
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-emerald-900">Typical Ranges:</span>
                            <ul className="text-emerald-700 mt-1 space-y-1 ml-2">
                              <li>• <span className="font-medium">100 guests:</span> $25,000 - $50,000</li>
                              <li>• <span className="font-medium">200 guests:</span> $40,000 - $80,000</li>
                              <li>• <span className="font-medium">300+ guests:</span> $60,000 - $150,000+</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-emerald-900">Key Cost Drivers:</span>
                            <span className="text-emerald-700 ml-1">
                              Venue (25-30%), Catering (25-35%), Photography (10-15%), Décor (10-15%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic suggestion based on guest count */}
                      {form.watch('guestCountEstimate') && parseInt(form.watch('guestCountEstimate') || '0') > 0 && (
                        <div className="mt-4 p-3 bg-white/60 rounded-md border border-emerald-200">
                          <p className="text-sm text-emerald-800">
                            <span className="font-semibold">Based on {form.watch('guestCountEstimate')} guests: </span>
                            We suggest starting with a budget between{' '}
                            <span className="font-bold text-emerald-700">
                              ${(parseInt(form.watch('guestCountEstimate') || '0') * 150).toLocaleString()}
                            </span>
                            {' '}-{' '}
                            <span className="font-bold text-emerald-700">
                              ${(parseInt(form.watch('guestCountEstimate') || '0') * 300).toLocaleString()}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

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
