import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Clock, Navigation, Info, Hotel, HelpCircle, Camera, Gift, ExternalLink, Video, Shirt, ChevronDown, ChevronUp, Sparkles, Users, BookOpen } from "lucide-react";
import { format } from "date-fns";
import type { WeddingWebsite, Wedding, Event, WeddingRegistry, RegistryRetailer, CeremonyExplainer } from "@shared/schema";
import { SiAmazon, SiTarget, SiWalmart, SiEtsy } from "react-icons/si";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { GuestChatbot } from "@/components/GuestChatbot";
import { CeremonyStyleCard, CEREMONY_STYLES } from "@/components/ceremony-style-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { OrnamentalDivider, MandalaIcon } from "@/components/desi-modern";
import { GuestMediaUpload } from "@/components/guest-media-upload";

interface PublicWeddingData {
  website: WeddingWebsite;
  wedding: Wedding;
  events: Event[];
  registries: (WeddingRegistry & { retailer?: RegistryRetailer })[];
  ceremonyExplainers?: CeremonyExplainer[];
  isPreview?: boolean;
}

const getRetailerIcon = (slug: string) => {
  switch (slug) {
    case "amazon": return <SiAmazon className="w-5 h-5" />;
    case "target": return <SiTarget className="w-5 h-5" />;
    case "walmart": return <SiWalmart className="w-5 h-5" />;
    case "etsy": return <SiEtsy className="w-5 h-5" />;
    default: return <Gift className="w-5 h-5" />;
  }
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return null;
};

function EventStyleGuide({ event }: { event: Event }) {
  const [isOpen, setIsOpen] = useState(false);
  const styleData = CEREMONY_STYLES[event.type || "custom"];
  
  if (!styleData) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between"
          data-testid={`button-style-guide-${event.id}`}
        >
          <span className="flex items-center gap-2">
            <Shirt className="w-4 h-4" />
            What to Wear
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <CeremonyStyleCard ceremonyType={event.type || "custom"} ceremonyName={event.name} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function CeremonyExplainerCard({ explainer, event }: { explainer: CeremonyExplainer; event: Event }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Safely parse keyMoments with type checking
  const keyMoments = Array.isArray(explainer.keyMoments) 
    ? (explainer.keyMoments as { moment: string; explanation: string }[]).filter(km => km?.moment && km?.explanation)
    : [];
  
  // Safely get guestTips
  const guestTips = Array.isArray(explainer.guestTips) ? explainer.guestTips.filter(Boolean) : [];
  
  // Don't render if no content available
  if (!explainer.title && !explainer.shortExplainer && !explainer.fullExplainer) {
    return null;
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-primary/5 border-primary/20 hover:bg-primary/10"
          data-testid={`button-ceremony-explainer-${event.id}`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Wait, what's happening?</span>
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4" data-testid={`explainer-content-${event.id}`}>
          {(explainer.title || explainer.shortExplainer) && (
            <div>
              {explainer.title && (
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {explainer.title}
                </h4>
              )}
              {explainer.shortExplainer && (
                <p className="text-muted-foreground mt-1">{explainer.shortExplainer}</p>
              )}
            </div>
          )}
          
          {explainer.fullExplainer && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{explainer.fullExplainer}</p>
            </div>
          )}
          
          {keyMoments.length > 0 && (
            <div>
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <Info className="w-4 h-4" /> Key Moments to Watch
              </h5>
              <ul className="space-y-2">
                {keyMoments.map((km, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="font-medium">{km.moment}:</span>
                    <span className="text-muted-foreground">{km.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {guestTips.length > 0 && (
            <div>
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" /> Tips for Guests
              </h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {guestTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          
          {explainer.culturalSignificance && (
            <div className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
              {explainer.culturalSignificance}
            </div>
          )}
          
          {explainer.attireGuidance && (
            <div className="flex items-start gap-2 text-sm bg-background/50 rounded-lg p-3">
              <Shirt className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Attire Tip:</span>{" "}
                <span className="text-muted-foreground">{explainer.attireGuidance}</span>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
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

  const { website, wedding, events, registries = [], ceremonyExplainers = [], isPreview } = data;
  const primaryColor = website.primaryColor || "#f97316";
  
  // Create a map from event ID to published explainer
  const explainerByEventId = new Map(
    ceremonyExplainers
      .filter(e => e.isPublished)
      .map(e => [e.eventId, e])
  );

  return (
    <div className="min-h-screen">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium" data-testid="preview-banner">
          Preview Mode - This website is not published yet. Only you can see this.
        </div>
      )}
      {/* Hero Section - responsive height for mobile with Desi-Modern styling */}
      <div
        className="relative min-h-[280px] md:min-h-[384px] flex items-center justify-center text-white py-12 md:py-16 bg-mandala-hero overflow-hidden"
        style={{
          background: website.couplePhotoUrl
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${website.couplePhotoUrl})`
            : website.heroImageUrl
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${website.heroImageUrl})`
            : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        data-testid="hero-section"
      >
        <div className="text-center space-y-3 md:space-y-4 px-6 relative z-10">
          <MandalaIcon className="w-12 h-12 mx-auto text-white/30 animate-float" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight" data-testid="text-wedding-title">
            {website.welcomeTitle || "Our Wedding"}
          </h1>
          {wedding.weddingDate && (
            <p className="text-lg sm:text-xl md:text-2xl" data-testid="text-wedding-date">
              {format(new Date(wedding.weddingDate), "MMMM d, yyyy")}
            </p>
          )}
          <p className="text-base sm:text-lg md:text-xl" data-testid="text-wedding-location">
            {wedding.location}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-4xl bg-mandala-pattern">
        {/* Welcome Message */}
        {website.welcomeMessage && (
          <Card className="mb-8 card-warm-accent overflow-hidden">
            <CardHeader>
              <CardTitle className="font-serif text-gradient-warm">Welcome</CardTitle>
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
          <>
            <OrnamentalDivider />
            <Card className="mb-8 flourish-corners">
              <CardHeader>
                <CardTitle className="font-serif text-gradient-warm">Our Story</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed whitespace-pre-wrap" data-testid="text-couple-story">
                  {website.coupleStory}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Events Schedule */}
        <OrnamentalDivider />
        <Card className="mb-8 card-warm-accent overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-gradient-warm">Event Schedule</span>
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
                        asChild
                        className="mt-3 w-full sm:w-auto"
                        data-testid={`button-view-map-${event.id}`}
                      >
                        <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Map
                        </a>
                      </Button>
                    )}
                    
                    {/* YouTube Livestream */}
                    {event.livestreamUrl && getYouTubeEmbedUrl(event.livestreamUrl) && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Video className="w-4 h-4 text-red-500" />
                          <span>Watch Live</span>
                        </div>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            src={getYouTubeEmbedUrl(event.livestreamUrl)!}
                            title={`${event.name} Livestream`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                            data-testid={`video-livestream-${event.id}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Can't join in person? Watch the ceremony live from anywhere.
                        </p>
                      </div>
                    )}
                    
                    {/* What to Wear Style Guide */}
                    {event.type && CEREMONY_STYLES[event.type] && (
                      <EventStyleGuide event={event} />
                    )}
                    
                    {/* Cultural Explainer - "Wait, what's happening?" */}
                    {explainerByEventId.get(event.id) && (
                      <CeremonyExplainerCard 
                        explainer={explainerByEventId.get(event.id)!} 
                        event={event} 
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gift Registries */}
        {registries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Gift Registry
              </CardTitle>
              <CardDescription>
                Browse our registries to find the perfect gift
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {registries.map((registry) => (
                  <a
                    key={registry.id}
                    href={registry.registryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg border hover-elevate transition-all group"
                    data-testid={`link-registry-${registry.id}`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      {registry.retailer ? getRetailerIcon(registry.retailer.slug) : <Gift className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {registry.retailer?.name || registry.customRetailerName || "Gift Registry"}
                      </p>
                      {registry.notes && (
                        <p className="text-sm text-muted-foreground truncate">{registry.notes}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information Tabs */}
        {(website.travelInfo || website.accommodationInfo || website.thingsToDoInfo || website.faqInfo) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={website.travelInfo ? "travel" : website.accommodationInfo ? "accommodation" : website.thingsToDoInfo ? "todo" : "faq"}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1 p-1">
                  {website.travelInfo && <TabsTrigger value="travel" className="py-2.5 text-sm">Travel</TabsTrigger>}
                  {website.accommodationInfo && <TabsTrigger value="accommodation" className="py-2.5 text-sm">Stay</TabsTrigger>}
                  {website.thingsToDoInfo && <TabsTrigger value="todo" className="py-2.5 text-sm">To Do</TabsTrigger>}
                  {website.faqInfo && <TabsTrigger value="faq" className="py-2.5 text-sm">FAQ</TabsTrigger>}
                </TabsList>

                {website.travelInfo && (
                  <TabsContent value="travel" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="w-5 h-5" />
                      <h3 className="font-semibold">Travel Information</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-travel-info">
                      <ReactMarkdown>{website.travelInfo}</ReactMarkdown>
                    </div>
                  </TabsContent>
                )}

                {website.accommodationInfo && (
                  <TabsContent value="accommodation" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hotel className="w-5 h-5" />
                      <h3 className="font-semibold">Where to Stay</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-accommodation-info">
                      <ReactMarkdown>{website.accommodationInfo}</ReactMarkdown>
                    </div>
                  </TabsContent>
                )}

                {website.thingsToDoInfo && (
                  <TabsContent value="todo" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5" />
                      <h3 className="font-semibold">Things to Do</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-things-to-do-info">
                      <ReactMarkdown>{website.thingsToDoInfo}</ReactMarkdown>
                    </div>
                  </TabsContent>
                )}

                {website.faqInfo && (
                  <TabsContent value="faq" className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-5 h-5" />
                      <h3 className="font-semibold">Frequently Asked Questions</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-faq-info">
                      <ReactMarkdown>{website.faqInfo}</ReactMarkdown>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Photo Gallery */}
        {website.galleryPhotos && website.galleryPhotos.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photo Gallery
              </CardTitle>
              <CardDescription>Moments from our journey together</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {website.galleryPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden rounded-lg aspect-square group"
                    data-testid={`gallery-photo-${index}`}
                  >
                    <img
                      src={photo}
                      alt={`Gallery photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guest Photo Uploads */}
        {wedding.guestUploadsEnabled && (
          <>
            <OrnamentalDivider />
            <GuestMediaUpload
              uploadUrlEndpoint={`/api/public/guest-media/wedding/${slug}/upload-url`}
              mediaEndpoint={`/api/public/guest-media/wedding/${slug}/media`}
              showApproved={true}
              approvedEndpoint={`/api/public/guest-media/wedding/${slug}/approved`}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-card border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">We can't wait to celebrate with you!</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Made with love on</span>
            <a 
              href="https://viah.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              data-testid="link-viah-home"
            >
              <img 
                src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
                alt="Viah.me"
                className="h-12 w-auto inline-block object-contain"
              />
            </a>
          </div>
        </div>
      </div>

      {/* AI Chatbot - only show on published websites */}
      {website.isPublished && slug && (
        <GuestChatbot slug={slug} coupleName={website.welcomeTitle || undefined} />
      )}
    </div>
  );
}
