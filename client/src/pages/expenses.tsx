import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil, DollarSign, Users, ArrowRightLeft, Check, Receipt } from "lucide-react";
import type { Expense, ExpenseSplit, Event, User } from "@shared/schema";

type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };
type SettlementBalance = Record<string, { name: string; paid: number; owes: number; balance: number }>;

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithSplits | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    eventId: "",
    splitType: "equal" as "equal" | "percentage" | "custom" | "full",
    notes: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});

  const weddingId = user?.activeWeddingId;

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<ExpenseWithSplits[]>({
    queryKey: ["/api/expenses", weddingId],
    enabled: !!weddingId,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", weddingId],
    enabled: !!weddingId,
  });

  const { data: settlement } = useQuery<SettlementBalance>({
    queryKey: ["/api/expenses", weddingId, "settlement"],
    enabled: !!weddingId,
  });

  const { data: collaborators = [] } = useQuery<any[]>({
    queryKey: ["/api/weddings", weddingId, "collaborators"],
    enabled: !!weddingId,
  });

  const { data: wedding } = useQuery<any>({
    queryKey: ["/api/weddings", weddingId],
    enabled: !!weddingId,
  });

  const teamMembers = [
    ...(user ? [{ id: user.id, name: user.name || user.email }] : []),
    ...(wedding?.partner1Name ? [{ id: "partner1", name: wedding.partner1Name }] : []),
    ...(wedding?.partner2Name ? [{ id: "partner2", name: wedding.partner2Name }] : []),
    ...collaborators.map((c: any) => ({ id: c.userId, name: c.user?.name || c.user?.email || "Team Member" })),
  ].filter((member, index, self) => 
    index === self.findIndex((m) => m.id === member.id)
  );

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/expenses", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Expense added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      setEditingExpense(null);
      resetForm();
      toast({ title: "Expense updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/expenses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const markSplitPaidMutation = useMutation({
    mutationFn: async ({ splitId, isPaid }: { splitId: string; isPaid: boolean }) => {
      return apiRequest(`/api/expense-splits/${splitId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPaid, paidAt: isPaid ? new Date().toISOString() : null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      toast({ title: "Split status updated" });
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      eventId: "",
      splitType: "equal",
      notes: "",
      expenseDate: new Date().toISOString().split("T")[0],
    });
    setSplitAmounts({});
  };

  const handleSubmit = () => {
    if (!user || !weddingId) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const splits = teamMembers.map((member) => {
      let shareAmount: number;
      if (formData.splitType === "equal") {
        shareAmount = amount / teamMembers.length;
      } else if (formData.splitType === "full") {
        shareAmount = member.id === user.id ? amount : 0;
      } else {
        shareAmount = parseFloat(splitAmounts[member.id] || "0");
      }
      return {
        userId: member.id,
        userName: member.name,
        shareAmount: shareAmount.toFixed(2),
        sharePercentage: formData.splitType === "equal" ? Math.round(100 / teamMembers.length) : null,
        isPaid: member.id === user.id,
      };
    }).filter((s) => parseFloat(s.shareAmount) > 0);

    const expenseData = {
      weddingId,
      description: formData.description,
      amount: formData.amount,
      paidById: user.id,
      paidByName: user.name || user.email,
      splitType: formData.splitType,
      eventId: formData.eventId || null,
      notes: formData.notes || null,
      expenseDate: formData.expenseDate,
      splits,
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, ...expenseData });
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const openEditDialog = (expense: ExpenseWithSplits) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      eventId: expense.eventId || "",
      splitType: expense.splitType as any,
      notes: expense.notes || "",
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });
    const amounts: Record<string, string> = {};
    expense.splits.forEach((s) => {
      amounts[s.userId] = s.shareAmount;
    });
    setSplitAmounts(amounts);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  if (!weddingId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Please select a wedding to manage expenses.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Expense Splitting</h1>
          <p className="text-muted-foreground">Track and split shared wedding costs</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingExpense} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingExpense(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-expense">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Venue deposit"
                  data-testid="input-expense-description"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-expense-amount"
                />
              </div>
              <div>
                <Label htmlFor="event">Event (Optional)</Label>
                <Select value={formData.eventId} onValueChange={(v) => setFormData({ ...formData, eventId: v })}>
                  <SelectTrigger data-testid="select-expense-event">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific event</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="splitType">Split Type</Label>
                <Select value={formData.splitType} onValueChange={(v: any) => setFormData({ ...formData, splitType: v })}>
                  <SelectTrigger data-testid="select-split-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Split Equally</SelectItem>
                    <SelectItem value="custom">Custom Amounts</SelectItem>
                    <SelectItem value="full">I Paid (No Split)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.splitType === "custom" && (
                <div className="space-y-2">
                  <Label>Custom Split Amounts</Label>
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <span className="text-sm flex-1">{member.name}</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24"
                        value={splitAmounts[member.id] || ""}
                        onChange={(e) => setSplitAmounts({ ...splitAmounts, [member.id]: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  data-testid="input-expense-date"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  data-testid="input-expense-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                data-testid="button-save-expense"
              >
                {editingExpense ? "Update Expense" : "Add Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-total-expenses">
              <DollarSign className="h-5 w-5 text-primary" />
              ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Number of Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-expense-count">
              <Receipt className="h-5 w-5 text-primary" />
              {expenses.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-team-count">
              <Users className="h-5 w-5 text-primary" />
              {teamMembers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {settlement && Object.keys(settlement).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Settlement Summary
            </CardTitle>
            <CardDescription>Who owes whom based on expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(settlement).map(([userId, data]) => (
                <div key={userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <span className="font-medium">{data.name}</span>
                    <div className="text-sm text-muted-foreground">
                      Paid: ${data.paid.toFixed(2)} | Owes: ${data.owes.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={data.balance >= 0 ? "default" : "destructive"} data-testid={`badge-balance-${userId}`}>
                    {data.balance >= 0 ? "+" : ""}${data.balance.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>View and manage all shared expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-expenses">
              No expenses yet. Add your first expense to start tracking.
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => {
                const event = events.find((e) => e.id === expense.eventId);
                return (
                  <div
                    key={expense.id}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`card-expense-${expense.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{expense.description}</h3>
                          {event && <Badge variant="outline">{event.name}</Badge>}
                          <Badge variant="secondary">{expense.splitType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Paid by {expense.paidByName} on {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                        </p>
                        {expense.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{expense.notes}</p>
                        )}
                        <div className="mt-3 space-y-1">
                          {expense.splits.map((split) => (
                            <div key={split.id} className="flex items-center gap-2 text-sm">
                              <Button
                                variant={split.isPaid ? "default" : "outline"}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => markSplitPaidMutation.mutate({ splitId: split.id, isPaid: !split.isPaid })}
                                data-testid={`button-toggle-paid-${split.id}`}
                              >
                                {split.isPaid && <Check className="h-3 w-3" />}
                              </Button>
                              <span className={split.isPaid ? "line-through text-muted-foreground" : ""}>
                                {split.userName}: ${parseFloat(split.shareAmount).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">${parseFloat(expense.amount).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(expense)}
                          data-testid={`button-edit-expense-${expense.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-expense-${expense.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this expense and all its splits.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
