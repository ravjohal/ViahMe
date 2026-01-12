import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, Sparkles, Clock, AlertTriangle, CheckCircle, ChevronRight, Plus, Trash2, Send, MapPin, Shirt } from "lucide-react";
import type { Event, Guest, RitualRoleAssignment, Wedding, RitualRoleTemplate } from "@shared/schema";

type RoleTemplateMap = Record<string, RitualRoleTemplate[]>;

function RitualRolesContent({ weddingId }: { weddingId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [customTiming, setCustomTiming] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customAttireNotes, setCustomAttireNotes] = useState("");

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", weddingId],
  });

  const { data: guests = [], isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests", weddingId],
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<RitualRoleAssignment[]>({
    queryKey: ["/api/ritual-roles", "wedding", weddingId],
  });

  const { data: roleTemplates = {} } = useQuery<RoleTemplateMap>({
    queryKey: ["/api/ritual-roles/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/ritual-roles", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ritual-roles", "wedding", weddingId] });
      setIsAssignDialogOpen(false);
      resetForm();
      toast({ title: "Role assigned!", description: "The guest will see their mission card in their portal." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign role. Please try again.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/ritual-roles/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ritual-roles", "wedding", weddingId] });
      toast({ title: "Role removed", description: "The assignment has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove role.", variant: "destructive" });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/ritual-roles/${id}/mark-completed`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ritual-roles", "wedding", weddingId] });
      toast({ title: "Role completed", description: "Marked as done." });
    },
  });

  const resetForm = () => {
    setSelectedTemplate(null);
    setSelectedGuestId("");
    setCustomInstructions("");
    setCustomTiming("");
    setCustomLocation("");
    setCustomAttireNotes("");
  };

  const handleAssignRole = () => {
    if (!selectedEvent || !selectedGuestId || !selectedTemplate) {
      toast({ title: "Missing fields", description: "Please select an event, guest, and role.", variant: "destructive" });
      return;
    }

    const event = events.find((e) => e.id === selectedEvent);
    const eventType = event?.type || "custom";
    const templates = roleTemplates[eventType] || roleTemplates.custom || [];
    const template = templates.find((t) => t.roleName === selectedTemplate);

    if (!template) {
      toast({ title: "Error", description: "Template not found.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      weddingId,
      eventId: selectedEvent,
      guestId: selectedGuestId,
      roleName: template.roleName,
      roleDisplayName: template.roleDisplayName,
      description: template.description,
      instructions: customInstructions || template.instructions,
      timing: customTiming || template.timing,
      location: customLocation || undefined,
      attireNotes: customAttireNotes || undefined,
      priority: template.priority,
    });
  };

  const currentEvent = events.find((e) => e.id === selectedEvent);
  const eventType = currentEvent?.type || "custom";
  const availableTemplates = roleTemplates[eventType] || roleTemplates.custom || [];
  const eventAssignments = assignments.filter((a) => a.eventId === selectedEvent);

  const getGuestName = (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId);
    return guest?.name || "Unknown Guest";
  };

  const getEventName = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    return event?.name || "Unknown Event";
  };

  if (eventsLoading || guestsLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-ritual-roles">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const assignmentsByEvent = events.reduce((acc, event) => {
    acc[event.id] = assignments.filter((a) => a.eventId === event.id);
    return acc;
  }, {} as Record<string, RitualRoleAssignment[]>);

  return (
    <div className="space-y-6" data-testid="ritual-roles-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Ritual Roles</h1>
          <p className="text-muted-foreground">
            Assign ceremonial duties to guests and send them "Mission Cards" with instructions.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Users className="h-4 w-4 mr-1" />
          {assignments.length} roles assigned
        </Badge>
      </div>

      <Tabs defaultValue="by-event" className="w-full">
        <TabsList>
          <TabsTrigger value="by-event" data-testid="tab-by-event">By Ceremony</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-roles">All Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="by-event" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ceremonies</CardTitle>
                  <CardDescription>Select a ceremony to manage roles</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1 p-3">
                      {events.map((event) => {
                        const eventRoles = assignmentsByEvent[event.id] || [];
                        const hasRoles = (roleTemplates[event.type]?.length || 0) > 0;
                        return (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors hover-elevate ${
                              selectedEvent === event.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted"
                            }`}
                            data-testid={`button-select-event-${event.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{event.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                {event.date && new Date(event.date).toLocaleDateString()}
                                {eventRoles.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {eventRoles.length} assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {hasRoles && <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedEvent ? (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>{currentEvent?.name}</CardTitle>
                      <CardDescription>
                        {availableTemplates.length > 0
                          ? `${availableTemplates.length} role templates available for this ceremony type`
                          : "Custom roles can be created for this event"}
                      </CardDescription>
                    </div>
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-assign-role">
                          <Plus className="h-4 w-4 mr-2" />
                          Assign Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Assign a Ritual Role</DialogTitle>
                          <DialogDescription>
                            Select a role template and assign it to a guest. They'll receive a "Mission Card" in their portal.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Role Template</Label>
                            <Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
                              <SelectTrigger data-testid="select-role-template">
                                <SelectValue placeholder="Select a role..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTemplates.map((template) => (
                                  <SelectItem key={template.roleName} value={template.roleName}>
                                    <div className="flex items-center gap-2">
                                      <span>{template.roleDisplayName}</span>
                                      <PriorityBadge priority={template.priority} />
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedTemplate && (
                              <p className="text-sm text-muted-foreground">
                                {availableTemplates.find((t) => t.roleName === selectedTemplate)?.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Assign to Guest</Label>
                            <Select value={selectedGuestId} onValueChange={setSelectedGuestId}>
                              <SelectTrigger data-testid="select-guest">
                                <SelectValue placeholder="Select a guest..." />
                              </SelectTrigger>
                              <SelectContent>
                                {guests.map((guest) => (
                                  <SelectItem key={guest.id} value={guest.id}>
                                    {guest.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Custom Instructions (optional)</Label>
                            <Textarea
                              placeholder="Override default instructions..."
                              value={customInstructions}
                              onChange={(e) => setCustomInstructions(e.target.value)}
                              data-testid="input-custom-instructions"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Timing</Label>
                              <Input
                                placeholder="e.g., 10 AM sharp"
                                value={customTiming}
                                onChange={(e) => setCustomTiming(e.target.value)}
                                data-testid="input-timing"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Location</Label>
                              <Input
                                placeholder="e.g., Main hall entrance"
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                data-testid="input-location"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Attire Notes</Label>
                            <Input
                              placeholder="e.g., Formal Indian attire required"
                              value={customAttireNotes}
                              onChange={(e) => setCustomAttireNotes(e.target.value)}
                              data-testid="input-attire"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAssignRole} disabled={createMutation.isPending} data-testid="button-confirm-assign">
                            {createMutation.isPending ? "Assigning..." : "Assign Role"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {eventAssignments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No roles assigned yet for this ceremony.</p>
                        <p className="text-sm">Click "Assign Role" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {eventAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card"
                            data-testid={`card-assignment-${assignment.id}`}
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{assignment.roleDisplayName}</span>
                                <PriorityBadge priority={assignment.priority || "medium"} />
                                <StatusBadge status={assignment.status || "assigned"} />
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Assigned to: <span className="font-medium">{getGuestName(assignment.guestId)}</span>
                              </div>
                              {assignment.timing && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {assignment.timing}
                                </div>
                              )}
                              {assignment.location && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {assignment.location}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {assignment.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markCompletedMutation.mutate(assignment.id)}
                                  title="Mark as completed"
                                  data-testid={`button-complete-${assignment.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(assignment.id)}
                                title="Remove assignment"
                                data-testid={`button-delete-${assignment.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a ceremony to manage ritual roles</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Assigned Roles</CardTitle>
              <CardDescription>Overview of all ritual role assignments across ceremonies</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No roles assigned yet.</p>
                  <p className="text-sm">Select a ceremony and assign roles to guests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card"
                      data-testid={`card-all-assignment-${assignment.id}`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{assignment.roleDisplayName}</span>
                          <PriorityBadge priority={assignment.priority || "medium"} />
                          <StatusBadge status={assignment.status || "assigned"} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getGuestName(assignment.guestId)} • {getEventName(assignment.eventId)}
                        </div>
                        {assignment.timing && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {assignment.timing}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(assignment.id)}
                        data-testid={`button-delete-all-${assignment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
  return (
    <Badge className={`${colors[priority] || colors.medium} text-xs`} data-testid={`badge-priority-${priority}`}>
      {priority === "high" ? "Critical" : priority === "medium" ? "Important" : "Optional"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; label: string }> = {
    assigned: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Assigned" },
    acknowledged: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", label: "Acknowledged" },
    completed: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", label: "Completed" },
  };
  const config = configs[status] || configs.assigned;
  return (
    <Badge className={`${config.color} text-xs`} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}

export default function RitualRolesPage() {
  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  if (weddingsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-wedding">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No wedding found. Please complete onboarding first.</p>
      </div>
    );
  }

  return <RitualRolesContent weddingId={wedding.id} />;
}
