import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Users, Mail, Phone, CheckCircle2, ArrowRight, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Household, Guest } from "@shared/schema";

interface DuplicateCandidate {
  household1: Household;
  household2: Household;
  guests1: Guest[];
  guests2: Guest[];
  confidence: number;
  matchReasons: string[];
}

interface DuplicatesManagerProps {
  weddingId: string;
}

export function DuplicatesManager({ weddingId }: DuplicatesManagerProps) {
  const { toast } = useToast();
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<DuplicateCandidate | null>(null);

  const { data: duplicates, isLoading } = useQuery<DuplicateCandidate[]>({
    queryKey: ['/api/weddings', weddingId, 'duplicate-households'],
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ survivorId, mergedId, decision }: { survivorId: string; mergedId: string; decision: 'kept_older' | 'kept_newer' }) => {
      return await apiRequest('POST', '/api/households/merge', { survivorId, mergedId, decision });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weddings', weddingId, 'duplicate-households'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/guests', weddingId] });
      setMergeDialogOpen(false);
      setSelectedPair(null);
      toast({
        title: "Duplicate resolved",
        description: "The duplicate entry has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Merge failed",
        description: error.message || "Failed to merge families",
        variant: "destructive",
      });
    },
  });

  const handleMerge = (pair: DuplicateCandidate) => {
    setSelectedPair(pair);
    setMergeDialogOpen(true);
  };

  const executeMerge = (keepOlder: boolean) => {
    if (!selectedPair) return;
    
    const h1Date = new Date(selectedPair.household1.createdAt);
    const h2Date = new Date(selectedPair.household2.createdAt);
    const h1IsOlder = h1Date < h2Date;
    
    let survivorId: string;
    let mergedId: string;
    
    if (keepOlder) {
      survivorId = h1IsOlder ? selectedPair.household1.id : selectedPair.household2.id;
      mergedId = h1IsOlder ? selectedPair.household2.id : selectedPair.household1.id;
    } else {
      survivorId = h1IsOlder ? selectedPair.household2.id : selectedPair.household1.id;
      mergedId = h1IsOlder ? selectedPair.household1.id : selectedPair.household2.id;
    }
    
    mergeMutation.mutate({
      survivorId,
      mergedId,
      decision: keepOlder ? 'kept_older' : 'kept_newer',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (confidence >= 0.6) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Duplicate Detection</h2>
        <p className="text-muted-foreground mt-1 text-base">
          Found families that might be duplicates. Choose which one to keep and delete the other.
        </p>
      </div>

      {!duplicates || duplicates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Duplicates Found</h3>
            <p className="text-muted-foreground">
              Your guest list looks clean! No potential duplicate families were detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Badge variant="outline" className="text-base px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            {duplicates.length} potential duplicate{duplicates.length !== 1 ? "s" : ""} found
          </Badge>

          {duplicates.map((pair, index) => (
            <Card key={index} className="overflow-hidden" data-testid={`card-duplicate-${index}`}>
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Possible Duplicate
                  </CardTitle>
                  <Badge className={getConfidenceColor(pair.confidence)}>
                    {getConfidenceLabel(pair.confidence)} Match ({Math.round(pair.confidence * 100)}%)
                  </Badge>
                </div>
                <CardDescription className="flex flex-wrap gap-2 mt-2">
                  {pair.matchReasons.map((reason, i) => (
                    <Badge key={i} variant="secondary" className="text-base">
                      {reason}
                    </Badge>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <HouseholdCard 
                    household={pair.household1} 
                    guests={pair.guests1} 
                    label={new Date(pair.household1.createdAt) < new Date(pair.household2.createdAt) ? "Older" : "Newer"}
                  />
                  <HouseholdCard 
                    household={pair.household2} 
                    guests={pair.guests2}
                    label={new Date(pair.household2.createdAt) < new Date(pair.household1.createdAt) ? "Older" : "Newer"}
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <Button 
                    onClick={() => handleMerge(pair)}
                    className="min-h-[48px] text-base gap-2"
                    data-testid={`button-merge-${index}`}
                  >
                    <Trash2 className="h-5 w-5" />
                    Resolve Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5" />
              Resolve Duplicate
            </DialogTitle>
            <DialogDescription className="text-base">
              Choose which family to keep. The other will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPair && (() => {
            const h1Date = new Date(selectedPair.household1.createdAt);
            const h2Date = new Date(selectedPair.household2.createdAt);
            const h1IsOlder = h1Date < h2Date;
            const olderHousehold = h1IsOlder ? selectedPair.household1 : selectedPair.household2;
            const newerHousehold = h1IsOlder ? selectedPair.household2 : selectedPair.household1;
            const olderGuests = h1IsOlder ? selectedPair.guests1 : selectedPair.guests2;
            const newerGuests = h1IsOlder ? selectedPair.guests2 : selectedPair.guests1;
            
            return (
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-lg">{olderHousehold.name}</p>
                      <Badge variant="outline">Added first</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {olderGuests.length} guest{olderGuests.length !== 1 ? "s" : ""} · 
                      Added {h1IsOlder ? h1Date.toLocaleDateString() : h2Date.toLocaleDateString()}
                    </p>
                    <Button
                      variant="default"
                      onClick={() => executeMerge(true)}
                      disabled={mergeMutation.isPending}
                      className="w-full mt-3 min-h-[44px]"
                      data-testid="button-keep-older"
                    >
                      Keep This One (Delete the other)
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-lg">{newerHousehold.name}</p>
                      <Badge variant="outline">Added later</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {newerGuests.length} guest{newerGuests.length !== 1 ? "s" : ""} · 
                      Added {h1IsOlder ? h2Date.toLocaleDateString() : h1Date.toLocaleDateString()}
                    </p>
                    <Button
                      variant="default"
                      onClick={() => executeMerge(false)}
                      disabled={mergeMutation.isPending}
                      className="w-full mt-3 min-h-[44px]"
                      data-testid="button-keep-newer"
                    >
                      Keep This One (Delete the other)
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  The deleted family and all its guests will be removed permanently.
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HouseholdCard({ household, guests, label }: { household: Household; guests: Guest[]; label: string }) {
  const mainContactGuest = guests.find(g => g.isMainHouseholdContact) || guests[0];
  const contactEmail = mainContactGuest?.email;
  const contactPhone = mainContactGuest?.phone;
  
  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-lg">{household.name}</h4>
          <Badge variant="outline" className="text-base mt-1">{label}</Badge>
        </div>
        <Badge variant="secondary" className="text-base">
          <Users className="h-4 w-4 mr-1" />
          {guests.length}
        </Badge>
      </div>
      
      <div className="space-y-2 text-base">
        {contactEmail && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-5 w-5" />
            <span className="truncate">{contactEmail}</span>
          </div>
        )}
        {contactPhone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-5 w-5" />
            <span>{contactPhone}</span>
          </div>
        )}
        
        {guests.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-base font-medium text-muted-foreground mb-2">Members:</p>
            <div className="space-y-1">
              {guests.slice(0, 4).map(guest => (
                <p key={guest.id} className="text-base">{guest.name}</p>
              ))}
              {guests.length > 4 && (
                <p className="text-base text-muted-foreground">+{guests.length - 4} more</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
