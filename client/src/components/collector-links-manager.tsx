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
  Trash2,
  Eye,
  EyeOff,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
  Heart,
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

type GuestCollectorSubmission = {
  id: string;
  collectorLinkId: string;
  weddingId: string;
  submitterName: string;
  submitterRelation: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
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

  const { data: pendingCount } = useQuery<{ count: number }>({
    queryKey: ["/api/weddings", weddingId, "collector-submissions", "count"],
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

  const approveSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("POST", `/api/collector-submissions/${submissionId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Guest approved", description: "The guest has been added to your list." });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId] });
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
      toast({ title: "Suggestion declined", description: "The guest suggestion has been declined." });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", weddingId] });
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
  const processedSubmissions = submissions.filter(s => s.status !== 'pending');

  // Group submissions by submitter
  const submissionsBySubmitter = submissions.reduce((acc, submission) => {
    const submitterName = submission.submitterName || 'Unknown';
    const submitterRelation = submission.submitterRelation || 'Unknown';
    const key = `${submitterName}|||${submitterRelation}`;
    if (!acc[key]) {
      acc[key] = {
        name: submitterName,
        relation: submitterRelation,
        submissions: [],
        pendingCount: 0,
        approvedCount: 0,
        declinedCount: 0,
      };
    }
    acc[key].submissions.push(submission);
    if (submission.status === 'pending') acc[key].pendingCount++;
    else if (submission.status === 'approved') acc[key].approvedCount++;
    else if (submission.status === 'declined') acc[key].declinedCount++;
    return acc;
  }, {} as Record<string, { name: string; relation: string; submissions: GuestCollectorSubmission[]; pendingCount: number; approvedCount: number; declinedCount: number }>);

  const submitterList = Object.values(submissionsBySubmitter).sort((a, b) => 
    b.submissions.length - a.submissions.length
  );

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
                <div className="flex justify-between items-start">
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

      {pendingSubmissions.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Submissions
              <Badge variant="secondary">{pendingSubmissions.length}</Badge>
            </h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {pendingSubmissions.map(submission => (
                  <Card key={submission.id} className="p-4" data-testid={`submission-${submission.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{submission.guestName}</div>
                        <div className="text-sm text-muted-foreground">
                          Suggested by {submission.submitterName} ({submission.submitterRelation})
                        </div>
                        {submission.guestEmail && (
                          <div className="text-xs text-muted-foreground mt-1">{submission.guestEmail}</div>
                        )}
                        {submission.notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">"{submission.notes}"</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => approveSubmissionMutation.mutate(submission.id)}
                              disabled={approveSubmissionMutation.isPending}
                              data-testid={`button-approve-submission-${submission.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Approve and add to guest list</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => declineSubmissionMutation.mutate(submission.id)}
                              disabled={declineSubmissionMutation.isPending}
                              data-testid={`button-decline-submission-${submission.id}`}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Decline suggestion</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {submitterList.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              Submissions by Person
              <Badge variant="secondary">{submitterList.length} contributor{submitterList.length !== 1 ? 's' : ''}</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submitterList.map((submitter) => (
                <Card 
                  key={`${submitter.name}-${submitter.relation}`} 
                  className="p-4"
                  data-testid={`submitter-card-${submitter.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-base">{submitter.name}</div>
                      <div className="text-sm text-muted-foreground">{submitter.relation}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {submitter.submissions.length} total
                      </Badge>
                      {submitter.pendingCount > 0 && (
                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {submitter.pendingCount} pending
                        </Badge>
                      )}
                      {submitter.approvedCount > 0 && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {submitter.approvedCount} approved
                        </Badge>
                      )}
                      {submitter.declinedCount > 0 && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          {submitter.declinedCount} declined
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium mb-1">Suggested:</div>
                      <div className="line-clamp-3">
                        {submitter.submissions.slice(0, 5).map(s => s.guestName).join(', ')}
                        {submitter.submissions.length > 5 && ` +${submitter.submissions.length - 5} more`}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
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
