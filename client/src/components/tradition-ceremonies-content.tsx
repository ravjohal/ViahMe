import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Users, Camera, Music, ShoppingBag, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { useTraditionRitualsByTradition, groupRitualsByTiming, TIMING_LABELS } from "@/hooks/use-tradition-rituals";
import type { TraditionRitual } from "@shared/schema";

interface TraditionCeremoniesContentProps {
  traditionSlug: string;
}

function RitualAccordionItem({ ritual }: { ritual: TraditionRitual }) {
  const timingCategory = (ritual.daysBeforeWedding ?? 0) < -1 
    ? "Pre-Wedding" 
    : (ritual.daysBeforeWedding ?? 0) > 1 
      ? "Post-Wedding" 
      : "Wedding Day";

  return (
    <AccordionItem value={ritual.slug}>
      <AccordionTrigger>
        <span className="flex items-center gap-2 flex-wrap">
          <Badge variant={timingCategory === "Wedding Day" ? "default" : "secondary"}>
            {timingCategory}
          </Badge>
          <span className="font-medium">{ritual.name}</span>
          {ritual.nameInLanguage && (
            <span className="text-sm text-muted-foreground font-normal">
              ({ritual.nameInLanguage})
            </span>
          )}
          {ritual.isRequired && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-4">
        {ritual.pronunciation && (
          <p className="text-sm text-muted-foreground italic">
            Pronounced: {ritual.pronunciation}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm text-primary mb-1">What it is</p>
            <p>{ritual.shortDescription}</p>
          </div>

          {ritual.fullDescription && (
            <div>
              <p className="font-medium text-sm text-primary mb-1">Full Description</p>
              <p className="text-muted-foreground">{ritual.fullDescription}</p>
            </div>
          )}

          {ritual.culturalSignificance && (
            <div>
              <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Cultural Significance
              </p>
              <p className="text-muted-foreground">{ritual.culturalSignificance}</p>
            </div>
          )}

          {ritual.spiritualMeaning && (
            <div>
              <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> Spiritual Meaning
              </p>
              <p className="text-muted-foreground">{ritual.spiritualMeaning}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ritual.typicalTiming && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">When</p>
                  <p className="text-sm text-muted-foreground">{ritual.typicalTiming}</p>
                </div>
              </div>
            )}

            {ritual.durationMinutes && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {ritual.durationMinutes >= 60 
                      ? `${Math.floor(ritual.durationMinutes / 60)} hour${ritual.durationMinutes >= 120 ? 's' : ''}${ritual.durationMinutes % 60 ? ` ${ritual.durationMinutes % 60} min` : ''}`
                      : `${ritual.durationMinutes} minutes`}
                  </p>
                </div>
              </div>
            )}

            {ritual.whoParticipates && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Who Participates</p>
                  <p className="text-sm text-muted-foreground">{ritual.whoParticipates}</p>
                </div>
              </div>
            )}
          </div>

          {ritual.whatToExpect && (
            <div>
              <p className="font-medium text-sm text-primary mb-1">What to Expect</p>
              <p className="text-muted-foreground">{ritual.whatToExpect}</p>
            </div>
          )}

          {ritual.itemsNeeded && ritual.itemsNeeded.length > 0 && (
            <div>
              <p className="font-medium text-sm text-primary mb-2 flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" /> Items Needed
              </p>
              <div className="flex flex-wrap gap-2">
                {ritual.itemsNeeded.map((item, idx) => (
                  <Badge key={idx} variant="outline">{item}</Badge>
                ))}
              </div>
            </div>
          )}

          {ritual.photoOpportunities && (
            <div>
              <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
                <Camera className="w-4 h-4" /> Photo Opportunities
              </p>
              <p className="text-muted-foreground">{ritual.photoOpportunities}</p>
            </div>
          )}

          {ritual.musicSuggestions && (
            <div>
              <p className="font-medium text-sm text-primary mb-1 flex items-center gap-1">
                <Music className="w-4 h-4" /> Music Suggestions
              </p>
              <p className="text-muted-foreground">{ritual.musicSuggestions}</p>
            </div>
          )}

          {ritual.modernVariations && (
            <div>
              <p className="font-medium text-sm text-primary mb-1">Modern Variations</p>
              <p className="text-muted-foreground">{ritual.modernVariations}</p>
            </div>
          )}

          {ritual.commonMisconceptions && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
              <p className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Common Misconceptions
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{ritual.commonMisconceptions}</p>
            </div>
          )}

          {ritual.couplesNote && (
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="font-medium text-sm text-primary mb-1">Note for Couples</p>
              <p className="text-sm">{ritual.couplesNote}</p>
            </div>
          )}

          {ritual.historicalOrigin && (
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">Historical Origin</p>
              <p className="text-sm text-muted-foreground">{ritual.historicalOrigin}</p>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function TraditionCeremoniesContent({ traditionSlug }: TraditionCeremoniesContentProps) {
  const { data: rituals = [], isLoading, error } = useTraditionRitualsByTradition(traditionSlug);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Unable to load ceremonies. Please try again later.</p>
      </div>
    );
  }

  if (rituals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No ceremonies have been added for this tradition yet.</p>
        <p className="text-sm mt-2">Check back later as we continue to expand our cultural content.</p>
      </div>
    );
  }

  const grouped = groupRitualsByTiming(rituals);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([timing, groupRituals]) => {
        if (groupRituals.length === 0) return null;
        return (
          <div key={timing}>
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Badge variant={timing === "wedding-day" ? "default" : "secondary"}>
                {TIMING_LABELS[timing]}
              </Badge>
              <span className="text-muted-foreground text-sm font-normal">
                ({groupRituals.length} {groupRituals.length === 1 ? 'ceremony' : 'ceremonies'})
              </span>
            </h4>
            <Accordion type="single" collapsible className="w-full">
              {groupRituals.map((ritual) => (
                <RitualAccordionItem key={ritual.id} ritual={ritual} />
              ))}
            </Accordion>
          </div>
        );
      })}
    </div>
  );
}
