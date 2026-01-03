import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";
import type { Event, BudgetCategory } from "@shared/schema";

type AllocationStrategy = "single" | "equal" | "percentage" | "custom";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  events: Event[];
  defaultEventId?: string;
}

export function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  weddingId, 
  events,
  defaultEventId 
}: AddExpenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

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
  });
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [eventAllocations, setEventAllocations] = useState<Record<string, { amount: string; percent: string }>>({});

  const { data: budgetCategories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", weddingId],
    enabled: !!weddingId,
  });

  const { data: collaborators = [] } = useQuery<any[]>({
    queryKey: ["/api/weddings", weddingId, "collaborators"],
    enabled: !!weddingId,
  });

  const teamMembers = [
    { id: "bride", name: "Bride" },
    { id: "groom", name: "Groom" },
    { id: "bride-parents", name: "Bride's Parents" },
    { id: "groom-parents", name: "Groom's Parents" },
    ...collaborators.map((c: any) => ({ id: c.userId, name: c.user?.name || c.user?.email || "Team Member" })),
  ];

  useEffect(() => {
    if (open && defaultEventId) {
      const selectedEvent = events.find(e => e.id === defaultEventId);
      const eventDate = selectedEvent?.date 
        ? new Date(selectedEvent.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      setFormData(prev => ({
        ...prev,
        eventId: defaultEventId,
        expenseDate: eventDate,
      }));
    }
  }, [open, defaultEventId, events]);

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
    });
    setSplitAmounts({});
    setSelectedEventIds([]);
    setEventAllocations({});
  };

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories", weddingId] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Expense added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" });
    },
  });

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
        isPaid: member.id === payerId,
      };
    });

    let allocationsToSend: { eventId: string; allocatedAmount: string; allocatedPercent: string | null }[] = [];

    if (formData.allocationStrategy === "single" && formData.eventId) {
      // Single event - no allocations needed
    } else if (formData.allocationStrategy === "equal" && selectedEventIds.length > 0) {
      allocationsToSend = selectedEventIds.map(eventId => ({
        eventId,
        allocatedAmount: (amount / selectedEventIds.length).toFixed(2),
        allocatedPercent: null,
      }));
    } else if (formData.allocationStrategy !== "single" && selectedEventIds.length > 0) {
      allocationsToSend = selectedEventIds.map(eventId => {
        const alloc = eventAllocations[eventId] || { amount: "0", percent: "0" };
        return {
          eventId,
          allocatedAmount: formData.allocationStrategy === "percentage"
            ? ((parseFloat(alloc.percent) / 100) * amount).toFixed(2)
            : alloc.amount,
          allocatedPercent: formData.allocationStrategy === "percentage" ? alloc.percent : null,
        };
      });
    }

    createExpenseMutation.mutate({
      weddingId,
      description: formData.description,
      amount: amount.toFixed(2),
      eventId: formData.allocationStrategy === "single" ? (formData.eventId || null) : null,
      categoryId: formData.categoryId || null,
      paidById: payerId,
      paidByName: teamMembers.find((m) => m.id === payerId)?.name || "Unknown",
      splitType: formData.splitType,
      notes: formData.notes,
      expenseDate: formData.expenseDate,
      splits,
      allocationStrategy: formData.allocationStrategy,
      eventAllocations: allocationsToSend,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                  const selectedEvent = events.find(e => e.id === v);
                  const eventDate = selectedEvent?.date 
                    ? new Date(selectedEvent.date).toISOString().split("T")[0]
                    : formData.expenseDate;
                  setFormData({ 
                    ...formData, 
                    eventId: v === "none" ? "" : v,
                    expenseDate: v === "none" ? formData.expenseDate : eventDate
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
            disabled={createExpenseMutation.isPending}
            data-testid="button-save-expense"
          >
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
