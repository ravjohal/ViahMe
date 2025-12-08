import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package, Ruler, DollarSign, Weight } from "lucide-react";
import type { ShoppingOrderItem, Guest, MeasurementProfile } from "@shared/schema";

export default function ShoppingPage() {
  const { toast } = useToast();
  const [isShoppingDialogOpen, setIsShoppingDialogOpen] = useState(false);
  const [isMeasurementDialogOpen, setIsMeasurementDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingOrderItem | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Fetch current user's wedding
  const { data: weddings } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  // Fetch shopping items
  const { data: shoppingItems = [], isLoading: isLoadingItems } = useQuery<ShoppingOrderItem[]>({
    queryKey: ["/api/shopping-items"],
    enabled: !!wedding?.id,
  });

  // Fetch guests
  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
    enabled: !!wedding?.id,
  });

  // Shopping item form state
  const [shoppingForm, setShoppingForm] = useState({
    itemName: "",
    storeName: "",
    status: "ordered" as "ordered" | "in_alterations" | "picked_up",
    cost: "",
    weightKg: "",
    notes: "",
  });

  // Measurement profile form state
  const [measurementForm, setMeasurementForm] = useState({
    blouseSize: "",
    waist: "",
    inseam: "",
    sariBlouseStyle: "standard" as "standard" | "backless",
    notes: "",
  });

  // Create/Update shopping item mutation
  const createShoppingItemMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return apiRequest("PATCH", `/api/shopping-items/${editingItem.id}`, data);
      }
      return apiRequest("POST", "/api/shopping-items", { ...data, weddingId: wedding.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-items"] });
      toast({ title: editingItem ? "Item Updated" : "Item Added", description: `Shopping item has been ${editingItem ? "updated" : "added"} successfully.` });
      setIsShoppingDialogOpen(false);
      resetShoppingForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save shopping item", variant: "destructive" });
    },
  });

  // Delete shopping item mutation
  const deleteShoppingItemMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/shopping-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-items"] });
      toast({ title: "Item Deleted", description: "Shopping item has been deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete shopping item", variant: "destructive" });
    },
  });

  // Create/Update measurement profile mutation
  const saveMeasurementMutation = useMutation({
    mutationFn: async ({ guestId, data }: { guestId: string; data: any }) => {
      // Fetch existing profile
      const existing = await fetch(`/api/guests/${guestId}/measurement-profile`).then(r => r.json());
      if (existing) {
        return apiRequest("PATCH", `/api/measurement-profiles/${existing.id}`, data);
      }
      return apiRequest("POST", "/api/measurement-profiles", { ...data, guestId });
    },
    onSuccess: () => {
      toast({ title: "Measurements Saved", description: "Measurement profile has been saved successfully." });
      setIsMeasurementDialogOpen(false);
      setSelectedGuest(null);
      resetMeasurementForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save measurements", variant: "destructive" });
    },
  });

  const resetShoppingForm = () => {
    setShoppingForm({ itemName: "", storeName: "", status: "ordered", cost: "", weightKg: "", notes: "" });
    setEditingItem(null);
  };

  const resetMeasurementForm = () => {
    setMeasurementForm({ blouseSize: "", waist: "", inseam: "", sariBlouseStyle: "standard", notes: "" });
  };

  const handleEditItem = (item: ShoppingOrderItem) => {
    setEditingItem(item);
    setShoppingForm({
      itemName: item.itemName,
      storeName: item.storeName || "",
      status: item.status as any,
      cost: item.costUSD || "",
      weightKg: item.weightKg || "",
      notes: item.notes || "",
    });
    setIsShoppingDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteShoppingItemMutation.mutate(id);
    }
  };

  const handleSubmitShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      itemName: shoppingForm.itemName,
      storeName: shoppingForm.storeName || null,
      status: shoppingForm.status,
      notes: shoppingForm.notes || null,
    };
    if (shoppingForm.cost) data.costUSD = shoppingForm.cost;
    if (shoppingForm.weightKg) data.weightKg = shoppingForm.weightKg;
    createShoppingItemMutation.mutate(data);
  };

  const handleSubmitMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;
    
    const data: any = {
      sariBlouseStyle: measurementForm.sariBlouseStyle,
      notes: measurementForm.notes || null,
    };
    if (measurementForm.blouseSize) data.blouseSize = measurementForm.blouseSize;
    if (measurementForm.waist) data.waist = measurementForm.waist;
    if (measurementForm.inseam) data.inseam = measurementForm.inseam;
    
    saveMeasurementMutation.mutate({ guestId: selectedGuest.id, data });
  };

  const openMeasurementDialog = async (guest: Guest) => {
    setSelectedGuest(guest);
    // Fetch existing measurements
    const response = await fetch(`/api/guests/${guest.id}/measurement-profile`);
    const profile = await response.json();
    if (profile) {
      setMeasurementForm({
        blouseSize: profile.blouseSize || "",
        waist: profile.waist || "",
        inseam: profile.inseam || "",
        sariBlouseStyle: profile.sariBlouseStyle || "standard",
        notes: profile.notes || "",
      });
    }
    setIsMeasurementDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      in_alterations: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      picked_up: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status.replace('_', ' ')}</Badge>;
  };

  if (!wedding) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>No Wedding Found</CardTitle>
            <CardDescription>Please create a wedding first to manage shopping and measurements.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shopping & Measurements</h1>
            <p className="text-muted-foreground mt-1">Track outfit purchases, alterations, and guest measurements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shopping Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Shopping Items
                  </CardTitle>
                  <CardDescription>Track outfit purchases and alterations</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetShoppingForm();
                    setIsShoppingDialogOpen(true);
                  }}
                  size="sm"
                  data-testid="button-add-shopping-item"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingItems ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : shoppingItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">No shopping items yet. Click "Add Item" to get started.</p>
              ) : (
                <div className="space-y-3">
                  {shoppingItems.map((item) => (
                    <Card key={item.id} className="hover-elevate" data-testid={`card-shopping-item-${item.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.itemName}</h3>
                            {item.storeName && (
                              <p className="text-sm text-muted-foreground">{item.storeName}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {getStatusBadge(item.status)}
                              {item.costUSD && (
                                <Badge variant="outline" className="gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${parseFloat(item.costUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Badge>
                              )}
                              {item.weightKg && (
                                <Badge variant="outline" className="gap-1">
                                  <Weight className="w-3 h-3" />
                                  {item.weightKg}kg
                                </Badge>
                              )}
                            </div>
                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditItem(item)}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guest Measurements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Guest Measurements
              </CardTitle>
              <CardDescription>Track clothing measurements for guests</CardDescription>
            </CardHeader>
            <CardContent>
              {guests.length === 0 ? (
                <p className="text-muted-foreground text-sm">No guests yet. Add guests first to track their measurements.</p>
              ) : (
                <div className="space-y-2">
                  {guests.slice(0, 10).map((guest) => (
                    <Card key={guest.id} className="hover-elevate" data-testid={`card-guest-${guest.id}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <p className="font-medium">{guest.name}</p>
                            <p className="text-sm text-muted-foreground">{guest.email || 'No email'}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMeasurementDialog(guest)}
                            data-testid={`button-measurements-${guest.id}`}
                          >
                            <Ruler className="w-4 h-4 mr-1" />
                            Measurements
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {guests.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Showing first 10 guests. Add measurements from the Guests page for more.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Shopping Item Dialog */}
        <Dialog open={isShoppingDialogOpen} onOpenChange={setIsShoppingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Shopping Item" : "Add Shopping Item"}</DialogTitle>
              <DialogDescription>
                Track outfit purchases, alterations, and shipping details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitShoppingItem}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={shoppingForm.itemName}
                    onChange={(e) => setShoppingForm({ ...shoppingForm, itemName: e.target.value })}
                    placeholder="e.g., Dad's Sherwani, Mom's Lehenga"
                    required
                    data-testid="input-item-name"
                  />
                </div>
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={shoppingForm.storeName}
                    onChange={(e) => setShoppingForm({ ...shoppingForm, storeName: e.target.value })}
                    placeholder="e.g., Kalyan Silks, Manyavar"
                    data-testid="input-store-name"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={shoppingForm.status}
                    onValueChange={(value: any) => setShoppingForm({ ...shoppingForm, status: value })}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="in_alterations">In Alterations</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">Cost (USD)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={shoppingForm.cost}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, cost: e.target.value })}
                      placeholder="$"
                      data-testid="input-cost-usd"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightKg">Weight (kg)</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.01"
                      value={shoppingForm.weightKg}
                      onChange={(e) => setShoppingForm({ ...shoppingForm, weightKg: e.target.value })}
                      placeholder="kg"
                      data-testid="input-weight-kg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={shoppingForm.notes}
                    onChange={(e) => setShoppingForm({ ...shoppingForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsShoppingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-item">
                  {editingItem ? "Update" : "Add"} Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Measurement Profile Dialog */}
        <Dialog open={isMeasurementDialogOpen} onOpenChange={setIsMeasurementDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Measurement Profile</DialogTitle>
              <DialogDescription>
                {selectedGuest && selectedGuest.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitMeasurement}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blouseSize">Blouse Size</Label>
                  <Input
                    id="blouseSize"
                    value={measurementForm.blouseSize}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, blouseSize: e.target.value })}
                    placeholder="e.g., S, M, L, XL, 36, 38"
                    data-testid="input-blouse-size"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waist">Waist (inches)</Label>
                    <Input
                      id="waist"
                      type="number"
                      step="0.1"
                      value={measurementForm.waist}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, waist: e.target.value })}
                      placeholder="inches"
                      data-testid="input-waist"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inseam">Inseam (inches)</Label>
                    <Input
                      id="inseam"
                      type="number"
                      step="0.1"
                      value={measurementForm.inseam}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, inseam: e.target.value })}
                      placeholder="inches"
                      data-testid="input-inseam"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sariBlouseStyle">Sari Blouse Style</Label>
                  <Select
                    value={measurementForm.sariBlouseStyle}
                    onValueChange={(value: any) => setMeasurementForm({ ...measurementForm, sariBlouseStyle: value })}
                  >
                    <SelectTrigger data-testid="select-blouse-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="backless">Backless</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="measurementNotes">Notes</Label>
                  <Textarea
                    id="measurementNotes"
                    value={measurementForm.notes}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                    placeholder="Additional measurement notes..."
                    rows={3}
                    data-testid="input-measurement-notes"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsMeasurementDialogOpen(false);
                    setSelectedGuest(null);
                    resetMeasurementForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-measurement">
                  Save Measurements
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
