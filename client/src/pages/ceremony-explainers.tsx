import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Wand2, 
  Trash2, 
  Edit, 
  Check,
  X,
  Info,
  Users,
  Shirt,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Wedding, Event, CeremonyExplainer } from "@shared/schema";

interface CeremonyExplainersPageProps {
  wedding: Wedding;
}

export default function CeremonyExplainersPage({ wedding }: CeremonyExplainersPageProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CeremonyExplainer>>({});

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding.id],
  });

  const { data: explainers = [], isLoading: explainersLoading } = useQuery<CeremonyExplainer[]>({
    queryKey: ["/api/ceremony-explainers/wedding", wedding.id],
  });

  const generateMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest("/api/ceremony-explainers/generate", {
        method: "POST",
        body: JSON.stringify({ weddingId: wedding.id, eventId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-explainers/wedding", wedding.id] });
      toast({ title: "Explainer generated", description: "AI has created a cultural guide for this ceremony" });
    },
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ceremony-explainers/generate-all", {
        method: "POST",
        body: JSON.stringify({ weddingId: wedding.id }),
      });
    },
    onSuccess: (data: { generated: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-explainers/wedding", wedding.id] });
      toast({ 
        title: "Explainers generated", 
        description: `Created ${data.generated} new cultural guides` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const endpoint = publish 
        ? `/api/ceremony-explainers/${id}/publish` 
        : `/api/ceremony-explainers/${id}/unpublish`;
      return await apiRequest(endpoint, { method: "POST" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-explainers/wedding", wedding.id] });
      toast({ 
        title: variables.publish ? "Published" : "Unpublished",
        description: variables.publish 
          ? "Guests can now see this explainer on your website"
          : "This explainer is hidden from guests"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CeremonyExplainer> }) => {
      return await apiRequest(`/api/ceremony-explainers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-explainers/wedding", wedding.id] });
      setEditingId(null);
      setEditForm({});
      toast({ title: "Updated", description: "Your changes have been saved" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/ceremony-explainers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-explainers/wedding", wedding.id] });
      toast({ title: "Deleted", description: "Explainer has been removed" });
    },
  });

  const explainerByEvent = new Map(explainers.map(e => [e.eventId, e]));
  const isFusionWedding = wedding.tradition === 'mixed' || wedding.partnerNewToTraditions === true;

  const isLoading = eventsLoading || explainersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const handleStartEdit = (explainer: CeremonyExplainer) => {
    setEditingId(explainer.id);
    setEditForm({
      title: explainer.title,
      shortExplainer: explainer.shortExplainer,
      fullExplainer: explainer.fullExplainer,
      culturalSignificance: explainer.culturalSignificance || "",
      attireGuidance: explainer.attireGuidance || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: editForm });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2" data-testid="text-page-title">
            <BookOpen className="w-6 h-6 text-primary" />
            Cultural Translator
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFusionWedding 
              ? "Help your guests understand each ceremony with AI-generated 'Wait, what's happening?' guides"
              : "Create educational guides for guests who may be new to your traditions"
            }
          </p>
        </div>
        <Button 
          onClick={() => generateAllMutation.mutate()}
          disabled={generateAllMutation.isPending}
          data-testid="button-generate-all"
        >
          {generateAllMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          Generate All Explainers
        </Button>
      </div>

      {isFusionWedding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Fusion Wedding Mode Active</p>
                <p className="text-sm text-muted-foreground">
                  Your explainers are specially crafted to help guests who may be attending their first 
                  South Asian ceremony. They'll understand the significance of each ritual and know 
                  exactly what to expect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
            <p className="text-muted-foreground">
              Add events to your timeline first, then generate cultural explainers for each ceremony.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const explainer = explainerByEvent.get(event.id);
            const isEditing = editingId === explainer?.id;

            return (
              <Card key={event.id} data-testid={`card-event-explainer-${event.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription>
                        {event.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {explainer ? (
                        <>
                          <Badge 
                            variant={explainer.isPublished ? "default" : "secondary"}
                            data-testid={`badge-status-${event.id}`}
                          >
                            {explainer.isPublished ? (
                              <><Eye className="w-3 h-3 mr-1" /> Published</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                            )}
                          </Badge>
                          {explainer.isAutoGenerated && (
                            <Badge variant="outline">
                              <Wand2 className="w-3 h-3 mr-1" /> AI Generated
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline">No explainer</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {explainer ? (
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={editForm.title || ""}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            data-testid={`input-title-${event.id}`}
                          />
                        </div>
                        <div>
                          <Label>Short Summary</Label>
                          <Textarea
                            value={editForm.shortExplainer || ""}
                            onChange={(e) => setEditForm({ ...editForm, shortExplainer: e.target.value })}
                            rows={2}
                            data-testid={`textarea-short-${event.id}`}
                          />
                        </div>
                        <div>
                          <Label>Full Explanation</Label>
                          <Textarea
                            value={editForm.fullExplainer || ""}
                            onChange={(e) => setEditForm({ ...editForm, fullExplainer: e.target.value })}
                            rows={6}
                            data-testid={`textarea-full-${event.id}`}
                          />
                        </div>
                        <div>
                          <Label>Cultural Significance</Label>
                          <Textarea
                            value={editForm.culturalSignificance || ""}
                            onChange={(e) => setEditForm({ ...editForm, culturalSignificance: e.target.value })}
                            rows={3}
                            data-testid={`textarea-significance-${event.id}`}
                          />
                        </div>
                        <div>
                          <Label>Attire Guidance</Label>
                          <Textarea
                            value={editForm.attireGuidance || ""}
                            onChange={(e) => setEditForm({ ...editForm, attireGuidance: e.target.value })}
                            rows={2}
                            data-testid={`textarea-attire-${event.id}`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSaveEdit}
                            disabled={updateMutation.isPending}
                            data-testid={`button-save-${event.id}`}
                          >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => { setEditingId(null); setEditForm({}); }}
                            data-testid={`button-cancel-${event.id}`}
                          >
                            <X className="w-4 h-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="preview" className="border-none">
                          <AccordionTrigger className="py-2 hover:no-underline">
                            <span className="text-lg font-medium">{explainer.title}</span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <p className="text-muted-foreground">{explainer.shortExplainer}</p>
                            
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <p className="whitespace-pre-wrap">{explainer.fullExplainer}</p>
                            </div>

                            {explainer.keyMoments && explainer.keyMoments.length > 0 && (
                              <div>
                                <h4 className="font-medium flex items-center gap-2 mb-2">
                                  <Info className="w-4 h-4" /> Key Moments to Watch
                                </h4>
                                <ul className="space-y-2">
                                  {(explainer.keyMoments as { moment: string; explanation: string }[]).map((km, i) => (
                                    <li key={i} className="flex gap-2">
                                      <span className="font-medium">{km.moment}:</span>
                                      <span className="text-muted-foreground">{km.explanation}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {explainer.guestTips && explainer.guestTips.length > 0 && (
                              <div>
                                <h4 className="font-medium flex items-center gap-2 mb-2">
                                  <Users className="w-4 h-4" /> Tips for Guests
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                  {explainer.guestTips.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {explainer.attireGuidance && (
                              <div>
                                <h4 className="font-medium flex items-center gap-2 mb-2">
                                  <Shirt className="w-4 h-4" /> What to Wear
                                </h4>
                                <p className="text-muted-foreground">{explainer.attireGuidance}</p>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      No explainer generated yet. Click the button below to create an AI-powered cultural guide for this ceremony.
                    </p>
                  </CardContent>
                )}

                <CardFooter className="flex flex-wrap gap-2">
                  {explainer ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(explainer)}
                        disabled={isEditing}
                        data-testid={`button-edit-${event.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant={explainer.isPublished ? "outline" : "default"}
                        size="sm"
                        onClick={() => publishMutation.mutate({ id: explainer.id, publish: !explainer.isPublished })}
                        disabled={publishMutation.isPending}
                        data-testid={`button-publish-${event.id}`}
                      >
                        {explainer.isPublished ? (
                          <><EyeOff className="w-4 h-4 mr-1" /> Unpublish</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-1" /> Publish</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateMutation.mutate(event.id)}
                        disabled={generateMutation.isPending}
                        data-testid={`button-regenerate-${event.id}`}
                      >
                        <Wand2 className="w-4 h-4 mr-1" /> Regenerate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(explainer.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${event.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => generateMutation.mutate(event.id)}
                      disabled={generateMutation.isPending}
                      data-testid={`button-generate-${event.id}`}
                    >
                      {generateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-1" />
                      )}
                      Generate Explainer
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
