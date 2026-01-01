import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Link2,
  Plus,
  Copy,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
  Heart,
  HelpCircle,
  RotateCcw,
  EyeOff,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type GuestMember = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dietaryRestriction?: string;
};

type GuestCollectorSubmission = {
  id: string;
  collectorLinkId: string;
  weddingId: string;
  submitterName: string;
  submitterRelation: string;
  householdName?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCount?: number;
  members?: GuestMember[];
  relationshipTier?: string;
  notes?: string;
  status: string;
  createdAt: string;
};

interface CollectorLinksManagerProps {
  weddingId: string;
}

export function CollectorLinksManager({ weddingId }: CollectorLinksManagerProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkSide, setNewLinkSide] = useState<string>("bride");

  const { data: links = [], isLoading: linksLoading } = useQuery<GuestCollectorLink[]>({
    queryKey: ["/api/weddings", weddingId, "collector-links"],
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<GuestCollectorSubmission[]>({
    queryKey: ["/api/weddings", weddingId, "collector-submissions"],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId] });
    queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId, "collector-submissions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/guests", weddingId] });
    queryClient.invalidateQueries({ queryKey: ["/api/households", weddingId] });
  };

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

  const approveSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Added to Final List", description: "This family has been added to your guest list." });
      invalidateAll();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const declineSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/decline`, {});
    },
    onSuccess: () => {
      toast({ title: "Moved to Denied", description: "You can restore this later if you change your mind." });
      invalidateAll();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const maybeSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/maybe`, {});
    },
    onSuccess: () => {
      toast({ title: "Added to Maybe", description: "You can decide on this later." });
      invalidateAll();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const restoreSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, targetStatus }: { submissionId: string; targetStatus: string }) => {
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/restore`, { targetStatus });
    },
    onSuccess: (_, { targetStatus }) => {
      const msg = targetStatus === 'approved' ? "Added to Final List" : targetStatus === 'maybe' ? "Moved to Maybe" : "Back to Review";
      toast({ title: msg, description: "Guest suggestion has been updated." });
      invalidateAll();
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

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const maybeSubmissions = submissions.filter(s => s.status === 'maybe');
  const deniedSubmissions = submissions.filter(s => s.status === 'declined');
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');

  const renderSubmissionCard = (submission: GuestCollectorSubmission, showActions: 'pending' | 'maybe' | 'denied') => {
    const memberCount = submission.members?.length || submission.guestCount || 1;
    const isProcessing = approveSubmissionMutation.isPending || declineSubmissionMutation.isPending || maybeSubmissionMutation.isPending || restoreSubmissionMutation.isPending;
    
    return (
      <Card key={submission.id} className="p-4" data-testid={`submission-${submission.id}`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">{submission.householdName || submission.guestName}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Users className="w-4 h-4" />
                {memberCount} {memberCount === 1 ? 'person' : 'people'}
              </div>
            </div>
          </div>
          
          {submission.members && submission.members.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {submission.members.map(m => m.name).join(', ')}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Suggested by <span className="font-medium">{submission.submitterName || 'Unknown'}</span>
            {submission.submitterRelation && ` (${submission.submitterRelation})`}
          </div>
          
          {submission.notes && (
            <div className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">"{submission.notes}"</div>
          )}
          
          <div className="flex flex-wrap gap-2 pt-2">
            {showActions === 'pending' && (
              <>
                <Button
                  size="default"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => approveSubmissionMutation.mutate(submission.id)}
                  disabled={isProcessing}
                  data-testid={`button-approve-${submission.id}`}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Add
                </Button>
                <Button
                  size="default"
                  variant="secondary"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => maybeSubmissionMutation.mutate(submission.id)}
                  disabled={isProcessing}
                  data-testid={`button-maybe-${submission.id}`}
                >
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Maybe
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => declineSubmissionMutation.mutate(submission.id)}
                  disabled={isProcessing}
                  data-testid={`button-deny-${submission.id}`}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  No
                </Button>
              </>
            )}
            
            {showActions === 'maybe' && (
              <>
                <Button
                  size="default"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => restoreSubmissionMutation.mutate({ submissionId: submission.id, targetStatus: 'approved' })}
                  disabled={isProcessing}
                  data-testid={`button-approve-maybe-${submission.id}`}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Add to List
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => declineSubmissionMutation.mutate(submission.id)}
                  disabled={isProcessing}
                  data-testid={`button-deny-maybe-${submission.id}`}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Deny
                </Button>
              </>
            )}
            
            {showActions === 'denied' && (
              <>
                <Button
                  size="default"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => restoreSubmissionMutation.mutate({ submissionId: submission.id, targetStatus: 'approved' })}
                  disabled={isProcessing}
                  data-testid={`button-restore-final-${submission.id}`}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Add to List
                </Button>
                <Button
                  size="default"
                  variant="secondary"
                  className="flex-1 min-w-[100px] h-12 text-base"
                  onClick={() => restoreSubmissionMutation.mutate({ submissionId: submission.id, targetStatus: 'maybe' })}
                  disabled={isProcessing}
                  data-testid={`button-restore-maybe-${submission.id}`}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  To Maybe
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Guest Collector Links</h3>
          <p className="text-sm text-muted-foreground">
            Create shareable links for family members to suggest guests
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-collector-link">
          <Plus className="w-4 h-4 mr-2" />
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
          <p className="text-muted-foreground">No collector links created yet</p>
          <p className="text-sm text-muted-foreground mt-1">
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
                    <Heart className={`w-4 h-4 ${link.side === 'bride' ? 'text-pink-500' : 'text-blue-500'}`} />
                    <CardTitle className="text-base">{link.name}</CardTitle>
                  </div>
                  <Badge variant={link.isActive ? "default" : "secondary"}>
                    {link.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  {link.submissionCount} submission{link.submissionCount !== 1 ? 's' : ''}
                  {link.maxSubmissions && ` / ${link.maxSubmissions} max`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyLinkToClipboard(link.token)}
                        disabled={!link.isActive}
                        data-testid={`button-copy-link-${link.id}`}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy shareable link to clipboard</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(`/collect/${link.token}`, '_blank')}
                        disabled={!link.isActive}
                        data-testid={`button-preview-link-${link.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview link</TooltipContent>
                  </Tooltip>
                  {link.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid={`button-deactivate-${link.id}`}>
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate this link?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will prevent anyone from using this link to submit more guests. 
                            Existing submissions will not be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deactivateLinkMutation.mutate(link.id)}
                            data-testid="button-confirm-deactivate"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {submissions.length > 0 && (
        <>
          <Separator />
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="pending" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Review ({pendingSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="maybe" className="py-3 text-base data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <HelpCircle className="w-4 h-4 mr-2" />
                Maybe ({maybeSubmissions.length})
              </TabsTrigger>
              <TabsTrigger value="denied" className="py-3 text-base data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                <XCircle className="w-4 h-4 mr-2" />
                Denied ({deniedSubmissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingSubmissions.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-muted-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No pending suggestions to review
                  </p>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {pendingSubmissions.map(submission => renderSubmissionCard(submission, 'pending'))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="maybe" className="mt-4">
              {maybeSubmissions.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-50" />
                  <p className="text-muted-foreground">No maybes yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Families you're unsure about will appear here
                  </p>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {maybeSubmissions.map(submission => renderSubmissionCard(submission, 'maybe'))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="denied" className="mt-4">
              {deniedSubmissions.length === 0 ? (
                <Card className="p-8 text-center">
                  <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No denied suggestions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Denied families can be restored if you change your mind
                  </p>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {deniedSubmissions.map(submission => renderSubmissionCard(submission, 'denied'))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          {approvedSubmissions.length > 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-500" />
              {approvedSubmissions.length} {approvedSubmissions.length === 1 ? 'family' : 'families'} added to your guest list
            </div>
          )}
        </>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Guest Collector Link</DialogTitle>
            <DialogDescription>
              Create a shareable link that family members can use to suggest guests for your wedding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-name">Link Name</Label>
              <Input
                id="link-name"
                placeholder="e.g., Mom's Family, Dad's Colleagues"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                data-testid="input-link-name"
              />
              <p className="text-xs text-muted-foreground">
                Give this link a descriptive name to track who suggested which guests
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-side">Which Side?</Label>
              <Select value={newLinkSide} onValueChange={setNewLinkSide}>
                <SelectTrigger data-testid="select-link-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride's Side</SelectItem>
                  <SelectItem value="groom">Groom's Side</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Guests suggested via this link will be assigned to this side
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLink}
              disabled={createLinkMutation.isPending}
              data-testid="button-confirm-create-link"
            >
              {createLinkMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
