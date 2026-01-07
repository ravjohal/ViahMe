import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, Sparkles, X } from "lucide-react";
import { BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket, type Event } from "@shared/schema";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  events: Event[];
  defaultEventId?: string;
  weddingTradition?: string;
}

type PayerType = "me" | "partner" | "me_partner" | "bride_family" | "groom_family";
type ExpenseStatus = "estimated" | "booked" | "paid";

export function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  weddingId, 
  events,
  defaultEventId,
  weddingTradition = "sikh"
}: AddExpenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<BudgetBucket | null>(null);
  const [payer, setPayer] = useState<PayerType>("me_partner");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ExpenseStatus>("paid");
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [splitType, setSplitType] = useState<"full" | "split">("full");
  const [splitPercentages, setSplitPercentages] = useState({
    couple: "50",
    bride_family: "25",
    groom_family: "25",
  });

  useEffect(() => {
    if (open && defaultEventId) {
      setSelectedCeremonyId(defaultEventId);
    }
  }, [open, defaultEventId]);

  const resetForm = () => {
    setExpenseName("");
    setAmount("");
    setAmountPaid("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setSelectedCeremonyId(null);
    setSelectedBucket(null);
    setPayer("me_partner");
    setNotes("");
    setStatus("paid");
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId, "totals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", weddingId] });
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

    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    if (!expenseName.trim()) {
      toast({ title: "Please enter an expense name", variant: "destructive" });
      return;
    }

    if (!selectedBucket) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    const payerIdMap: Record<PayerType, string> = {
      me: "me",
      partner: "partner",
      me_partner: "me-partner",
      bride_family: "bride-parents",
      groom_family: "groom-parents",
    };
    const payerNameMap: Record<PayerType, string> = {
      me: "Me",
      partner: "Partner",
      me_partner: "Me/Partner",
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
          userId: "me-partner",
          userName: "Me/Partner",
          shareAmount: ((couplePercent / 100) * parsedAmount).toFixed(2),
          isPaid: payer === "me" || payer === "partner" || payer === "me_partner",
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

    const parsedAmountPaid = status === "paid" 
      ? parsedAmount 
      : (parseFloat(amountPaid.replace(/,/g, "")) || 0);

    createExpenseMutation.mutate({
      weddingId,
      parentCategory: selectedBucket,
      expenseName: expenseName.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: parsedAmountPaid.toFixed(2),
      ceremonyId: selectedCeremonyId,
      paidById: payerId,
      paidByName: payerName,
      status,
      notes: notes.trim() || null,
      expenseDate,
      splits,
    });
  };

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
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              placeholder="e.g., Custom Pink Pagg Turbans"
              className="text-base"
              data-testid="input-expense-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                How much total?
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
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Date of Expense
              </Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="text-base"
                data-testid="input-expense-date"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Category <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_BUCKETS.map((bucket) => (
                <button
                  key={bucket}
                  type="button"
                  onClick={() => setSelectedBucket(bucket)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBucket === bucket
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-category-${bucket}`}
                >
                  {BUDGET_BUCKET_LABELS[bucket]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              For which ceremony? (Optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCeremonyId(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCeremonyId === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-ceremony-none"
              >
                General
              </button>
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedCeremonyId(event.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCeremonyId === event.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid={`button-ceremony-${event.id}`}
                >
                  {event.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Who is paying?
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPayer("me")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  payer === "me"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-payer-me"
              >
                Me
              </button>
              <button
                type="button"
                onClick={() => setPayer("partner")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  payer === "partner"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-payer-partner"
              >
                Partner
              </button>
              <button
                type="button"
                onClick={() => setPayer("me_partner")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  payer === "me_partner"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-payer-me-partner"
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
                  <span className="text-sm w-28">Me/Partner</span>
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
              Status
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatus("estimated")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  status === "estimated"
                    ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-status-estimated"
              >
                Estimated
              </button>
              <button
                type="button"
                onClick={() => setStatus("booked")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  status === "booked"
                    ? "bg-orange-100 text-orange-700 ring-2 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-status-booked"
              >
                Booked
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("paid");
                  setAmountPaid("");
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  status === "paid"
                    ? "bg-green-100 text-green-700 ring-2 ring-green-300 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-status-paid"
              >
                Paid
              </button>
            </div>

            {status === "booked" && (
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
