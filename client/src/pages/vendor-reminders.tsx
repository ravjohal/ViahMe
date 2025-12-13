import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, isBefore, isToday, parseISO } from "date-fns";
import { useLocation } from "wouter";
import type { Vendor, FollowUpReminder } from "@shared/schema";
import {
  Bell,
  AlertCircle,
  Sparkles,
  Clock,
  Calendar,
  Heart,
  Check,
  X,
} from "lucide-react";

interface EnrichedReminder extends Omit<FollowUpReminder, 'reminderDate'> {
  coupleName: string;
  reminderDate: Date | string;
}

function ReminderCard({
  reminder,
  variant,
  onComplete,
  onDismiss,
}: {
  reminder: EnrichedReminder;
  variant: "overdue" | "today" | "upcoming";
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const bgClass = variant === "overdue" 
    ? "border-destructive/50 bg-destructive/5" 
    : variant === "today"
      ? "border-primary/50 bg-primary/5"
      : "";
  
  return (
    <Card className={bgClass} data-testid={`reminder-card-${reminder.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-primary" />
              <span className="font-medium">{reminder.coupleName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {variant === "overdue" ? "Was due " : variant === "today" ? "Due " : "Due "}
              {formatDistanceToNow(parseISO(reminder.reminderDate.toString()), { addSuffix: true })}
            </p>
            {reminder.note && (
              <p className="text-sm mt-2 italic">{reminder.note}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onComplete}
              title="Mark as completed"
              data-testid={`button-complete-reminder-${reminder.id}`}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              title="Dismiss"
              data-testid={`button-dismiss-reminder-${reminder.id}`}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorReminders() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "vendor",
  });
  
  const currentVendor = vendors?.find(v => v.userId === user?.id);
  const vendorId = currentVendor?.id;
  
  const { data: pendingReminders = [], isLoading: remindersLoading } = useQuery<EnrichedReminder[]>({
    queryKey: ["/api/follow-up-reminders/vendor", vendorId, "pending"],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/follow-up-reminders/vendor/${vendorId}/pending`);
      if (!response.ok) throw new Error("Failed to fetch reminders");
      return response.json();
    },
    enabled: !!vendorId,
  });
  
  const completeReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/follow-up-reminders/${id}`, { status: "completed" });
    },
    onSuccess: () => {
      toast({ title: "Reminder completed" });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-up-reminders/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to complete reminder", variant: "destructive" });
    },
  });
  
  const dismissReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/follow-up-reminders/${id}`, { status: "dismissed" });
    },
    onSuccess: () => {
      toast({ title: "Reminder dismissed" });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-up-reminders/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to dismiss reminder", variant: "destructive" });
    },
  });
  
  const overdueReminders = pendingReminders.filter(r => 
    isBefore(parseISO(r.reminderDate.toString()), new Date()) && !isToday(parseISO(r.reminderDate.toString()))
  );
  const todayReminders = pendingReminders.filter(r => 
    isToday(parseISO(r.reminderDate.toString()))
  );
  const upcomingReminders = pendingReminders.filter(r => 
    !isBefore(parseISO(r.reminderDate.toString()), new Date()) && !isToday(parseISO(r.reminderDate.toString()))
  );
  
  if (authLoading || vendorsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please log in as a vendor to access Reminders.</p>
            <Button className="mt-4" onClick={() => setLocation("/vendor-login")}>
              Go to Vendor Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!currentVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-4">Complete your vendor profile to access Reminders.</p>
            <Button onClick={() => setLocation("/vendor-dashboard")}>
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <VendorHeader />
      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Follow-Up Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Never forget to follow up with potential clients
          </p>
        </div>
        
        {remindersLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : pendingReminders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No pending reminders</h3>
              <p className="text-sm text-muted-foreground">
                Set reminders from the Messages page to stay on top of follow-ups
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {overdueReminders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Overdue ({overdueReminders.length})
                </h3>
                <div className="space-y-3">
                  {overdueReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      variant="overdue"
                      onComplete={() => completeReminderMutation.mutate(reminder.id)}
                      onDismiss={() => dismissReminderMutation.mutate(reminder.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {todayReminders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-primary flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Due Today ({todayReminders.length})
                </h3>
                <div className="space-y-3">
                  {todayReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      variant="today"
                      onComplete={() => completeReminderMutation.mutate(reminder.id)}
                      onDismiss={() => dismissReminderMutation.mutate(reminder.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {upcomingReminders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming ({upcomingReminders.length})
                </h3>
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      variant="upcoming"
                      onComplete={() => completeReminderMutation.mutate(reminder.id)}
                      onDismiss={() => dismissReminderMutation.mutate(reminder.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
