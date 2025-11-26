import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  MapPin, 
  Coffee, 
  Utensils, 
  Camera, 
  ShoppingBag, 
  ExternalLink, 
  Car,
  Radio,
  CheckCircle,
  Play,
  AlertCircle,
  Bell,
  Sparkles,
  RefreshCw,
  Wine
} from "lucide-react";
import { format, parseISO, differenceInMinutes, isAfter, isBefore } from "date-fns";

function getOrCreateViewerId(): string {
  const storageKey = 'viah_viewer_id';
  if (typeof window === 'undefined') {
    return `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  let viewerId = localStorage.getItem(storageKey);
  if (!viewerId) {
    viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, viewerId);
  }
  return viewerId;
}

const RECOMMENDATION_ICONS: Record<string, typeof Coffee> = {
  restaurant: Utensils,
  coffee_shop: Coffee,
  bar: Wine,
  lounge: Sparkles,
  attraction: Camera,
  shopping: ShoppingBag,
  other: MapPin,
};

function formatTime(timeStr: string | Date | null): string {
  if (!timeStr) return "";
  if (typeof timeStr === "string") {
    try {
      const parsed = parseISO(timeStr);
      return format(parsed, "h:mm a");
    } catch {
      return timeStr;
    }
  }
  return format(timeStr, "h:mm a");
}

interface LiveFeedData {
  isLive: boolean;
  message?: string;
  lastUpdatedAt?: string;
  lastBroadcastMessage?: string;
  currentEvent?: {
    name: string;
    eventType: string;
    date: string | null;
    time: string | null;
    location: string | null;
  };
  ritualProgress?: {
    currentStage: {
      displayName: string;
      description: string | null;
      guestInstructions: string | null;
      status: string;
      message?: string;
      delayMinutes: number;
    };
    allStages: {
      id: string;
      displayName: string;
      description: string | null;
      displayOrder: number;
      guestInstructions: string | null;
      status: string;
      delayMinutes: number;
    }[];
  };
  currentGap?: {
    label: string;
    startTime: string;
    endTime: string;
    shuttleSchedule: string | null;
    specialInstructions: string | null;
    recommendations: {
      name: string;
      type: string;
      description: string | null;
      address: string | null;
      mapUrl: string | null;
      estimatedTravelTime: number | null;
      priceLevel: string | null;
      photoUrl: string | null;
    }[];
  };
}

export default function GuestLiveFeed() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const viewerIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: liveFeed, isLoading, error, refetch, isRefetching } = useQuery<LiveFeedData>({
    queryKey: ["/api/public/weddings", weddingId, "live-feed"],
    enabled: !!weddingId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!weddingId) return;
    
    viewerIdRef.current = getOrCreateViewerId();
    
    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/public/weddings/${weddingId}/viewer-heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewerId: viewerIdRef.current }),
        });
      } catch (error) {
        console.error('Failed to send viewer heartbeat:', error);
      }
    };
    
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [weddingId]);

  useEffect(() => {
    if (!weddingId) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-feed?weddingId=${weddingId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected for live updates');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'status_update' || message.type === 'went_live' || message.type === 'went_offline') {
          refetch();
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return () => {
      ws.close();
    };
  }, [weddingId, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
        <div className="container max-w-lg mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load feed</h2>
          <p className="text-muted-foreground mb-4">Please check your link or try again later.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!liveFeed?.isLive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
        <div className="container max-w-lg mx-auto">
          <Card className="text-center p-8 mt-8">
            <div className="p-4 rounded-full bg-muted inline-block mb-4">
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Not Live Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              {liveFeed?.message || "The wedding broadcast hasn't started yet. Check back when the celebrations begin!"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const completedStages = liveFeed.ritualProgress?.allStages.filter(s => s.status === 'completed').length || 0;
  const totalStages = liveFeed.ritualProgress?.allStages.length || 0;
  const progressPercent = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b p-4">
        <div className="container max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 animate-pulse">
              <Radio className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="font-semibold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>Live Updates</h1>
              <p className="text-xs text-muted-foreground">
                Updated {liveFeed.lastUpdatedAt ? format(parseISO(liveFeed.lastUpdatedAt), "h:mm a") : "just now"}
              </p>
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="container max-w-lg mx-auto p-4 space-y-4 pb-8">
        {liveFeed.lastBroadcastMessage && (
          <Card className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-950/50 dark:to-pink-950/50 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-orange-200 dark:bg-orange-900 flex-shrink-0">
                  <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1 text-orange-800 dark:text-orange-200">Announcement</h3>
                  <p className="text-foreground">{liveFeed.lastBroadcastMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {liveFeed.currentEvent && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Now Happening</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                {liveFeed.currentEvent.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {liveFeed.currentEvent.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {liveFeed.currentEvent.time}
                  </span>
                )}
                {liveFeed.currentEvent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {liveFeed.currentEvent.location}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {liveFeed.ritualProgress && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Ceremony Progress</CardTitle>
                <span className="text-sm text-muted-foreground">{completedStages}/{totalStages}</span>
              </div>
              <Progress value={progressPercent} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {liveFeed.ritualProgress.allStages.sort((a, b) => a.displayOrder - b.displayOrder).map((stage) => {
                  const isCurrent = liveFeed.ritualProgress?.currentStage.displayName === stage.displayName;
                  return (
                    <div 
                      key={stage.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-950/30 dark:to-pink-950/30 border border-orange-200 dark:border-orange-800' 
                          : stage.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-950/20'
                            : 'bg-muted/50'
                      }`}
                      data-testid={`stage-${stage.id}`}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        stage.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                        stage.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-900' :
                        stage.status === 'delayed' ? 'bg-red-100 dark:bg-red-900' :
                        'bg-muted'
                      }`}>
                        {stage.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : stage.status === 'in_progress' ? (
                          <Play className="w-4 h-4 text-yellow-600" />
                        ) : stage.status === 'delayed' ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${isCurrent ? 'text-orange-800 dark:text-orange-200' : ''}`}>
                            {stage.displayName}
                          </span>
                          {stage.status === 'delayed' && stage.delayMinutes > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              +{stage.delayMinutes} min
                            </Badge>
                          )}
                          {isCurrent && stage.status === 'in_progress' && (
                            <Badge className="text-xs bg-orange-500">Now</Badge>
                          )}
                        </div>
                        {isCurrent && stage.guestInstructions && (
                          <p className="text-sm text-muted-foreground mt-1">{stage.guestInstructions}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {liveFeed.currentGap && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{liveFeed.currentGap.label}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(liveFeed.currentGap.startTime)} - {formatTime(liveFeed.currentGap.endTime)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveFeed.currentGap.shuttleSchedule && (
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm">Shuttle Information</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{liveFeed.currentGap.shuttleSchedule}</p>
                  </div>
                )}

                {liveFeed.currentGap.specialInstructions && (
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm">Note from the Couple</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{liveFeed.currentGap.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {liveFeed.currentGap.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nearby Recommendations
                </h3>
                <div className="space-y-3">
                  {liveFeed.currentGap.recommendations.map((rec, index) => {
                    const Icon = RECOMMENDATION_ICONS[rec.type] || MapPin;
                    return (
                      <Card key={index} className="hover-elevate">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {rec.photoUrl ? (
                              <img 
                                src={rec.photoUrl} 
                                alt={rec.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{rec.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
                                <Badge variant="outline" className="text-xs capitalize">{rec.type.replace('_', ' ')}</Badge>
                                {rec.priceLevel && <span>{rec.priceLevel}</span>}
                                {rec.estimatedTravelTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {rec.estimatedTravelTime} min
                                  </span>
                                )}
                              </div>
                              {rec.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                              )}
                              {rec.mapUrl && (
                                <a 
                                  href={rec.mapUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                                >
                                  Get Directions <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!liveFeed.ritualProgress && !liveFeed.currentGap && !liveFeed.lastBroadcastMessage && (
          <Card className="text-center p-8">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Celebrations are underway!
            </h3>
            <p className="text-muted-foreground">
              Updates will appear here as the ceremonies progress. Stay tuned!
            </p>
          </Card>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-semibold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Viah.me</span>
        </p>
      </footer>
    </div>
  );
}
