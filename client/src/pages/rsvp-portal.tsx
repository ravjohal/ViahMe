import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, Mail, Sparkles, Clock, AlertTriangle, Shirt, Vote, Send, Lock, Eye, Camera } from "lucide-react";
import { useState } from "react";
import type { Household, Guest, Invitation, Event, RitualRoleAssignment, Poll, PollOption, PollVote, WeddingWebsite } from "@shared/schema";
import { GuestMediaUpload } from "@/components/guest-media-upload";

interface EnrichedRitualRole extends RitualRoleAssignment {
  event?: Event;
  guest?: Guest;
}

interface GuestPollData {
  household: { id: string; name: string };
  guests: { id: string; name: string }[];
  polls: (Poll & {
    options: PollOption[];
    myVotes: PollVote[];
    results: (PollOption & { voteCount: number })[] | null;
  })[];
}

export default function RsvpPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [rsvpForms, setRsvpForms] = useState<Record<string, {
    rsvpStatus: string;
    dietaryRestrictions?: string;
    plusOneAttending?: boolean;
  }>>({});
  const [pollSelections, setPollSelections] = useState<Record<string, string | string[]>>({});
  const [textResponses, setTextResponses] = useState<Record<string, string>>({});
  const [votingGuestId, setVotingGuestId] = useState<string>("");

  // Fetch household by magic token
  const { data: household, isLoading: loadingHousehold, error: householdError } = useQuery<Household>({
    queryKey: ['/api/households/by-token', token],
    enabled: !!token,
  });

  // Fetch guests in household
  const { data: guests = [], isLoading: loadingGuests } = useQuery<Guest[]>({
    queryKey: ['/api/guests/by-household', household?.id],
    enabled: !!household?.id,
  });

  // Fetch all invitations for all guests in household
  const { data: allInvitations = [], isLoading: loadingInvitations } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations/household', household?.id],
    queryFn: async () => {
      if (!household?.id || guests.length === 0) return [];
      
      const invitationsPromises = guests.map(guest => 
        fetch(`/api/invitations/by-guest/${guest.id}`).then(res => res.json())
      );
      
      const results = await Promise.all(invitationsPromises);
      return results.flat();
    },
    enabled: !!household?.id && guests.length > 0,
  });

  // Fetch all unique events from invitations
  const { data: events = [], isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events/invited', allInvitations],
    queryFn: async () => {
      const eventIdsSet = new Set(allInvitations.map(inv => inv.eventId));
      const eventIds = Array.from(eventIdsSet);
      if (eventIds.length === 0) return [];
      
      const eventsPromises = eventIds.map(id => 
        fetch(`/api/events/by-id/${id}`).then(res => res.json())
      );
      
      return Promise.all(eventsPromises);
    },
    enabled: allInvitations.length > 0,
  });

  // Build stable query key for ritual roles based on guest IDs
  const guestIds = guests.map(g => g.id).sort().join(",");

  // Fetch ritual role assignments for all guests in household
  const { data: ritualRoles = [], isLoading: loadingRitualRoles } = useQuery<EnrichedRitualRole[]>({
    queryKey: ['/api/ritual-roles', 'guests', guestIds],
    queryFn: async () => {
      if (guests.length === 0) return [];
      
      const rolesPromises = guests.map(guest => 
        fetch(`/api/ritual-roles/guest/${guest.id}`).then(res => res.json())
      );
      
      const results = await Promise.all(rolesPromises);
      return results.flat();
    },
    enabled: guests.length > 0,
  });

  const { data: guestPollData, isLoading: loadingPolls } = useQuery<GuestPollData>({
    queryKey: ['/api/guest-polls/by-token', token],
    enabled: !!token,
  });

  const { data: websiteConfig } = useQuery<WeddingWebsite>({
    queryKey: [`/api/wedding-websites/wedding/${household?.weddingId}`],
    enabled: !!household?.weddingId,
  });

  const submitVoteMutation = useMutation({
    mutationFn: async (data: { pollId: string; guestId: string; householdId?: string; optionId?: string; optionIds?: string[]; textResponse?: string }) => {
      return await apiRequest("POST", "/api/poll-votes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guest-polls/by-token', token] });
      toast({
        title: "Vote Submitted",
        description: "Your response has been recorded!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit your vote",
        variant: "destructive",
      });
    },
  });

  const handleSubmitVote = (poll: GuestPollData["polls"][0]) => {
    if (!guestPollData) return;
    const guestId = votingGuestId || guestPollData.guests[0]?.id;
    if (!guestId) return;

    if (poll.type === "text") {
      const response = textResponses[poll.id];
      if (!response?.trim()) {
        toast({ title: "Please enter a response", variant: "destructive" });
        return;
      }
      submitVoteMutation.mutate({
        pollId: poll.id,
        guestId,
        householdId: guestPollData.household.id,
        textResponse: response,
      });
    } else if (poll.type === "multiple") {
      const selected = pollSelections[poll.id] as string[] | undefined;
      if (!selected || selected.length === 0) {
        toast({ title: "Please select at least one option", variant: "destructive" });
        return;
      }
      submitVoteMutation.mutate({
        pollId: poll.id,
        guestId,
        householdId: guestPollData.household.id,
        optionIds: selected,
      });
    } else {
      const optionId = pollSelections[poll.id] as string | undefined;
      if (!optionId) {
        toast({ title: "Please select an option", variant: "destructive" });
        return;
      }
      submitVoteMutation.mutate({
        pollId: poll.id,
        guestId,
        householdId: guestPollData.household.id,
        optionId,
      });
    }
  };

  // Acknowledge ritual role mutation
  const acknowledgeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/ritual-roles/${roleId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error('Failed to acknowledge role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ritual-roles', 'guests', guestIds] });
      toast({
        title: "Role Acknowledged",
        description: "Thank you for confirming your role!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit RSVP mutation
  const submitRsvpMutation = useMutation({
    mutationFn: async ({ invitationId, data }: { 
      invitationId: string; 
      data: { rsvpStatus: string; dietaryRestrictions?: string; plusOneAttending?: boolean } 
    }) => {
      const response = await fetch(`/api/invitations/${invitationId}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/household'] });
      toast({
        title: "RSVP Submitted",
        description: "Your response has been recorded. You'll receive a confirmation email shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit RSVP",
        variant: "destructive",
      });
    },
  });

  const handleRsvpChange = (eventId: string, field: string, value: any) => {
    setRsvpForms(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value,
      }
    }));
  };

  const handleSubmitEvent = async (eventId: string, guestId: string) => {
    const invitation = allInvitations.find(
      inv => inv.eventId === eventId && inv.guestId === guestId
    );

    if (!invitation) {
      toast({
        title: "Error",
        description: "Invitation not found",
        variant: "destructive",
      });
      return;
    }

    const formData = rsvpForms[eventId];
    if (!formData?.rsvpStatus) {
      toast({
        title: "Please select your attendance",
        description: "You must indicate whether you'll be attending",
        variant: "destructive",
      });
      return;
    }

    await submitRsvpMutation.mutateAsync({
      invitationId: invitation.id,
      data: formData,
    });
  };

  if (loadingHousehold || loadingGuests || loadingInvitations || loadingEvents) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" data-testid="loading-rsvp-portal">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (householdError || !household) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" data-testid="error-rsvp-portal">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-6 h-6" />
              Invalid or Expired Link
            </CardTitle>
            <CardDescription>
              This invitation link is no longer valid or has expired. Please contact the couple for a new invitation link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" data-testid="no-events-rsvp-portal">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Events Found</CardTitle>
            <CardDescription>
              There are no events associated with this invitation yet. Please check back later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4" data-testid="page-rsvp-portal">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center space-y-4 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="text-6xl">💌</div>
            <CardTitle className="text-3xl font-serif">You're Invited!</CardTitle>
            <CardDescription className="text-lg">
              <span className="font-semibold text-foreground">{household.name}</span>
            </CardDescription>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Up to {household.maxCount} seats reserved</span>
            </div>
            {/* Contact email removed from household schema */}
          </CardHeader>
        </Card>

        {/* Events RSVP */}
        <div className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold">Please RSVP for Each Event</h2>
          
          {events.map((event) => {
            // Get the first guest's invitation for this event (for display purposes)
            const firstGuestInvitation = allInvitations.find(inv => inv.eventId === event.id);
            const currentRsvp = rsvpForms[event.id] || {
              rsvpStatus: firstGuestInvitation?.rsvpStatus || 'pending',
              dietaryRestrictions: firstGuestInvitation?.dietaryRestrictions || '',
              plusOneAttending: firstGuestInvitation?.plusOneAttending || false,
            };

            return (
              <Card key={event.id} data-testid={`card-event-${event.id}`}>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {event.name}
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    {event.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label>Will you be attending?</Label>
                    <RadioGroup
                      value={currentRsvp.rsvpStatus}
                      onValueChange={(value) => handleRsvpChange(event.id, 'rsvpStatus', value)}
                      data-testid={`radio-rsvp-status-${event.id}`}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="attending" id={`${event.id}-attending`} data-testid={`radio-attending-${event.id}`} />
                        <Label htmlFor={`${event.id}-attending`} className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Yes, I'll be there!
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="not_attending" id={`${event.id}-not-attending`} data-testid={`radio-not-attending-${event.id}`} />
                        <Label htmlFor={`${event.id}-not-attending`} className="flex items-center gap-2 cursor-pointer">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Sorry, I can't make it
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {currentRsvp.rsvpStatus === 'attending' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor={`${event.id}-dietary`}>Dietary Restrictions (optional)</Label>
                        <Textarea
                          id={`${event.id}-dietary`}
                          placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
                          value={currentRsvp.dietaryRestrictions || ''}
                          onChange={(e) => handleRsvpChange(event.id, 'dietaryRestrictions', e.target.value)}
                          data-testid={`textarea-dietary-${event.id}`}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${event.id}-plus-one`}
                          checked={currentRsvp.plusOneAttending || false}
                          onCheckedChange={(checked) => handleRsvpChange(event.id, 'plusOneAttending', checked)}
                          data-testid={`checkbox-plus-one-${event.id}`}
                        />
                        <Label htmlFor={`${event.id}-plus-one`} className="cursor-pointer">
                          I'll be bringing a plus-one
                        </Label>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={() => handleSubmitEvent(event.id, guests[0]?.id)}
                    disabled={submitRsvpMutation.isPending}
                    className="w-full"
                    data-testid={`button-submit-rsvp-${event.id}`}
                  >
                    {submitRsvpMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit RSVP
                      </>
                    )}
                  </Button>

                  {firstGuestInvitation?.respondedAt && (
                    <p className="text-sm text-muted-foreground text-center">
                      Last updated: {new Date(firstGuestInvitation.respondedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission Cards - Ritual Role Assignments */}
        {loadingRitualRoles && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Loading your special roles...</span>
            </CardContent>
          </Card>
        )}
        {!loadingRitualRoles && ritualRoles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-serif font-semibold">Your Special Roles</h2>
            </div>
            <p className="text-muted-foreground">
              You've been honored with special ceremonial duties! Please review your "Mission Cards" below.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {ritualRoles.map((role) => {
                const priorityColors: Record<string, string> = {
                  high: "border-red-300 bg-gradient-to-br from-red-50 to-orange-50",
                  medium: "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50",
                  low: "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50",
                };
                const priorityBadgeColors: Record<string, string> = {
                  high: "bg-red-100 text-red-800",
                  medium: "bg-amber-100 text-amber-800",
                  low: "bg-green-100 text-green-800",
                };
                const statusColors: Record<string, string> = {
                  assigned: "bg-blue-100 text-blue-800",
                  acknowledged: "bg-emerald-100 text-emerald-800",
                  completed: "bg-gray-100 text-gray-800",
                };

                return (
                  <Card 
                    key={role.id} 
                    className={`border-2 ${priorityColors[role.priority || "medium"]}`}
                    data-testid={`card-mission-${role.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          <CardTitle className="text-lg">{role.roleDisplayName}</CardTitle>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`text-xs ${priorityBadgeColors[role.priority || "medium"]}`}>
                            {role.priority === "high" ? "Critical" : role.priority === "medium" ? "Important" : "Optional"}
                          </Badge>
                          <Badge className={`text-xs ${statusColors[role.status || "assigned"]}`}>
                            {role.status === "acknowledged" ? "Confirmed" : role.status === "completed" ? "Done" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="mt-1">
                        {role.event?.name && (
                          <span className="font-medium">{role.event.name}</span>
                        )}
                        {role.guest?.name && role.guest.name !== guests[0]?.name && (
                          <span className="ml-2 text-sm">Assigned to: {role.guest.name}</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {role.description && (
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      )}
                      
                      {role.instructions && (
                        <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border">
                          <p className="text-sm font-medium mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Instructions
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{role.instructions}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {role.timing && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{role.timing}</span>
                          </div>
                        )}
                        {role.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{role.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {role.attireNotes && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-gray-900/50 rounded-lg p-3 border">
                          <Shirt className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{role.attireNotes}</span>
                        </div>
                      )}
                      
                      {role.status === "assigned" && (
                        <Button
                          onClick={() => acknowledgeRoleMutation.mutate(role.id)}
                          disabled={acknowledgeRoleMutation.isPending}
                          className="w-full"
                          data-testid={`button-acknowledge-${role.id}`}
                        >
                          {acknowledgeRoleMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              I Accept This Role
                            </>
                          )}
                        </Button>
                      )}
                      
                      {role.status === "acknowledged" && (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg py-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Role Confirmed</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Guest Polls Section */}
        {loadingPolls && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Loading polls...</span>
            </CardContent>
          </Card>
        )}
        {!loadingPolls && guestPollData && guestPollData.polls.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Vote className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-serif font-semibold">Share Your Preferences</h2>
            </div>
            <p className="text-muted-foreground">
              The couple would love your input! Please vote on the polls below.
            </p>

            {guestPollData.guests.length > 1 && (
              <div className="space-y-2">
                <Label>Voting as:</Label>
                <RadioGroup
                  value={votingGuestId || guestPollData.guests[0]?.id || ""}
                  onValueChange={setVotingGuestId}
                  data-testid="radio-voting-guest"
                >
                  {guestPollData.guests.map((g) => (
                    <div key={g.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={g.id} id={`voting-as-${g.id}`} data-testid={`radio-voting-as-${g.id}`} />
                      <Label htmlFor={`voting-as-${g.id}`} className="cursor-pointer">{g.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {guestPollData.polls.map((poll) => {
              const hasVoted = poll.myVotes.length > 0;
              const totalResults = poll.results ? poll.results.reduce((sum, o) => sum + o.voteCount, 0) : 0;

              return (
                <Card key={poll.id} data-testid={`card-poll-${poll.id}`}>
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <CardTitle className="flex items-center gap-2">
                        <Vote className="w-5 h-5 text-primary" />
                        {poll.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {poll.isAnonymous && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Anonymous
                          </Badge>
                        )}
                        {hasVoted && (
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Voted
                          </Badge>
                        )}
                      </div>
                    </div>
                    {poll.description && (
                      <CardDescription>{poll.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Single Choice Poll */}
                    {poll.type === "single" && (
                      <RadioGroup
                        value={(pollSelections[poll.id] as string) || (hasVoted ? poll.myVotes[0]?.optionId || "" : "")}
                        onValueChange={(value) =>
                          setPollSelections((prev) => ({ ...prev, [poll.id]: value }))
                        }
                        data-testid={`radio-poll-${poll.id}`}
                      >
                        {poll.options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={option.id}
                              id={`poll-${poll.id}-opt-${option.id}`}
                              data-testid={`radio-option-${option.id}`}
                            />
                            <Label htmlFor={`poll-${poll.id}-opt-${option.id}`} className="cursor-pointer flex-1">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* Multiple Choice Poll */}
                    {poll.type === "multiple" && (
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const currentSelected = (pollSelections[poll.id] as string[]) || 
                            (hasVoted ? poll.myVotes.map(v => v.optionId).filter(Boolean) as string[] : []);
                          const isChecked = currentSelected.includes(option.id);
                          return (
                            <div key={option.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`poll-${poll.id}-opt-${option.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  setPollSelections((prev) => {
                                    const current = (prev[poll.id] as string[]) || 
                                      (hasVoted ? poll.myVotes.map(v => v.optionId).filter(Boolean) as string[] : []);
                                    if (checked) {
                                      return { ...prev, [poll.id]: [...current, option.id] };
                                    } else {
                                      return { ...prev, [poll.id]: current.filter(id => id !== option.id) };
                                    }
                                  });
                                }}
                                data-testid={`checkbox-option-${option.id}`}
                              />
                              <Label htmlFor={`poll-${poll.id}-opt-${option.id}`} className="cursor-pointer flex-1">
                                {option.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Response Poll */}
                    {poll.type === "text" && (
                      <div className="space-y-2">
                        <Label>Your response</Label>
                        <Textarea
                          placeholder="Share your thoughts..."
                          value={textResponses[poll.id] || (hasVoted && poll.myVotes[0]?.textResponse ? poll.myVotes[0].textResponse : "")}
                          onChange={(e) =>
                            setTextResponses((prev) => ({ ...prev, [poll.id]: e.target.value }))
                          }
                          data-testid={`textarea-poll-${poll.id}`}
                        />
                      </div>
                    )}

                    {/* Results Display */}
                    {poll.showResultsToGuests && poll.results && poll.results.length > 0 && hasVoted && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          <span>Current Results</span>
                        </div>
                        {poll.results.map((opt) => {
                          const percentage = totalResults > 0 ? Math.round((opt.voteCount / totalResults) * 100) : 0;
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span>{opt.label}</span>
                                <span className="text-muted-foreground">{opt.voteCount} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <Button
                      onClick={() => handleSubmitVote(poll)}
                      disabled={submitVoteMutation.isPending}
                      className="w-full"
                      data-testid={`button-submit-vote-${poll.id}`}
                    >
                      {submitVoteMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : hasVoted ? (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Update Vote
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Vote
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Guest Photo Uploads */}
        {websiteConfig?.guestUploadsEnabled && token && (
          <GuestMediaUpload
            uploadUrlEndpoint={`/api/public/guest-media/rsvp/${token}/upload-url`}
            mediaEndpoint={`/api/public/guest-media/rsvp/${token}/media`}
            guestId={guests[0]?.id}
          />
        )}

        {/* Footer */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              You can return to this link at any time to update your RSVP. 
              This invitation link will remain valid for 30 days.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by <span className="font-semibold">Viah.me</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
