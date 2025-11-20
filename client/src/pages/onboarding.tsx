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

const MUSLIM_EVENT_TEMPLATES = [
  { name: "Mangni (Engagement)", eventType: "mangni", description: "Formal engagement ceremony with family blessings" },
  { name: "Mehndi Ceremony", eventType: "mehndi_muslim", description: "Henna application with traditional songs and dances" },
  { name: "Nikah (Wedding Ceremony)", eventType: "nikah", description: "Sacred Islamic marriage contract witnessed by family" },
  { name: "Walima Reception", eventType: "walima", description: "Groom's family hosts grand celebration for the couple" },
  { name: "Rukhsati", eventType: "rukhsati", description: "Bride's emotional farewell from her family" },
];

const GUJARATI_EVENT_TEMPLATES = [
  { name: "Mandvo Mahurat", eventType: "mandvo_mahurat", description: "Auspicious installation of the wedding mandap" },
  { name: "Pithi Ceremony", eventType: "pithi", description: "Turmeric and sandalwood paste application ritual" },
  { name: "Garba Night", eventType: "garba", description: "Traditional Gujarati dance celebration with dandiya" },
  { name: "Jaan (Baraat)", eventType: "jaan", description: "Groom's procession with family and friends" },
  { name: "Pheras (Wedding)", eventType: "pheras_gujarati", description: "Sacred seven circles around the holy fire" },
  { name: "Vidaai", eventType: "vidaai_gujarati", description: "Bride's farewell from her parental home" },
];

const SOUTH_INDIAN_EVENT_TEMPLATES = [
  { name: "Vratham", eventType: "vratham", description: "Pre-wedding purification ritual and prayers" },
  { name: "Nalugu", eventType: "nalugu", description: "Oil bath ceremony with turmeric and kumkum" },
  { name: "Muhurtham (Wedding)", eventType: "muhurtham", description: "Auspicious wedding ceremony at temple" },
  { name: "Oonjal", eventType: "oonjal", description: "Couple seated on swing, blessed by elders" },
  { name: "Saptapadi (Seven Steps)", eventType: "saptapadi", description: "Seven sacred steps around the holy fire" },
  { name: "Arundhati Ceremony", eventType: "arundhati", description: "Viewing the Arundhati star for marital bliss" },
];

const MIXED_EVENT_TEMPLATES = [
  { name: "Engagement Ceremony", eventType: "custom", description: "Fusion engagement combining multiple traditions" },
  { name: "Mehndi & Pre-Wedding", eventType: "custom", description: "Henna ceremony with elements from both cultures" },
  { name: "Sangeet Celebration", eventType: "custom", description: "Music and dance night blending traditions" },
  { name: "Wedding Ceremony", eventType: "custom", description: "Fusion wedding with rituals from both cultures" },
  { name: "Reception", eventType: "reception", description: "Grand celebration honoring all cultural backgrounds" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = async (data: any) => {
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
        : data.tradition === 'muslim'
        ? MUSLIM_EVENT_TEMPLATES
        : data.tradition === 'gujarati'
        ? GUJARATI_EVENT_TEMPLATES
        : data.tradition === 'south_indian'
        ? SOUTH_INDIAN_EVENT_TEMPLATES
        : data.tradition === 'mixed'
        ? MIXED_EVENT_TEMPLATES
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
