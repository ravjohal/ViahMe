import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";
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
  Users,
  Home,
  Plus,
  Trash2,
  Mail
} from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, addDays } from "date-fns";
import type { Vendor, VendorAvailability } from "@shared/schema";
import { CalendarConnectionsManager } from "@/components/calendar-connections-manager";

interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

interface OutlookCalendarInfo {
  id: string;
  name: string;
  color?: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
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

type CalendarSource = 'local' | 'google' | 'outlook';

export default function VendorCalendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCalendar, setSelectedCalendar] = useState<string>("primary");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [syncStartDate, setSyncStartDate] = useState<Date>(startOfMonth(new Date()));
  const [syncEndDate, setSyncEndDate] = useState<Date>(endOfMonth(addMonths(new Date(), 3)));
  const [localSelectedDates, setLocalSelectedDates] = useState<Date[]>([]);
  const [localTimeSlot, setLocalTimeSlot] = useState<string>("full_day");

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const myVendor = vendors.find(v => v.userId === user?.id);
  const currentCalendarSource = (myVendor?.calendarSource || 'local') as CalendarSource;

  // Initialize selectedCalendar from vendor's saved externalCalendarId
  useEffect(() => {
    if (myVendor?.externalCalendarId) {
      setSelectedCalendar(myVendor.externalCalendarId);
    }
  }, [myVendor?.externalCalendarId]);

  const { data: localAvailability = [] } = useQuery<VendorAvailability[]>({
    queryKey: ['/api/vendor-availability/vendor', myVendor?.id],
    enabled: !!myVendor?.id && currentCalendarSource === 'local',
  });

  const updateCalendarSourceMutation = useMutation({
    mutationFn: async ({ calendarSource, externalCalendarId }: { calendarSource: CalendarSource; externalCalendarId?: string }) => {
      if (!myVendor) throw new Error("No vendor profile found");
      return apiRequest("PATCH", `/api/vendors/${myVendor.id}`, { 
        calendarSource,
        externalCalendarId: externalCalendarId || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Calendar source updated",
        description: "Your calendar settings have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update calendar source",
        variant: "destructive",
      });
    },
  });

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
    enabled: currentCalendarSource === 'google',
  });

  const { data: outlookCalendars, isLoading: outlookCalendarsLoading, error: outlookCalendarsError } = useQuery<OutlookCalendarInfo[]>({
    queryKey: ["/api/outlook-calendar/list"],
    retry: false,
    enabled: currentCalendarSource === 'outlook',
  });

  const [selectedOutlookCalendar, setSelectedOutlookCalendar] = useState<string>("primary");

  const googleNeedsAuth = (calendarsError as any)?.needsAuth || (!calendarsLoading && !calendars && currentCalendarSource === 'google');
  const outlookNeedsAuth = (outlookCalendarsError as any)?.needsAuth || (!outlookCalendarsLoading && !outlookCalendars && currentCalendarSource === 'outlook');

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
    enabled: currentCalendarSource === 'google' && !!calendars && calendars.length > 0,
  });

  const { data: outlookAvailability, isLoading: outlookAvailabilityLoading } = useQuery<AvailabilityWindow[]>({
    queryKey: ["/api/outlook-calendar/availability", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
      });
      const res = await fetch(`/api/outlook-calendar/availability?${params}`);
      if (!res.ok) throw new Error("Failed to fetch Outlook availability");
      return res.json();
    },
    enabled: currentCalendarSource === 'outlook' && !!outlookCalendars && outlookCalendars.length > 0,
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

  const syncOutlookMutation = useMutation({
    mutationFn: async () => {
      if (!myVendor) throw new Error("No vendor profile found");
      return apiRequest("POST", `/api/vendors/${myVendor.id}/sync-outlook-calendar`, {
        calendarId: selectedOutlookCalendar,
        startDate: syncStartDate.toISOString(),
        endDate: syncEndDate.toISOString(),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-availability"] });
      toast({
        title: "Outlook Calendar synced",
        description: data.message || "Your Outlook calendar has been synced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync Outlook calendar",
        variant: "destructive",
      });
    },
  });

  const addLocalAvailabilityMutation = useMutation({
    mutationFn: async (data: { vendorId: string; date: Date; timeSlot: string; status: string }) => {
      return apiRequest("POST", "/api/vendor-availability", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-availability/vendor', myVendor?.id] });
      setLocalSelectedDates([]);
      toast({
        title: "Availability added",
        description: "Your available time slots have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add availability",
        variant: "destructive",
      });
    },
  });

  const deleteLocalAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vendor-availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-availability/vendor', myVendor?.id] });
      toast({
        title: "Availability removed",
        description: "The time slot has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove availability",
        variant: "destructive",
      });
    },
  });

  const selectedDayAvailability = availability?.find(
    (a) => a.date === (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null)
  );

  const handleAddLocalAvailability = () => {
    if (!myVendor || localSelectedDates.length === 0) return;
    
    localSelectedDates.forEach(date => {
      addLocalAvailabilityMutation.mutate({
        vendorId: myVendor.id,
        date: date,
        timeSlot: localTimeSlot,
        status: 'available'
      });
    });
  };

  const handleCalendarSourceChange = (source: CalendarSource) => {
    updateCalendarSourceMutation.mutate({ calendarSource: source });
  };

  const CalendarSourceCard = ({ 
    source, 
    icon: Icon, 
    title, 
    description, 
    connected = false 
  }: { 
    source: CalendarSource; 
    icon: any; 
    title: string; 
    description: string; 
    connected?: boolean;
  }) => (
    <Card 
      className={`cursor-pointer hover-elevate transition-all ${
        currentCalendarSource === source ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={() => handleCalendarSourceChange(source)}
      data-testid={`calendar-source-${source}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
            currentCalendarSource === source ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{title}</h3>
              {currentCalendarSource === source && (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              )}
              {connected && source !== 'local' && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">Connected</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!myVendor) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Calendar Management</CardTitle>
            <CardDescription className="text-base">
              Create a vendor profile first to manage your availability calendar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar Management</h1>
          <p className="text-muted-foreground">
            Choose how to manage your availability - use our built-in calendar or sync with an external service
          </p>
        </div>
      </div>

      {/* Calendar Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Calendar Source</CardTitle>
          <CardDescription>
            Select where your availability data comes from. You can keep everything in Viah.me or sync with your existing calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <CalendarSourceCard
              source="local"
              icon={Home}
              title="Viah.me Calendar"
              description="Manage availability directly in the app"
              connected={true}
            />
            <CalendarSourceCard
              source="google"
              icon={SiGoogle}
              title="Google Calendar"
              description="Sync with your Google account"
              connected={!!calendars && calendars.length > 0}
            />
            <CalendarSourceCard
              source="outlook"
              icon={Mail}
              title="Outlook Calendar"
              description="Sync with Microsoft 365"
              connected={false}
            />
          </div>
        </CardContent>
      </Card>

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
                disabled={toggleCalendarSharingMutation.isPending}
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

      {/* Local Calendar Management */}
      {currentCalendarSource === 'local' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Add Available Dates</CardTitle>
              <CardDescription>Select dates when you're available for bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Dates</Label>
                <Calendar
                  mode="multiple"
                  selected={localSelectedDates}
                  onSelect={(dates) => setLocalSelectedDates(dates || [])}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                  data-testid="calendar-local-select"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-slot">Time Slot</Label>
                <Select value={localTimeSlot} onValueChange={setLocalTimeSlot}>
                  <SelectTrigger id="time-slot" data-testid="select-time-slot">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5 PM - 10 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={handleAddLocalAvailability}
                disabled={localSelectedDates.length === 0 || addLocalAvailabilityMutation.isPending}
                data-testid="button-add-availability"
              >
                {addLocalAvailabilityMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {localSelectedDates.length > 0 ? `${localSelectedDates.length} Date(s)` : 'Availability'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Your Availability</CardTitle>
              <CardDescription>
                Manage your available time slots for bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {localAvailability.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No availability set</p>
                  <p className="text-sm">Select dates on the left to add your available time slots</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {localAvailability
                    .filter(a => a.status === 'available')
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        data-testid={`availability-slot-${slot.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-4 w-4 text-green-600" />
                          <div>
                            <span className="font-medium">
                              {format(new Date(slot.date), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({slot.timeSlot === 'full_day' ? 'Full Day' : 
                                slot.timeSlot === 'morning' ? 'Morning' : 
                                slot.timeSlot === 'afternoon' ? 'Afternoon' : 'Evening'})
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLocalAvailabilityMutation.mutate(slot.id)}
                          disabled={deleteLocalAvailabilityMutation.isPending}
                          data-testid={`button-delete-${slot.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Google Calendar Integration */}
      {currentCalendarSource === 'google' && (
        <>
          {calendarsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Connecting to Google Calendar...</p>
              </div>
            </div>
          )}

          {googleNeedsAuth && !calendarsLoading && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <SiGoogle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Connect Google Calendar</CardTitle>
                <CardDescription className="text-base">
                  Connect your Google Calendar to automatically sync your availability with Viah.me.
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
          )}

          {calendars && calendars.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  Google Calendar Connected
                </Badge>
              </div>

              {/* Multi-Calendar Connections Manager */}
              {myVendor && (
                <CalendarConnectionsManager
                  vendorId={myVendor.id}
                  onConnectionsChange={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/calendar/list"] });
                  }}
                />
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Calendar Selection</CardTitle>
                    <CardDescription>Choose which calendar to sync</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="calendar-select">Active Calendar</Label>
                      <Select 
                        value={selectedCalendar} 
                        onValueChange={(value) => {
                          setSelectedCalendar(value);
                          // Save the selected calendar to vendor profile
                          updateCalendarSourceMutation.mutate({ 
                            calendarSource: 'google', 
                            externalCalendarId: value 
                          });
                        }}
                      >
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
                      <p className="text-xs text-muted-foreground">
                        Your selection will be saved automatically
                      </p>
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
                      disabled={syncMutation.isPending}
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
            </>
          )}
        </>
      )}

      {/* Outlook Calendar Integration */}
      {currentCalendarSource === 'outlook' && (
        <>
          {outlookCalendarsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                <p className="text-muted-foreground">Connecting to Outlook Calendar...</p>
              </div>
            </div>
          )}

          {outlookNeedsAuth && !outlookCalendarsLoading && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Connect Outlook Calendar</CardTitle>
                <CardDescription className="text-base">
                  Connect your Microsoft 365 or Outlook.com calendar to sync your availability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium">What you'll get:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Automatic availability sync from Outlook
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Real-time free/busy status for couples
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Booking confirmations added to your calendar
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Works with Microsoft 365 and Outlook.com
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.location.reload()}
                    data-testid="button-connect-outlook"
                  >
                    <Link2 className="mr-2 h-5 w-5" />
                    Connect Outlook Calendar
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your Outlook Calendar connection is managed through Replit's secure integration.
                    Refresh this page after connecting your account.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {outlookCalendars && outlookCalendars.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  Outlook Calendar Connected
                </Badge>
              </div>

              {/* Multi-Calendar Connections Manager for Outlook */}
              {myVendor && (
                <CalendarConnectionsManager
                  vendorId={myVendor.id}
                  onConnectionsChange={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/outlook-calendar/list"] });
                  }}
                />
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Calendar Selection</CardTitle>
                    <CardDescription>Choose which Outlook calendar to sync</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="outlook-calendar-select">Active Calendar</Label>
                      <Select value={selectedOutlookCalendar} onValueChange={setSelectedOutlookCalendar}>
                        <SelectTrigger id="outlook-calendar-select" data-testid="select-outlook-calendar">
                          <SelectValue placeholder="Select a calendar" />
                        </SelectTrigger>
                        <SelectContent>
                          {outlookCalendars?.map((cal) => (
                            <SelectItem key={cal.id} value={cal.id}>
                              <div className="flex items-center gap-2">
                                {cal.color && (
                                  <div 
                                    className="h-3 w-3 rounded-full" 
                                    style={{ backgroundColor: cal.color }}
                                  />
                                )}
                                <span>{cal.name}</span>
                                {cal.isDefaultCalendar && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Sync Date Range</h4>
                      <div className="grid gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <Calendar
                            mode="single"
                            selected={syncStartDate}
                            onSelect={(d) => d && setSyncStartDate(d)}
                            className="rounded-md border"
                            data-testid="calendar-sync-start"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <Calendar
                            mode="single"
                            selected={syncEndDate}
                            onSelect={(d) => d && setSyncEndDate(d)}
                            disabled={(date) => date < syncStartDate}
                            className="rounded-md border"
                            data-testid="calendar-sync-end"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => syncOutlookMutation.mutate()}
                      disabled={syncOutlookMutation.isPending}
                      data-testid="button-sync-outlook"
                    >
                      {syncOutlookMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync to Viah.me
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Availability Preview</CardTitle>
                    <CardDescription>
                      View your overall free/busy status from your Outlook account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border mx-auto"
                        data-testid="calendar-outlook-preview"
                      />
                    </div>

                    {outlookAvailabilityLoading && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {selectedDate && outlookAvailability && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </h4>
                        {(() => {
                          const dayAvailability = outlookAvailability.find(
                            (a) => a.date === format(selectedDate, 'yyyy-MM-dd')
                          );
                          if (!dayAvailability) {
                            return (
                              <p className="text-sm text-muted-foreground">
                                No availability data for this date
                              </p>
                            );
                          }
                          return (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {dayAvailability.slots.map((slot, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded-md text-sm flex items-center gap-2 ${
                                    slot.available
                                      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800'
                                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800'
                                  }`}
                                >
                                  {slot.available ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(slot.start), 'h:mm a')} - {format(new Date(slot.end), 'h:mm a')}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Outlook Calendars</CardTitle>
                  <CardDescription>All calendars connected to your Microsoft account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {outlookCalendars.map((cal) => (
                      <div
                        key={cal.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                          selectedOutlookCalendar === cal.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-border bg-card'
                        }`}
                        onClick={() => setSelectedOutlookCalendar(cal.id)}
                        data-testid={`outlook-calendar-card-${cal.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-600"
                          >
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium truncate">{cal.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{cal.id.slice(0, 20)}...</p>
                          </div>
                        </div>
                        {cal.isDefaultCalendar && (
                          <Badge variant="secondary" className="mt-3">Default Calendar</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
