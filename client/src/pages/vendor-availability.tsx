import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import type { Vendor, VendorAvailability, Wedding, Event } from "@shared/schema";

export default function VendorAvailabilityCalendar() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | 'full_day'>('full_day');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const getVendorName = (vendor: Vendor | null) => {
    return vendor?.name || 'Unknown Vendor';
  };

  // Fetch wedding and events
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ['/api/weddings'],
  });
  const wedding = weddings?.[0];

  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events', wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch all vendors
  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors'],
  });

  // Fetch availability for selected vendor in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: availability } = useQuery<VendorAvailability[]>({
    queryKey: ['/api/vendor-availability/vendor', selectedVendor?.id, 'range', monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      if (!selectedVendor) return [];
      const response = await fetch(
        `/api/vendor-availability/vendor/${selectedVendor.id}/range?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!selectedVendor,
  });

  // Check conflicts mutation
  const checkConflictsMutation = useMutation<
    { hasConflicts: boolean },
    Error,
    { vendorId: string; date: Date; timeSlot: string }
  >({
    mutationFn: async (data: { vendorId: string; date: Date; timeSlot: string }) => {
      const response = await apiRequest('POST', '/api/vendor-availability/check-conflicts', {
        vendorId: data.vendorId,
        date: data.date.toISOString(),
        timeSlot: data.timeSlot,
      });
      return await response.json();
    },
  });

  // Create availability/booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      date: Date;
      timeSlot: string;
      eventId?: string;
    }) => {
      return await apiRequest('POST', '/api/vendor-availability', {
        vendorId: data.vendorId,
        date: data.date.toISOString(),
        timeSlot: data.timeSlot,
        status: 'booked',
        eventId: data.eventId || null,
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate all availability queries for the booked vendor using prefix matching
      queryClient.invalidateQueries({ 
        queryKey: ['/api/vendor-availability/vendor', variables.vendorId, 'range'],
        exact: false
      });
      setBookingDialogOpen(false);
      toast({
        title: "Booking confirmed!",
        description: `${getVendorName(selectedVendor)} has been booked for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBookVendor = async () => {
    if (!selectedVendor || !selectedDate) return;

    // Check for conflicts first
    const conflictCheck = await checkConflictsMutation.mutateAsync({
      vendorId: selectedVendor.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    });

    if (conflictCheck.hasConflicts) {
      toast({
        title: "Time slot unavailable",
        description: "This vendor is already booked for the selected time slot.",
        variant: "destructive",
      });
      return;
    }

    // Create the booking
    createBookingMutation.mutate({
      vendorId: selectedVendor.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      eventId: selectedEvent || undefined,
    });
  };

  const getAvailabilityStatus = (date: Date): 'available' | 'partial' | 'booked' | null => {
    if (!availability || !selectedVendor) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvailability = availability.filter(
      (a) => format(new Date(a.date), 'yyyy-MM-dd') === dateStr
    );

    if (dayAvailability.length === 0) return 'available';

    const bookedSlots = dayAvailability.filter((a) => a.status === 'booked');
    if (bookedSlots.some((a) => a.timeSlot === 'full_day')) return 'booked';
    if (bookedSlots.length >= 3) return 'booked';
    if (bookedSlots.length > 0) return 'partial';

    return 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'booked':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'partial':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const modifiers = {
    available: (date: Date) => getAvailabilityStatus(date) === 'available',
    partial: (date: Date) => getAvailabilityStatus(date) === 'partial',
    booked: (date: Date) => getAvailabilityStatus(date) === 'booked',
  };

  const modifiersStyles = {
    available: {
      backgroundColor: 'hsl(var(--success) / 0.2)',
      color: 'hsl(var(--success-foreground))',
    },
    partial: {
      backgroundColor: 'hsl(var(--warning) / 0.2)',
      color: 'hsl(var(--warning-foreground))',
    },
    booked: {
      backgroundColor: 'hsl(var(--destructive) / 0.2)',
      color: 'hsl(var(--destructive-foreground))',
    },
  };

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Vendor Availability</CardTitle>
            <CardDescription>
              Please complete the onboarding process to start booking vendors.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-2">Vendor Availability</h1>
          <p className="text-muted-foreground">
            Real-time vendor calendar with instant booking confirmation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vendor Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Vendor</CardTitle>
                <CardDescription>Choose a vendor to view their availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedVendor?.id || ''}
                  onValueChange={(id) => {
                    const vendor = vendors?.find((v) => v.id === id);
                    setSelectedVendor(vendor || null);
                  }}
                >
                  <SelectTrigger data-testid="select-vendor">
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          <span>{vendor.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {vendor.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedVendor && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">{getVendorName(selectedVendor)}</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Category:</span> {selectedVendor.category}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">Location:</span> {selectedVendor.location}
                      </p>
                      {selectedVendor.priceRange && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Price Range:</span> {selectedVendor.priceRange}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Availability Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-green-200 dark:bg-green-900/30" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-amber-200 dark:bg-amber-900/30" />
                  <span className="text-sm">Partially Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-red-200 dark:bg-red-900/30" />
                  <span className="text-sm">Fully Booked</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {selectedVendor ? `${getVendorName(selectedVendor)} Availability` : 'Select a Vendor'}
                    </CardTitle>
                    <CardDescription>
                      {selectedVendor ? 'Click a date to book this vendor' : 'Choose a vendor to view their calendar'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                      data-testid="button-prev-month"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      data-testid="button-next-month"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedVendor ? (
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setBookingDialogOpen(true);
                        }
                      }}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      modifiers={modifiers}
                      modifiersStyles={modifiersStyles}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                      data-testid="calendar-availability"
                    />
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a vendor to view their availability calendar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Confirmation Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent data-testid="dialog-booking">
            <DialogHeader>
              <DialogTitle>Book {getVendorName(selectedVendor)}</DialogTitle>
              <DialogDescription>
                Confirm your booking for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Status Check */}
              {checkConflictsMutation.data && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${
                  checkConflictsMutation.data.hasConflicts 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                }`}>
                  {checkConflictsMutation.data.hasConflicts ? (
                    <>
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">This time slot is unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">This time slot is available!</span>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Time Slot</label>
                <Select value={selectedTimeSlot} onValueChange={(v: any) => setSelectedTimeSlot(v)}>
                  <SelectTrigger data-testid="select-timeslot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                    <SelectItem value="evening">Evening (5pm - 11pm)</SelectItem>
                    <SelectItem value="full_day">Full Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Link to Event (Optional)</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger data-testid="select-booking-event">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.date && format(new Date(event.date), 'MMM d')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                data-testid="button-cancel-booking"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookVendor}
                disabled={createBookingMutation.isPending || checkConflictsMutation.isPending}
                data-testid="button-confirm-booking"
              >
                {createBookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
