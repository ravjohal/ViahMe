import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shirt, AlertTriangle, Crown, CheckCircle2, Info, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type FormalityLevel = "casual" | "semi-formal" | "formal" | "black-tie";
type ModestyLevel = 1 | 2 | 3 | 4 | 5; // 1 = relaxed, 5 = very modest

interface StyleCardData {
  ceremony: string;
  icon?: string;
  description: string;
  formality: FormalityLevel;
  modestyLevel: ModestyLevel;
  modestyNotes: string[];
  colorsToAvoid: { color: string; hex: string; reason: string }[];
  suggestedColors: { color: string; hex: string }[];
  outfitSuggestions: { gender: "women" | "men" | "all"; suggestions: string[] }[];
  tips: string[];
}

const FORMALITY_CONFIG: Record<FormalityLevel, { label: string; color: string; bg: string }> = {
  casual: { label: "Casual", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  "semi-formal": { label: "Semi-Formal", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  formal: { label: "Formal", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  "black-tie": { label: "Black Tie", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800/50" },
};

const MODESTY_LABELS = ["Very Relaxed", "Relaxed", "Moderate", "Modest", "Very Modest"];

export const CEREMONY_STYLES: Record<string, StyleCardData> = {
  // Sikh ceremonies
  anand_karaj: {
    ceremony: "Anand Karaj",
    icon: "🛕",
    description: "Sacred Sikh wedding ceremony in the Gurdwara (temple)",
    formality: "formal",
    modestyLevel: 5,
    modestyNotes: [
      "Head covering REQUIRED for everyone (scarves usually provided)",
      "Remove shoes before entering the Gurdwara",
      "Cover shoulders and knees",
      "Avoid sleeveless tops or short dresses",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
      { color: "Black", hex: "#000000", reason: "Considered inauspicious for ceremonies" },
      { color: "Bright Red", hex: "#DC2626", reason: "Reserved for the bride" },
    ],
    suggestedColors: [
      { color: "Pink", hex: "#EC4899" },
      { color: "Turquoise", hex: "#06B6D4" },
      { color: "Gold", hex: "#F59E0B" },
      { color: "Coral", hex: "#F97316" },
      { color: "Emerald", hex: "#10B981" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Saree with dupatta", "Salwar Kameez with dupatta", "Lehenga (modest neckline)", "Long Anarkali suit"] },
      { gender: "men", suggestions: ["Kurta Pajama with turban/patka", "Sherwani", "Formal suit with head covering"] },
    ],
    tips: [
      "Sit cross-legged on the floor (chairs available for those who need them)",
      "Langar (communal meal) is served after - everyone eats together",
      "Photography may be limited during prayers",
    ],
  },
  paath: {
    ceremony: "Paath",
    icon: "🙏",
    description: "Prayer reading ceremony, often held at home or Gurdwara",
    formality: "semi-formal",
    modestyLevel: 4,
    modestyNotes: [
      "Head covering required",
      "Remove shoes before entering prayer area",
      "Modest attire appreciated",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
      { color: "Black", hex: "#000000", reason: "Considered somber" },
    ],
    suggestedColors: [
      { color: "Coral", hex: "#F97316" },
      { color: "Blue", hex: "#3B82F6" },
      { color: "Yellow", hex: "#EAB308" },
      { color: "Green", hex: "#22C55E" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Salwar Kameez", "Saree", "Modest dress with dupatta"] },
      { gender: "men", suggestions: ["Kurta Pajama", "Formal casual with head covering"] },
    ],
    tips: [
      "May last several hours - comfortable seating recommended",
      "Langar (meal) often served",
    ],
  },
  maiyan: {
    ceremony: "Maiyan",
    icon: "✨",
    description: "Turmeric and oil ceremony for the bride/groom (like Haldi)",
    formality: "casual",
    modestyLevel: 2,
    modestyNotes: [
      "Wear clothes you don't mind getting stained!",
      "Yellow/old clothes recommended",
    ],
    colorsToAvoid: [],
    suggestedColors: [
      { color: "Yellow", hex: "#EAB308" },
      { color: "Orange", hex: "#F97316" },
      { color: "Any old clothes", hex: "#A3A3A3" },
    ],
    outfitSuggestions: [
      { gender: "all", suggestions: ["Yellow kurta/dress", "Old comfortable clothes", "Something you can get dirty"] },
    ],
    tips: [
      "Expect to get messy with turmeric paste!",
      "Great for candid photos",
      "Usually held at home or backyard",
    ],
  },
  chunni_chadana: {
    ceremony: "Chunni Chadana",
    icon: "🧣",
    description: "Ceremony where groom's family presents chunni (scarf) to the bride",
    formality: "formal",
    modestyLevel: 3,
    modestyNotes: [
      "Modest traditional attire preferred",
      "May involve sitting on floor",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
      { color: "Black", hex: "#000000", reason: "Considered inauspicious" },
    ],
    suggestedColors: [
      { color: "Pink", hex: "#EC4899" },
      { color: "Red", hex: "#EF4444" },
      { color: "Gold", hex: "#F59E0B" },
      { color: "Purple", hex: "#A855F7" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Saree", "Salwar Kameez", "Lehenga"] },
      { gender: "men", suggestions: ["Kurta Pajama", "Sherwani"] },
    ],
    tips: [
      "Gifts are exchanged between families",
      "Photography welcome",
    ],
  },
  jaggo: {
    ceremony: "Jaggo",
    icon: "🪔",
    description: "Night celebration with decorated pots, dancing in the neighborhood",
    formality: "casual",
    modestyLevel: 1,
    modestyNotes: [
      "Dancing-friendly clothes!",
      "Comfortable for walking/dancing outdoors",
    ],
    colorsToAvoid: [],
    suggestedColors: [
      { color: "Any bright color", hex: "#F43F5E" },
      { color: "Gold accents", hex: "#F59E0B" },
    ],
    outfitSuggestions: [
      { gender: "all", suggestions: ["Bright comfortable clothes", "Dancing-friendly kurta/dress", "Comfortable shoes for walking"] },
    ],
    tips: [
      "Happens late at night (can go until early morning)",
      "Involves dancing through the neighborhood",
      "Very energetic and loud - bring your energy!",
    ],
  },
  chooda: {
    ceremony: "Chooda",
    icon: "💍",
    description: "Bride's maternal uncle gifts red and white bangles",
    formality: "semi-formal",
    modestyLevel: 3,
    modestyNotes: [
      "Traditional attire appreciated",
      "Intimate family ceremony",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
    ],
    suggestedColors: [
      { color: "Pink", hex: "#EC4899" },
      { color: "Yellow", hex: "#EAB308" },
      { color: "Red", hex: "#EF4444" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Salwar Kameez", "Saree"] },
      { gender: "men", suggestions: ["Kurta Pajama"] },
    ],
    tips: [
      "Usually morning of the wedding day",
      "Very emotional and beautiful ceremony",
    ],
  },
  bakra_party: {
    ceremony: "Bakra Party",
    icon: "🎊",
    description: "Groom's bachelor party celebration",
    formality: "casual",
    modestyLevel: 1,
    modestyNotes: [
      "Party wear!",
      "Anything goes",
    ],
    colorsToAvoid: [],
    suggestedColors: [
      { color: "Any", hex: "#6366F1" },
    ],
    outfitSuggestions: [
      { gender: "men", suggestions: ["Party wear", "Smart casual", "Club attire"] },
    ],
    tips: [
      "This is a party - have fun!",
      "Usually the night before the wedding",
    ],
  },
  // Hindu ceremonies
  haldi: {
    ceremony: "Haldi",
    icon: "💛",
    description: "Turmeric paste ceremony for good luck and glowing skin",
    formality: "casual",
    modestyLevel: 2,
    modestyNotes: [
      "WEAR OLD CLOTHES - turmeric stains permanently!",
      "Yellow attire is traditional but not required",
    ],
    colorsToAvoid: [],
    suggestedColors: [
      { color: "Yellow", hex: "#EAB308" },
      { color: "Orange", hex: "#F97316" },
      { color: "White (will stain yellow!)", hex: "#FEF3C7" },
    ],
    outfitSuggestions: [
      { gender: "all", suggestions: ["Yellow kurta/dress", "Old comfortable clothes", "Something you don't mind staining"] },
    ],
    tips: [
      "Expect to get messy!",
      "Usually held outdoors or in backyard",
      "Fun, playful atmosphere",
    ],
  },
  mehndi: {
    ceremony: "Mehndi",
    icon: "🎨",
    description: "Henna application party for the bride",
    formality: "semi-formal",
    modestyLevel: 2,
    modestyNotes: [
      "Colorful, festive attire encouraged",
      "Comfortable for sitting",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
      { color: "Black", hex: "#000000", reason: "Not festive" },
    ],
    suggestedColors: [
      { color: "Green", hex: "#22C55E" },
      { color: "Yellow", hex: "#EAB308" },
      { color: "Orange", hex: "#F97316" },
      { color: "Pink", hex: "#EC4899" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Colorful salwar kameez", "Lehenga choli", "Indo-western dress", "Guests can also get henna!"] },
      { gender: "men", suggestions: ["Colorful kurta", "Smart casual Indian wear"] },
    ],
    tips: [
      "Lasts 3-5 hours as bride's mehndi is applied",
      "Music, dancing, and snacks",
      "Guests can also get henna applied!",
    ],
  },
  sangeet: {
    ceremony: "Sangeet",
    icon: "🎵",
    description: "Musical night with choreographed dances and performances",
    formality: "formal",
    modestyLevel: 2,
    modestyNotes: [
      "Glamorous party wear!",
      "Dancing-friendly but dressy",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Not festive for celebrations" },
    ],
    suggestedColors: [
      { color: "Any bright/jewel tones", hex: "#8B5CF6" },
      { color: "Sequins & sparkle welcome!", hex: "#F59E0B" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Glamorous lehenga", "Designer saree", "Cocktail dress", "Indo-western gown"] },
      { gender: "men", suggestions: ["Designer sherwani", "Bandhgala", "Indo-western suit", "Stylish kurta"] },
    ],
    tips: [
      "Biggest party of the wedding week!",
      "Prepare for lots of dancing",
      "Often has a DJ and dance floor",
    ],
  },
  baraat: {
    ceremony: "Baraat",
    icon: "🐎",
    description: "Groom's grand procession to the venue with dancing and music",
    formality: "formal",
    modestyLevel: 2,
    modestyNotes: [
      "Dancing-friendly but festive formal",
      "Comfortable shoes for dancing outdoors",
    ],
    colorsToAvoid: [
      { color: "Black", hex: "#000000", reason: "Not celebratory" },
    ],
    suggestedColors: [
      { color: "Gold", hex: "#F59E0B" },
      { color: "Maroon", hex: "#991B1B" },
      { color: "Royal Blue", hex: "#1D4ED8" },
      { color: "Any festive color", hex: "#EC4899" },
    ],
    outfitSuggestions: [
      { gender: "all", suggestions: ["Festive traditional wear", "Comfortable for dancing", "Bright colors"] },
    ],
    tips: [
      "Be prepared to DANCE!",
      "Usually outdoors in parking lot or street",
      "Loud dhol drums - embrace it!",
    ],
  },
  milni: {
    ceremony: "Milni",
    icon: "🤝",
    description: "Formal meeting and garlanding between both families",
    formality: "formal",
    modestyLevel: 3,
    modestyNotes: [
      "Formal traditional attire",
      "Respectful of religious setting",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
      { color: "Black", hex: "#000000", reason: "Not auspicious" },
    ],
    suggestedColors: [
      { color: "Festive traditional colors", hex: "#DC2626" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Saree", "Salwar kameez", "Lehenga"] },
      { gender: "men", suggestions: ["Kurta pajama", "Sherwani", "Formal suit"] },
    ],
    tips: [
      "Brief ceremony before the main wedding",
      "Family members exchange garlands",
    ],
  },
  pheras: {
    ceremony: "Pheras",
    icon: "🔥",
    description: "The sacred wedding ceremony - walking around the holy fire",
    formality: "formal",
    modestyLevel: 4,
    modestyNotes: [
      "Modest, respectful attire",
      "May sit on floor for extended periods",
      "Remove shoes in mandap area",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Associated with mourning" },
      { color: "Black", hex: "#000000", reason: "Inauspicious for weddings" },
      { color: "Bright Red", hex: "#DC2626", reason: "Reserved for the bride" },
    ],
    suggestedColors: [
      { color: "Gold", hex: "#F59E0B" },
      { color: "Pink", hex: "#EC4899" },
      { color: "Maroon", hex: "#991B1B" },
      { color: "Emerald", hex: "#10B981" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Elegant saree", "Lehenga", "Anarkali suit"] },
      { gender: "men", suggestions: ["Sherwani", "Kurta pajama", "Formal traditional"] },
    ],
    tips: [
      "Can be 2-4 hours long",
      "Sacred ceremony - photography often restricted",
      "Bring patience and open heart",
    ],
  },
  vidaai: {
    ceremony: "Vidaai",
    icon: "👋",
    description: "Emotional farewell as the bride leaves her parents' home",
    formality: "formal",
    modestyLevel: 3,
    modestyNotes: [
      "Same attire as wedding ceremony",
      "Have tissues ready!",
    ],
    colorsToAvoid: [],
    suggestedColors: [
      { color: "Same as ceremony", hex: "#A855F7" },
    ],
    outfitSuggestions: [
      { gender: "all", suggestions: ["Continue wearing ceremony attire"] },
    ],
    tips: [
      "Very emotional - tears expected",
      "Bride throws rice over her shoulder",
      "Usually immediately follows the wedding",
    ],
  },
  // Muslim ceremonies
  nikah: {
    ceremony: "Nikah",
    icon: "💒",
    description: "Islamic marriage ceremony with signing of marriage contract",
    formality: "formal",
    modestyLevel: 5,
    modestyNotes: [
      "Head covering required for women in mosque",
      "Full arm and leg coverage",
      "Conservative, modest attire",
      "Remove shoes before entering prayer area",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Worn for burial rites" },
      { color: "Black", hex: "#000000", reason: "Not celebratory" },
    ],
    suggestedColors: [
      { color: "Jewel tones", hex: "#059669" },
      { color: "Pastels", hex: "#F9A8D4" },
      { color: "Gold", hex: "#F59E0B" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Modest sharara/gharara", "Long-sleeve maxi dress with hijab", "Salwar kameez with dupatta covering head"] },
      { gender: "men", suggestions: ["Sherwani", "Kurta pajama with cap", "Formal suit with prayer cap"] },
    ],
    tips: [
      "Ceremony usually 30-60 minutes",
      "Separate seating for men and women sometimes",
      "Signing of Nikahnama (marriage contract)",
    ],
  },
  walima: {
    ceremony: "Walima",
    icon: "🍽️",
    description: "Wedding feast/reception hosted by groom's family",
    formality: "formal",
    modestyLevel: 3,
    modestyNotes: [
      "Modest but celebratory attire",
      "Head covering optional but appreciated",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Not festive" },
    ],
    suggestedColors: [
      { color: "Any festive color", hex: "#8B5CF6" },
      { color: "Pastels", hex: "#FBCFE8" },
      { color: "Jewel tones", hex: "#0E7490" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Elegant sharara", "Lehenga", "Formal dress", "Saree"] },
      { gender: "men", suggestions: ["Sherwani", "Formal suit", "Kurta pajama"] },
    ],
    tips: [
      "This is the main reception/feast",
      "Usually 1-3 days after Nikah",
      "Great food - come hungry!",
    ],
  },
  // General events
  reception: {
    ceremony: "Reception",
    icon: "🎉",
    description: "Grand celebration and dinner party for all guests",
    formality: "formal",
    modestyLevel: 2,
    modestyNotes: [
      "Dress to impress!",
      "This is the most glamorous event",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Reserved for Western brides (not applicable here but still avoided)" },
    ],
    suggestedColors: [
      { color: "Any glamorous color", hex: "#7C3AED" },
      { color: "Jewel tones", hex: "#0F766E" },
      { color: "Metallics welcome!", hex: "#D4AF37" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Designer lehenga", "Elegant saree", "Cocktail gown", "Indo-western"] },
      { gender: "men", suggestions: ["Sherwani", "Tuxedo", "Designer suit", "Bandhgala"] },
    ],
    tips: [
      "Biggest party - photos with couple!",
      "Dinner, drinks, dancing",
      "Usually 4-5 hours",
    ],
  },
  cocktail: {
    ceremony: "Cocktail Party",
    icon: "🍸",
    description: "Pre-wedding or post-ceremony cocktail party",
    formality: "semi-formal",
    modestyLevel: 1,
    modestyNotes: [
      "Cocktail attire - smart and fun!",
    ],
    colorsToAvoid: [],
    suggestedColors: [
      { color: "Any color works", hex: "#F43F5E" },
    ],
    outfitSuggestions: [
      { gender: "women", suggestions: ["Cocktail dress", "Dressy separates", "Short lehenga", "Indo-western"] },
      { gender: "men", suggestions: ["Blazer with kurta", "Smart casual suit", "Designer kurta"] },
    ],
    tips: [
      "More relaxed than reception",
      "Great for mingling",
    ],
  },
  custom: {
    ceremony: "Special Event",
    icon: "📅",
    description: "Custom ceremony or event",
    formality: "semi-formal",
    modestyLevel: 2,
    modestyNotes: [
      "Check with the couple for specific guidance",
    ],
    colorsToAvoid: [
      { color: "White", hex: "#FFFFFF", reason: "Generally avoided at South Asian celebrations" },
      { color: "Black", hex: "#000000", reason: "May not be festive enough" },
    ],
    suggestedColors: [
      { color: "Bright colors", hex: "#EC4899" },
      { color: "Traditional colors", hex: "#F59E0B" },
    ],
    outfitSuggestions: [
      { gender: "all", suggestions: ["Smart traditional wear", "Festive colors", "Ask the couple!"] },
    ],
    tips: [
      "When in doubt, ask the couple",
      "Err on the side of dressing up",
    ],
  },
};

interface CeremonyStyleCardProps {
  ceremonyType: string;
  ceremonyName?: string;
  compact?: boolean;
}

export function CeremonyStyleCard({ ceremonyType, ceremonyName, compact = false }: CeremonyStyleCardProps) {
  const styleData = CEREMONY_STYLES[ceremonyType] || CEREMONY_STYLES.custom;
  const formalityConfig = FORMALITY_CONFIG[styleData.formality];
  
  if (compact) {
    return (
      <Card className="overflow-hidden" data-testid={`style-card-compact-${ceremonyType}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{styleData.icon}</span>
              <h4 className="font-semibold">{ceremonyName || styleData.ceremony}</h4>
            </div>
            <Badge className={`${formalityConfig.bg} ${formalityConfig.color} border-0`}>
              {formalityConfig.label}
            </Badge>
          </div>
          
          {styleData.colorsToAvoid.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Avoid:</span>
              {styleData.colorsToAvoid.slice(0, 3).map((c) => (
                <Tooltip key={c.color}>
                  <TooltipTrigger>
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-red-400 relative"
                      style={{ backgroundColor: c.hex }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-0.5 bg-red-500 rotate-45 rounded-full" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{c.color}</p>
                    <p className="text-xs">{c.reason}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
          
          {styleData.modestyNotes.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{styleData.modestyNotes[0]}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden" data-testid={`style-card-${ceremonyType}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{styleData.icon}</span>
            <div>
              <CardTitle className="text-xl">{ceremonyName || styleData.ceremony}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{styleData.description}</p>
            </div>
          </div>
          <Badge className={`${formalityConfig.bg} ${formalityConfig.color} border-0`}>
            <Crown className="w-3 h-3 mr-1" />
            {formalityConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Modesty Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <Shirt className="w-4 h-4" />
              Modesty Level
            </span>
            <span className="text-muted-foreground">{MODESTY_LABELS[styleData.modestyLevel - 1]}</span>
          </div>
          <Progress value={styleData.modestyLevel * 20} className="h-2" />
          {styleData.modestyNotes.length > 0 && (
            <ul className="mt-2 space-y-1">
              {styleData.modestyNotes.map((note, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Colors to Avoid */}
        {styleData.colorsToAvoid.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Colors to Avoid
            </h4>
            <div className="flex flex-wrap gap-2">
              {styleData.colorsToAvoid.map((c) => (
                <Tooltip key={c.color}>
                  <TooltipTrigger>
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div 
                        className="w-5 h-5 rounded-full border relative"
                        style={{ backgroundColor: c.hex, borderColor: c.hex === '#FFFFFF' ? '#E5E7EB' : c.hex }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-0.5 bg-red-500 rotate-45 rounded-full" />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">{c.color}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{c.reason}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
        
        {/* Suggested Colors */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Suggested Colors
          </h4>
          <div className="flex flex-wrap gap-2">
            {styleData.suggestedColors.map((c) => (
              <div key={c.color} className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div 
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: c.hex, borderColor: c.hex === '#FFFFFF' ? '#E5E7EB' : c.hex }}
                />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">{c.color}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Outfit Suggestions */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            What to Wear
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {styleData.outfitSuggestions.map((group) => (
              <div key={group.gender} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.gender === "all" ? "Everyone" : `For ${group.gender}`}
                </p>
                <ul className="text-sm space-y-1">
                  {group.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tips */}
        {styleData.tips.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <h4 className="font-medium text-sm flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {styleData.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AllCeremonyStyles() {
  const ceremonies = Object.entries(CEREMONY_STYLES);
  
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {ceremonies.map(([type]) => (
        <CeremonyStyleCard key={type} ceremonyType={type} />
      ))}
    </div>
  );
}
