import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Calendar, Clock, Navigation, Info, Hotel, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import type { WeddingWebsite, Wedding, Event } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PublicWeddingData {
  website: WeddingWebsite;
  wedding: Wedding;
  events: Event[];
}

export default function GuestWebsite() {
  const params = useParams();
  const slug = params.slug;

  const { data, isLoading, error } = useQuery<PublicWeddingData>({
    queryKey: [`/api/public/wedding/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Wedding Not Found</CardTitle>
            <CardDescription>
              This wedding website doesn't exist or hasn't been published yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { website, wedding, events } = data;
  const primaryColor = website.primaryColor || "#f97316";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className="relative h-96 flex items-center justify-center text-white"
        style={{
          background: website.heroImageUrl
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${website.heroImageUrl})`
            : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        data-testid="hero-section"
      >
        <div className="text-center space-y-4 px-4">
          <h1 className="text-5xl md:text-6xl font-display font-bold" data-testid="text-wedding-title">
            {website.welcomeTitle || "Our Wedding"}
          </h1>
          {wedding.weddingDate && (
            <p className="text-xl md:text-2xl" data-testid="text-wedding-date">
              {format(new Date(wedding.weddingDate), "MMMM d, yyyy")}
            </p>
          )}
          <p className="text-lg md:text-xl" data-testid="text-wedding-location">
            {wedding.location}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Welcome Message */}
        {website.welcomeMessage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap" data-testid="text-welcome-message">
                {website.welcomeMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Our Story */}
        {website.coupleStory && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Story</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-wrap" data-testid="text-couple-story">
                {website.coupleStory}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Events Schedule */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Schedule
            </CardTitle>
            <CardDescription>Celebrate with us across multiple events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id}>
                {index > 0 && <Separator className="my-6" />}
                <div className="space-y-3" data-testid={`event-card-${event.id}`}>
                  <div>
                    <h3 className="text-xl font-semibold" data-testid={`text-event-name-${event.id}`}>{event.name}</h3>
                    {event.description && (
                      <p className="text-muted-foreground" data-testid={`text-event-description-${event.id}`}>
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm">
                    {event.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`text-event-date-${event.id}`}>
                          {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`text-event-time-${event.id}`}>{event.time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`text-event-location-${event.id}`}>{event.location}</span>
                      </div>
                    )}
                    {event.dressCode && (
                      <div className="flex items-start gap-2 mt-2">
                        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">Dress Code:</span>{" "}
                          <span data-testid={`text-event-dresscode-${event.id}`}>{event.dressCode}</span>
                        </div>
                      </div>
                    )}
                    {event.locationDetails && (
                      <p className="text-sm text-muted-foreground mt-2" data-testid={`text-event-details-${event.id}`}>
                        {event.locationDetails}
                      </p>
                    )}
                    {event.directions && (
                      <div className="flex items-start gap-2 mt-2">
                        <Navigation className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Directions:</span>{" "}
                          <span className="text-muted-foreground whitespace-pre-wrap" data-testid={`text-event-directions-${event.id}`}>
                            {event.directions}
                          </span>
                        </div>
                      </div>
                    )}
                    {event.mapUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-2"
                        data-testid={`button-view-map-${event.id}`}
                      >
                        <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Map
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Information Tabs */}
        {(website.travelInfo || website.accommodationInfo || website.thingsToDoInfo || website.faqInfo) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={website.travelInfo ? "travel" : website.accommodationInfo ? "accommodation" : website.thingsToDoInfo ? "todo" : "faq"}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                  {website.travelInfo && <TabsTrigger value="travel">Travel</TabsTrigger>}
                  {website.accommodationInfo && <TabsTrigger value="accommodation">Accommodation</TabsTrigger>}
                  {website.thingsToDoInfo && <TabsTrigger value="todo">Things to Do</TabsTrigger>}
                  {website.faqInfo && <TabsTrigger value="faq">FAQ</TabsTrigger>}
                </TabsList>

                {website.travelInfo && (
                  <TabsContent value="travel" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="w-5 h-5" />
                      <h3 className="font-semibold">Travel Information</h3>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap text-sm" data-testid="text-travel-info">
                      {website.travelInfo}
                    </p>
                  </TabsContent>
                )}

                {website.accommodationInfo && (
                  <TabsContent value="accommodation" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hotel className="w-5 h-5" />
                      <h3 className="font-semibold">Where to Stay</h3>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap text-sm" data-testid="text-accommodation-info">
                      {website.accommodationInfo}
                    </p>
                  </TabsContent>
                )}

                {website.thingsToDoInfo && (
                  <TabsContent value="todo" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5" />
                      <h3 className="font-semibold">Things to Do</h3>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap text-sm" data-testid="text-things-to-do-info">
                      {website.thingsToDoInfo}
                    </p>
                  </TabsContent>
                )}

                {website.faqInfo && (
                  <TabsContent value="faq" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-5 h-5" />
                      <h3 className="font-semibold">Frequently Asked Questions</h3>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap text-sm" data-testid="text-faq-info">
                      {website.faqInfo}
                    </p>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="bg-card border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">We can't wait to celebrate with you!</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Made with ❤️ on</span>
            <img 
              src={new URL("@assets/image_1763666527836.png", import.meta.url).href}
              alt="Viah.me"
              className="h-12 w-auto inline-block object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
