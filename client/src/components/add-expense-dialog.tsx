import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, X } from "lucide-react";
import type { Event, BudgetCategory } from "@shared/schema";

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

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  events: Event[];
  defaultEventId?: string;
}

type PayerType = "couple" | "bride_family" | "groom_family";

export function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  weddingId, 
  events,
  defaultEventId 
}: AddExpenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [payer, setPayer] = useState<PayerType>("couple");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"partial" | "paid">("partial");
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [splitType, setSplitType] = useState<"full" | "split">("full");
  const [splitPercentages, setSplitPercentages] = useState({
    couple: "50",
    bride_family: "25",
    groom_family: "25",
  });

  const { data: budgetCategories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories", weddingId],
    enabled: !!weddingId,
  });

  useEffect(() => {
    if (open && defaultEventId) {
      setSelectedEvents([defaultEventId]);
    }
  }, [open, defaultEventId]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setAmountPaid("");
    setSelectedEvents([]);
    setSelectedCategoryId(null);
    setPayer("couple");
    setNotes("");
    setPaymentStatus("partial");
    setShowNotesSection(false);
    setSplitType("full");
    setSplitPercentages({ couple: "50", bride_family: "25", groom_family: "25" });
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

  const handleEventToggle = (eventId: string) => {
    if (eventId === "all") {
      if (selectedEvents.length === events.length) {
        setSelectedEvents([]);
      } else {
        setSelectedEvents(events.map(e => e.id));
      }
    } else {
      if (selectedEvents.includes(eventId)) {
        setSelectedEvents(selectedEvents.filter(id => id !== eventId));
      } else {
        setSelectedEvents([...selectedEvents, eventId]);
      }
    }
  };

  const handleSubmit = () => {
    if (!user || !weddingId) return;

    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    if (!description.trim()) {
      toast({ title: "Please enter a description", variant: "destructive" });
      return;
    }

    const payerIdMap: Record<PayerType, string> = {
      couple: "bride",
      bride_family: "bride-parents",
      groom_family: "groom-parents",
    };
    const payerNameMap: Record<PayerType, string> = {
      couple: "Couple",
      bride_family: "Bride's Family",
      groom_family: "Groom's Family",
    };

    const payerId = payerIdMap[payer];
    const payerName = payerNameMap[payer];

    let splits: any[] = [];
    if (splitType === "split") {
      const couplePercent = parseFloat(splitPercentages.couple) || 0;
      const bridePercent = parseFloat(splitPercentages.bride_family) || 0;
      const groomPercent = parseFloat(splitPercentages.groom_family) || 0;
      
      if (couplePercent > 0) {
        splits.push({
          userId: "bride",
          userName: "Couple",
          shareAmount: ((couplePercent / 100) * parsedAmount).toFixed(2),
          isPaid: payer === "couple",
        });
      }
      if (bridePercent > 0) {
        splits.push({
          userId: "bride-parents",
          userName: "Bride's Family",
          shareAmount: ((bridePercent / 100) * parsedAmount).toFixed(2),
          isPaid: payer === "bride_family",
        });
      }
      if (groomPercent > 0) {
        splits.push({
          userId: "groom-parents",
          userName: "Groom's Family",
          shareAmount: ((groomPercent / 100) * parsedAmount).toFixed(2),
          isPaid: payer === "groom_family",
        });
      }
    } else {
      splits = [{
        userId: payerId,
        userName: payerName,
        shareAmount: parsedAmount.toFixed(2),
        isPaid: true,
      }];
    }

    let eventAllocations: any[] = [];
    const eventId = selectedEvents.length === 1 ? selectedEvents[0] : null;
    
    if (selectedEvents.length > 1) {
      const perEventAmount = parsedAmount / selectedEvents.length;
      eventAllocations = selectedEvents.map(evId => ({
        eventId: evId,
        allocatedAmount: perEventAmount.toFixed(2),
        allocatedPercent: null,
      }));
    }

    const parsedAmountPaid = paymentStatus === "paid" 
      ? parsedAmount 
      : (parseFloat(amountPaid.replace(/,/g, "")) || 0);

    createExpenseMutation.mutate({
      weddingId,
      description: description.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: parsedAmountPaid.toFixed(2),
      eventId,
      categoryId: selectedCategoryId,
      paidById: payerId,
      paidByName: payerName,
      splitType: splitType === "split" ? "custom" : "full",
      paymentStatus,
      notes: notes.trim() || null,
      expenseDate: new Date().toISOString().split("T")[0],
      splits,
      allocationStrategy: selectedEvents.length > 1 ? "equal" : "single",
      eventAllocations: eventAllocations.length > 0 ? eventAllocations : undefined,
    });
  };

  const isAllSelected = events.length > 0 && selectedEvents.length === events.length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Add Expense</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              What is this for?
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Floral Decor for Mandap"
              className="text-base"
              data-testid="input-expense-description"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              How much?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
              <Input
                type="text"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, "");
                  setAmount(val);
                }}
                placeholder="0.00"
                className="pl-7 text-base font-medium"
                data-testid="input-expense-amount"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Which event?
            </Label>
            <div className="flex flex-wrap gap-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventToggle(event.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedEvents.includes(event.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-event-${event.id}`}
                >
                  {event.name}
                </button>
              ))}
              {events.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleEventToggle("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isAllSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid="button-event-all"
                >
                  All Events
                </button>
              )}
            </div>
          </div>

          {budgetCategories.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Category (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategoryId === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid="button-category-none"
                >
                  None
                </button>
                {budgetCategories.map((cat) => {
                  const label = CATEGORY_LABELS[cat.category] || cat.category;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategoryId === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover-elevate"
                      }`}
                      data-testid={`button-category-${cat.id}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Who is paying?
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPayer("couple")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  payer === "couple"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-payer-couple"
              >
                Me/Partner
              </button>
              <button
                type="button"
                onClick={() => setPayer("bride_family")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  payer === "bride_family"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-payer-bride"
              >
                Bride's Family
              </button>
              <button
                type="button"
                onClick={() => setPayer("groom_family")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  payer === "groom_family"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-payer-groom"
              >
                Groom's Family
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Split the bill?
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitType("full")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  splitType === "full"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-split-none"
              >
                No Split
              </button>
              <button
                type="button"
                onClick={() => setSplitType("split")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  splitType === "split"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-split-yes"
              >
                Split Among Families
              </button>
            </div>
            
            {splitType === "split" && (
              <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-28">Couple</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={splitPercentages.couple}
                    onChange={(e) => setSplitPercentages(prev => ({ ...prev, couple: e.target.value }))}
                    className="w-20 h-8 text-sm"
                    data-testid="input-split-couple"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm w-28">Bride's Family</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={splitPercentages.bride_family}
                    onChange={(e) => setSplitPercentages(prev => ({ ...prev, bride_family: e.target.value }))}
                    className="w-20 h-8 text-sm"
                    data-testid="input-split-bride"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm w-28">Groom's Family</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={splitPercentages.groom_family}
                    onChange={(e) => setSplitPercentages(prev => ({ ...prev, groom_family: e.target.value }))}
                    className="w-20 h-8 text-sm"
                    data-testid="input-split-groom"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                {(() => {
                  const total = (parseFloat(splitPercentages.couple) || 0) + 
                               (parseFloat(splitPercentages.bride_family) || 0) + 
                               (parseFloat(splitPercentages.groom_family) || 0);
                  if (total !== 100) {
                    return (
                      <p className="text-xs text-destructive">
                        Total: {total}% (should equal 100%)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Payment Status
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("partial")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentStatus === "partial"
                    ? "bg-orange-100 text-orange-700 ring-2 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-status-partial"
              >
                Partially Paid
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("paid");
                  setAmountPaid("");
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentStatus === "paid"
                    ? "bg-green-100 text-green-700 ring-2 ring-green-300 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-status-paid"
              >
                Fully Paid
              </button>
            </div>

            {paymentStatus === "partial" && (
              <div className="mt-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg space-y-2">
                <Label className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  How much has been paid so far?
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="text"
                    value={amountPaid}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "");
                      setAmountPaid(val);
                    }}
                    placeholder="0.00"
                    className="pl-7 text-base font-medium bg-white dark:bg-background"
                    data-testid="input-amount-paid"
                  />
                </div>
                {amount && amountPaid && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Still owed: ${(parseFloat(amount.replace(/,/g, "")) - parseFloat(amountPaid.replace(/,/g, ""))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}
          </div>

          <Collapsible open={showNotesSection} onOpenChange={setShowNotesSection}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-notes"
              >
                <Plus className={`w-4 h-4 transition-transform ${showNotesSection ? "rotate-45" : ""}`} />
                Add notes or photo of receipt
                <ChevronDown className={`w-4 h-4 transition-transform ${showNotesSection ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details..."
                className="min-h-[80px]"
                data-testid="input-expense-notes"
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="px-6 py-4 border-t bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={createExpenseMutation.isPending}
            className="w-full"
            size="lg"
            data-testid="button-save-expense"
          >
            {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
