import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vendor, Booking, Event, Wedding } from "@shared/schema";
import { useLocation, useSearch } from "wouter";
import {
  Calendar,
  CalendarDays,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  MessageSquare,
  Plus,
  Trash2,
  Users,
  MapPin,
  Mail,
  Heart,
} from "lucide-react";
import { format } from "date-fns";

interface AlternateSlot {
  date: string;
  timeSlot: string;
  notes?: string;
}

export default function VendorBookings() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Parse filter from URL query params
  const getFilterFromUrl = () => {
    const params = new URLSearchParams(searchString);
    const filter = params.get("filter");
    if (filter === "pending" || filter === "confirmed" || filter === "declined") {
      return filter;
    }
    return "all";
  };
  
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "confirmed" | "declined">(getFilterFromUrl());
  
  // Update filter when URL changes
  useEffect(() => {
    setActiveFilter(getFilterFromUrl());
  }, [searchString]);

  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedBookingForDecline, setSelectedBookingForDecline] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [alternateSlots, setAlternateSlots] = useState<AlternateSlot[]>([]);
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotTime, setNewSlotTime] = useState("morning");
  const [newSlotNotes, setNewSlotNotes] = useState("");

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "vendor",
  });

  const currentVendor = vendors?.find(v => v.userId === user?.id);
  const vendorId = currentVendor?.id;

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/bookings/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Get unique wedding IDs from bookings to fetch their events and wedding info
  const uniqueWeddingIds = Array.from(new Set(bookings.map(b => b.weddingId).filter(Boolean))) as string[];
  
  // Fetch events for all weddings that have bookings
  const { data: eventsMap = {} } = useQuery<Record<string, Event>>({
    queryKey: ["/api/events/for-bookings", uniqueWeddingIds],
    queryFn: async () => {
      if (uniqueWeddingIds.length === 0) return {};
      
      // Fetch events for each wedding in parallel
      const eventPromises = uniqueWeddingIds.map(async (weddingId) => {
        try {
          const response = await fetch(`/api/events/${weddingId}`);
          if (!response.ok) return [];
          return await response.json();
        } catch {
          return [];
        }
      });
      
      const allEventsArrays = await Promise.all(eventPromises);
      const allEvents = allEventsArrays.flat() as Event[];
      
      // Create a map of eventId -> event for easy lookup
      const map: Record<string, Event> = {};
      allEvents.forEach(event => {
        map[event.id] = event;
      });
      return map;
    },
    enabled: uniqueWeddingIds.length > 0,
  });
  
  // Fetch wedding info for all bookings
  const { data: weddingsMap = {} } = useQuery<Record<string, Wedding>>({
    queryKey: ["/api/weddings/for-bookings", uniqueWeddingIds],
    queryFn: async () => {
      if (uniqueWeddingIds.length === 0) return {};
      
      // Fetch weddings in parallel
      const weddingPromises = uniqueWeddingIds.map(async (weddingId) => {
        try {
          const response = await fetch(`/api/weddings/${weddingId}`);
          if (!response.ok) return null;
          return await response.json();
        } catch {
          return null;
        }
      });
      
      const allWeddings = await Promise.all(weddingPromises);
      
      // Create a map of weddingId -> wedding for easy lookup
      const map: Record<string, Wedding> = {};
      allWeddings.forEach(wedding => {
        if (wedding) {
          map[wedding.id] = wedding;
        }
      });
      return map;
    },
    enabled: uniqueWeddingIds.length > 0,
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      status, 
      declineReason, 
      alternateSlots 
    }: { 
      bookingId: string; 
      status: string; 
      declineReason?: string;
      alternateSlots?: AlternateSlot[];
    }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}`, { 
        status, 
        declineReason, 
        alternateSlots 
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/vendor", vendorId] });
      const isDecline = variables.status === "declined";
      toast({
        title: isDecline ? "Booking Declined" : "Booking Updated",
        description: isDecline 
          ? (variables.alternateSlots?.length 
              ? "Booking declined with alternate dates suggested." 
              : "Booking has been declined.")
          : "Booking status has been updated successfully.",
      });
      if (isDecline) {
        setDeclineDialogOpen(false);
        setSelectedBookingForDecline(null);
        setDeclineReason("");
        setAlternateSlots([]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimeSlot = (slot: string) => {
    switch (slot) {
      case "morning": return "Morning (6am - 12pm)";
      case "afternoon": return "Afternoon (12pm - 5pm)";
      case "evening": return "Evening (5pm - 11pm)";
      case "full_day": return "Full Day";
      default: return slot;
    }
  };

  const handleUpdateBooking = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  const openDeclineDialog = (booking: Booking) => {
    setSelectedBookingForDecline(booking);
    setDeclineReason("");
    setAlternateSlots([]);
    setDeclineDialogOpen(true);
  };

  const addAlternateSlot = () => {
    if (newSlotDate) {
      setAlternateSlots([...alternateSlots, {
        date: newSlotDate,
        timeSlot: newSlotTime,
        notes: newSlotNotes,
      }]);
      setNewSlotDate("");
      setNewSlotTime("morning");
      setNewSlotNotes("");
    }
  };

  const removeAlternateSlot = (index: number) => {
    setAlternateSlots(alternateSlots.filter((_, i) => i !== index));
  };

  const handleDeclineWithAlternates = () => {
    if (selectedBookingForDecline) {
      updateBookingMutation.mutate({
        bookingId: selectedBookingForDecline.id,
        status: "declined",
        declineReason,
        alternateSlots: alternateSlots.length > 0 ? alternateSlots : undefined,
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background flex items-center justify-center">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  if (user.role !== "vendor") {
    setLocation("/dashboard");
    return null;
  }

  const pendingBookings = bookings.filter((b: Booking) => b.status === "pending");
  const confirmedBookings = bookings.filter((b: Booking) => b.status === "confirmed");
  const declinedBookings = bookings.filter((b: Booking) => b.status === "declined");
  
  // Filter bookings based on active filter
  const filteredBookings = activeFilter === "all" 
    ? bookings 
    : bookings.filter((b: Booking) => b.status === activeFilter);
  
  const handleFilterChange = (filter: string) => {
    const newFilter = filter as "all" | "pending" | "confirmed" | "declined";
    setActiveFilter(newFilter);
    // Update URL without triggering navigation
    if (newFilter === "all") {
      window.history.replaceState({}, '', '/vendor-bookings');
    } else {
      window.history.replaceState({}, '', `/vendor-bookings?filter=${newFilter}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
      <VendorHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Booking Requests</h1>
          <p className="text-muted-foreground mt-1">Manage your incoming booking requests from couples</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className={`p-4 hover-elevate cursor-pointer ${activeFilter === "pending" ? "ring-2 ring-yellow-500" : ""}`}
            onClick={() => handleFilterChange("pending")}
            data-testid="filter-card-pending"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold" data-testid="stat-pending">{pendingBookings.length}</p>
              </div>
            </div>
          </Card>
          <Card 
            className={`p-4 hover-elevate cursor-pointer ${activeFilter === "confirmed" ? "ring-2 ring-green-500" : ""}`}
            onClick={() => handleFilterChange("confirmed")}
            data-testid="filter-card-confirmed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold" data-testid="stat-confirmed">{confirmedBookings.length}</p>
              </div>
            </div>
          </Card>
          <Card 
            className={`p-4 hover-elevate cursor-pointer ${activeFilter === "declined" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => handleFilterChange("declined")}
            data-testid="filter-card-declined"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-2xl font-bold" data-testid="stat-declined">{declinedBookings.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <Tabs value={activeFilter} onValueChange={handleFilterChange}>
            <TabsList data-testid="tabs-booking-filter">
              <TabsTrigger value="all" data-testid="tab-all">
                All ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" data-testid="tab-confirmed">
                Confirmed ({confirmedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="declined" data-testid="tab-declined">
                Declined ({declinedBookings.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {bookingsLoading || vendorsLoading ? (
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeFilter === "all" ? "No Booking Requests" : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Bookings`}
            </h3>
            <p className="text-muted-foreground">
              {activeFilter === "all" 
                ? "You haven't received any booking requests yet."
                : `You don't have any ${activeFilter} bookings.`}
            </p>
            {activeFilter !== "all" && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => handleFilterChange("all")}
                data-testid="button-show-all"
              >
                Show All Bookings
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const event = booking.eventId ? eventsMap[booking.eventId] : null;
              const wedding = booking.weddingId ? weddingsMap[booking.weddingId] : null;
              const coupleName = wedding?.partner1Name && wedding?.partner2Name 
                ? `${wedding.partner1Name} & ${wedding.partner2Name}`
                : wedding?.partner1Name || wedding?.partner2Name || null;
              return (
              <Card key={booking.id} className="p-6" data-testid={`card-booking-${booking.id}`}>
                {/* Request From Section */}
                {(coupleName || wedding?.coupleEmail) && (
                  <div className="mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-primary" />
                      <span className="font-medium">Request from:</span>
                      {coupleName && (
                        <span className="font-semibold text-primary" data-testid={`text-couple-name-${booking.id}`}>
                          {coupleName}
                        </span>
                      )}
                      {wedding?.coupleEmail && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          {wedding.coupleEmail}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg" data-testid={`text-booking-event-${booking.id}`}>
                      {event?.name || "Booking Request"}
                    </h3>
                    {event && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {event.date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {format(new Date(event.date), 'MMM d, yyyy')}
                          </span>
                        )}
                        {event.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                          </span>
                        )}
                        {event.guestCount && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.guestCount} guests
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    )}
                    {!event && !coupleName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Wedding #{booking.weddingId?.slice(0, 8)}
                        {booking.eventId && ` - Event #${booking.eventId.slice(0, 8)}`}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default"
                        : booking.status === "pending"
                        ? "outline"
                        : "secondary"
                    }
                    data-testid={`badge-booking-status-${booking.id}`}
                  >
                    {booking.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {booking.requestedDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Requested Date</p>
                        <p className="font-medium" data-testid={`text-booking-date-${booking.id}`}>
                          {format(new Date(booking.requestedDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.timeSlot && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Time Slot</p>
                        <p className="font-medium">{formatTimeSlot(booking.timeSlot)}</p>
                      </div>
                    </div>
                  )}

                  {booking.estimatedCost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Cost</p>
                        <p className="font-mono font-semibold" data-testid={`text-booking-cost-${booking.id}`}>
                          ${parseFloat(booking.estimatedCost).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {(booking.coupleNotes || booking.notes) && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Message from Couple</p>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-booking-notes-${booking.id}`}>
                      {booking.coupleNotes || booking.notes}
                    </p>
                  </div>
                )}

                {booking.status === "pending" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBooking(booking.id, "confirmed")}
                      disabled={updateBookingMutation.isPending}
                      data-testid={`button-confirm-booking-${booking.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeclineDialog(booking)}
                      disabled={updateBookingMutation.isPending}
                      data-testid={`button-decline-booking-${booking.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline / Suggest Dates
                    </Button>
                  </div>
                )}

                {booking.status === "declined" && booking.declineReason && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">Decline Reason</p>
                    <p className="text-sm">{booking.declineReason}</p>
                  </div>
                )}

                {booking.status === "declined" && Array.isArray(booking.alternateSlots) && booking.alternateSlots.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">Alternate Dates Suggested</p>
                    <div className="space-y-2">
                      {(booking.alternateSlots as AlternateSlot[]).map((slot: AlternateSlot, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(slot.date), 'MMMM d, yyyy')}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{formatTimeSlot(slot.timeSlot)}</span>
                          {slot.notes && (
                            <>
                              <span className="text-muted-foreground">-</span>
                              <span className="text-muted-foreground">{slot.notes}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Couple Button - always visible */}
                <div className={`flex gap-2 ${booking.status !== "pending" ? "mt-4 pt-4 border-t" : ""}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const conversationId = booking.eventId 
                        ? `${booking.weddingId}-vendor-${booking.vendorId}-event-${booking.eventId}`
                        : `${booking.weddingId}-vendor-${booking.vendorId}`;
                      setLocation(`/vendor/messages?conversation=${conversationId}`);
                    }}
                    data-testid={`button-message-couple-${booking.id}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Couple
                  </Button>
                </div>
              </Card>
            );
            })}
          </div>
        )}
      </main>

      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Decline Booking</DialogTitle>
            <DialogDescription>
              Provide a reason for declining and optionally suggest alternate dates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="decline-reason">Reason for Declining</Label>
              <Textarea
                id="decline-reason"
                placeholder="e.g., Already booked for this date..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="mt-1"
                data-testid="input-decline-reason"
              />
            </div>

            <div>
              <Label className="mb-2 block">Suggest Alternate Dates (Optional)</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="flex-1"
                    data-testid="input-alternate-date"
                  />
                  <Select value={newSlotTime} onValueChange={setNewSlotTime}>
                    <SelectTrigger className="w-32" data-testid="select-alternate-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="full_day">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={addAlternateSlot}
                    data-testid="button-add-alternate"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Optional notes for this slot"
                  value={newSlotNotes}
                  onChange={(e) => setNewSlotNotes(e.target.value)}
                  data-testid="input-alternate-notes"
                />

                {alternateSlots.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    {alternateSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">
                          {format(new Date(slot.date), 'MMM d, yyyy')} - {formatTimeSlot(slot.timeSlot)}
                          {slot.notes && ` (${slot.notes})`}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeAlternateSlot(idx)}
                          data-testid={`button-remove-alternate-${idx}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineWithAlternates}
              disabled={updateBookingMutation.isPending}
              data-testid="button-confirm-decline"
            >
              Decline Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
