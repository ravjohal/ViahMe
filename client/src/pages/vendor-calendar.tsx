import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Check, 
  X, 
  Link2, 
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Users
} from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import type { Vendor } from "@shared/schema";

interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

interface AvailabilityWindow {
  date: string;
  slots: AvailabilitySlot[];
}

export default function VendorCalendar() {
  const { toast } = useToast();
  const [selectedCalendar, setSelectedCalendar] = useState<string>("primary");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [syncStartDate, setSyncStartDate] = useState<Date>(startOfMonth(new Date()));
  const [syncEndDate, setSyncEndDate] = useState<Date>(endOfMonth(addMonths(new Date(), 3)));

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const myVendor = vendors.find(v => v.userId);

  const toggleCalendarSharingMutation = useMutation({
    mutationFn: async (calendarShared: boolean) => {
      if (!myVendor) throw new Error("No vendor profile found");
      return apiRequest("PATCH", `/api/vendors/${myVendor.id}`, { calendarShared });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: myVendor?.calendarShared ? "Calendar hidden" : "Calendar shared",
        description: myVendor?.calendarShared 
          ? "Couples can no longer see your availability"
          : "Couples can now view your available time slots",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update calendar sharing",
        variant: "destructive",
      });
    },
  });

  const { data: calendars, isLoading: calendarsLoading, error: calendarsError } = useQuery<CalendarInfo[]>({
    queryKey: ["/api/calendar/list"],
    retry: false,
  });

  const needsAuth = (calendarsError as any)?.needsAuth;

  const startDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addMonths(new Date(startDate), 1), 'yyyy-MM-dd');

  const { data: availability, isLoading: availabilityLoading } = useQuery<AvailabilityWindow[]>({
    queryKey: ["/api/calendar/availability", selectedCalendar, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        calendarId: selectedCalendar,
        startDate: startDate,
        endDate: endDate,
      });
      const res = await fetch(`/api/calendar/availability?${params}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!calendars && calendars.length > 0,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!myVendor) throw new Error("No vendor profile found");
      return apiRequest("POST", `/api/vendors/${myVendor.id}/sync-calendar`, {
        calendarId: selectedCalendar,
        startDate: syncStartDate.toISOString(),
        endDate: syncEndDate.toISOString(),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-availability"] });
      toast({
        title: "Calendar synced",
        description: data.message || "Your calendar has been synced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync calendar",
        variant: "destructive",
      });
    },
  });

  const selectedDayAvailability = availability?.find(
    (a) => a.date === (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null)
  );

  if (calendarsLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Connecting to Google Calendar...</p>
        </div>
      </div>
    );
  }

  if (needsAuth || !calendars) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Connect Your Calendar</CardTitle>
            <CardDescription className="text-base">
              Connect your Google Calendar to automatically sync your availability with Viah.me.
              This allows couples to see when you're free for consultations and bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium">What you'll get:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  Automatic availability sync from your calendar
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  Real-time free/busy status for couples
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  Automatic booking confirmations added to your calendar
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  Two-way sync to prevent double bookings
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => window.location.reload()}
                data-testid="button-connect-google"
              >
                <Link2 className="mr-2 h-5 w-5" />
                Connect Google Calendar
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your Google Calendar connection is managed through Replit's secure integration.
                Refresh this page after connecting your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar Integration</h1>
          <p className="text-muted-foreground">
            Manage your availability by syncing with your Google Calendar
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          Connected
        </Badge>
      </div>

      {/* Calendar Sharing Toggle */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Share Calendar with Couples</CardTitle>
                <CardDescription>
                  When enabled, couples can see your available time slots and request bookings
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="calendar-sharing"
                checked={myVendor?.calendarShared || false}
                onCheckedChange={(checked) => toggleCalendarSharingMutation.mutate(checked)}
                disabled={!myVendor || toggleCalendarSharingMutation.isPending}
                data-testid="switch-calendar-sharing"
              />
              <Label htmlFor="calendar-sharing" className="text-sm font-medium">
                {myVendor?.calendarShared ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Eye className="h-4 w-4" /> Visible to couples
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <EyeOff className="h-4 w-4" /> Hidden
                  </span>
                )}
              </Label>
            </div>
          </div>
        </CardHeader>
        {!myVendor?.calendarShared && (
          <CardContent className="pt-0">
            <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Your availability is currently hidden. Enable sharing so couples can see when you're available and request bookings.
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar Selection</CardTitle>
            <CardDescription>Choose which calendar to sync</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-select">Active Calendar</Label>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger id="calendar-select" data-testid="select-calendar">
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars?.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      <div className="flex items-center gap-2">
                        {cal.backgroundColor && (
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: cal.backgroundColor }}
                          />
                        )}
                        <span>{cal.summary}</span>
                        {cal.primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Sync Settings</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync from:</span>
                  <span>{format(syncStartDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sync to:</span>
                  <span>{format(syncEndDate, 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !myVendor}
              data-testid="button-sync-calendar"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Calendar Now
                </>
              )}
            </Button>

            {!myVendor && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Create a vendor profile to sync availability
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Availability Preview</CardTitle>
            <CardDescription>
              View your availability based on calendar events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasAvailability: availability?.map(a => new Date(a.date)) || [],
                  }}
                  modifiersStyles={{
                    hasAvailability: {
                      fontWeight: 'bold',
                    },
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                  </span>
                </div>

                {availabilityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedDayAvailability ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedDayAvailability.slots.map((slot, index) => {
                      const startTime = new Date(slot.start);
                      const endTime = new Date(slot.end);
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            slot.available 
                              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                              : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                          }`}
                          data-testid={`slot-${index}`}
                        >
                          <span className="font-medium">
                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                          </span>
                          <Badge variant={slot.available ? "default" : "secondary"}>
                            {slot.available ? (
                              <><Check className="h-3 w-3 mr-1" /> Available</>
                            ) : (
                              <><X className="h-3 w-3 mr-1" /> Busy</>
                            )}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a date to view availability</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Calendars</CardTitle>
          <CardDescription>
            Calendars available from your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calendars?.map((cal) => (
              <div
                key={cal.id}
                className={`p-4 rounded-lg border hover-elevate cursor-pointer transition-colors ${
                  selectedCalendar === cal.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCalendar(cal.id)}
                data-testid={`calendar-card-${cal.id}`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cal.backgroundColor || 'hsl(var(--primary))' }}
                  >
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate">{cal.summary}</h4>
                    <p className="text-xs text-muted-foreground truncate">{cal.id}</p>
                  </div>
                </div>
                {cal.primary && (
                  <Badge variant="secondary" className="mt-3">Primary Calendar</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
