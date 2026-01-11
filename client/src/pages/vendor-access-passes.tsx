import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Link2, 
  Plus, 
  Copy, 
  Trash2, 
  ExternalLink, 
  ShieldOff,
  Eye,
  Users,
  Calendar,
  Clock,
  Loader2
} from "lucide-react";
import type { VendorAccessPass, Vendor, Event, Booking } from "@shared/schema";

interface BookingWithVendor extends Booking {
  vendor?: Vendor;
}

export default function VendorAccessPassesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [passName, setPassName] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [canViewGuestCount, setCanViewGuestCount] = useState(false);
  const [canViewVendorDetails, setCanViewVendorDetails] = useState(false);

  const { data: wedding } = useQuery<any>({
    queryKey: ["/api/weddings"],
    select: (data: any[]) => data?.[0],
  });

  const weddingId = wedding?.id;

  const { data: accessPasses = [], isLoading: loadingPasses } = useQuery<VendorAccessPass[]>({
    queryKey: ["/api/vendor-access-passes/wedding", weddingId],
    enabled: !!weddingId,
  });

  const { data: bookings = [] } = useQuery<BookingWithVendor[]>({
    queryKey: ["/api/bookings/with-vendors", weddingId],
    enabled: !!weddingId,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", weddingId],
    enabled: !!weddingId,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const bookedVendorIds = bookings
    .filter(b => b.status === "confirmed")
    .map(b => b.vendorId);
  
  const bookedVendors = vendors.filter(v => bookedVendorIds.includes(v.id));

  const createPassMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/vendor-access-passes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-access-passes/wedding", weddingId] });
      toast({
        title: "Access Pass Created",
        description: "The vendor can now view their filtered timeline.",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create access pass.",
        variant: "destructive",
      });
    },
  });

  const revokePassMutation = useMutation({
    mutationFn: async (passId: string) => {
      return await apiRequest(`/api/vendor-access-passes/${passId}/revoke`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-access-passes/wedding", weddingId] });
      toast({
        title: "Access Revoked",
        description: "The vendor can no longer access the timeline.",
      });
    },
  });

  const deletePassMutation = useMutation({
    mutationFn: async (passId: string) => {
      return await apiRequest(`/api/vendor-access-passes/${passId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-access-passes/wedding", weddingId] });
      toast({
        title: "Access Pass Deleted",
        description: "The access pass has been removed.",
      });
    },
  });

  const resetForm = () => {
    setSelectedVendorId("");
    setPassName("");
    setSelectedEventIds([]);
    setCanViewGuestCount(false);
    setCanViewVendorDetails(false);
  };

  const handleCreatePass = () => {
    if (!selectedVendorId || !passName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a vendor and enter a name for the access pass.",
        variant: "destructive",
      });
      return;
    }

    createPassMutation.mutate({
      weddingId,
      vendorId: selectedVendorId,
      name: passName.trim(),
      eventIds: selectedEventIds.length > 0 ? selectedEventIds : null,
      canViewGuestCount,
      canViewVendorDetails,
      timelineViewType: selectedEventIds.length > 0 ? "filtered" : "full",
    });
  };

  const copyAccessLink = (token: string) => {
    const link = `${window.location.origin}/vendor-timeline/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Share this link with your vendor.",
    });
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || "Unknown Vendor";
  };

  const formatCategories = (categories: string[] | null) => {
    if (!categories || categories.length === 0) return "";
    return categories.map(c => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  if (!wedding) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold" data-testid="text-page-title">Vendor Collaboration Hub</h1>
          <p className="text-muted-foreground mt-1">
            Share filtered timeline views with your booked vendors
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-access-pass">
              <Plus className="w-4 h-4 mr-2" />
              Create Access Pass
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Vendor Access Pass</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Vendor</Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger data-testid="select-vendor">
                    <SelectValue placeholder="Choose a booked vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bookedVendors.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        No confirmed bookings yet
                      </div>
                    ) : (
                      bookedVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} - {formatCategories(vendor.categories)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pass-name">Access Pass Name</Label>
                <Input
                  id="pass-name"
                  placeholder="e.g., Sarah's Makeup Artist Timeline"
                  value={passName}
                  onChange={(e) => setPassName(e.target.value)}
                  data-testid="input-pass-name"
                />
              </div>

              <div className="space-y-2">
                <Label>Visible Events (leave empty for all events)</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events created yet</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`event-${event.id}`}
                          checked={selectedEventIds.includes(event.id)}
                          onCheckedChange={() => toggleEventSelection(event.id)}
                          data-testid={`checkbox-event-${event.id}`}
                        />
                        <label 
                          htmlFor={`event-${event.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {event.name}
                          {event.date && (
                            <span className="text-muted-foreground ml-2">
                              ({new Date(event.date).toLocaleDateString()})
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select specific events the vendor should see, or leave empty to show all events.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Visibility Permissions</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="guest-count"
                    checked={canViewGuestCount}
                    onCheckedChange={(checked) => setCanViewGuestCount(checked === true)}
                    data-testid="checkbox-guest-count"
                  />
                  <label htmlFor="guest-count" className="text-sm cursor-pointer">
                    Show guest counts per event
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vendor-details"
                    checked={canViewVendorDetails}
                    onCheckedChange={(checked) => setCanViewVendorDetails(checked === true)}
                    data-testid="checkbox-vendor-details"
                  />
                  <label htmlFor="vendor-details" className="text-sm cursor-pointer">
                    Show other vendor names
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePass} 
                disabled={createPassMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createPassMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Access Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Active Access Passes
          </CardTitle>
          <CardDescription>
            Each pass gives a vendor access to view specific parts of your wedding timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPasses ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : accessPasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No access passes yet</p>
              <p className="text-sm mt-1">
                Create an access pass to share your timeline with vendors
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accessPasses.map((pass) => (
                <div 
                  key={pass.id} 
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`card-access-pass-${pass.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{pass.name}</h3>
                        <Badge 
                          variant={pass.status === "active" ? "default" : "secondary"}
                        >
                          {pass.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getVendorName(pass.vendorId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAccessLink(pass.token)}
                        disabled={pass.status !== "active"}
                        data-testid={`button-copy-link-${pass.id}`}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`/vendor-timeline/${pass.token}`, "_blank")}
                        disabled={pass.status !== "active"}
                        data-testid={`button-preview-${pass.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {pass.eventIds && pass.eventIds.length > 0 
                        ? `${pass.eventIds.length} events visible` 
                        : "All events visible"}
                    </div>
                    {pass.canViewGuestCount && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Guest counts
                      </div>
                    )}
                    {pass.accessCount && pass.accessCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Viewed {pass.accessCount} time{pass.accessCount !== 1 ? "s" : ""}
                      </div>
                    )}
                    {pass.lastAccessedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Last accessed: {new Date(pass.lastAccessedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    {pass.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokePassMutation.mutate(pass.id)}
                        disabled={revokePassMutation.isPending}
                        data-testid={`button-revoke-${pass.id}`}
                      >
                        <ShieldOff className="w-4 h-4 mr-1" />
                        Revoke Access
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePassMutation.mutate(pass.id)}
                      disabled={deletePassMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${pass.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>1. Create an access pass</strong> for each vendor you want to share timeline information with.
          </p>
          <p>
            <strong>2. Select which events</strong> they should see. For example, your makeup artist only needs to see morning prep schedules.
          </p>
          <p>
            <strong>3. Share the link</strong> with your vendor via email or message. They don't need to create an account.
          </p>
          <p>
            <strong>4. Track usage</strong> to see when vendors view the timeline, and revoke access anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
