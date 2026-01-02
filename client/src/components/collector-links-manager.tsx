import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Link2,
  Plus,
  Copy,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Heart,
  HelpCircle,
  RotateCcw,
  EyeOff,
  ChevronDown,
  ChevronUp,
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
  const [showDecisions, setShowDecisions] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      setProcessingId(submissionId);
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Added to Guest List!", description: "This family has been added to your final guest list." });
      invalidateAll();
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setProcessingId(null);
    },
  });

  const declineSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      setProcessingId(submissionId);
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/decline`, {});
    },
    onSuccess: () => {
      toast({ title: "Declined", description: "You can restore this later if you change your mind." });
      invalidateAll();
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setProcessingId(null);
    },
  });

  const maybeSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      setProcessingId(submissionId);
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/maybe`, {});
    },
    onSuccess: () => {
      toast({ title: "Saved for Later", description: "You can decide on this when you're ready." });
      invalidateAll();
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setProcessingId(null);
    },
  });

  const restoreSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, targetStatus }: { submissionId: string; targetStatus: string }) => {
      setProcessingId(submissionId);
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/restore`, { targetStatus });
    },
    onSuccess: (_, { targetStatus }) => {
      const msg = targetStatus === 'approved' ? "Added to Guest List!" : "Moved to Maybe";
      toast({ title: msg, description: "Guest suggestion has been updated." });
      invalidateAll();
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setProcessingId(null);
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
  const decidedCount = maybeSubmissions.length + deniedSubmissions.length + approvedSubmissions.length;

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
                  {link.submissionCount} submission{link.submissionCount !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
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
                  {link.isActive && (
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
          
          {pendingSubmissions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Suggestions to Review ({pendingSubmissions.length})
                </h3>
              </div>
              
              <div className="space-y-4">
                {pendingSubmissions.map(submission => {
                  const memberCount = submission.members?.length || submission.guestCount || 1;
                  const isProcessing = processingId === submission.id;
                  
                  return (
                    <Card key={submission.id} className="p-4" data-testid={`submission-${submission.id}`}>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-lg">{submission.householdName || submission.guestName}</div>
                          <div className="text-base text-muted-foreground flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4" />
                            {memberCount} {memberCount === 1 ? 'person' : 'people'}
                          </div>
                        </div>
                        
                        {submission.members && submission.members.length > 0 && (
                          <div className="text-base text-muted-foreground">
                            {submission.members.map(m => m.name).join(', ')}
                          </div>
                        )}
                        
                        <div className="text-base text-muted-foreground">
                          Suggested by <span className="font-medium">{submission.submitterName || 'Unknown'}</span>
                          {submission.submitterRelation && ` (${submission.submitterRelation})`}
                        </div>
                        
                        {submission.notes && (
                          <div className="text-base text-muted-foreground italic bg-muted/50 p-3 rounded">"{submission.notes}"</div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 pt-2">
                          <Button
                            className="flex-1 min-w-[120px] min-h-[48px] text-base"
                            onClick={() => approveSubmissionMutation.mutate(submission.id)}
                            disabled={isProcessing}
                            data-testid={`button-approve-${submission.id}`}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                            )}
                            Add to List
                          </Button>
                          <Button
                            variant="secondary"
                            className="flex-1 min-w-[120px] min-h-[48px] text-base"
                            onClick={() => maybeSubmissionMutation.mutate(submission.id)}
                            disabled={isProcessing}
                            data-testid={`button-maybe-${submission.id}`}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <HelpCircle className="w-5 h-5 mr-2" />
                            )}
                            Maybe
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 min-w-[120px] min-h-[48px] text-base"
                            onClick={() => declineSubmissionMutation.mutate(submission.id)}
                            disabled={isProcessing}
                            data-testid={`button-decline-${submission.id}`}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="w-5 h-5 mr-2" />
                            )}
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-700 dark:text-green-400">All Caught Up!</p>
              <p className="text-base text-muted-foreground mt-1">
                No pending suggestions to review
              </p>
            </Card>
          )}

          {decidedCount > 0 && (
            <Collapsible open={showDecisions} onOpenChange={setShowDecisions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between min-h-[48px] text-base" data-testid="button-toggle-decisions">
                  <span className="flex items-center gap-2">
                    Past Decisions ({decidedCount})
                  </span>
                  {showDecisions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {approvedSubmissions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-base font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Added to Guest List ({approvedSubmissions.length})
                    </h4>
                    {approvedSubmissions.map(submission => (
                      <Card key={submission.id} className="p-3 bg-green-50/50 dark:bg-green-950/20 border-green-200">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-base font-medium">{submission.householdName || submission.guestName}</span>
                            <span className="text-base text-muted-foreground ml-2">
                              ({submission.members?.length || submission.guestCount || 1} people)
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {maybeSubmissions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-base font-medium flex items-center gap-2 text-amber-600">
                      <HelpCircle className="w-4 h-4" />
                      Maybe ({maybeSubmissions.length})
                    </h4>
                    {maybeSubmissions.map(submission => {
                      const isProcessing = processingId === submission.id;
                      return (
                        <Card key={submission.id} className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-base font-medium">{submission.householdName || submission.guestName}</span>
                              <span className="text-base text-muted-foreground ml-2">
                                ({submission.members?.length || submission.guestCount || 1} people)
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="min-h-[40px] text-base"
                                onClick={() => restoreSubmissionMutation.mutate({ submissionId: submission.id, targetStatus: 'approved' })}
                                disabled={isProcessing}
                                data-testid={`button-approve-maybe-${submission.id}`}
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[40px] text-base"
                                onClick={() => declineSubmissionMutation.mutate(submission.id)}
                                disabled={isProcessing}
                                data-testid={`button-decline-maybe-${submission.id}`}
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                                Decline
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {deniedSubmissions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-base font-medium flex items-center gap-2 text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      Declined ({deniedSubmissions.length})
                    </h4>
                    {deniedSubmissions.map(submission => {
                      const isProcessing = processingId === submission.id;
                      return (
                        <Card key={submission.id} className="p-3 opacity-75">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-base font-medium">{submission.householdName || submission.guestName}</span>
                              <span className="text-base text-muted-foreground ml-2">
                                ({submission.members?.length || submission.guestCount || 1} people)
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[40px] text-base"
                                onClick={() => restoreSubmissionMutation.mutate({ submissionId: submission.id, targetStatus: 'approved' })}
                                disabled={isProcessing}
                                data-testid={`button-restore-${submission.id}`}
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                                Restore
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
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
