import { useState } from "react";
import { useLocation } from "wouter";
import { OnboardingQuestionnaire } from "@/components/onboarding-questionnaire";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2 } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleQuestionnaireComplete = (data: any) => {
    setQuestionnaireData(data);
    setShowRegister(true);
  };

  const handleRegisterAndCreateWedding = async (registerData: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Step 1: Register the user
      const registerResponse = await apiRequest("POST", "/api/auth/register", {
        email: registerData.email,
        password: registerData.password,
        role: "couple",
      });
      const { user } = await registerResponse.json();
      setRegisteredEmail(user.email);

      // Step 2: Log them in automatically
      await apiRequest("POST", "/api/auth/login", {
        email: registerData.email,
        password: registerData.password,
      });

      // Refetch user to update auth context - WAIT for it to complete
      const { data: authData } = await refetchUser();
      console.log("[Onboarding] Refetched auth data:", authData);
      
      // Extract user from response (backend returns { user: {...} })
      const loggedInUser = authData?.user;
      
      if (!loggedInUser || !loggedInUser.id) {
        console.error("[Onboarding] User authentication failed:", { authData, loggedInUser });
        throw new Error("Failed to authenticate user - user ID missing");
      }

      console.log("[Onboarding] Authenticated user ID:", loggedInUser.id);

      // Step 3: Create the wedding with the authenticated user
      const weddingPayload = {
        ...questionnaireData,
        userId: loggedInUser.id,
      };
      console.log("[Onboarding] Creating wedding with payload:", weddingPayload);
      
      const weddingResponse = await apiRequest("POST", "/api/weddings", weddingPayload);
      const weddingData = await weddingResponse.json();
      console.log("[Onboarding] Wedding created successfully:", weddingData);

      // Backend automatically seeds events based on tradition
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/events"], exact: false });

      setRegistrationComplete(true);

      toast({
        title: "Account created!",
        description: "You can now access your wedding dashboard.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={logoUrl}
              alt="Viah.me"
              className="h-20 mx-auto object-contain mb-4"
            />
          </div>

          <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Account Created Successfully!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your account <strong className="text-foreground">{registeredEmail}</strong> is ready.
              You're all set to start planning your wedding!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Click below to access your personalized wedding dashboard.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-full"
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={logoUrl}
              alt="Viah.me"
              className="h-20 mx-auto object-contain mb-4"
            />
            <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-muted-foreground mt-2">
              One last step to start planning your wedding
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegisterAndCreateWedding)} className="space-y-6">
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          disabled={isLoading}
                          className="h-12 rounded-lg border-2 focus-visible:ring-orange-500"
                          data-testid="input-register-email"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Use this to login to your account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Create a password (min 8 characters)"
                          disabled={isLoading}
                          className="h-12 rounded-lg border-2 focus-visible:ring-orange-500"
                          data-testid="input-register-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm your password"
                          disabled={isLoading}
                          className="h-12 rounded-lg border-2 focus-visible:ring-orange-500"
                          data-testid="input-register-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg"
                  data-testid="button-create-account"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account & Start Planning"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-orange-600 font-semibold hover:text-orange-700 hover:underline"
                  data-testid="link-login"
                >
                  Sign In
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <OnboardingQuestionnaire onComplete={handleQuestionnaireComplete} />;
}
