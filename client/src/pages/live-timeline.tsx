import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  useDraggable, 
  useDroppable, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCenter 
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Clock, 
  MapPin, 
  GripVertical, 
  Bell, 
  Check, 
  X, 
  AlertCircle, 
  Users2, 
  Radio,
  RefreshCw,
  Send,
  Pencil,
  UserCheck,
  UserX,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Event, Vendor, VendorEventTagWithVendor, TimelineChangeWithAcks } from "@shared/schema";

interface TimelineEvent extends Event {
  tags: VendorEventTagWithVendor[];
  pendingAcks: number;
  acknowledgedAcks: number;
}

interface BookedVendor {
  id: string;
  name: string;
  category: string;
  email: string | null;
  phone: string | null;
}

function SortableEventCard({ 
  event, 
  onEditTime, 
  onTagVendors 
}: { 
  event: TimelineEvent; 
  onEditTime: (event: TimelineEvent) => void;
  onTagVendors: (event: TimelineEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalVendors = event.tags.length;
  const hasVendors = totalVendors > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
      data-testid={`live-event-${event.id}`}
    >
      <Card className="mb-3 hover-elevate transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors touch-none"
              data-testid={`drag-handle-live-${event.id}`}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditTime(event)}
                    data-testid={`button-edit-time-${event.id}`}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit Time
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onTagVendors(event)}
                    data-testid={`button-tag-vendors-${event.id}`}
                  >
                    <Users2 className="w-4 h-4 mr-1" />
                    {hasVendors ? 'Manage' : 'Tag Vendors'}
                  </Button>
                </div>
              </div>

              {hasVendors && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">Tagged Vendors:</span>
                      {event.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.vendor.name}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {event.acknowledgedAcks > 0 && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                          <UserCheck className="w-3 h-3" />
                          {event.acknowledgedAcks} confirmed
                        </Badge>
                      )}
                      {event.pendingAcks > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {event.pendingAcks} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LiveTimelinePage() {
  const { toast } = useToast();
  const [editTimeDialogOpen, setEditTimeDialogOpen] = useState(false);
  const [tagVendorsDialogOpen, setTagVendorsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [newTime, setNewTime] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: timeline = [], isLoading: timelineLoading, refetch: refetchTimeline } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/weddings", wedding?.id, "timeline"],
    enabled: !!wedding?.id,
  });

  const { data: bookedVendors = [] } = useQuery<BookedVendor[]>({
    queryKey: ["/api/weddings", wedding?.id, "booked-vendors"],
    enabled: !!wedding?.id,
  });

  const { data: recentChanges = [], refetch: refetchChanges } = useQuery<TimelineChangeWithAcks[]>({
    queryKey: ["/api/weddings", wedding?.id, "timeline-changes"],
    enabled: !!wedding?.id,
  });

  useEffect(() => {
    if (!wedding?.id) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-feed?weddingId=${wedding.id}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected for live timeline updates');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'timeline_updated' || message.type === 'timeline_reordered' || message.type === 'vendor_ack') {
          refetchTimeline();
          refetchChanges();
          
          if (message.type === 'timeline_updated') {
            toast({
              title: "Timeline Updated",
              description: `${message.eventName} time changed to ${message.newTime}`,
            });
          } else if (message.type === 'vendor_ack') {
            toast({
              title: "Vendor Response",
              description: `${message.vendorName} ${message.status} the change`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return () => {
      ws.close();
    };
  }, [wedding?.id, refetchTimeline, refetchChanges, toast]);

  const reorderMutation = useMutation({
    mutationFn: async (orderedEventIds: string[]) => {
      return await apiRequest("PATCH", `/api/weddings/${wedding?.id}/timeline/reorder`, {
        orderedEventIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "timeline"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to reorder timeline",
        variant: "destructive",
      });
      refetchTimeline();
    },
  });

  const updateTimeMutation = useMutation({
    mutationFn: async ({ eventId, newTime, note }: { eventId: string; newTime: string; note?: string }) => {
      return await apiRequest("PATCH", `/api/events/${eventId}/time`, {
        newTime,
        note,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "timeline-changes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", wedding?.id] });
      setEditTimeDialogOpen(false);
      setNewTime("");
      setChangeNote("");
      setSelectedEvent(null);
      
      const vendorCount = data.taggedVendors?.length || 0;
      toast({
        title: "Time Updated",
        description: vendorCount > 0 
          ? `Notifications sent to ${vendorCount} tagged vendor(s)` 
          : "Event time has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update event time",
        variant: "destructive",
      });
    },
  });

  const tagVendorsMutation = useMutation({
    mutationFn: async ({ eventId, vendorIds }: { eventId: string; vendorIds: string[] }) => {
      return await apiRequest("POST", `/api/events/${eventId}/tags`, {
        vendorIds,
        notifyVia: 'email',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weddings", wedding?.id, "timeline"] });
      setTagVendorsDialogOpen(false);
      toast({
        title: "Vendors Tagged",
        description: "Vendors will be notified of any timeline changes",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to tag vendors",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = timeline.findIndex((e) => e.id === active.id);
      const newIndex = timeline.findIndex((e) => e.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(timeline, oldIndex, newIndex);
        const orderedIds = newOrder.map((e) => e.id);
        reorderMutation.mutate(orderedIds);
      }
    }
  };

  const handleEditTime = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setNewTime(event.time || "");
    setEditTimeDialogOpen(true);
  };

  const handleTagVendors = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setSelectedVendorIds(event.tags.map(t => t.vendorId));
    setTagVendorsDialogOpen(true);
  };

  const handleSubmitTimeChange = () => {
    if (selectedEvent && newTime) {
      updateTimeMutation.mutate({
        eventId: selectedEvent.id,
        newTime,
        note: changeNote || undefined,
      });
    }
  };

  const handleSubmitVendorTags = () => {
    if (selectedEvent) {
      tagVendorsMutation.mutate({
        eventId: selectedEvent.id,
        vendorIds: selectedVendorIds,
      });
    }
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  if (weddingsLoading || timelineLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="text-center p-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Wedding Found</h2>
          <p className="text-muted-foreground">Please create a wedding first to access the live timeline.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
            <Radio className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Timeline Control</h1>
            <p className="text-sm text-muted-foreground">
              Drag to reorder, edit times to notify vendors
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetchTimeline();
            refetchChanges();
          }}
          data-testid="button-refresh-timeline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {recentChanges.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Recent Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentChanges.slice(0, 3).map((change) => (
                <div key={change.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{change.event?.name}</span>
                    <span className="text-muted-foreground mx-2">-</span>
                    <span className="text-muted-foreground">
                      {change.changeType === 'time' && `${change.oldValue} → ${change.newValue}`}
                      {change.changeType === 'order' && 'Reordered'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {change.acknowledgments.filter(a => a.status === 'acknowledged').length > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Check className="w-3 h-3" />
                        {change.acknowledgments.filter(a => a.status === 'acknowledged').length}
                      </Badge>
                    )}
                    {change.acknowledgments.filter(a => a.status === 'pending').length > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {change.acknowledgments.filter(a => a.status === 'pending').length}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>
            Drag events to reorder. Tag vendors to notify them of changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled yet</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={timeline.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {timeline.map((event) => (
                  <SortableEventCard
                    key={event.id}
                    event={event}
                    onEditTime={handleEditTime}
                    onTagVendors={handleTagVendors}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={editTimeDialogOpen} onOpenChange={setEditTimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event Time</DialogTitle>
            <DialogDescription>
              Change the time for "{selectedEvent?.name}". Tagged vendors will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-time">New Time</Label>
              <Input
                id="new-time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="e.g., 10:30 AM"
                data-testid="input-new-time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-note">Note (optional)</Label>
              <Textarea
                id="change-note"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Add a note about this change..."
                rows={2}
                data-testid="input-change-note"
              />
            </div>
            {selectedEvent?.tags && selectedEvent.tags.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Will notify:</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedEvent.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.vendor.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTimeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitTimeChange}
              disabled={!newTime || updateTimeMutation.isPending}
              data-testid="button-submit-time-change"
            >
              {updateTimeMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Update & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagVendorsDialogOpen} onOpenChange={setTagVendorsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag Vendors</DialogTitle>
            <DialogDescription>
              Select vendors to notify when "{selectedEvent?.name}" time changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {bookedVendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No booked vendors found</p>
                <p className="text-sm">Book vendors to tag them for notifications</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {bookedVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleVendor(vendor.id)}
                    data-testid={`vendor-option-${vendor.id}`}
                  >
                    <Checkbox
                      checked={selectedVendorIds.includes(vendor.id)}
                      onCheckedChange={() => toggleVendor(vendor.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.category} {vendor.email && `- ${vendor.email}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagVendorsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitVendorTags}
              disabled={tagVendorsMutation.isPending}
              data-testid="button-submit-vendor-tags"
            >
              {tagVendorsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
