import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Gift, Users, Plus, Trash2, Edit2, Check, Package, Heart, 
  Baby, UserCheck, Briefcase, Crown, Star, Flower2, Loader2
} from "lucide-react";
import type { Wedding, Favour, FavourRecipient } from "@shared/schema";
import { FAVOUR_CATEGORIES, insertFavourSchema, insertFavourRecipientSchema } from "@shared/schema";

const optionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  },
  z.number().nullable().optional()
);

const favourFormSchema = insertFavourSchema.pick({
  name: true,
  description: true,
  category: true,
  quantityPurchased: true,
  unitCost: true,
  totalCost: true,
  vendor: true,
  notes: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  quantityPurchased: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: optionalNumber,
  totalCost: optionalNumber,
});

type FavourFormData = z.infer<typeof favourFormSchema>;

const recipientFormSchema = insertFavourRecipientSchema.pick({
  recipientName: true,
  recipientType: true,
  quantity: true,
  notes: true,
}).extend({
  recipientName: z.string().min(1, "Recipient name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

type RecipientFormData = z.infer<typeof recipientFormSchema>;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  guest_favours: <Gift className="h-4 w-4" />,
  bridesmaids: <Heart className="h-4 w-4" />,
  groomsmen: <Briefcase className="h-4 w-4" />,
  parents: <Crown className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  vendors: <Star className="h-4 w-4" />,
  children: <Baby className="h-4 w-4" />,
  vip: <Crown className="h-4 w-4" />,
  other: <Package className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  guest_favours: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  bridesmaids: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  groomsmen: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  parents: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  family: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  vendors: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  children: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  vip: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

function formatCurrency(amount: number | string | null): string {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

function getCategoryLabel(category: string): string {
  const found = FAVOUR_CATEGORIES.find(c => c.value === category);
  return found?.label || category;
}

interface FavourCardProps {
  favour: Favour;
  recipientCount: number;
  onEdit: (favour: Favour) => void;
  onDelete: (id: string) => void;
  onAssignRecipient: (favour: Favour) => void;
}

function FavourCard({ favour, recipientCount, onEdit, onDelete, onAssignRecipient }: FavourCardProps) {
  const assignedPercentage = favour.quantityPurchased > 0 
    ? ((favour.quantityPurchased - favour.quantityRemaining) / favour.quantityPurchased) * 100 
    : 0;

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className={`p-1.5 rounded ${CATEGORY_COLORS[favour.category] || CATEGORY_COLORS.other}`}>
                {CATEGORY_ICONS[favour.category] || CATEGORY_ICONS.other}
              </div>
              <span className="font-semibold">{favour.name}</span>
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(favour.category)}
              </Badge>
            </div>
            
            {favour.description && (
              <p className="text-sm text-muted-foreground mb-2">{favour.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inventory</span>
                <span className="font-medium">
                  {favour.quantityPurchased - favour.quantityRemaining} / {favour.quantityPurchased} assigned
                </span>
              </div>
              <Progress value={assignedPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className="font-medium">{favour.quantityRemaining} units</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recipients</p>
                <p className="font-medium">{recipientCount}</p>
              </div>
            </div>

            {(favour.unitCost || favour.totalCost) && (
              <div className="flex items-center gap-4 mt-2 text-sm">
                {favour.unitCost && (
                  <span className="text-muted-foreground">
                    {formatCurrency(favour.unitCost)}/unit
                  </span>
                )}
                {favour.totalCost && (
                  <span className="font-medium text-primary">
                    Total: {formatCurrency(favour.totalCost)}
                  </span>
                )}
              </div>
            )}

            {favour.vendor && (
              <p className="text-xs text-muted-foreground mt-2">
                Vendor: {favour.vendor}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onAssignRecipient(favour)} 
              data-testid={`button-assign-recipient-${favour.id}`}
              title="Assign recipient"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onEdit(favour)} 
              data-testid={`button-edit-favour-${favour.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(favour.id)} 
              data-testid={`button-delete-favour-${favour.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecipientCardProps {
  recipient: FavourRecipient;
  favourName: string;
  onToggleDelivered: (id: string) => void;
  onDelete: (id: string) => void;
}

function RecipientCard({ recipient, favourName, onToggleDelivered, onDelete }: RecipientCardProps) {
  const isDelivered = recipient.deliveryStatus === 'delivered';
  
  return (
    <Card className={`hover-elevate ${isDelivered ? 'border-green-500/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant={isDelivered ? "default" : "outline"}
              onClick={() => onToggleDelivered(recipient.id)}
              data-testid={`button-toggle-delivered-${recipient.id}`}
            >
              <Check className="h-4 w-4" />
            </Button>
            <div>
              <p className="font-medium">{recipient.recipientName}</p>
              <p className="text-sm text-muted-foreground">{favourName}</p>
              {recipient.recipientType && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {recipient.recipientType}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">Qty: {recipient.quantity}</p>
              {isDelivered && recipient.deliveryDate && (
                <p className="text-xs text-muted-foreground">
                  Delivered: {new Date(recipient.deliveryDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(recipient.id)}
              data-testid={`button-delete-recipient-${recipient.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {recipient.notes && (
          <p className="text-xs text-muted-foreground mt-2 pl-12">{recipient.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function FavoursPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [showFavourDialog, setShowFavourDialog] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [editingFavour, setEditingFavour] = useState<Favour | null>(null);
  const [selectedFavour, setSelectedFavour] = useState<Favour | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const favourForm = useForm<FavourFormData>({
    resolver: zodResolver(favourFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "guest_favours",
      quantityPurchased: 1,
      unitCost: null,
      totalCost: null,
      vendor: "",
      notes: "",
    },
  });

  const recipientForm = useForm<RecipientFormData>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: {
      recipientName: "",
      recipientType: "",
      quantity: 1,
      notes: "",
    },
  });

  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  const { data: favours = [], isLoading: favoursLoading, isError: favoursError } = useQuery<Favour[]>({
    queryKey: ["/api/favours/wedding", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: recipients = [], isLoading: recipientsLoading, isError: recipientsError } = useQuery<FavourRecipient[]>({
    queryKey: ["/api/favour-recipients/wedding", wedding?.id],
    enabled: !!wedding?.id,
  });

  const createFavourMutation = useMutation({
    mutationFn: async (data: FavourFormData) => {
      return apiRequest("POST", "/api/favours", {
        ...data,
        weddingId: wedding!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favours/wedding", wedding?.id] });
      setShowFavourDialog(false);
      favourForm.reset();
      toast({ title: "Favour added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add favour", variant: "destructive" });
    },
  });

  const updateFavourMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FavourFormData }) => {
      return apiRequest("PATCH", `/api/favours/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favours/wedding", wedding?.id] });
      setShowFavourDialog(false);
      setEditingFavour(null);
      favourForm.reset();
      toast({ title: "Favour updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update favour", variant: "destructive" });
    },
  });

  const deleteFavourMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/favours/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favours/wedding", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/favour-recipients/wedding", wedding?.id] });
      toast({ title: "Favour deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete favour", variant: "destructive" });
    },
  });

  const createRecipientMutation = useMutation({
    mutationFn: async (data: RecipientFormData) => {
      return apiRequest("POST", "/api/favour-recipients", {
        ...data,
        favourId: selectedFavour!.id,
        weddingId: wedding!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favour-recipients/wedding", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/favours/wedding", wedding?.id] });
      setShowRecipientDialog(false);
      setSelectedFavour(null);
      recipientForm.reset();
      toast({ title: "Recipient assigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to assign recipient", variant: "destructive" });
    },
  });

  const toggleDeliveredMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/favour-recipients/${id}/toggle-delivered`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favour-recipients/wedding", wedding?.id] });
      toast({ title: "Delivery status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const deleteRecipientMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/favour-recipients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favour-recipients/wedding", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/favours/wedding", wedding?.id] });
      toast({ title: "Recipient removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove recipient", variant: "destructive" });
    },
  });

  function openEditFavour(favour: Favour) {
    setEditingFavour(favour);
    favourForm.reset({
      name: favour.name,
      description: favour.description || "",
      category: favour.category as "mithai" | "dry_fruits" | "clothing" | "jewelry" | "home_decor" | "cosmetics" | "gift_cards" | "cash_envelope" | "religious_items" | "personalized" | "other" | undefined,
      quantityPurchased: favour.quantityPurchased,
      unitCost: favour.unitCost ? Number(favour.unitCost) : null,
      totalCost: favour.totalCost ? Number(favour.totalCost) : null,
      vendor: favour.vendor || "",
      notes: favour.notes || "",
    });
    setShowFavourDialog(true);
  }

  function openAssignRecipient(favour: Favour) {
    setSelectedFavour(favour);
    recipientForm.reset({
      recipientName: "",
      recipientType: "",
      quantity: 1,
      notes: "",
    });
    setShowRecipientDialog(true);
  }

  function sanitizeNumericValue(val: number | null | undefined): number | undefined {
    if (val === null || val === undefined || Number.isNaN(val)) {
      return undefined;
    }
    return val;
  }

  function handleFavourSubmit(data: FavourFormData) {
    const sanitizedData = {
      ...data,
      unitCost: sanitizeNumericValue(data.unitCost),
      totalCost: sanitizeNumericValue(data.totalCost),
    };
    if (editingFavour) {
      updateFavourMutation.mutate({ id: editingFavour.id, data: sanitizedData });
    } else {
      createFavourMutation.mutate(sanitizedData);
    }
  }

  function handleRecipientSubmit(data: RecipientFormData) {
    createRecipientMutation.mutate(data);
  }

  const getRecipientCountForFavour = (favourId: string) => {
    return recipients.filter(r => r.favourId === favourId).length;
  };

  const getFavourName = (favourId: string) => {
    return favours.find(f => f.id === favourId)?.name || "Unknown";
  };

  const totalItems = favours.reduce((sum, f) => sum + f.quantityPurchased, 0);
  const totalAssigned = favours.reduce((sum, f) => sum + (f.quantityPurchased - f.quantityRemaining), 0);
  const totalDelivered = recipients.filter(r => r.deliveryStatus === 'delivered').length;
  const totalCost = favours.reduce((sum, f) => sum + (Number(f.totalCost) || 0), 0);

  if (!wedding) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please create or select a wedding first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Favour Log
          </h1>
          <p className="text-muted-foreground">
            Track gifts and favours for your wedding party and guests
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-200">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAssigned}</p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDelivered}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200">
                <Flower2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="recipients" data-testid="tab-recipients">
            <Users className="h-4 w-4 mr-2" />
            Recipients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Favours</h2>
            <Button 
              onClick={() => {
                setEditingFavour(null);
                favourForm.reset();
                setShowFavourDialog(true);
              }}
              data-testid="button-add-favour"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Favour
            </Button>
          </div>

          {favoursLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading favours...</p>
            </div>
          ) : favoursError ? (
            <div className="text-center py-8 text-destructive">
              Failed to load favours. Please try again.
            </div>
          ) : favours.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No favours yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking gifts for your wedding party and guests
                </p>
                <Button onClick={() => setShowFavourDialog(true)} data-testid="button-add-first-favour">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Favour
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {favours.map((favour) => (
                <FavourCard
                  key={favour.id}
                  favour={favour}
                  recipientCount={getRecipientCountForFavour(favour.id)}
                  onEdit={openEditFavour}
                  onDelete={(id) => deleteFavourMutation.mutate(id)}
                  onAssignRecipient={openAssignRecipient}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recipients" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recipients</h2>
            {favours.length > 0 && (
              <Select
                onValueChange={(favourId) => {
                  const favour = favours.find(f => f.id === favourId);
                  if (favour) openAssignRecipient(favour);
                }}
              >
                <SelectTrigger className="w-48" data-testid="select-assign-favour">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Assign Favour</span>
                </SelectTrigger>
                <SelectContent>
                  {favours.filter(f => f.quantityRemaining > 0).map((favour) => (
                    <SelectItem key={favour.id} value={favour.id}>
                      {favour.name} ({favour.quantityRemaining} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {recipientsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Loading recipients...</p>
            </div>
          ) : recipientsError ? (
            <div className="text-center py-8 text-destructive">
              Failed to load recipients. Please try again.
            </div>
          ) : recipients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No recipients assigned</h3>
                <p className="text-muted-foreground">
                  Assign favours to track who receives what
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recipients.map((recipient) => (
                <RecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  favourName={getFavourName(recipient.favourId)}
                  onToggleDelivered={(id) => toggleDeliveredMutation.mutate(id)}
                  onDelete={(id) => deleteRecipientMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showFavourDialog} onOpenChange={setShowFavourDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFavour ? "Edit Favour" : "Add Favour"}</DialogTitle>
            <DialogDescription>
              {editingFavour ? "Update favour details" : "Add a new favour to track"}
            </DialogDescription>
          </DialogHeader>
          <Form {...favourForm}>
            <form onSubmit={favourForm.handleSubmit(handleFavourSubmit)} className="space-y-4">
              <FormField
                control={favourForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Thank You Gift Bags" data-testid="input-favour-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={favourForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-favour-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FAVOUR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={favourForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Optional description" data-testid="input-favour-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={favourForm.control}
                  name="quantityPurchased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} data-testid="input-favour-quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={favourForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Unit</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} placeholder="$0.00" data-testid="input-favour-cost-per-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={favourForm.control}
                  name="totalCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Cost</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} placeholder="$0.00" data-testid="input-favour-total-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={favourForm.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Where purchased" data-testid="input-favour-vendor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={favourForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Any additional notes" data-testid="input-favour-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFavourDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createFavourMutation.isPending || updateFavourMutation.isPending}
                  data-testid="button-save-favour"
                >
                  {(createFavourMutation.isPending || updateFavourMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingFavour ? "Update" : "Add"} Favour
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Recipient</DialogTitle>
            <DialogDescription>
              {selectedFavour && (
                <>
                  Assign "{selectedFavour.name}" to a recipient.
                  <span className="block text-xs mt-1">
                    {selectedFavour.quantityRemaining} remaining
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...recipientForm}>
            <form onSubmit={recipientForm.handleSubmit(handleRecipientSubmit)} className="space-y-4">
              <FormField
                control={recipientForm.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., John Smith" data-testid="input-recipient-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={recipientForm.control}
                name="recipientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recipient-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bridesmaid">Bridesmaid</SelectItem>
                        <SelectItem value="groomsman">Groomsman</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="family">Family Member</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={recipientForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={selectedFavour?.quantityRemaining || 1} 
                        {...field} 
                        data-testid="input-recipient-quantity" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={recipientForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Optional notes" data-testid="input-recipient-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRecipientDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createRecipientMutation.isPending}
                  data-testid="button-assign-recipient"
                >
                  {createRecipientMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Assign
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
