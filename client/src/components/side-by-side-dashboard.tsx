import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Guest, Wedding } from "@shared/schema";
import {
  Users,
  Eye,
  EyeOff,
  Share2,
  Heart,
  CheckCircle2,
  Clock,
  MessageSquare,
  XCircle,
  Lock,
  Unlock,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SideStats = {
  bride: { total: number; private: number; shared: number; byStatus: Record<string, number> };
  groom: { total: number; private: number; shared: number; byStatus: Record<string, number> };
  mutual: { total: number };
};

const CONSENSUS_ICONS = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  under_discussion: <MessageSquare className="w-4 h-4 text-blue-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  declined: <XCircle className="w-4 h-4 text-red-500" />,
  frozen: <Lock className="w-4 h-4 text-gray-500" />,
};

const CONSENSUS_LABELS = {
  pending: "Pending Discussion",
  under_discussion: "Under Discussion",
  approved: "Both Agreed",
  declined: "Declined",
  frozen: "Final (Frozen)",
};

const CONSENSUS_COLORS = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  under_discussion: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  declined: "bg-red-100 text-red-700 border-red-200",
  frozen: "bg-gray-100 text-gray-700 border-gray-200",
};

interface SideBySideDashboardProps {
  weddingId: string;
  wedding?: Wedding;
  userSide?: 'bride' | 'groom';
}

export function SideBySideDashboard({ weddingId, wedding, userSide = 'bride' }: SideBySideDashboardProps) {
  const { toast } = useToast();
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: sideStats, isLoading: statsLoading } = useQuery<SideStats>({
    queryKey: ["/api/weddings", weddingId, "side-statistics"],
  });

  const { data: brideGuests = [], isLoading: brideLoading } = useQuery<Guest[]>({
    queryKey: ["/api/weddings", weddingId, "guests-by-side", "bride"],
  });

  const { data: groomGuests = [], isLoading: groomLoading } = useQuery<Guest[]>({
    queryKey: ["/api/weddings", weddingId, "guests-by-side", "groom"],
  });

  const { data: mutualGuests = [] } = useQuery<Guest[]>({
    queryKey: ["/api/weddings", weddingId, "guests-by-side", "mutual"],
  });

  const shareGuestsMutation = useMutation({
    mutationFn: async (guestIds: string[]) => {
      return apiRequest("POST", `/api/weddings/${weddingId}/share-guests`, { guestIds });
    },
    onSuccess: () => {
      toast({ title: "Guests shared", description: "Your partner can now see the selected guests." });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId] });
      setSelectedGuests([]);
      setShareDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateConsensusMutation = useMutation({
    mutationFn: async ({ guestIds, status }: { guestIds: string[]; status: string }) => {
      return apiRequest("POST", `/api/guests/update-consensus-status`, { guestIds, status });
    },
    onSuccess: () => {
      toast({ title: "Status updated", description: "Guest consensus status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId] });
      setSelectedGuests([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const myGuests = userSide === 'bride' ? brideGuests : groomGuests;
  const partnerGuests = userSide === 'bride' ? groomGuests : brideGuests;
  const myPrivateGuests = myGuests.filter(g => g.visibility === 'private');
  const mySharedGuests = myGuests.filter(g => g.visibility === 'shared');
  const partnerSharedGuests = partnerGuests.filter(g => g.visibility === 'shared');

  const totalConfirmed = 
    (sideStats?.bride.byStatus?.approved || 0) + 
    (sideStats?.groom.byStatus?.approved || 0);
  const totalGuests = (sideStats?.bride.total || 0) + (sideStats?.groom.total || 0) + (sideStats?.mutual.total || 0);

  const isLoading = statsLoading || brideLoading || groomLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-96 animate-pulse bg-muted" />
          <Card className="h-96 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Side-by-Side Guest Comparison
          </h2>
          <p className="text-muted-foreground">
            Review and collaborate on guest lists with your partner
          </p>
        </div>
        <div className="flex gap-2">
          {selectedGuests.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGuests([])}
                data-testid="button-clear-selection"
              >
                Clear ({selectedGuests.length})
              </Button>
              <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" data-testid="button-share-with-partner">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with Partner
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Share guests with your partner?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will make {selectedGuests.length} guest(s) visible to your partner. 
                      They will be able to see these guests and participate in decision-making.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => shareGuestsMutation.mutate(selectedGuests)}
                      disabled={shareGuestsMutation.isPending}
                      data-testid="button-confirm-share"
                    >
                      {shareGuestsMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4 mr-2" />
                      )}
                      Share Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              {wedding?.partner1Name || "Bride"}'s Side
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{sideStats?.bride.total || 0}</div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {sideStats?.bride.shared || 0} shared
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> {sideStats?.bride.private || 0} private
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-500" />
              {wedding?.partner2Name || "Groom"}'s Side
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{sideStats?.groom.total || 0}</div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {sideStats?.groom.shared || 0} shared
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> {sideStats?.groom.private || 0} private
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalGuests}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Agreed guests</span>
                <span>{totalConfirmed} / {totalGuests}</span>
              </div>
              <Progress 
                value={totalGuests > 0 ? (totalConfirmed / totalGuests) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b bg-pink-50/50 dark:bg-pink-950/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Your Guests
                {userSide === 'bride' ? " (Bride's Side)" : " (Groom's Side)"}
              </CardTitle>
              <Badge variant="secondary">{myGuests.length}</Badge>
            </div>
            <CardDescription>
              Guests you've added. Private guests are only visible to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {myPrivateGuests.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Private (Not shared with partner)
                    </span>
                  </div>
                  {myPrivateGuests.map(guest => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      selected={selectedGuests.includes(guest.id)}
                      onToggle={() => toggleGuestSelection(guest.id)}
                      showCheckbox={true}
                    />
                  ))}
                </>
              )}
              {mySharedGuests.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-green-50 dark:bg-green-950/20 border-b flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Shared with partner
                    </span>
                  </div>
                  {mySharedGuests.map(guest => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      selected={selectedGuests.includes(guest.id)}
                      onToggle={() => toggleGuestSelection(guest.id)}
                      showCheckbox={false}
                    />
                  ))}
                </>
              )}
              {myGuests.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No guests added yet</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b bg-blue-50/50 dark:bg-blue-950/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-blue-500" />
                Partner's Guests
                {userSide === 'bride' ? " (Groom's Side)" : " (Bride's Side)"}
              </CardTitle>
              <Badge variant="secondary">{partnerSharedGuests.length}</Badge>
            </div>
            <CardDescription>
              Guests shared by your partner for review and collaboration.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {partnerSharedGuests.length > 0 ? (
                partnerSharedGuests.map(guest => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    selected={false}
                    onToggle={() => {}}
                    showCheckbox={false}
                    onStatusChange={(status) => updateConsensusMutation.mutate({ guestIds: [guest.id], status })}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your partner hasn't shared any guests yet</p>
                  <p className="text-sm mt-2">
                    They may still be working on their list privately
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {mutualGuests.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b bg-purple-50/50 dark:bg-purple-950/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Mutual Guests
              </CardTitle>
              <Badge variant="secondary">{mutualGuests.length}</Badge>
            </div>
            <CardDescription>
              Guests that belong to both sides of the family.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              {mutualGuests.map(guest => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  selected={false}
                  onToggle={() => {}}
                  showCheckbox={false}
                />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface GuestRowProps {
  guest: Guest;
  selected: boolean;
  onToggle: () => void;
  showCheckbox: boolean;
  onStatusChange?: (status: string) => void;
}

function GuestRow({ guest, selected, onToggle, showCheckbox, onStatusChange }: GuestRowProps) {
  const status = (guest.consensusStatus || 'approved') as keyof typeof CONSENSUS_ICONS;
  
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover-elevate"
      data-testid={`guest-row-${guest.id}`}
    >
      {showCheckbox && (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          data-testid={`checkbox-guest-${guest.id}`}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{guest.name}</span>
          {guest.visibility === 'private' && (
            <Tooltip>
              <TooltipTrigger>
                <EyeOff className="w-3 h-3 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>Private - not shared with partner</TooltipContent>
            </Tooltip>
          )}
        </div>
        {guest.email && (
          <p className="text-xs text-muted-foreground truncate">{guest.email}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`text-xs ${CONSENSUS_COLORS[status]}`}
            >
              {CONSENSUS_ICONS[status]}
              <span className="ml-1 hidden sm:inline">{CONSENSUS_LABELS[status]}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{CONSENSUS_LABELS[status]}</TooltipContent>
        </Tooltip>
        {onStatusChange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onStatusChange('approved')}
                data-testid={`button-approve-${guest.id}`}
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Approve</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
