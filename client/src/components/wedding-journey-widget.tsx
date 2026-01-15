import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Check, 
  Circle, 
  ChevronRight, 
  BookOpen, 
  Heart,
  Play,
  Pause,
  Info
} from "lucide-react";
import { Link } from "wouter";
import type { TraditionRitual, WeddingJourneyItem, Wedding } from "@shared/schema";

interface WeddingJourneyWidgetProps {
  wedding: Wedding;
}

interface JourneyItemWithRitual extends WeddingJourneyItem {
  ritual?: TraditionRitual;
}

interface JourneyResponse {
  journeyItems: JourneyItemWithRitual[];
  availableRituals: TraditionRitual[];
  allRituals: TraditionRitual[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Check className="w-3 h-3" />;
    case 'included':
      return <Play className="w-3 h-3" />;
    case 'considering':
      return <Pause className="w-3 h-3" />;
    default:
      return <Circle className="w-3 h-3" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'included':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'considering':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'skipped':
      return 'bg-muted/50 text-muted-foreground/50 border-muted-foreground/10';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function WeddingJourneyWidget({ wedding }: WeddingJourneyWidgetProps) {
  const { data, isLoading, error } = useQuery<JourneyResponse>({
    queryKey: ["/api/wedding-journey/wedding", wedding.id, "with-rituals"],
    queryFn: async () => {
      const response = await fetch(`/api/wedding-journey/wedding/${wedding.id}/with-rituals`);
      if (!response.ok) throw new Error("Failed to fetch journey");
      return response.json();
    },
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/wedding-journey/wedding/${wedding.id}/initialize`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wedding-journey/wedding", wedding.id, "with-rituals"] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { journeyItems, allRituals } = data;

  if (journeyItems.length === 0 && allRituals.length > 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-primary" />
            Your Wedding Journey
          </CardTitle>
          <CardDescription>
            Discover the beautiful rituals that make up your tradition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We found {allRituals.length} traditional rituals for your wedding. 
            Start your journey to learn about each one and decide which to include.
          </p>
          <Button 
            onClick={() => initializeMutation.mutate()}
            disabled={initializeMutation.isPending}
            className="w-full"
            data-testid="button-start-journey"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {initializeMutation.isPending ? "Setting up..." : "Start Your Journey"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (journeyItems.length === 0) {
    return null;
  }

  const includedCount = journeyItems.filter(i => i.status === 'included' || i.status === 'completed').length;
  const completedCount = journeyItems.filter(i => i.status === 'completed').length;
  const totalCount = journeyItems.length;

  const sortedItems = [...journeyItems].sort((a, b) => {
    const orderA = a.ritual?.sortOrder ?? 999;
    const orderB = b.ritual?.sortOrder ?? 999;
    return orderA - orderB;
  });

  const displayItems = sortedItems.filter(item => 
    item.status === 'included' || item.status === 'completed' || item.status === 'considering'
  ).slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-primary" />
            Wedding Journey
          </CardTitle>
          <Link href="/journey">
            <Button variant="ghost" size="sm" data-testid="button-view-journey">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <CardDescription className="flex items-center gap-4">
          <span>{includedCount} rituals planned</span>
          <span className="text-xs">•</span>
          <span>{completedCount}/{includedCount} completed</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-3">
            {displayItems.map((item, index) => (
              <div 
                key={item.id} 
                className="relative flex items-start gap-3 pl-1"
                data-testid={`journey-item-${item.id}`}
              >
                <div className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full border-2 ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {item.ritual?.name || 'Unknown Ritual'}
                    </span>
                    {item.ritual?.isRequired && (
                      <Badge variant="outline" className="text-xs py-0">Essential</Badge>
                    )}
                  </div>
                  {item.ritual?.shortDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.ritual.shortDescription}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {journeyItems.length > 6 && (
          <Link href="/journey">
            <Button variant="ghost" size="sm" className="w-full mt-4" data-testid="button-see-all-rituals">
              <BookOpen className="w-4 h-4 mr-2" />
              See all {journeyItems.length} rituals
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
