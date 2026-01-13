import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Plane, Hotel, MapPin, DollarSign, Plus, Trash2, Edit2, 
  Check, Calendar, Clock, CreditCard, Palmtree, Utensils,
  Car, ShoppingBag, Shield, Package
} from "lucide-react";
import type { 
  Wedding, HoneymoonFlight, HoneymoonHotel, 
  HoneymoonActivity, HoneymoonBudgetItem 
} from "@shared/schema";
import { HONEYMOON_BUDGET_CATEGORIES } from "@shared/schema";

const BUDGET_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  flights: <Plane className="h-4 w-4" />,
  accommodation: <Hotel className="h-4 w-4" />,
  activities: <Palmtree className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  transportation: <Car className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  insurance: <Shield className="h-4 w-4" />,
  other: <Package className="h-4 w-4" />,
};

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number | string | null): string {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

interface FlightCardProps {
  flight: HoneymoonFlight;
  onEdit: (flight: HoneymoonFlight) => void;
  onDelete: (id: string) => void;
}

function FlightCard({ flight, onEdit, onDelete }: FlightCardProps) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="h-4 w-4 text-primary" />
              <span className="font-semibold">{flight.airline}</span>
              {flight.flightNumber && (
                <Badge variant="secondary" className="text-xs">{flight.flightNumber}</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Departure</p>
                <p className="font-medium">{flight.departureAirport}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(flight.departureDate)} {flight.departureTime}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Arrival</p>
                <p className="font-medium">{flight.arrivalAirport}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(flight.arrivalDate)} {flight.arrivalTime}
                </p>
              </div>
            </div>
            {flight.confirmationNumber && (
              <p className="text-xs text-muted-foreground mt-2">
                Confirmation: {flight.confirmationNumber}
              </p>
            )}
            {flight.cost && (
              <p className="text-sm font-medium text-primary mt-2">
                {formatCurrency(flight.cost)}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(flight)} data-testid={`button-edit-flight-${flight.id}`}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(flight.id)} data-testid={`button-delete-flight-${flight.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HotelCardProps {
  hotel: HoneymoonHotel;
  onEdit: (hotel: HoneymoonHotel) => void;
  onDelete: (id: string) => void;
}

function HotelCard({ hotel, onEdit, onDelete }: HotelCardProps) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Hotel className="h-4 w-4 text-primary" />
              <span className="font-semibold">{hotel.name}</span>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{hotel.city}, {hotel.country}</span>
              </div>
              {hotel.address && (
                <p className="text-xs text-muted-foreground mt-1">{hotel.address}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div>
                <p className="text-muted-foreground">Check-in</p>
                <p className="font-medium">{formatDate(hotel.checkInDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check-out</p>
                <p className="font-medium">{formatDate(hotel.checkOutDate)}</p>
              </div>
            </div>
            {hotel.roomType && (
              <p className="text-xs text-muted-foreground mt-2">Room: {hotel.roomType}</p>
            )}
            {hotel.confirmationNumber && (
              <p className="text-xs text-muted-foreground">Confirmation: {hotel.confirmationNumber}</p>
            )}
            {hotel.totalCost && (
              <p className="text-sm font-medium text-primary mt-2">
                {formatCurrency(hotel.totalCost)}
                {hotel.costPerNight && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatCurrency(hotel.costPerNight)}/night)
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(hotel)} data-testid={`button-edit-hotel-${hotel.id}`}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(hotel.id)} data-testid={`button-delete-hotel-${hotel.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityCardProps {
  activity: HoneymoonActivity;
  onToggleComplete: (id: string) => void;
  onEdit: (activity: HoneymoonActivity) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}

function ActivityCard({ activity, onToggleComplete, onEdit, onDelete, isToggling }: ActivityCardProps) {
  return (
    <Card className={`hover-elevate ${activity.completed ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={activity.completed}
            onCheckedChange={() => onToggleComplete(activity.id)}
            disabled={isToggling}
            className="mt-1"
            data-testid={`checkbox-activity-${activity.id}`}
          />
          <div className="flex-1">
            <p className={`font-medium ${activity.completed ? 'line-through text-muted-foreground' : ''}`}>
              {activity.name}
            </p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {activity.date && (
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(activity.date)}
                </Badge>
              )}
              {activity.time && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </Badge>
              )}
              {activity.location && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {activity.location}
                </Badge>
              )}
            </div>
            {activity.cost && (
              <p className="text-sm font-medium text-primary mt-2">
                {formatCurrency(activity.cost)}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(activity)} data-testid={`button-edit-activity-${activity.id}`}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(activity.id)} data-testid={`button-delete-activity-${activity.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BudgetItemRowProps {
  item: HoneymoonBudgetItem;
  onTogglePaid: (id: string) => void;
  onEdit: (item: HoneymoonBudgetItem) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}

function BudgetItemRow({ item, onTogglePaid, onEdit, onDelete, isToggling }: BudgetItemRowProps) {
  const category = HONEYMOON_BUDGET_CATEGORIES.find(c => c.value === item.category);
  
  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg bg-card hover-elevate ${item.isPaid ? 'opacity-60' : ''}`}>
      <Checkbox
        checked={item.isPaid}
        onCheckedChange={() => onTogglePaid(item.id)}
        disabled={isToggling}
        data-testid={`checkbox-budget-${item.id}`}
      />
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        {BUDGET_CATEGORY_ICONS[item.category] || <DollarSign className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium ${item.isPaid ? 'line-through text-muted-foreground' : ''}`}>
            {item.name}
          </p>
          <Badge variant="outline" className="text-xs">{category?.label || item.category}</Badge>
          {item.isPaid && <Badge variant="secondary" className="text-xs">Paid</Badge>}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
        )}
      </div>
      <div className="text-right">
        {item.estimatedCost && (
          <p className="text-xs text-muted-foreground">Est: {formatCurrency(item.estimatedCost)}</p>
        )}
        <p className="font-medium text-primary">{formatCurrency(item.actualCost || item.estimatedCost)}</p>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => onEdit(item)} data-testid={`button-edit-budget-${item.id}`}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)} data-testid={`button-delete-budget-${item.id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface HoneymoonSummary {
  flights: { count: number; totalCost: number };
  hotels: { count: number; totalCost: number };
  activities: { total: number; completed: number; totalCost: number };
  budget: { itemCount: number; estimated: number; actual: number; paid: number; remaining: number };
  totalCost: number;
}

function HoneymoonPlannerContent({ weddingId }: { weddingId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("flights");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  
  const [flightDialog, setFlightDialog] = useState(false);
  const [editingFlight, setEditingFlight] = useState<HoneymoonFlight | null>(null);
  const [hotelDialog, setHotelDialog] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HoneymoonHotel | null>(null);
  const [activityDialog, setActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<HoneymoonActivity | null>(null);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<HoneymoonBudgetItem | null>(null);

  const { data: flights = [], isLoading: loadingFlights } = useQuery<HoneymoonFlight[]>({
    queryKey: ["/api/honeymoon/flights/wedding", weddingId],
  });

  const { data: hotels = [], isLoading: loadingHotels } = useQuery<HoneymoonHotel[]>({
    queryKey: ["/api/honeymoon/hotels/wedding", weddingId],
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery<HoneymoonActivity[]>({
    queryKey: ["/api/honeymoon/activities/wedding", weddingId],
  });

  const { data: budgetItems = [], isLoading: loadingBudget } = useQuery<HoneymoonBudgetItem[]>({
    queryKey: ["/api/honeymoon/budget/wedding", weddingId],
  });

  const { data: summary } = useQuery<HoneymoonSummary>({
    queryKey: ["/api/honeymoon/summary", weddingId],
  });

  const createFlightMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/honeymoon/flights", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/flights/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setFlightDialog(false);
      setEditingFlight(null);
      toast({ title: "Flight added" });
    },
    onError: () => toast({ title: "Failed to add flight", variant: "destructive" }),
  });

  const updateFlightMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/honeymoon/flights/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/flights/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setFlightDialog(false);
      setEditingFlight(null);
      toast({ title: "Flight updated" });
    },
    onError: () => toast({ title: "Failed to update flight", variant: "destructive" }),
  });

  const deleteFlightMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/honeymoon/flights/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/flights/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      toast({ title: "Flight deleted" });
    },
    onError: () => toast({ title: "Failed to delete flight", variant: "destructive" }),
  });

  const createHotelMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/honeymoon/hotels", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/hotels/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setHotelDialog(false);
      setEditingHotel(null);
      toast({ title: "Hotel added" });
    },
    onError: () => toast({ title: "Failed to add hotel", variant: "destructive" }),
  });

  const updateHotelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/honeymoon/hotels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/hotels/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setHotelDialog(false);
      setEditingHotel(null);
      toast({ title: "Hotel updated" });
    },
    onError: () => toast({ title: "Failed to update hotel", variant: "destructive" }),
  });

  const deleteHotelMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/honeymoon/hotels/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/hotels/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      toast({ title: "Hotel deleted" });
    },
    onError: () => toast({ title: "Failed to delete hotel", variant: "destructive" }),
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/honeymoon/activities", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/activities/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setActivityDialog(false);
      setEditingActivity(null);
      toast({ title: "Activity added" });
    },
    onError: () => toast({ title: "Failed to add activity", variant: "destructive" }),
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/honeymoon/activities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/activities/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setActivityDialog(false);
      setEditingActivity(null);
      toast({ title: "Activity updated" });
    },
    onError: () => toast({ title: "Failed to update activity", variant: "destructive" }),
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/honeymoon/activities/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/activities/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      toast({ title: "Activity deleted" });
    },
    onError: () => toast({ title: "Failed to delete activity", variant: "destructive" }),
  });

  const toggleActivityMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/honeymoon/activities/${id}/toggle-completed`, { method: "POST" }),
    onMutate: (id) => setTogglingIds(prev => new Set(prev).add(id)),
    onSettled: (_, __, id) => setTogglingIds(prev => { const next = new Set(prev); next.delete(id); return next; }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/activities/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
    },
    onError: () => toast({ title: "Failed to toggle activity", variant: "destructive" }),
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/honeymoon/budget", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/budget/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setBudgetDialog(false);
      setEditingBudget(null);
      toast({ title: "Budget item added" });
    },
    onError: () => toast({ title: "Failed to add budget item", variant: "destructive" }),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/honeymoon/budget/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/budget/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      setBudgetDialog(false);
      setEditingBudget(null);
      toast({ title: "Budget item updated" });
    },
    onError: () => toast({ title: "Failed to update budget item", variant: "destructive" }),
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/honeymoon/budget/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/budget/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
      toast({ title: "Budget item deleted" });
    },
    onError: () => toast({ title: "Failed to delete budget item", variant: "destructive" }),
  });

  const toggleBudgetPaidMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/honeymoon/budget/${id}/toggle-paid`, { method: "POST" }),
    onMutate: (id) => setTogglingIds(prev => new Set(prev).add(id)),
    onSettled: (_, __, id) => setTogglingIds(prev => { const next = new Set(prev); next.delete(id); return next; }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/budget/wedding", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/honeymoon/summary", weddingId] });
    },
    onError: () => toast({ title: "Failed to toggle payment status", variant: "destructive" }),
  });

  const handleFlightSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      weddingId,
      airline: formData.get("airline") as string,
      flightNumber: formData.get("flightNumber") as string || null,
      departureAirport: formData.get("departureAirport") as string,
      arrivalAirport: formData.get("arrivalAirport") as string,
      departureDate: formData.get("departureDate") as string,
      departureTime: formData.get("departureTime") as string || null,
      arrivalDate: formData.get("arrivalDate") as string || null,
      arrivalTime: formData.get("arrivalTime") as string || null,
      confirmationNumber: formData.get("confirmationNumber") as string || null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      notes: formData.get("notes") as string || null,
    };
    if (editingFlight) {
      updateFlightMutation.mutate({ id: editingFlight.id, data });
    } else {
      createFlightMutation.mutate(data);
    }
  };

  const handleHotelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      weddingId,
      name: formData.get("name") as string,
      address: formData.get("address") as string || null,
      city: formData.get("city") as string,
      country: formData.get("country") as string,
      checkInDate: formData.get("checkInDate") as string,
      checkOutDate: formData.get("checkOutDate") as string,
      confirmationNumber: formData.get("confirmationNumber") as string || null,
      costPerNight: formData.get("costPerNight") ? Number(formData.get("costPerNight")) : null,
      totalCost: formData.get("totalCost") ? Number(formData.get("totalCost")) : null,
      roomType: formData.get("roomType") as string || null,
      notes: formData.get("notes") as string || null,
    };
    if (editingHotel) {
      updateHotelMutation.mutate({ id: editingHotel.id, data });
    } else {
      createHotelMutation.mutate(data);
    }
  };

  const handleActivitySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      weddingId,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      location: formData.get("location") as string || null,
      date: formData.get("date") as string || null,
      time: formData.get("time") as string || null,
      duration: formData.get("duration") as string || null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      confirmationNumber: formData.get("confirmationNumber") as string || null,
      notes: formData.get("notes") as string || null,
    };
    if (editingActivity) {
      updateActivityMutation.mutate({ id: editingActivity.id, data });
    } else {
      createActivityMutation.mutate(data);
    }
  };

  const handleBudgetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      weddingId,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      estimatedCost: formData.get("estimatedCost") ? Number(formData.get("estimatedCost")) : null,
      actualCost: formData.get("actualCost") ? Number(formData.get("actualCost")) : null,
      dueDate: formData.get("dueDate") as string || null,
      notes: formData.get("notes") as string || null,
    };
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const paidPercent = summary?.budget?.actual ? (summary.budget.paid / summary.budget.actual) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.flights?.count || 0}</p>
                <p className="text-sm text-muted-foreground">Flights</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Hotel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.hotels?.count || 0}</p>
                <p className="text-sm text-muted-foreground">Hotels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Palmtree className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.activities?.completed || 0}/{summary?.activities?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary?.totalCost || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary && summary.budget?.actual > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(summary.budget.paid)} / {formatCurrency(summary.budget.actual)} paid
              </span>
            </div>
            <Progress value={paidPercent} className="h-2" />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flights" data-testid="tab-flights">
            <Plane className="h-4 w-4 mr-2" /> Flights
          </TabsTrigger>
          <TabsTrigger value="hotels" data-testid="tab-hotels">
            <Hotel className="h-4 w-4 mr-2" /> Hotels
          </TabsTrigger>
          <TabsTrigger value="activities" data-testid="tab-activities">
            <Palmtree className="h-4 w-4 mr-2" /> Activities
          </TabsTrigger>
          <TabsTrigger value="budget" data-testid="tab-budget">
            <DollarSign className="h-4 w-4 mr-2" /> Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Flight Bookings</h3>
            <Button onClick={() => { setEditingFlight(null); setFlightDialog(true); }} data-testid="button-add-flight">
              <Plus className="h-4 w-4 mr-2" /> Add Flight
            </Button>
          </div>
          {loadingFlights ? (
            <p className="text-muted-foreground">Loading flights...</p>
          ) : flights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No flights added yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setFlightDialog(true)} data-testid="button-add-first-flight">
                  Add Your First Flight
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {flights.map(flight => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  onEdit={(f) => { setEditingFlight(f); setFlightDialog(true); }}
                  onDelete={(id) => deleteFlightMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Accommodations</h3>
            <Button onClick={() => { setEditingHotel(null); setHotelDialog(true); }} data-testid="button-add-hotel">
              <Plus className="h-4 w-4 mr-2" /> Add Hotel
            </Button>
          </div>
          {loadingHotels ? (
            <p className="text-muted-foreground">Loading hotels...</p>
          ) : hotels.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hotels added yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setHotelDialog(true)} data-testid="button-add-first-hotel">
                  Add Your First Hotel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {hotels.map(hotel => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onEdit={(h) => { setEditingHotel(h); setHotelDialog(true); }}
                  onDelete={(id) => deleteHotelMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Planned Activities</h3>
            <Button onClick={() => { setEditingActivity(null); setActivityDialog(true); }} data-testid="button-add-activity">
              <Plus className="h-4 w-4 mr-2" /> Add Activity
            </Button>
          </div>
          {loadingActivities ? (
            <p className="text-muted-foreground">Loading activities...</p>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Palmtree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No activities planned yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setActivityDialog(true)} data-testid="button-add-first-activity">
                  Add Your First Activity
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onToggleComplete={(id) => toggleActivityMutation.mutate(id)}
                  onEdit={(a) => { setEditingActivity(a); setActivityDialog(true); }}
                  onDelete={(id) => deleteActivityMutation.mutate(id)}
                  isToggling={togglingIds.has(activity.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Honeymoon Budget</h3>
            <Button onClick={() => { setEditingBudget(null); setBudgetDialog(true); }} data-testid="button-add-budget">
              <Plus className="h-4 w-4 mr-2" /> Add Expense
            </Button>
          </div>
          {loadingBudget ? (
            <p className="text-muted-foreground">Loading budget...</p>
          ) : budgetItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No budget items added yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setBudgetDialog(true)} data-testid="button-add-first-budget">
                  Add Your First Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {budgetItems.map(item => (
                <BudgetItemRow
                  key={item.id}
                  item={item}
                  onTogglePaid={(id) => toggleBudgetPaidMutation.mutate(id)}
                  onEdit={(b) => { setEditingBudget(b); setBudgetDialog(true); }}
                  onDelete={(id) => deleteBudgetMutation.mutate(id)}
                  isToggling={togglingIds.has(item.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={flightDialog} onOpenChange={setFlightDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFlight ? "Edit Flight" : "Add Flight"}</DialogTitle>
            <DialogDescription>Enter your flight details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFlightSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="airline">Airline *</Label>
                <Input id="airline" name="airline" defaultValue={editingFlight?.airline || ""} required data-testid="input-flight-airline" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flightNumber">Flight Number</Label>
                <Input id="flightNumber" name="flightNumber" defaultValue={editingFlight?.flightNumber || ""} data-testid="input-flight-number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureAirport">Departure Airport *</Label>
                <Input id="departureAirport" name="departureAirport" placeholder="e.g. SFO" defaultValue={editingFlight?.departureAirport || ""} required data-testid="input-flight-departure-airport" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalAirport">Arrival Airport *</Label>
                <Input id="arrivalAirport" name="arrivalAirport" placeholder="e.g. CDG" defaultValue={editingFlight?.arrivalAirport || ""} required data-testid="input-flight-arrival-airport" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date *</Label>
                <Input id="departureDate" name="departureDate" type="date" defaultValue={editingFlight?.departureDate ? new Date(editingFlight.departureDate).toISOString().split('T')[0] : ""} required data-testid="input-flight-departure-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input id="departureTime" name="departureTime" type="time" defaultValue={editingFlight?.departureTime || ""} data-testid="input-flight-departure-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Arrival Date</Label>
                <Input id="arrivalDate" name="arrivalDate" type="date" defaultValue={editingFlight?.arrivalDate ? new Date(editingFlight.arrivalDate).toISOString().split('T')[0] : ""} data-testid="input-flight-arrival-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Arrival Time</Label>
                <Input id="arrivalTime" name="arrivalTime" type="time" defaultValue={editingFlight?.arrivalTime || ""} data-testid="input-flight-arrival-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confirmationNumber">Confirmation #</Label>
                <Input id="confirmationNumber" name="confirmationNumber" defaultValue={editingFlight?.confirmationNumber || ""} data-testid="input-flight-confirmation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingFlight?.cost || ""} data-testid="input-flight-cost" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={editingFlight?.notes || ""} data-testid="input-flight-notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFlightDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createFlightMutation.isPending || updateFlightMutation.isPending} data-testid="button-save-flight">
                {editingFlight ? "Update" : "Add"} Flight
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={hotelDialog} onOpenChange={setHotelDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHotel ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
            <DialogDescription>Enter your accommodation details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHotelSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hotel Name *</Label>
              <Input id="name" name="name" defaultValue={editingHotel?.name || ""} required data-testid="input-hotel-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={editingHotel?.address || ""} data-testid="input-hotel-address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" defaultValue={editingHotel?.city || ""} required data-testid="input-hotel-city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input id="country" name="country" defaultValue={editingHotel?.country || ""} required data-testid="input-hotel-country" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date *</Label>
                <Input id="checkInDate" name="checkInDate" type="date" defaultValue={editingHotel?.checkInDate ? new Date(editingHotel.checkInDate).toISOString().split('T')[0] : ""} required data-testid="input-hotel-checkin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-out Date *</Label>
                <Input id="checkOutDate" name="checkOutDate" type="date" defaultValue={editingHotel?.checkOutDate ? new Date(editingHotel.checkOutDate).toISOString().split('T')[0] : ""} required data-testid="input-hotel-checkout" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type</Label>
                <Input id="roomType" name="roomType" placeholder="e.g. Deluxe Suite" defaultValue={editingHotel?.roomType || ""} data-testid="input-hotel-room" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmationNumber">Confirmation #</Label>
                <Input id="confirmationNumber" name="confirmationNumber" defaultValue={editingHotel?.confirmationNumber || ""} data-testid="input-hotel-confirmation" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPerNight">Cost/Night ($)</Label>
                <Input id="costPerNight" name="costPerNight" type="number" step="0.01" defaultValue={editingHotel?.costPerNight || ""} data-testid="input-hotel-cost-night" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost ($)</Label>
                <Input id="totalCost" name="totalCost" type="number" step="0.01" defaultValue={editingHotel?.totalCost || ""} data-testid="input-hotel-cost-total" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={editingHotel?.notes || ""} data-testid="input-hotel-notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setHotelDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createHotelMutation.isPending || updateHotelMutation.isPending} data-testid="button-save-hotel">
                {editingHotel ? "Update" : "Add"} Hotel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>Plan an activity for your honeymoon</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActivitySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input id="name" name="name" placeholder="e.g. Sunset Cruise" defaultValue={editingActivity?.name || ""} required data-testid="input-activity-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingActivity?.description || ""} data-testid="input-activity-description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={editingActivity?.location || ""} data-testid="input-activity-location" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editingActivity?.date ? new Date(editingActivity.date).toISOString().split('T')[0] : ""} data-testid="input-activity-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" name="time" type="time" defaultValue={editingActivity?.time || ""} data-testid="input-activity-time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" name="duration" placeholder="e.g. 2 hours" defaultValue={editingActivity?.duration || ""} data-testid="input-activity-duration" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingActivity?.cost || ""} data-testid="input-activity-cost" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmationNumber">Confirmation #</Label>
                <Input id="confirmationNumber" name="confirmationNumber" defaultValue={editingActivity?.confirmationNumber || ""} data-testid="input-activity-confirmation" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={editingActivity?.notes || ""} data-testid="input-activity-notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setActivityDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createActivityMutation.isPending || updateActivityMutation.isPending} data-testid="button-save-activity">
                {editingActivity ? "Update" : "Add"} Activity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>Track your honeymoon expenses</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" name="name" placeholder="e.g. Travel Insurance" defaultValue={editingBudget?.name || ""} required data-testid="input-budget-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue={editingBudget?.category || ""} required>
                <SelectTrigger data-testid="select-budget-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {HONEYMOON_BUDGET_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" defaultValue={editingBudget?.estimatedCost || ""} data-testid="input-budget-estimated" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualCost">Actual Cost ($)</Label>
                <Input id="actualCost" name="actualCost" type="number" step="0.01" defaultValue={editingBudget?.actualCost || ""} data-testid="input-budget-actual" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={editingBudget?.dueDate ? new Date(editingBudget.dueDate).toISOString().split('T')[0] : ""} data-testid="input-budget-due" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={editingBudget?.notes || ""} data-testid="input-budget-notes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBudgetDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending} data-testid="button-save-budget">
                {editingBudget ? "Update" : "Add"} Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HoneymoonPlannerPage() {
  const { data: wedding, isLoading } = useQuery<Wedding>({
    queryKey: ["/api/my-wedding"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Palmtree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Wedding Found</h2>
            <p className="text-muted-foreground">
              Create a wedding first to plan your honeymoon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Palmtree className="h-6 w-6 text-primary" />
          Honeymoon Planner
        </h1>
        <p className="text-muted-foreground">
          Plan and track your dream honeymoon
        </p>
      </div>
      <HoneymoonPlannerContent weddingId={wedding.id} />
    </div>
  );
}
