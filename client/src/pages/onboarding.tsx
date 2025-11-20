import { useLocation } from "wouter";
import { OnboardingQuestionnaire } from "@/components/onboarding-questionnaire";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertWedding } from "@shared/schema";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = async (data: any) => {
    try {
      const response = await apiRequest("POST", "/api/weddings", {
        ...data,
        userId: "user-1", // TODO: Replace with actual user ID from auth
      });
      
      await response.json();

      // Backend automatically seeds events based on tradition
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });

      toast({
        title: "Welcome to The Digital Baraat!",
        description: "Your wedding planning journey begins now with pre-configured events for your tradition!",
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
