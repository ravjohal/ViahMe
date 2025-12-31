import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Mail,
  MessageSquare,
  Bell,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  Phone,
  Home,
} from "lucide-react";
import type { Wedding, Event, Household, GuestCommunication } from "@shared/schema";
import { format } from "date-fns";

type RsvpStats = {
  event: Event;
  totalInvited: number;
  attending: number;
  declined: number;
  pending: number;
  percentResponded: number;
};

export default function CommunicationHub() {
  const [activeTab, setActiveTab] = useState("send");
  const [selectedHouseholds, setSelectedHouseholds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [channel, setChannel] = useState<"email" | "sms" | "both">("email");
  const [message, setMessage] = useState("");
  const [updateSubject, setUpdateSubject] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: households, isLoading: householdsLoading } = useQuery<Household[]>({
    queryKey: ["/api/households", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: communications, isLoading: communicationsLoading } = useQuery<GuestCommunication[]>({
    queryKey: ["/api/communications", wedding?.id],
    queryFn: async () => {
      const res = await fetch(`/api/communications/${wedding?.id}`);
      if (!res.ok) throw new Error("Failed to fetch communications");
      return res.json();
    },
    enabled: !!wedding?.id,
  });

  const { data: rsvpStats, isLoading: rsvpLoading, refetch: refetchRsvp } = useQuery<RsvpStats[]>({
    queryKey: ["/api/rsvp-stats", wedding?.id],
    queryFn: async () => {
      const res = await fetch(`/api/rsvp-stats/${wedding?.id}`);
      if (!res.ok) throw new Error("Failed to fetch RSVP stats");
      return res.json();
    },
    enabled: !!wedding?.id,
  });

  const sendInvitationsMutation = useMutation({
    mutationFn: async (data: { householdIds: string[]; message?: string; channel: string }) => {
      return apiRequest(`/api/communications/send-invitations`, {
        method: "POST",
        body: JSON.stringify({ ...data, weddingId: wedding?.id }),
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Invitations sent",
        description: `Successfully sent to ${response.deliveredCount} households.${response.failedCount > 0 ? ` ${response.failedCount} failed.` : ""}`,
      });
      setSelectedHouseholds([]);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/communications", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp-stats", wedding?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const sendUpdateMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string; channel: string }) => {
      return apiRequest(`/api/communications/send-update`, {
        method: "POST",
        body: JSON.stringify({ ...data, weddingId: wedding?.id }),
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Update sent",
        description: `Successfully sent to ${response.deliveredCount} households.`,
      });
      setUpdateSubject("");
      setUpdateMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/communications", wedding?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send update",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const sendRsvpReminderMutation = useMutation({
    mutationFn: async (data: { channel: string }) => {
      return apiRequest(`/api/communications/send-rsvp-reminder`, {
        method: "POST",
        body: JSON.stringify({ ...data, weddingId: wedding?.id }),
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Reminders sent",
        description: `Sent to ${response.deliveredCount} households who haven't responded.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communications", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/rsvp-stats", wedding?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reminders",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredHouseholds = useMemo(() => {
    if (!households) return [];
    return households.filter((h) =>
      h.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [households, searchFilter]);

  const toggleAllHouseholds = () => {
    if (selectedHouseholds.length === filteredHouseholds.length) {
      setSelectedHouseholds([]);
    } else {
      setSelectedHouseholds(filteredHouseholds.map((h) => h.id));
    }
  };

  const toggleHousehold = (id: string) => {
    if (selectedHouseholds.includes(id)) {
      setSelectedHouseholds(selectedHouseholds.filter((hId) => hId !== id));
    } else {
      setSelectedHouseholds([...selectedHouseholds, id]);
    }
  };

  const householdsWithContact = useMemo(() => {
    if (!households) return { email: 0, phone: 0, total: 0 };
    const withEmail = households.filter((h) => h.contactEmail).length;
    const withPhone = households.filter((h) => h.contactPhone).length;
    return { email: withEmail, phone: withPhone, total: households.length };
  }, [households]);

  const totalResponded = useMemo(() => {
    if (!rsvpStats?.length) return { attending: 0, declined: 0, pending: 0, total: 0 };
    const first = rsvpStats[0];
    return {
      attending: first.attending,
      declined: first.declined,
      pending: first.pending,
      total: first.totalInvited,
    };
  }, [rsvpStats]);

  if (weddingsLoading || !wedding) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Guest Communication Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Send invitations, track RSVPs, and keep your guests informed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Households</p>
                <p className="text-2xl font-bold" data-testid="text-total-households">
                  {householdsLoading ? "..." : households?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Contacts</p>
                <p className="text-2xl font-bold" data-testid="text-email-contacts">
                  {householdsWithContact.email}/{householdsWithContact.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Contacts</p>
                <p className="text-2xl font-bold" data-testid="text-phone-contacts">
                  {householdsWithContact.phone}/{householdsWithContact.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="send" className="min-h-[48px] text-base gap-2" data-testid="tab-send">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send Invites</span>
            <span className="sm:hidden">Invites</span>
          </TabsTrigger>
          <TabsTrigger value="rsvp" className="min-h-[48px] text-base gap-2" data-testid="tab-rsvp">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">RSVP Tracker</span>
            <span className="sm:hidden">RSVPs</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="min-h-[48px] text-base gap-2" data-testid="tab-updates">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Send Updates</span>
            <span className="sm:hidden">Updates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>
                  Choose which households to send invitations to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search households..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10 min-h-[48px] text-base"
                      data-testid="input-search-households"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    {selectedHouseholds.length} of {filteredHouseholds.length} selected
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllHouseholds}
                    className="min-h-[48px]"
                    data-testid="button-toggle-all"
                  >
                    {selectedHouseholds.length === filteredHouseholds.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>

                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {householdsLoading ? (
                      <div className="p-4 space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : filteredHouseholds.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No households found</p>
                        <p className="text-sm">Add households in the Guests page first</p>
                      </div>
                    ) : (
                      filteredHouseholds.map((household) => (
                        <div
                          key={household.id}
                          className={`flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer ${
                            selectedHouseholds.includes(household.id)
                              ? "bg-primary/10"
                              : "bg-muted/30"
                          }`}
                          onClick={() => toggleHousehold(household.id)}
                          data-testid={`household-row-${household.id}`}
                        >
                          <Checkbox
                            checked={selectedHouseholds.includes(household.id)}
                            className="h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{household.name}</p>
                            <div className="flex gap-2 mt-0.5">
                              {household.contactEmail && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                              {household.contactPhone && (
                                <Badge variant="outline" className="text-xs">
                                  <Phone className="h-3 w-3 mr-1" />
                                  Phone
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">{household.maxCount} guests</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Compose Invitation
                </CardTitle>
                <CardDescription>
                  Customize your invitation message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base">Delivery Method</Label>
                  <RadioGroup
                    value={channel}
                    onValueChange={(v) => setChannel(v as any)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="text-base cursor-pointer">
                        Email only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="sms" />
                      <Label htmlFor="sms" className="text-base cursor-pointer">
                        SMS only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="text-base cursor-pointer">
                        Both
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-base">
                    Personal Message (optional)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal note to your invitation..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="text-base resize-none"
                    data-testid="input-personal-message"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be included along with your RSVP link
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Invitation will include:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Your wedding details and date
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Magic link for easy RSVP (no password needed)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Event list for per-event RSVPs
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full min-h-[48px] text-base gap-2"
                  onClick={() =>
                    sendInvitationsMutation.mutate({
                      householdIds: selectedHouseholds,
                      message: message || undefined,
                      channel,
                    })
                  }
                  disabled={selectedHouseholds.length === 0 || sendInvitationsMutation.isPending}
                  data-testid="button-send-invitations"
                >
                  {sendInvitationsMutation.isPending ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send to {selectedHouseholds.length} Household
                      {selectedHouseholds.length !== 1 && "s"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rsvp" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Invited</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-total-invited">
                    {totalResponded.total}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-green-700 dark:text-green-300">Attending</p>
                  <p
                    className="text-3xl font-bold text-green-600 dark:text-green-400"
                    data-testid="text-attending"
                  >
                    {totalResponded.attending}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-red-700 dark:text-red-300">Declined</p>
                  <p
                    className="text-3xl font-bold text-red-600 dark:text-red-400"
                    data-testid="text-declined"
                  >
                    {totalResponded.declined}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending</p>
                  <p
                    className="text-3xl font-bold text-yellow-600 dark:text-yellow-400"
                    data-testid="text-pending"
                  >
                    {totalResponded.pending}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {totalResponded.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress
                  value={
                    totalResponded.total > 0
                      ? ((totalResponded.attending + totalResponded.declined) /
                          totalResponded.total) *
                        100
                      : 0
                  }
                  className="h-4"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(
                    ((totalResponded.attending + totalResponded.declined) / totalResponded.total) *
                      100
                  )}
                  % of guests have responded
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>RSVP by Event</CardTitle>
                <CardDescription>Track responses for each ceremony</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchRsvp()}
                className="min-h-[48px] gap-2"
                data-testid="button-refresh-rsvp"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {rsvpLoading || eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !rsvpStats?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No RSVP data available yet</p>
                  <p className="text-sm">Send invitations to start tracking responses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rsvpStats.map((stat) => (
                    <div
                      key={stat.event.id}
                      className="p-4 border rounded-lg space-y-3"
                      data-testid={`rsvp-event-${stat.event.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{stat.event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.event.date
                              ? format(new Date(stat.event.date), "MMMM d, yyyy")
                              : "Date TBD"}
                          </p>
                        </div>
                        <Badge
                          variant={stat.percentResponded >= 80 ? "default" : "secondary"}
                          className="text-base px-3 py-1"
                        >
                          {Math.round(stat.percentResponded)}% responded
                        </Badge>
                      </div>
                      <Progress value={stat.percentResponded} className="h-2" />
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {stat.attending} attending
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          {stat.declined} declined
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Clock className="h-4 w-4" />
                          {stat.pending} pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {totalResponded.pending > 0 && (
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] text-base gap-2"
                  onClick={() => sendRsvpReminderMutation.mutate({ channel: "email" })}
                  disabled={sendRsvpReminderMutation.isPending}
                  data-testid="button-send-reminder"
                >
                  {sendRsvpReminderMutation.isPending ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Sending reminders...
                    </>
                  ) : (
                    <>
                      <Bell className="h-5 w-5" />
                      Send Reminder to {totalResponded.pending} Pending Guests
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Broadcast an Update
              </CardTitle>
              <CardDescription>
                Send an announcement to all invited guests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="update-subject" className="text-base">
                  Subject
                </Label>
                <Input
                  id="update-subject"
                  placeholder="e.g., Venue Change, Schedule Update, Important Information"
                  value={updateSubject}
                  onChange={(e) => setUpdateSubject(e.target.value)}
                  className="min-h-[48px] text-base"
                  data-testid="input-update-subject"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="update-message" className="text-base">
                  Message
                </Label>
                <Textarea
                  id="update-message"
                  placeholder="Write your announcement here..."
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  rows={6}
                  className="text-base resize-none"
                  data-testid="input-update-message"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base">Delivery Method</Label>
                <RadioGroup
                  value={channel}
                  onValueChange={(v) => setChannel(v as any)}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="update-email" />
                    <Label htmlFor="update-email" className="text-base cursor-pointer">
                      Email only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="update-sms" />
                    <Label htmlFor="update-sms" className="text-base cursor-pointer">
                      SMS only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="update-both" />
                    <Label htmlFor="update-both" className="text-base cursor-pointer">
                      Both
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    This will send to all {households?.length || 0} households
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Make sure your message is ready before sending!
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full min-h-[48px] text-base gap-2"
                onClick={() =>
                  sendUpdateMutation.mutate({
                    subject: updateSubject,
                    message: updateMessage,
                    channel,
                  })
                }
                disabled={
                  !updateSubject.trim() ||
                  !updateMessage.trim() ||
                  sendUpdateMutation.isPending
                }
                data-testid="button-send-update"
              >
                {sendUpdateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-5 w-5" />
                    Send Update to All Guests
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
              <CardDescription>History of messages sent to guests</CardDescription>
            </CardHeader>
            <CardContent>
              {communicationsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !communications?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No communications sent yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {communications
                      .sort(
                        (a, b) =>
                          new Date(b.sentAt || b.createdAt || 0).getTime() -
                          new Date(a.sentAt || a.createdAt || 0).getTime()
                      )
                      .map((comm) => (
                        <div
                          key={comm.id}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                          data-testid={`communication-row-${comm.id}`}
                        >
                          <div
                            className={`p-2 rounded-full ${
                              comm.type === "invitation"
                                ? "bg-primary/10"
                                : comm.type === "rsvp_reminder"
                                ? "bg-yellow-100 dark:bg-yellow-900"
                                : "bg-blue-100 dark:bg-blue-900"
                            }`}
                          >
                            {comm.type === "invitation" ? (
                              <Send className="h-4 w-4 text-primary" />
                            ) : comm.type === "rsvp_reminder" ? (
                              <Bell className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Megaphone className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize">
                              {comm.type?.replace("_", " ")}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {comm.subject || "Wedding Invitation"}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={comm.status === "completed" ? "default" : "secondary"}
                            >
                              {comm.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {comm.sentAt || comm.createdAt
                                ? format(
                                    new Date(comm.sentAt || comm.createdAt!),
                                    "MMM d, h:mm a"
                                  )
                                : "Pending"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
