import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, Users, Mail } from "lucide-react";
import { useState } from "react";
import type { Household, Guest, Invitation, Event } from "@shared/schema";

export default function RsvpPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [rsvpForms, setRsvpForms] = useState<Record<string, {
    rsvpStatus: string;
    dietaryRestrictions?: string;
    plusOneAttending?: boolean;
  }>>({});

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
