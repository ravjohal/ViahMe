import { useLocation } from "wouter";
import { OnboardingQuestionnaire } from "@/components/onboarding-questionnaire";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertWedding } from "@shared/schema";

// Event templates for different traditions
const SIKH_EVENT_TEMPLATES = [
  { name: "Paath (Prayer Ceremony)", eventType: "paath", description: "3-day prayer ceremony at home or Gurdwara" },
  { name: "Mehndi & Maiyan", eventType: "mehndi", description: "Henna application and turmeric ceremony" },
  { name: "Lady Sangeet", eventType: "sangeet", description: "Music and dance celebration (2 days before wedding)" },
  { name: "Anand Karaj (Wedding Ceremony)", eventType: "anand_karaj", description: "Sacred Sikh wedding ceremony at Gurdwara" },
  { name: "Reception", eventType: "reception", description: "Grand celebration with all guests" },
];

const HINDU_EVENT_TEMPLATES = [
  { name: "Tilak Ceremony", eventType: "tilak", description: "Groom's forehead blessing ceremony" },
  { name: "Haldi Ceremony", eventType: "haldi", description: "Turmeric paste application for both bride and groom" },
  { name: "Mehendi Ceremony", eventType: "mehendi", description: "Henna art application for the bride" },
  { name: "Sangeet Night", eventType: "sangeet_hindu", description: "Music, dance, and pre-wedding festivities" },
  { name: "Pheras (Wedding Ceremony)", eventType: "pheras", description: "Sacred Hindu wedding ceremony with seven vows" },
  { name: "Vidaai", eventType: "vidaai", description: "Emotional farewell as bride leaves her family home" },
  { name: "Chunni Ceremony", eventType: "chunni_ceremony", description: "Groom's family presents chunni to the bride" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = async (data: InsertWedding) => {
    try {
      const response = await apiRequest("POST", "/api/weddings", {
        ...data,
        userId: "user-1", // TODO: Replace with actual user ID from auth
      });
      
      const wedding = await response.json();

      // Auto-seed events based on tradition
      const eventTemplates = data.tradition === 'sikh' 
        ? SIKH_EVENT_TEMPLATES 
        : data.tradition === 'hindu' 
        ? HINDU_EVENT_TEMPLATES 
        : [];

      if (eventTemplates.length > 0) {
        // Create all events in parallel
        await Promise.all(
          eventTemplates.map((template, index) =>
            apiRequest("POST", "/api/events", {
              weddingId: wedding.id,
              name: template.name,
              type: template.eventType,
              description: template.description,
              order: index + 1,
            })
          )
        );
      }

      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });

      toast({
        title: "Welcome to The Digital Baraat!",
        description: eventTemplates.length > 0 
          ? `Your wedding planning journey begins now with ${eventTemplates.length} pre-configured events!`
          : "Your wedding planning journey begins now.",
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
