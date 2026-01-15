import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Check, 
  Circle, 
  Play, 
  Pause,
  X,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Camera,
  Music,
  ShoppingBag,
  Star,
  Info,
  ChevronRight,
  Calendar,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import type { TraditionRitual, WeddingJourneyItem, Wedding } from "@shared/schema";


interface JourneyItemWithRitual extends WeddingJourneyItem {
  ritual?: TraditionRitual;
}

interface JourneyResponse {
  journeyItems: JourneyItemWithRitual[];
  availableRituals: TraditionRitual[];
  allRituals: TraditionRitual[];
}

const STATUS_OPTIONS = [
  { value: 'included', label: 'Include', icon: Play, color: 'bg-primary text-primary-foreground' },
  { value: 'considering', label: 'Maybe', icon: Pause, color: 'bg-muted text-muted-foreground' },
  { value: 'skipped', label: 'Skip', icon: X, color: 'bg-muted/50 text-muted-foreground/50' },
  { value: 'completed', label: 'Done', icon: Check, color: 'bg-green-500 text-white' },
];

function RitualDetailDialog({ 
  ritual, 
  item, 
  open, 
  onOpenChange,
  onUpdateStatus
}: { 
  ritual: TraditionRitual; 
  item?: JourneyItemWithRitual;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (status: string) => void;
}) {
  const [notes, setNotes] = useState(item?.notes || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">{ritual.name}</DialogTitle>
            {ritual.nameInLanguage && (
              <span className="text-muted-foreground text-sm">({ritual.nameInLanguage})</span>
            )}
          </div>
          {ritual.pronunciation && (
            <p className="text-sm text-muted-foreground italic">Pronounced: {ritual.pronunciation}</p>
          )}
          <DialogDescription>{ritual.shortDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 -mx-6 px-6 overflow-y-auto overscroll-contain touch-pan-y">
          <div className="space-y-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {ritual.isRequired && (
                <Badge variant="default">Essential Ritual</Badge>
              )}
              {ritual.isPopular && (
                <Badge variant="outline">Popular Choice</Badge>
              )}
              {ritual.typicalTiming && (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {ritual.typicalTiming}
                </Badge>
              )}
              {ritual.durationMinutes && (
                <Badge variant="secondary">
                  ~{ritual.durationMinutes > 60 ? `${Math.round(ritual.durationMinutes / 60)}h` : `${ritual.durationMinutes}min`}
                </Badge>
              )}
            </div>

            <Accordion type="multiple" className="w-full">
              <AccordionItem value="full-description">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    What is this ritual?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed">
                  {ritual.fullDescription}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cultural-significance">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Why is this important?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed">
                  {ritual.culturalSignificance}
                </AccordionContent>
              </AccordionItem>

              {ritual.spiritualMeaning && (
                <AccordionItem value="spiritual">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Spiritual Meaning
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.spiritualMeaning}
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.whatToExpect && (
                <AccordionItem value="expect">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      What to Expect
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.whatToExpect}
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.whoParticipates && (
                <AccordionItem value="participants">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Who Participates
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.whoParticipates}
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.itemsNeeded && (ritual.itemsNeeded as string[]).length > 0 && (
                <AccordionItem value="items">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Items Needed
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="text-sm space-y-1">
                      {(ritual.itemsNeeded as string[]).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Circle className="w-1.5 h-1.5 fill-current" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.photoOpportunities && (
                <AccordionItem value="photos">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photo Opportunities
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.photoOpportunities}
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.musicSuggestions && (
                <AccordionItem value="music">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Music Suggestions
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.musicSuggestions}
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.modernVariations && (
                <AccordionItem value="modern">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Modern Variations
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.modernVariations}
                  </AccordionContent>
                </AccordionItem>
              )}

              {ritual.commonMisconceptions && (
                <AccordionItem value="misconceptions">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Common Misconceptions
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed">
                    {ritual.commonMisconceptions}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {ritual.couplesNote && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Note for Couples</p>
                      <p className="text-sm text-muted-foreground">{ritual.couplesNote}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {item && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Your Notes</label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your personal notes about this ritual..."
                  className="min-h-[100px]"
                  data-testid="input-ritual-notes"
                />
              </div>
            )}
          </div>
        </div>

        {item && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={item.status === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => onUpdateStatus(option.value)}
                data-testid={`button-status-${option.value}`}
              >
                <option.icon className="w-4 h-4 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function WeddingJourneyPage() {
  const { toast } = useToast();
  const [selectedRitual, setSelectedRitual] = useState<TraditionRitual | null>(null);
  const [selectedItem, setSelectedItem] = useState<JourneyItemWithRitual | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const { data: weddings, isLoading: weddingLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  const { data, isLoading, error } = useQuery<JourneyResponse>({
    queryKey: ["/api/wedding-journey/wedding", wedding?.id, "with-rituals"],
    queryFn: async () => {
      const response = await fetch(`/api/wedding-journey/wedding/${wedding!.id}/with-rituals`);
      if (!response.ok) throw new Error("Failed to fetch journey");
      return response.json();
    },
    enabled: !!wedding?.id,
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/wedding-journey/wedding/${wedding!.id}/initialize`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wedding-journey/wedding", wedding?.id, "with-rituals"] });
      toast({ title: "Journey started!", description: "Your wedding journey has been set up." });
    },
  });

  const syncWithEventsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/wedding-journey/wedding/${wedding!.id}/sync-events`);
    },
    onSuccess: (data: { linked: number; created: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wedding-journey/wedding", wedding?.id, "with-rituals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      if (data.linked > 0) {
        toast({ 
          title: "Linked to events", 
          description: `${data.linked} ritual${data.linked > 1 ? 's' : ''} connected to existing events.` 
        });
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/wedding-journey/items/${id}`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wedding-journey/wedding", wedding?.id, "with-rituals"] });
      toast({ title: "Updated", description: "Ritual status has been updated." });
      
      if (variables.status === 'included') {
        syncWithEventsMutation.mutate();
      }
    },
  });

  // Loading or no wedding state
  if (weddingLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please create or select a wedding first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to load journey</h2>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { journeyItems, allRituals } = data;

  if (journeyItems.length === 0 && allRituals.length > 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Your Wedding Journey</CardTitle>
            <CardDescription className="text-base">
              Discover the {allRituals.length} beautiful rituals that make up your wedding tradition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allRituals.slice(0, 6).map((ritual) => (
                <div 
                  key={ritual.id}
                  className="p-3 rounded-lg border bg-muted/30 text-center"
                >
                  <p className="font-medium text-sm">{ritual.name}</p>
                  {ritual.typicalTiming && (
                    <p className="text-xs text-muted-foreground mt-1">{ritual.typicalTiming}</p>
                  )}
                </div>
              ))}
            </div>
            {allRituals.length > 6 && (
              <p className="text-center text-sm text-muted-foreground">
                + {allRituals.length - 6} more rituals
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-start-journey"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {initializeMutation.isPending ? "Setting up your journey..." : "Start Your Journey"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (journeyItems.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No rituals found</h2>
            <p className="text-muted-foreground">
              Please select a wedding tradition to see available rituals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedItems = [...journeyItems].sort((a, b) => {
    const orderA = a.ritual?.sortOrder ?? 999;
    const orderB = b.ritual?.sortOrder ?? 999;
    return orderA - orderB;
  });

  const filteredItems = filter === 'all' 
    ? sortedItems 
    : sortedItems.filter(item => item.status === filter);

  const stats = {
    total: journeyItems.length,
    included: journeyItems.filter(i => i.status === 'included').length,
    completed: journeyItems.filter(i => i.status === 'completed').length,
    considering: journeyItems.filter(i => i.status === 'considering').length,
    skipped: journeyItems.filter(i => i.status === 'skipped').length,
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              Your Wedding Journey
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore and customize the rituals for your celebration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm py-1">
              {stats.included + stats.completed} / {stats.total} planned
            </Badge>
            <Badge variant="secondary" className="text-sm py-1">
              <Check className="w-3 h-3 mr-1" />
              {stats.completed} completed
            </Badge>
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="all" data-testid="filter-all">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="included" data-testid="filter-included">
                Included ({stats.included})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="filter-completed">
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="considering" data-testid="filter-considering">
                Considering ({stats.considering})
              </TabsTrigger>
              <TabsTrigger value="skipped" data-testid="filter-skipped">
                Skipped ({stats.skipped})
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value={filter} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className={`cursor-pointer hover-elevate transition-all ${
                    item.status === 'skipped' ? 'opacity-60' : ''
                  }`}
                  onClick={() => {
                    if (item.ritual) {
                      setSelectedRitual(item.ritual);
                      setSelectedItem(item);
                    }
                  }}
                  data-testid={`ritual-card-${item.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {item.ritual?.name || 'Unknown Ritual'}
                          {item.ritual?.isRequired && (
                            <Badge variant="default" className="text-xs">Essential</Badge>
                          )}
                        </CardTitle>
                        {item.ritual?.nameInLanguage && (
                          <p className="text-xs text-muted-foreground">{item.ritual.nameInLanguage}</p>
                        )}
                      </div>
                      <Badge 
                        variant={item.status === 'completed' ? 'default' : 'outline'}
                        className="capitalize flex-shrink-0"
                      >
                        {item.status === 'included' && <Play className="w-3 h-3 mr-1" />}
                        {item.status === 'completed' && <Check className="w-3 h-3 mr-1" />}
                        {item.status === 'considering' && <Pause className="w-3 h-3 mr-1" />}
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.ritual?.shortDescription}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.eventId && (
                        <Badge variant="default" className="text-xs" data-testid={`badge-linked-event-${item.id}`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          On timeline
                        </Badge>
                      )}
                      {item.ritual?.typicalTiming && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.ritual.typicalTiming}
                        </Badge>
                      )}
                      {item.ritual?.durationMinutes && (
                        <Badge variant="secondary" className="text-xs">
                          {item.ritual.durationMinutes > 60 
                            ? `${Math.round(item.ritual.durationMinutes / 60)}h`
                            : `${item.ritual.durationMinutes}min`
                          }
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      data-testid={`button-learn-more-${item.id}`}
                    >
                      Learn more
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Info className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No rituals found with this filter.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {selectedRitual && (
          <RitualDetailDialog
            ritual={selectedRitual}
            item={selectedItem || undefined}
            open={!!selectedRitual}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedRitual(null);
                setSelectedItem(null);
              }
            }}
            onUpdateStatus={(status) => {
              if (selectedItem) {
                updateStatusMutation.mutate({ id: selectedItem.id, status });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
