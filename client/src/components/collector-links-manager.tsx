import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Link2,
  Plus,
  Copy,
  Users,
  ExternalLink,
  RefreshCw,
  Heart,
  EyeOff,
  Eye,
  Loader2,
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

type GuestCollectorLink = {
  id: string;
  weddingId: string;
  token: string;
  name: string;
  side: string;
  createdById: string;
  createdByName?: string;
  isActive: boolean;
  submissionCount: number;
  maxSubmissions?: number;
  expiresAt?: string;
  createdAt: string;
};

interface CollectorLinksManagerProps {
  weddingId: string;
  onNavigateToReview?: () => void;
}

export function CollectorLinksManager({ weddingId, onNavigateToReview }: CollectorLinksManagerProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkSide, setNewLinkSide] = useState<string>("bride");

  const { data: links = [], isLoading: linksLoading } = useQuery<GuestCollectorLink[]>({
    queryKey: ["/api/weddings", weddingId, "collector-links"],
  });

  const createLinkMutation = useMutation({
    mutationFn: async ({ name, side }: { name: string; side: string }) => {
      return apiRequest("POST", `/api/weddings/${weddingId}/collector-links`, { name, side });
    },
    onSuccess: () => {
      toast({ title: "Link created", description: "Share this link with family members to collect guest suggestions." });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collector-links"] });
      setCreateDialogOpen(false);
      setNewLinkName("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deactivateLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      return apiRequest("POST", `/api/collector-links/${linkId}/deactivate`, {});
    },
    onSuccess: () => {
      toast({ title: "Link deactivated", description: "This link can no longer be used to submit guests." });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collector-links"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reactivateLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      return apiRequest("POST", `/api/collector-links/${linkId}/reactivate`, {});
    },
    onSuccess: () => {
      toast({ title: "Link reactivated", description: "This link is now active and can accept submissions." });
      queryClient.refetchQueries({ queryKey: ["/api/weddings", weddingId, "collector-links"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const copyLinkToClipboard = (token: string) => {
    const url = `${window.location.origin}/collect/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link with family members." });
  };

  const handleCreateLink = () => {
    if (!newLinkName.trim()) {
      toast({ title: "Error", description: "Please enter a name for this link", variant: "destructive" });
      return;
    }
    createLinkMutation.mutate({ name: newLinkName, side: newLinkSide });
  };

  const handleSubmissionClick = () => {
    if (onNavigateToReview) {
      onNavigateToReview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Guest Collector Links</h3>
          <p className="text-base text-muted-foreground">
            Create shareable links for family members to suggest guests
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="min-h-[48px] text-base px-6" data-testid="button-create-collector-link">
          <Plus className="w-5 h-5 mr-2" />
          Create Link
        </Button>
      </div>

      {linksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <Card className="p-8 text-center">
          <Link2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-base text-muted-foreground">No collector links created yet</p>
          <p className="text-base text-muted-foreground mt-1">
            Create a link to let family members suggest guests
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map(link => (
            <Card 
              key={link.id} 
              className={`${!link.isActive ? 'opacity-60' : ''}`}
              data-testid={`collector-link-${link.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <Heart className={`w-5 h-5 ${link.side === 'bride' ? 'text-pink-500' : 'text-amber-600'}`} />
                    <CardTitle className="text-base">{link.name}</CardTitle>
                  </div>
                  <Badge variant={link.isActive ? "default" : "secondary"}>
                    {link.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  {link.submissionCount > 0 ? (
                    <button
                      onClick={handleSubmissionClick}
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
                      data-testid={`link-submissions-${link.id}`}
                    >
                      {link.submissionCount} submission{link.submissionCount !== 1 ? 's' : ''}
                    </button>
                  ) : (
                    <span>{link.submissionCount} submissions</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="min-h-[44px]"
                        onClick={() => copyLinkToClipboard(link.token)}
                        disabled={!link.isActive}
                        data-testid={`button-copy-link-${link.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy shareable link to clipboard</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="min-h-[44px] min-w-[44px]"
                        onClick={() => window.open(`/collect/${link.token}`, '_blank')}
                        disabled={!link.isActive}
                        data-testid={`button-preview-link-${link.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview link</TooltipContent>
                  </Tooltip>
                  {link.isActive ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" data-testid={`button-deactivate-${link.id}`}>
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate this link?</AlertDialogTitle>
                          <AlertDialogDescription className="text-base">
                            This will prevent anyone from using this link to submit more guests. 
                            Existing submissions will not be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="min-h-[48px]">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deactivateLinkMutation.mutate(link.id)}
                            className="min-h-[48px]"
                            data-testid="button-confirm-deactivate"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          className="min-h-[44px]"
                          onClick={() => reactivateLinkMutation.mutate(link.id)}
                          disabled={reactivateLinkMutation.isPending}
                          data-testid={`button-reactivate-${link.id}`}
                        >
                          {reactivateLinkMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4 mr-2" />
                          )}
                          Reactivate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Make this link active again</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Guest Collector Link</DialogTitle>
            <DialogDescription className="text-base">
              Create a shareable link that family members can use to suggest guests for your wedding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-name" className="text-base">Link Name</Label>
              <Input
                id="link-name"
                placeholder="e.g., Mom's Family, Dad's Colleagues"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                className="min-h-[48px] text-base"
                data-testid="input-link-name"
              />
              <p className="text-base text-muted-foreground">
                Give this link a descriptive name to track who suggested which guests
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-side" className="text-base">Which Side?</Label>
              <Select value={newLinkSide} onValueChange={setNewLinkSide}>
                <SelectTrigger className="min-h-[48px] text-base" data-testid="select-link-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride" className="text-base">Bride's Side</SelectItem>
                  <SelectItem value="groom" className="text-base">Groom's Side</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-base text-muted-foreground">
                Guests suggested via this link will be assigned to this side
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="min-h-[48px] text-base">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLink}
              disabled={createLinkMutation.isPending}
              className="min-h-[48px] text-base"
              data-testid="button-confirm-create-link"
            >
              {createLinkMutation.isPending ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-5 h-5 mr-2" />
              )}
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
