import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetCategorySchema, type Wedding, type BudgetCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { DollarSign, TrendingUp, AlertCircle, Edit2, Trash2, PieChart } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const budgetFormSchema = insertBudgetCategorySchema.extend({
  allocatedAmount: z.string().transform((val) => val),
  spentAmount: z.string().optional().transform((val) => val || "0"),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

const CATEGORY_LABELS: Record<string, string> = {
  catering: "Catering & Food",
  venue: "Venue & Rentals",
  entertainment: "Entertainment",
  photography: "Photography & Video",
  decoration: "Decoration & Flowers",
  attire: "Attire & Beauty",
  transportation: "Transportation",
  other: "Other Expenses",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
];

export default function Budget() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [editBudgetDialogOpen, setEditBudgetDialogOpen] = useState(false);
  const [newTotalBudget, setNewTotalBudget] = useState("");

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "catering",
      allocatedAmount: "0",
      spentAmount: "0",
      weddingId: wedding?.id || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      return await apiRequest("POST", "/api/budget-categories", {
        ...data,
        allocatedAmount: data.allocatedAmount,
        spentAmount: data.spentAmount || "0",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Budget category added",
        description: "Budget category has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add budget category",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetFormData> }) => {
      return await apiRequest("PATCH", `/api/budget-categories/${id}`, {
        ...data,
        allocatedAmount: data.allocatedAmount,
        spentAmount: data.spentAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Budget category updated",
        description: "Budget category has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update budget category",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/budget-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", wedding?.id] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Budget category deleted",
        description: "Budget category has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete budget category",
        variant: "destructive",
      });
    },
  });

  const updateWeddingBudgetMutation = useMutation({
    mutationFn: async (totalBudget: string) => {
      console.log("[BUDGET] Mutation started - wedding ID:", wedding?.id, "new budget:", totalBudget);
      if (!wedding?.id) {
        console.log("[BUDGET] ERROR: Wedding ID not found!");
        throw new Error("Wedding ID not found");
      }
      console.log("[BUDGET] Making PATCH request to /api/weddings/" + wedding.id);
      const result = await apiRequest("PATCH", `/api/weddings/${wedding.id}`, {
        totalBudget,
      });
      console.log("[BUDGET] PATCH request completed, result:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[BUDGET] Mutation success! Response:", data);
      console.log("[BUDGET] Invalidating and refetching queries...");
      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });
      queryClient.refetchQueries({ queryKey: ["/api/weddings"] });
      setEditBudgetDialogOpen(false);
      setNewTotalBudget("");
      toast({
        title: "Budget Updated",
        description: "Your total wedding budget has been updated successfully",
      });
    },
    onError: (error) => {
      console.log("[BUDGET] Mutation failed! Error:", error);
      toast({
        title: "Error",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  useEffect(() => {
    if (wedding?.id) {
      form.setValue("weddingId", wedding.id);
    }
  }, [wedding?.id, form]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.reset({
      category: "catering",
      allocatedAmount: "0",
      spentAmount: "0",
      weddingId: wedding?.id || "",
    });
    setDialogOpen(true);
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    form.reset({
      category: category.category as any,
      allocatedAmount: category.allocatedAmount.toString(),
      spentAmount: category.spentAmount?.toString() || "0",
      weddingId: category.weddingId,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: BudgetFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (editingCategory) {
      deleteMutation.mutate(editingCategory.id);
    }
  };

  const handleEditBudget = () => {
    console.log("[BUDGET] Edit button clicked, current budget:", wedding?.totalBudget);
    setNewTotalBudget(wedding?.totalBudget?.toString() || "0");
    setEditBudgetDialogOpen(true);
    console.log("[BUDGET] Dialog opened with value:", wedding?.totalBudget?.toString() || "0");
  };

  const handleUpdateBudget = () => {
    console.log("[BUDGET] Update button clicked, new budget value:", newTotalBudget);
    if (!newTotalBudget || parseFloat(newTotalBudget) < 0) {
      console.log("[BUDGET] Validation failed - invalid budget:", newTotalBudget);
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }
    console.log("[BUDGET] Calling mutation with:", newTotalBudget);
    updateWeddingBudgetMutation.mutate(newTotalBudget);
  };

  const total = parseFloat(wedding?.totalBudget || "0");
  const totalSpent = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.spentAmount?.toString() || "0"),
    0
  );
  const totalAllocated = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.allocatedAmount.toString()),
    0
  );
  const remainingBudget = total - totalSpent;
  const budgetPercentage = total > 0 ? (totalSpent / total) * 100 : 0;

  const chartData = categories.map((cat, index) => ({
    name: CATEGORY_LABELS[cat.category] || cat.category,
    value: parseFloat(cat.allocatedAmount.toString()),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  if (weddingsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Budget Management ✨
              </h2>
              <p className="text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Track and manage your wedding expenses
              </p>
            </div>
            <Button onClick={handleAddCategory} data-testid="button-add-category" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg">
              <DollarSign className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="font-mono text-2xl font-bold text-foreground" data-testid="text-total-budget">
                      ${total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditBudget}
                  data-testid="button-edit-budget"
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-chart-1/10">
                  <TrendingUp className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="font-mono text-2xl font-bold text-foreground" data-testid="text-total-spent">
                    ${totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <AlertCircle className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="font-mono text-2xl font-bold text-foreground" data-testid="text-remaining-budget">
                    ${remainingBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Budget Allocation
              </h3>
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No Categories Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding budget categories
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Overall Budget Usage</h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Spent</span>
                  <span className="font-mono text-sm font-semibold">
                    {budgetPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={budgetPercentage} className="h-3" />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Budget Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Allocated:</span>
                    <span className="font-mono font-semibold">${totalAllocated.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Spent:</span>
                    <span className="font-mono font-semibold">${totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Unallocated:</span>
                    <span className="font-mono font-semibold">
                      ${Math.max(0, total - totalAllocated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Budget Categories</h3>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No Budget Categories</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your wedding budget
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => {
                  const allocated = parseFloat(category.allocatedAmount.toString());
                  const spent = parseFloat(category.spentAmount?.toString() || "0");
                  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
                  const isOverBudget = spent > allocated;

                  return (
                    <div
                      key={category.id}
                      className="space-y-2 p-4 rounded-lg border hover-elevate cursor-pointer"
                      onClick={() => handleEditCategory(category)}
                      data-testid={`card-category-${category.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {CATEGORY_LABELS[category.category] || category.category}
                          </span>
                          {isOverBudget && (
                            <Badge variant="destructive" className="text-xs">
                              Over Budget
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">
                            ${spent.toLocaleString()} / ${allocated.toLocaleString()}
                          </span>
                          <span className="font-mono text-sm font-semibold min-w-[50px] text-right">
                            {percentage.toFixed(0)}%
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOverBudget ? "bg-destructive/20" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-category">
              {editingCategory ? "Edit Budget Category" : "Add Budget Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update budget allocation and spending"
                : "Add a new budget category to track expenses"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value as any)}
                disabled={!!editingCategory}
              >
                <SelectTrigger id="category" data-testid="select-category-type">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="catering">Catering & Food</SelectItem>
                  <SelectItem value="venue">Venue & Rentals</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="photography">Photography & Video</SelectItem>
                  <SelectItem value="decoration">Decoration & Flowers</SelectItem>
                  <SelectItem value="attire">Attire & Beauty</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedAmount">
                Allocated Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="allocatedAmount"
                type="number"
                step="0.01"
                min="0"
                {...form.register("allocatedAmount")}
                placeholder="0.00"
                data-testid="input-allocated-amount"
              />
              {form.formState.errors.allocatedAmount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.allocatedAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="spentAmount">Spent Amount</Label>
              <Input
                id="spentAmount"
                type="number"
                step="0.01"
                min="0"
                {...form.register("spentAmount")}
                placeholder="0.00"
                data-testid="input-spent-amount"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-between">
              {editingCategory && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-category"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-category"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-category"
                >
                  {editingCategory ? "Update Category" : "Add Category"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editBudgetDialogOpen} onOpenChange={setEditBudgetDialogOpen}>
        <DialogContent data-testid="dialog-edit-budget">
          <DialogHeader>
            <DialogTitle>Edit Total Budget</DialogTitle>
            <DialogDescription>
              Update your overall wedding budget. This will affect your budget tracking and allocation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalBudget">
                Total Budget <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="totalBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTotalBudget}
                  onChange={(e) => setNewTotalBudget(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-total-budget"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Current budget: ${total.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditBudgetDialogOpen(false)}
                data-testid="button-cancel-budget-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBudget}
                disabled={updateWeddingBudgetMutation.isPending}
                data-testid="button-save-budget"
              >
                {updateWeddingBudgetMutation.isPending ? "Updating..." : "Update Budget"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
