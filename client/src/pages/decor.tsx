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
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, Plus, Trash2, Edit2, Check, X,
  Flower2, Package, Import, ExternalLink
} from "lucide-react";
import type { Wedding, DecorItem } from "@shared/schema";
import { DECOR_SOURCING_OPTIONS, DECOR_CATEGORIES } from "@shared/schema";

interface DecorItemRowProps {
  item: DecorItem;
  onToggleSourced: (id: string) => void;
  onEdit: (item: DecorItem) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}

function DecorItemRow({ item, onToggleSourced, onEdit, onDelete, isToggling }: DecorItemRowProps) {
  const sourcingLabel = DECOR_SOURCING_OPTIONS.find(o => o.value === item.sourcing)?.label || item.sourcing;
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card hover-elevate">
      <Checkbox 
        checked={item.sourced}
        onCheckedChange={() => onToggleSourced(item.id)}
        disabled={isToggling}
        data-testid={`checkbox-sourced-${item.id}`}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${item.sourced ? 'line-through text-muted-foreground' : ''}`}>
            {item.itemName}
          </span>
          {item.sourced && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Sourced
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>Qty: {item.quantity}</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs">{sourcingLabel}</Badge>
          {item.vendor && (
            <>
              <span>•</span>
              <span className="truncate">{item.vendor}</span>
            </>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{item.notes}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {item.link && (
          <Button size="icon" variant="ghost" asChild data-testid={`button-link-${item.id}`}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => onEdit(item)} data-testid={`button-edit-${item.id}`}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)} data-testid={`button-delete-${item.id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DecorContent({ weddingId }: { weddingId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DecorItem | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("general_decor");
  
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    sourcing: "hire",
    vendor: "",
    notes: "",
    link: "",
    estimatedCost: "",
    actualCost: "",
  });

  const { data: decorItems = [], isLoading } = useQuery<DecorItem[]>({
    queryKey: ["/api/decor/wedding", weddingId],
  });

  const generalDecorItems = decorItems.filter(item => item.category === "general_decor");
  const floristItems = decorItems.filter(item => item.category === "florist_list");

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/decor/items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decor/wedding", weddingId] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Item added!", description: "Decor item has been added to your list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add decor item.", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/decor/items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decor/wedding", weddingId] });
      setEditingItem(null);
      resetForm();
      toast({ title: "Item updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update decor item.", variant: "destructive" });
    },
  });

  const toggleSourcedMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("PATCH", `/api/decor/items/${itemId}/toggle-sourced`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decor/wedding", weddingId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/decor/items/${itemId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decor/wedding", weddingId] });
      toast({ title: "Item deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    },
  });

  const importDefaultsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/decor/import-defaults/${weddingId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decor/wedding", weddingId] });
      toast({ title: "Library imported!", description: "Default decor items have been added to your list." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to import library.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      itemName: "",
      quantity: 1,
      sourcing: "hire",
      vendor: "",
      notes: "",
      link: "",
      estimatedCost: "",
      actualCost: "",
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (item: DecorItem) => {
    setFormData({
      itemName: item.itemName,
      quantity: item.quantity,
      sourcing: item.sourcing || "hire",
      vendor: item.vendor || "",
      notes: item.notes || "",
      link: item.link || "",
      estimatedCost: item.estimatedCost || "",
      actualCost: item.actualCost || "",
    });
    setEditingItem(item);
  };

  const handleSubmit = () => {
    const data = {
      weddingId,
      category: activeCategory,
      itemName: formData.itemName,
      quantity: formData.quantity,
      sourcing: formData.sourcing,
      vendor: formData.vendor || null,
      notes: formData.notes || null,
      link: formData.link || null,
      estimatedCost: formData.estimatedCost || null,
      actualCost: formData.actualCost || null,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleToggleSourced = (itemId: string) => {
    setTogglingIds(prev => new Set(prev).add(itemId));
    toggleSourcedMutation.mutate(itemId, {
      onSettled: () => {
        setTogglingIds(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      },
    });
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const categoryLabel = DECOR_CATEGORIES.find(c => c.value === activeCategory)?.label || "Decor";
  const currentItems = activeCategory === "general_decor" ? generalDecorItems : floristItems;
  const sourcedCount = currentItems.filter(item => item.sourced).length;
  const totalCount = currentItems.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Decor Tracker</h1>
          <p className="text-muted-foreground">Track and source your wedding decor items</p>
        </div>
        <div className="flex items-center gap-2">
          {decorItems.length === 0 && (
            <Button
              variant="outline"
              onClick={() => importDefaultsMutation.mutate()}
              disabled={importDefaultsMutation.isPending}
              data-testid="button-import-library"
            >
              <Import className="h-4 w-4 mr-2" />
              Import Library
            </Button>
          )}
          <Button onClick={handleOpenAddDialog} data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general_decor" data-testid="tab-general-decor">
            <Package className="h-4 w-4 mr-2" />
            General Decor ({generalDecorItems.length})
          </TabsTrigger>
          <TabsTrigger value="florist_list" data-testid="tab-florist-list">
            <Flower2 className="h-4 w-4 mr-2" />
            Florist List ({floristItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general_decor" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">General Decor</CardTitle>
                {totalCount > 0 && (
                  <Badge variant={sourcedCount === totalCount ? "default" : "secondary"}>
                    {sourcedCount}/{totalCount} Sourced
                  </Badge>
                )}
              </div>
              <CardDescription>
                Decor items you can buy, rent, or DIY for your wedding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generalDecorItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No general decor items yet</p>
                  <p className="text-sm mt-1">Add items or import our curated library</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {generalDecorItems.map((item) => (
                    <DecorItemRow
                      key={item.id}
                      item={item}
                      onToggleSourced={handleToggleSourced}
                      onEdit={handleOpenEditDialog}
                      onDelete={handleDelete}
                      isToggling={togglingIds.has(item.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="florist_list" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Florist List</CardTitle>
                {floristItems.length > 0 && (
                  <Badge variant={floristItems.filter(i => i.sourced).length === floristItems.length ? "default" : "secondary"}>
                    {floristItems.filter(i => i.sourced).length}/{floristItems.length} Sourced
                  </Badge>
                )}
              </div>
              <CardDescription>
                Floral arrangements and flower-based decorations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {floristItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flower2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No florist items yet</p>
                  <p className="text-sm mt-1">Add items like bouquets, garlands, and centerpieces</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {floristItems.map((item) => (
                    <DecorItemRow
                      key={item.id}
                      item={item}
                      onToggleSourced={handleToggleSourced}
                      onEdit={handleOpenEditDialog}
                      onDelete={handleDelete}
                      isToggling={togglingIds.has(item.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Decor Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the details for this decor item" : `Add a new item to your ${categoryLabel} list`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                placeholder="e.g., Aisle runner"
                data-testid="input-item-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  data-testid="input-quantity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sourcing">Sourcing</Label>
                <Select
                  value={formData.sourcing}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sourcing: value }))}
                >
                  <SelectTrigger data-testid="select-sourcing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECOR_SOURCING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor / Store (Optional)</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder="e.g., Local Party Rentals"
                data-testid="input-vendor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
                data-testid="input-link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional details..."
                rows={2}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingItem(null);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.itemName || createItemMutation.isPending || updateItemMutation.isPending}
              data-testid="button-submit"
            >
              {editingItem ? "Update" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DecorPage() {
  const { data: weddings, isLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Decor Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please complete your wedding setup to access the decor tracker.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <DecorContent weddingId={wedding.id} />
    </div>
  );
}
