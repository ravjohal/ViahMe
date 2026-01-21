import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Monitor,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserFeedback } from "@shared/schema";

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  reviewed: { label: "Reviewed", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  wont_fix: { label: "Won't Fix", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

const TYPE_ICONS = {
  bug: Bug,
  feature: Lightbulb,
  general: MessageSquare,
};

function getDeviceIcon(deviceInfo: any) {
  if (!deviceInfo?.userAgent) return Monitor;
  const ua = deviceInfo.userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return Smartphone;
  }
  return Monitor;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminFeedback() {
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("new");

  const { data: allFeedback = [], isLoading } = useQuery<UserFeedback[]>({
    queryKey: ["/api/feedback"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/feedback/${id}`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      setDetailDialogOpen(false);
      toast({
        title: "Feedback updated",
        description: "The feedback status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    },
  });

  const handleViewDetails = (feedback: UserFeedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.adminNotes || "");
    setNewStatus(feedback.status);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedFeedback) {
      updateMutation.mutate({
        id: selectedFeedback.id,
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      });
    }
  };

  const filteredFeedback = allFeedback.filter((f) => {
    if (activeTab === "all") return true;
    return f.status === activeTab;
  });

  const counts = {
    new: allFeedback.filter((f) => f.status === "new").length,
    reviewed: allFeedback.filter((f) => f.status === "reviewed").length,
    resolved: allFeedback.filter((f) => f.status === "resolved").length,
    all: allFeedback.length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-primary" />
            User Feedback
          </h1>
          <p className="text-muted-foreground">
            Review bug reports and feature requests from users
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{counts.new}</span>
              </div>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{counts.reviewed}</span>
              </div>
              <p className="text-sm text-muted-foreground">Reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{counts.resolved}</span>
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{counts.all}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Items</CardTitle>
            <CardDescription>
              Click on an item to view details and update status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="new" data-testid="tab-feedback-new">New ({counts.new})</TabsTrigger>
                <TabsTrigger value="reviewed" data-testid="tab-feedback-reviewed">Reviewed ({counts.reviewed})</TabsTrigger>
                <TabsTrigger value="resolved" data-testid="tab-feedback-resolved">Resolved ({counts.resolved})</TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-feedback-all">All ({counts.all})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {filteredFeedback.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No feedback items in this category</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeedback.map((feedback) => {
                        const TypeIcon = TYPE_ICONS[feedback.feedbackType as keyof typeof TYPE_ICONS] || MessageSquare;
                        const DeviceIcon = getDeviceIcon(feedback.deviceInfo);
                        const statusConfig = STATUS_CONFIG[feedback.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;

                        return (
                          <TableRow
                            key={feedback.id}
                            className="cursor-pointer hover-elevate"
                            onClick={() => handleViewDetails(feedback)}
                            data-testid={`row-feedback-${feedback.id}`}
                          >
                            <TableCell>
                              <TypeIcon className="h-4 w-4" />
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {feedback.description}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                              {feedback.pageUrl.replace(/^https?:\/\/[^/]+/, "")}
                            </TableCell>
                            <TableCell>
                              <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(feedback.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig.color}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" data-testid={`button-view-feedback-${feedback.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedFeedback && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {(() => {
                      const TypeIcon = TYPE_ICONS[selectedFeedback.feedbackType as keyof typeof TYPE_ICONS] || MessageSquare;
                      return <TypeIcon className="h-5 w-5" />;
                    })()}
                    {selectedFeedback.feedbackType === "bug" ? "Bug Report" : 
                     selectedFeedback.feedbackType === "feature" ? "Feature Request" : "General Feedback"}
                  </DialogTitle>
                  <DialogDescription>
                    Submitted {formatDate(selectedFeedback.createdAt)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {selectedFeedback.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Page URL</h4>
                      <a
                        href={selectedFeedback.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedFeedback.pageUrl.replace(/^https?:\/\/[^/]+/, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {selectedFeedback.userEmail && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">User Email</h4>
                        <p className="text-sm">{selectedFeedback.userEmail}</p>
                      </div>
                    )}
                  </div>

                  {selectedFeedback.deviceInfo && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Device Info</h4>
                      <div className="text-xs bg-muted p-2 rounded-md font-mono">
                        <p>Screen: {(selectedFeedback.deviceInfo as any).screenWidth}x{(selectedFeedback.deviceInfo as any).screenHeight}</p>
                        <p>Platform: {(selectedFeedback.deviceInfo as any).platform}</p>
                        <p className="truncate">UA: {(selectedFeedback.deviceInfo as any).userAgent}</p>
                      </div>
                    </div>
                  )}

                  {selectedFeedback.screenshotUrl && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Screenshot</h4>
                      <img
                        src={selectedFeedback.screenshotUrl}
                        alt="Screenshot"
                        className="w-full rounded-md border"
                      />
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Status</h4>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger data-testid="select-feedback-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="wont_fix">Won't Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Admin Notes</h4>
                      <Textarea
                        placeholder="Add notes about this feedback..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        data-testid="textarea-admin-notes"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDetailDialogOpen(false)}
                    data-testid="button-cancel-feedback-update"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updateMutation.isPending}
                    data-testid="button-update-feedback"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Status"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}
