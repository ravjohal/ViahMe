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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Pencil, DollarSign, Users, ArrowRightLeft, Check, Receipt, Share2, Copy, Calendar, ChevronDown, ChevronRight, List, LayoutGrid } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Expense, ExpenseSplit, Event, Wedding, BudgetCategory, ExpenseEventAllocation } from "@shared/schema";
import { EditExpenseDialog, type ExpenseWithDetails } from "@/components/edit-expense-dialog";
import { useBudgetCategoryLookup } from "@/hooks/use-budget-bucket-categories";

type ExpenseWithSplits = Expense & { splits: ExpenseSplit[]; eventAllocations?: ExpenseEventAllocation[] };
type SettlementBalance = Record<string, { name: string; paid: number; owes: number; balance: number }>;
type AllocationStrategy = "single" | "equal" | "percentage" | "custom";

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCategoryLabel } = useBudgetCategoryLookup();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithSplits | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    eventId: "",
    categoryId: "",
    splitType: "equal" as "equal" | "percentage" | "custom" | "full",
    paidById: "",
    notes: "",
    expenseDate: new Date().toISOString().split("T")[0],
    allocationStrategy: "single" as AllocationStrategy,
    paymentStatus: "pending" as "pending" | "deposit_paid" | "paid",
  });
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [eventAllocations, setEventAllocations] = useState<Record<string, { amount: string; percent: string }>>({});
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "byCeremony">("list");
  const [collapsedCeremonies, setCollapsedCeremonies] = useState<Set<string>>(new Set());

  const { data: weddings = [] } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !!user,
  });

  const wedding = weddings[0];
  const weddingId = wedding?.id;

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<ExpenseWithSplits[]>({
    queryKey: ["/api/expenses", weddingId],
    enabled: !!weddingId,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", weddingId],
    enabled: !!weddingId,
  });

  const { data: budgetCategories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-bucket-categories", weddingId],
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

  // Build team members list: Bride, Groom, and Parents by default, plus any collaborators
  const teamMembers = [
    { id: "bride", name: "Bride" },
    { id: "groom", name: "Groom" },
    { id: "bride-parents", name: "Bride's Parents" },
    { id: "groom-parents", name: "Groom's Parents" },
    ...collaborators.map((c: any) => ({ id: c.userId, name: c.user?.name || c.user?.email || "Team Member" })),
  ];

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-bucket-categories", weddingId] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Expense added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-bucket-categories", weddingId] });
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
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-bucket-categories", weddingId] });
      toast({ title: "Expense deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const markSplitPaidMutation = useMutation({
    mutationFn: async ({ splitId, isPaid }: { splitId: string; isPaid: boolean }) => {
      return apiRequest("PATCH", `/api/expense-splits/${splitId}`, { isPaid, paidAt: isPaid ? new Date().toISOString() : null });
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
      categoryId: "",
      splitType: "equal",
      paidById: user?.id || "",
      notes: "",
      expenseDate: new Date().toISOString().split("T")[0],
      allocationStrategy: "single",
      paymentStatus: "pending",
    });
    setSplitAmounts({});
    setSelectedEventIds([]);
    setEventAllocations({});
  };

  const handleSubmit = () => {
    if (!user || !weddingId) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const payerId = formData.paidById || user.id;
    const splits = teamMembers.map((member) => {
      let shareAmount: number;
      if (formData.splitType === "equal") {
        shareAmount = amount / teamMembers.length;
      } else if (formData.splitType === "full") {
        shareAmount = member.id === payerId ? amount : 0;
      } else {
        shareAmount = parseFloat(splitAmounts[member.id] || "0");
      }
      return {
        userId: member.id,
        userName: member.name,
        shareAmount: shareAmount.toFixed(2),
        sharePercentage: formData.splitType === "equal" ? Math.round(100 / teamMembers.length) : null,
        isPaid: member.id === payerId,
      };
    }).filter((s) => parseFloat(s.shareAmount) > 0);

    // Build event allocations based on strategy
    let allocationsToSend: { eventId: string; allocatedAmount: string; allocatedPercent: string | null }[] = [];
    
    if (formData.allocationStrategy === "single" && formData.eventId) {
      // Legacy single-event: no allocations needed, eventId is on the expense itself
    } else if (formData.allocationStrategy === "equal" && selectedEventIds.length > 0) {
      const perEvent = (amount / selectedEventIds.length).toFixed(2);
      const percent = (100 / selectedEventIds.length).toFixed(2);
      allocationsToSend = selectedEventIds.map(eventId => ({
        eventId,
        allocatedAmount: perEvent,
        allocatedPercent: percent,
      }));
    } else if ((formData.allocationStrategy === "percentage" || formData.allocationStrategy === "custom") && selectedEventIds.length > 0) {
      allocationsToSend = selectedEventIds.map(eventId => {
        const alloc = eventAllocations[eventId] || { amount: "0", percent: "0" };
        return {
          eventId,
          allocatedAmount: formData.allocationStrategy === "percentage" 
            ? ((parseFloat(alloc.percent || "0") / 100) * amount).toFixed(2)
            : alloc.amount,
          allocatedPercent: alloc.percent || null,
        };
      });
    }

    const expenseData = {
      weddingId,
      description: formData.description,
      amount: formData.amount,
      paidById: payerId,
      paidByName: teamMembers.find(m => m.id === payerId)?.name || user.email,
      splitType: formData.splitType,
      paymentStatus: formData.paymentStatus,
      eventId: formData.allocationStrategy === "single" ? (formData.eventId || null) : null,
      allocationStrategy: formData.allocationStrategy,
      categoryId: formData.categoryId || null,
      notes: formData.notes || null,
      expenseDate: formData.expenseDate,
      splits,
      eventAllocations: allocationsToSend.length > 0 ? allocationsToSend : undefined,
    };

    createExpenseMutation.mutate(expenseData);
  };

  const openEditDialog = (expense: ExpenseWithSplits) => {
    setEditingExpense(expense);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + parseFloat(e.amountPaid || "0"), 0);
  const totalBalance = totalExpenses - totalPaid;

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
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
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
              <DialogTitle>Add New Expense</DialogTitle>
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
                <Label htmlFor="allocationStrategy">Event Allocation</Label>
                <Select 
                  value={formData.allocationStrategy} 
                  onValueChange={(v: AllocationStrategy) => {
                    setFormData({ ...formData, allocationStrategy: v, eventId: "" });
                    if (v === "single") {
                      setSelectedEventIds([]);
                      setEventAllocations({});
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-allocation-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Event</SelectItem>
                    <SelectItem value="equal">Split Equally Across Events</SelectItem>
                    <SelectItem value="percentage">Split by Percentage</SelectItem>
                    <SelectItem value="custom">Custom Amounts per Event</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.allocationStrategy === "single" && "Assign this expense to one event (or no event)"}
                  {formData.allocationStrategy === "equal" && "Split cost equally across selected events"}
                  {formData.allocationStrategy === "percentage" && "Specify % of cost for each event"}
                  {formData.allocationStrategy === "custom" && "Enter exact amounts for each event"}
                </p>
              </div>
              
              {formData.allocationStrategy === "single" && (
                <div>
                  <Label htmlFor="event">Event (Optional)</Label>
                  <Select 
                    value={formData.eventId || "none"} 
                    onValueChange={(v) => {
                      setFormData({ 
                        ...formData, 
                        eventId: v === "none" ? "" : v,
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-expense-event">
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific event</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {formData.allocationStrategy !== "single" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Select Events
                  </Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No events found. Create events first.</p>
                    ) : (
                      events.map((event) => (
                        <div key={event.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`event-${event.id}`}
                            checked={selectedEventIds.includes(event.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEventIds([...selectedEventIds, event.id]);
                                setEventAllocations({
                                  ...eventAllocations,
                                  [event.id]: { amount: "0", percent: "0" },
                                });
                              } else {
                                setSelectedEventIds(selectedEventIds.filter(id => id !== event.id));
                                const newAllocs = { ...eventAllocations };
                                delete newAllocs[event.id];
                                setEventAllocations(newAllocs);
                              }
                            }}
                            data-testid={`checkbox-event-${event.id}`}
                          />
                          <label htmlFor={`event-${event.id}`} className="text-sm flex-1 cursor-pointer">
                            {event.name}
                          </label>
                          {formData.allocationStrategy === "percentage" && selectedEventIds.includes(event.id) && (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                className="w-16 h-8 text-sm"
                                value={eventAllocations[event.id]?.percent || ""}
                                onChange={(e) => setEventAllocations({
                                  ...eventAllocations,
                                  [event.id]: { ...eventAllocations[event.id], percent: e.target.value },
                                })}
                                placeholder="0"
                                data-testid={`input-percent-${event.id}`}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          )}
                          {formData.allocationStrategy === "custom" && selectedEventIds.includes(event.id) && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-20 h-8 text-sm"
                                value={eventAllocations[event.id]?.amount || ""}
                                onChange={(e) => setEventAllocations({
                                  ...eventAllocations,
                                  [event.id]: { ...eventAllocations[event.id], amount: e.target.value },
                                })}
                                placeholder="0.00"
                                data-testid={`input-amount-${event.id}`}
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {formData.allocationStrategy === "equal" && selectedEventIds.length > 0 && formData.amount && (
                    <p className="text-xs text-muted-foreground">
                      ${(parseFloat(formData.amount) / selectedEventIds.length).toFixed(2)} per event
                    </p>
                  )}
                  {formData.allocationStrategy === "percentage" && selectedEventIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Total: {selectedEventIds.reduce((sum, id) => sum + parseFloat(eventAllocations[id]?.percent || "0"), 0)}%
                      {selectedEventIds.reduce((sum, id) => sum + parseFloat(eventAllocations[id]?.percent || "0"), 0) !== 100 && 
                        <span className="text-destructive ml-1">(should equal 100%)</span>
                      }
                    </p>
                  )}
                  {formData.allocationStrategy === "custom" && selectedEventIds.length > 0 && formData.amount && (
                    <p className="text-xs text-muted-foreground">
                      Allocated: ${selectedEventIds.reduce((sum, id) => sum + parseFloat(eventAllocations[id]?.amount || "0"), 0).toFixed(2)}
                      {Math.abs(selectedEventIds.reduce((sum, id) => sum + parseFloat(eventAllocations[id]?.amount || "0"), 0) - parseFloat(formData.amount)) > 0.01 && 
                        <span className="text-destructive ml-1">(should equal ${parseFloat(formData.amount).toFixed(2)})</span>
                      }
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="category">Budget Category (Optional)</Label>
                <Select value={formData.categoryId || "none"} onValueChange={(v) => setFormData({ ...formData, categoryId: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="select-expense-category">
                    <SelectValue placeholder="Link to budget category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Don't link to budget</SelectItem>
                    {budgetCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Linked expenses automatically update budget spending
                </p>
              </div>
              <div>
                <Label htmlFor="paidBy">Who Paid?</Label>
                <Select value={formData.paidById} onValueChange={(v) => setFormData({ ...formData, paidById: v })}>
                  <SelectTrigger data-testid="select-paid-by">
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
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
                    <SelectItem value="full">Full Amount (No Split)</SelectItem>
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
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(v: "pending" | "deposit_paid" | "paid") => setFormData({ ...formData, paymentStatus: v })}
                >
                  <SelectTrigger data-testid="select-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                    <SelectItem value="paid">Paid in Full</SelectItem>
                  </SelectContent>
                </Select>
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
                Add Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-total-expenses">
              <DollarSign className="h-5 w-5 text-primary" />
              ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} expenses tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deposits & Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2 text-green-600" data-testid="text-total-paid">
              <Check className="h-5 w-5" />
              ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExpenses > 0 ? Math.round((totalPaid / totalExpenses) * 100) : 0}% paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${totalBalance > 0 ? "text-orange-600" : "text-green-600"}`} data-testid="text-balance-due">
              <Calendar className="h-5 w-5" />
              ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBalance > 0 ? "Still owed to vendors" : "All paid up!"}
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              <a href="/collaborators" className="text-primary hover:underline">Manage team</a>
            </p>
          </CardContent>
        </Card>
      </div>

      {settlement && Object.keys(settlement).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Settlement Summary
              </CardTitle>
              <CardDescription>Who owes whom based on expenses</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
              data-testid="button-share-settlement"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
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

      {/* Share Settlement Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Settlement Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">Wedding Expense Summary</p>
              <p className="text-sm text-muted-foreground mb-3">Total: ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <div className="space-y-2 text-sm">
                {settlement && Object.entries(settlement).map(([userId, data]) => (
                  <div key={userId} className="flex justify-between">
                    <span>{data.name}</span>
                    <span className={data.balance >= 0 ? "text-green-600" : "text-red-600"}>
                      {data.balance >= 0 ? "gets back" : "owes"} ${Math.abs(data.balance).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  const summaryText = `Wedding Expense Summary\nTotal: $${totalExpenses.toFixed(2)}\n\n` +
                    Object.entries(settlement || {})
                      .map(([_, data]) => `${data.name}: ${data.balance >= 0 ? "gets back" : "owes"} $${Math.abs(data.balance).toFixed(2)}`)
                      .join("\n");
                  navigator.clipboard.writeText(summaryText);
                  toast({ title: "Copied to clipboard!" });
                }}
                data-testid="button-copy-settlement"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>View and manage all shared expenses</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === "byCeremony" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("byCeremony")}
                  data-testid="button-view-ceremony"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  By Ceremony
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filter by payer:</span>
              {[
                { value: "all", label: "All" },
                { value: "me", label: "Me" },
                { value: "partner", label: "Partner" },
                { value: "me-partner", label: "Me/Partner" },
                { value: "bride-parents", label: "Bride's Family" },
                { value: "groom-parents", label: "Groom's Family" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPayerFilter(option.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    payerFilter === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-filter-payer-${option.value}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
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
          ) : (() => {
              const filteredExpenses = expenses.filter((expense) => {
                if (payerFilter === "all") return true;
                if (payerFilter === "me-partner") {
                  return expense.paidById === "me-partner" || expense.paidById === "bride" || expense.paidById === "couple";
                }
                if (payerFilter === "me") {
                  return expense.paidById === "me" || expense.paidById === "bride";
                }
                if (payerFilter === "partner") {
                  return expense.paidById === "partner" || expense.paidById === "groom";
                }
                return expense.paidById === payerFilter;
              });
              
              if (filteredExpenses.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-filtered-expenses">
                    No expenses match the selected filter. Try selecting "All" or a different payer.
                  </div>
                );
              }

              const renderExpenseCard = (expense: ExpenseWithSplits, showCeremonyBadge = true) => {
                const event = expense.ceremonyId ? events.find((e) => e.id === expense.ceremonyId) : null;
                return (
                  <div
                    key={expense.id}
                    className="p-4 border rounded-lg hover-elevate"
                    data-testid={`card-expense-${expense.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{expense.expenseName}</h3>
                          {expense.parentCategory && <Badge variant="default" data-testid={`badge-category-${expense.id}`}>{getCategoryLabel(expense.parentCategory)}</Badge>}
                          {showCeremonyBadge && event && <Badge variant="outline">{event.name}</Badge>}
                          <Badge 
                            variant={
                              expense.status === "paid" ? "default" : 
                              (expense.status === "booked" || expense.status === "deposit_paid") ? "outline" : 
                              "secondary"
                            }
                            data-testid={`badge-status-${expense.id}`}
                          >
                            {expense.status === "paid" ? "Paid" : 
                             (expense.status === "booked" || expense.status === "deposit_paid") ? "Deposit Paid" : 
                             (expense.status === "pending" ? "Pending" : "Estimated")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Paid by {expense.paidByName === "Couple" ? "Me/Partner" : expense.paidByName} on {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                        </p>
                        {expense.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{expense.notes}</p>
                        )}
                        {expense.splits && expense.splits.length > 0 && (
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
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-lg font-bold">${parseFloat(expense.amount).toFixed(2)}</div>
                          {parseFloat(expense.amountPaid || "0") > 0 && parseFloat(expense.amountPaid || "0") < parseFloat(expense.amount) && (
                            <div className="text-xs">
                              <span className="text-green-600">Paid: ${parseFloat(expense.amountPaid || "0").toFixed(2)}</span>
                              <span className="text-muted-foreground"> | </span>
                              <span className="text-orange-600">Due: ${(parseFloat(expense.amount) - parseFloat(expense.amountPaid || "0")).toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(expense.amountPaid || "0") === 0 && expense.status !== "paid" && (
                            <div className="text-xs text-orange-600">Unpaid</div>
                          )}
                        </div>
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
              };

              if (viewMode === "byCeremony") {
                const expensesByCeremony = new Map<string, ExpenseWithSplits[]>();
                const unassignedExpenses: ExpenseWithSplits[] = [];
                const eventIds = new Set(events.map((e) => e.id));
                
                filteredExpenses.forEach((expense) => {
                  let assigned = false;
                  
                  if (expense.eventAllocations && expense.eventAllocations.length > 0) {
                    expense.eventAllocations.forEach((alloc) => {
                      if (eventIds.has(alloc.eventId)) {
                        const existing = expensesByCeremony.get(alloc.eventId) || [];
                        if (!existing.some((e) => e.id === expense.id)) {
                          expensesByCeremony.set(alloc.eventId, [...existing, expense]);
                        }
                        assigned = true;
                      }
                    });
                  } else if (expense.ceremonyId) {
                    if (eventIds.has(expense.ceremonyId)) {
                      const existing = expensesByCeremony.get(expense.ceremonyId) || [];
                      expensesByCeremony.set(expense.ceremonyId, [...existing, expense]);
                      assigned = true;
                    }
                  }
                  
                  if (!assigned) {
                    unassignedExpenses.push(expense);
                  }
                });

                const ceremonyGroups = events
                  .filter((e) => expensesByCeremony.has(e.id))
                  .map((event) => ({
                    event,
                    expenses: expensesByCeremony.get(event.id) || [],
                    total: (expensesByCeremony.get(event.id) || []).reduce(
                      (sum, exp) => sum + parseFloat(exp.amount), 0
                    ),
                  }));

                return (
                  <div className="space-y-4">
                    {ceremonyGroups.map(({ event, expenses: ceremonyExpenses, total }) => {
                      const isCollapsed = collapsedCeremonies.has(event.id);
                      return (
                        <Collapsible
                          key={event.id}
                          open={!isCollapsed}
                          onOpenChange={(open) => {
                            const newCollapsed = new Set(collapsedCeremonies);
                            if (open) {
                              newCollapsed.delete(event.id);
                            } else {
                              newCollapsed.add(event.id);
                            }
                            setCollapsedCeremonies(newCollapsed);
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover-elevate" data-testid={`trigger-ceremony-${event.id}`}>
                              <div className="flex items-center gap-3">
                                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                <span className="font-semibold">{event.name}</span>
                                <Badge variant="secondary">{ceremonyExpenses.length} expenses</Badge>
                              </div>
                              <span className="font-bold text-lg">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2 pl-4 space-y-2">
                            {ceremonyExpenses.map((expense) => renderExpenseCard(expense, false))}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                    
                    {unassignedExpenses.length > 0 && (
                      <Collapsible
                        open={!collapsedCeremonies.has("unassigned")}
                        onOpenChange={(open) => {
                          const newCollapsed = new Set(collapsedCeremonies);
                          if (open) {
                            newCollapsed.delete("unassigned");
                          } else {
                            newCollapsed.add("unassigned");
                          }
                          setCollapsedCeremonies(newCollapsed);
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover-elevate" data-testid="trigger-ceremony-unassigned">
                            <div className="flex items-center gap-3">
                              {collapsedCeremonies.has("unassigned") ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              <span className="font-semibold text-muted-foreground">General / Unassigned</span>
                              <Badge variant="outline">{unassignedExpenses.length} expenses</Badge>
                            </div>
                            <span className="font-bold text-lg">
                              ${unassignedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-4 space-y-2">
                          {unassignedExpenses.map((expense) => renderExpenseCard(expense, false))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => renderExpenseCard(expense))}
                </div>
              );
            })()}
        </CardContent>
      </Card>

      {/* Edit Expense Dialog (shared component) */}
      <EditExpenseDialog
        expense={editingExpense as ExpenseWithDetails | null}
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        categories={budgetCategories}
        events={events}
        onSave={(data) => {
          if (editingExpense) {
            updateExpenseMutation.mutate({ id: editingExpense.id, data });
          }
        }}
        isPending={updateExpenseMutation.isPending}
      />
    </div>
  );
}
