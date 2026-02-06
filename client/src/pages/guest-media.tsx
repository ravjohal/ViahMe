import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, XCircle, Loader2, Video, Clock, ImagePlus, Settings } from "lucide-react";
import type { GuestMedia, WeddingWebsite, Wedding } from "@shared/schema";
import { useState } from "react";

export default function GuestMediaPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: weddings = [], isLoading: loadingWeddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[0];

  const { data: website, isLoading: loadingWebsite } = useQuery<WeddingWebsite>({
    queryKey: [`/api/wedding-websites/wedding/${wedding?.id}`],
    enabled: !!wedding?.id,
  });

  const { data: counts } = useQuery<{ pending: number; approved: number; rejected: number; total: number }>({
    queryKey: ['/api/guest-media', wedding?.id, 'counts'],
    enabled: !!wedding?.id,
  });

  const mediaStatusPath = activeTab === 'all'
    ? `/api/guest-media/${wedding?.id}`
    : `/api/guest-media/${wedding?.id}?status=${activeTab}`;

  const { data: media = [], isLoading: loadingMedia } = useQuery<GuestMedia[]>({
    queryKey: ['/api/guest-media', wedding?.id, activeTab],
    queryFn: async () => {
      const res = await fetch(mediaStatusPath, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
    enabled: !!wedding?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      return await apiRequest("PATCH", `/api/guest-media/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guest-media'] });
      toast({ title: "Media updated" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const toggleUploadsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!website) throw new Error("No website");
      return await apiRequest("PATCH", `/api/wedding-websites/${website.id}`, {
        guestUploadsEnabled: enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-websites/wedding/${wedding?.id}`] });
      toast({ title: "Settings updated" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const toggleModerationMutation = useMutation({
    mutationFn: async (requireApproval: boolean) => {
      if (!website) throw new Error("No website");
      return await apiRequest("PATCH", `/api/wedding-websites/${website.id}`, {
        guestUploadsRequireApproval: requireApproval,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-websites/wedding/${wedding?.id}`] });
      toast({ title: "Settings updated" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const handleApproveAll = async () => {
    const pendingMedia = media.filter(m => m.status === 'pending');
    for (const item of pendingMedia) {
      await updateStatusMutation.mutateAsync({ id: item.id, status: 'approved' });
    }
  };

  if (loadingWeddings || loadingWebsite) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Camera className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Create a wedding first to manage guest uploads</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold" data-testid="text-page-title">Guest Photos & Videos</h1>
          <p className="text-muted-foreground">Manage photos and videos uploaded by your guests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Upload Settings
          </CardTitle>
          <CardDescription>
            Control whether guests can upload photos and videos to your wedding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-base">Enable Guest Uploads</Label>
              <p className="text-sm text-muted-foreground">
                Allow guests to share photos and videos via your wedding website and RSVP portal
              </p>
            </div>
            <Switch
              checked={website?.guestUploadsEnabled ?? false}
              onCheckedChange={(checked) => toggleUploadsMutation.mutate(checked)}
              disabled={toggleUploadsMutation.isPending}
              data-testid="switch-uploads-enabled"
            />
          </div>

          {website?.guestUploadsEnabled && (
            <div className="flex items-center justify-between gap-4 border-t pt-4">
              <div>
                <Label className="text-base">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, uploads need your approval before appearing on the guest gallery
                </p>
              </div>
              <Switch
                checked={website?.guestUploadsRequireApproval ?? true}
                onCheckedChange={(checked) => toggleModerationMutation.mutate(checked)}
                disabled={toggleModerationMutation.isPending}
                data-testid="switch-require-approval"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {website?.guestUploadsEnabled && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold" data-testid="text-count-total">{counts?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-amber-500" data-testid="text-count-pending">{counts?.pending ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-green-500" data-testid="text-count-approved">{counts?.approved ?? 0}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-red-500" data-testid="text-count-rejected">{counts?.rejected ?? 0}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Media Gallery
                </CardTitle>
                {activeTab === 'pending' && (counts?.pending ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleApproveAll}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-approve-all"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve All ({counts?.pending})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 h-auto gap-1 p-1 mb-4">
                  <TabsTrigger value="pending" className="py-2">
                    Pending {(counts?.pending ?? 0) > 0 && <Badge variant="secondary" className="ml-1">{counts?.pending}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="py-2">Approved</TabsTrigger>
                  <TabsTrigger value="rejected" className="py-2">Rejected</TabsTrigger>
                  <TabsTrigger value="all" className="py-2">All</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {loadingMedia ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : media.length === 0 ? (
                    <div className="text-center py-12">
                      <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No {activeTab !== 'all' ? activeTab : ''} media yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {media.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border overflow-hidden group"
                          data-testid={`media-card-${item.id}`}
                        >
                          <div className="relative aspect-square bg-muted">
                            {item.mediaType === 'photo' ? (
                              <img
                                src={item.url}
                                alt={item.caption || "Guest upload"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                <Video className="w-10 h-10 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Video</span>
                              </div>
                            )}

                            <div className="absolute top-2 right-2">
                              {item.status === 'pending' && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {item.status === 'approved' && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {item.status === 'rejected' && (
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                            </div>

                            <div className="absolute bottom-2 left-2 right-2">
                              {item.source === 'rsvp' && (
                                <Badge variant="secondary" className="text-xs">
                                  via RSVP
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="p-3 space-y-2">
                            {item.uploaderName && (
                              <p className="text-sm font-medium truncate" data-testid={`text-uploader-${item.id}`}>
                                {item.uploaderName}
                              </p>
                            )}
                            {item.caption && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.caption}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>

                            {item.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full"
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'approved' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-approve-${item.id}`}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            {item.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'rejected' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-reject-${item.id}`}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
