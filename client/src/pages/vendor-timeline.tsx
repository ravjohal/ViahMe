import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles,
  Shirt,
  Info,
  AlertCircle,
  Link2Off
} from "lucide-react";
import { format } from "date-fns";

interface CollaborationViewData {
  pass: {
    id: string;
    name: string;
    timelineViewType: string;
    canViewGuestCount: boolean;
    canViewVendorDetails: boolean;
  };
  wedding: {
    id: string;
    title: string;
    partner1Name: string;
    partner2Name: string;
    city: string;
  };
  vendor: {
    id: string;
    name: string;
    categories: string[];
  } | null;
  events: Array<{
    id: string;
    name: string;
    type: string;
    date: string | null;
    time: string | null;
    location: string | null;
    description: string | null;
    dressCode: string | null;
    locationDetails: string | null;
    guestCount?: number;
  }>;
}

export default function VendorTimeline() {
  const [, params] = useRoute("/vendor-timeline/:token");
  const token = params?.token;

  const { data, isLoading, error } = useQuery<CollaborationViewData>({
    queryKey: ["/api/vendor-collaboration", token],
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error instanceof Error ? error.message : "Access denied or link expired";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Link2Off className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Unavailable</h2>
            <p className="text-muted-foreground">
              {errorMessage.includes("revoked") 
                ? "This access link has been revoked by the couple."
                : errorMessage.includes("expired")
                ? "This access link has expired."
                : "This link is no longer valid or has been removed."
              }
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact the couple for an updated link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { pass, wedding, vendor, events } = data;
  const coupleName = wedding.partner1Name && wedding.partner2Name
    ? `${wedding.partner1Name} & ${wedding.partner2Name}`
    : wedding.title || "Wedding";

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const formatEventType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-serif font-bold" data-testid="text-wedding-title">
              {coupleName}'s Wedding
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {wedding.city && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {wedding.city}
              </div>
            )}
            {vendor && (
              <Badge variant="secondary" data-testid="badge-vendor-name">
                {vendor.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3" data-testid="text-pass-name">
            Timeline View: {pass.name}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Events to Display</h3>
              <p className="text-muted-foreground">
                The couple hasn't shared any events with you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Event Schedule
            </h2>
            
            {sortedEvents.map((event) => (
              <Card key={event.id} data-testid={`card-event-${event.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {formatEventType(event.type)}
                      </Badge>
                    </div>
                    {event.date && (
                      <div className="text-right">
                        <div className="font-medium">
                          {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                        </div>
                        {event.time && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.description && (
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm">{event.description}</p>
                    </div>
                  )}
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                          {event.locationDetails && (
                            <p className="text-xs text-muted-foreground mt-1">{event.locationDetails}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {event.dressCode && (
                      <div className="flex items-start gap-2">
                        <Shirt className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Dress Code</p>
                          <p className="text-sm text-muted-foreground">{event.dressCode}</p>
                        </div>
                      </div>
                    )}
                    
                    {pass.canViewGuestCount && event.guestCount !== undefined && (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Expected Guests</p>
                          <p className="text-sm text-muted-foreground">{event.guestCount} guests</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">About This View</p>
                <p>
                  This is a shared timeline view created by the couple. It shows only the events 
                  relevant to your services. For any questions or changes, please contact the couple directly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
