import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, DollarSign, ShieldCheck, AlertCircle, Tag, Check, X } from "lucide-react";
import type { BudgetCategory } from "@shared/schema";

export default function AdminBudgetCategoriesPage() {
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
    iconName: "",
    isEssential: true,
    suggestedPercentage: "",
    displayOrder: "",
    isActive: true,
  });

  const { data: authData } = useQuery<{ user: { id: string; email: string; isSiteAdmin: boolean } | null }>({
    queryKey: ["/api/auth/me"],
  });
  const user = authData?.user;

  const { data: categories = [], isLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget/categories", { includeInactive: true }],
    queryFn: async () => {
      const res = await fetch("/api/budget/categories?includeInactive=true");
      if (!res.ok) throw new Error("Failed to fetch budget categories");
      return res.json();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetCategory> }) => {
      return apiRequest("PATCH", `/api/budget/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/categories"] });
      toast({ title: "Category updated successfully" });
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
    },
  });

  const openEditDialog = (category: BudgetCategory) => {
    setEditingCategory(category);
    setFormData({
      displayName: category.displayName || "",
      description: category.description || "",
      iconName: category.iconName || "",
      isEssential: category.isEssential ?? true,
      suggestedPercentage: category.suggestedPercentage?.toString() || "",
      displayOrder: category.displayOrder?.toString() || "",
      isActive: category.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        displayName: formData.displayName,
        description: formData.description || null,
        iconName: formData.iconName || null,
        isEssential: formData.isEssential,
        suggestedPercentage: formData.suggestedPercentage ? parseInt(formData.suggestedPercentage) : null,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : null,
        isActive: formData.isActive,
      },
    });
  };

  if (!user?.isSiteAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You must be a site administrator to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Budget Categories</h1>
          <p className="text-muted-foreground">Manage the system-defined budget categories used by all weddings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Budget Categories
          </CardTitle>
          <CardDescription>
            These 12 categories are used to organize all wedding budgets. Edit display names, descriptions, icons, and suggested percentages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Suggested %</TableHead>
                  <TableHead className="text-center">Essential</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{category.id}</code>
                    </TableCell>
                    <TableCell className="font-medium">{category.displayName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.suggestedPercentage ? (
                        <Badge variant="secondary">{category.suggestedPercentage}%</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isEssential ? (
                        <Check className="h-4 w-4 mx-auto text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        data-testid={`button-edit-${category.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Category</DialogTitle>
            <DialogDescription>
              Update the display settings for this budget category. The ID cannot be changed as it's used for system references.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category ID (read-only)</Label>
              <Input value={editingCategory?.id || ""} disabled className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., Catering & Food"
                data-testid="input-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Help text for couples about this category"
                rows={2}
                data-testid="input-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iconName">Icon Name (Lucide)</Label>
              <Input
                id="iconName"
                value={formData.iconName}
                onChange={(e) => setFormData(prev => ({ ...prev, iconName: e.target.value }))}
                placeholder="e.g., utensils, camera, music"
                data-testid="input-icon-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suggestedPercentage">Suggested % of Budget</Label>
                <Input
                  id="suggestedPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.suggestedPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, suggestedPercentage: e.target.value }))}
                  placeholder="e.g., 25"
                  data-testid="input-suggested-percentage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
                  placeholder="e.g., 1"
                  data-testid="input-display-order"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Essential Category</Label>
                <p className="text-xs text-muted-foreground">Mark as essential for budget planning</p>
              </div>
              <Switch
                checked={formData.isEssential}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEssential: checked }))}
                data-testid="switch-essential"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Show this category in the budget planner</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                data-testid="switch-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateCategoryMutation.isPending}
              data-testid="button-save-category"
            >
              {updateCategoryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
