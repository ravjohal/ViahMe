import { useLocation } from "wouter";
import { OnboardingQuestionnaire } from "@/components/onboarding-questionnaire";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertWedding } from "@shared/schema";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = async (data: InsertWedding) => {
    try {
      const wedding = await apiRequest<any>("POST", "/api/weddings", {
        ...data,
        userId: "user-1", // TODO: Replace with actual user ID from auth
      });

      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });

      toast({
        title: "Welcome to The Digital Baraat!",
        description: "Your wedding planning journey begins now.",
      });

      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create wedding. Please try again.",
        variant: "destructive",
      });
    }
  };

  return <OnboardingQuestionnaire onComplete={handleComplete} />;
}
