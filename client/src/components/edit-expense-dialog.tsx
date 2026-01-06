import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Event, BudgetCategory, Expense, ExpenseSplit, ExpenseEventAllocation } from "@shared/schema";

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

type PayerType = "me" | "partner" | "me_partner" | "bride_family" | "groom_family";

export interface ExpenseWithDetails extends Expense {
  eventAllocations?: ExpenseEventAllocation[];
  splits?: ExpenseSplit[];
}

interface EditExpenseDialogProps {
  expense: ExpenseWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: BudgetCategory[];
  events: Event[];
  onSave: (data: any) => void;
  isPending: boolean;
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  categories,
  events,
  onSave,
  isPending,
}: EditExpenseDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"partial" | "paid">("partial");
  const [payer, setPayer] = useState<PayerType>("me_partner");
  const [notes, setNotes] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<"full" | "split">("full");
  const [splitPercentages, setSplitPercentages] = useState({
    couple: "50",
    bride_family: "25",
    groom_family: "25",
  });

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || "");
      setAmount(expense.amount?.toString() || "");
      setAmountPaid(expense.amountPaid?.toString() || "0");
      const dateValue = expense.expenseDate 
        ? (typeof expense.expenseDate === 'string' 
            ? expense.expenseDate.split('T')[0] 
            : new Date(expense.expenseDate).toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0];
      setExpenseDate(dateValue);
      setCategoryId(expense.categoryId || null);
      setPaymentStatus((expense.paymentStatus as "partial" | "paid") || "partial");
      setNotes(expense.notes || "");
      
      if (expense.paidById === "me") {
        setPayer("me");
      } else if (expense.paidById === "partner") {
        setPayer("partner");
      } else if (expense.paidById === "me-partner" || expense.paidById === "bride") {
        setPayer("me_partner");
      } else if (expense.paidById === "bride-parents") {
        setPayer("bride_family");
      } else if (expense.paidById === "groom-parents") {
        setPayer("groom_family");
      } else {
        setPayer("me_partner");
      }
      
      if (expense.eventAllocations && expense.eventAllocations.length > 0) {
        setSelectedEvents(expense.eventAllocations.map((a) => a.eventId));
      } else if (expense.eventId) {
        setSelectedEvents([expense.eventId]);
      } else {
        setSelectedEvents([]);
      }
      
      if (expense.splitType === "custom" && expense.splits && expense.splits.length > 1) {
        setSplitType("split");
        const totalAmount = parseFloat(expense.amount) || 1;
        const newPercentages = { couple: "0", bride_family: "0", groom_family: "0" };
        for (const split of expense.splits) {
          const percent = ((parseFloat(split.shareAmount) / totalAmount) * 100).toFixed(0);
          if (split.userId === "bride") {
            newPercentages.couple = percent;
          } else if (split.userId === "bride-parents") {
            newPercentages.bride_family = percent;
          } else if (split.userId === "groom-parents") {
            newPercentages.groom_family = percent;
          }
        }
        setSplitPercentages(newPercentages);
      } else {
        setSplitType("full");
      }
    }
  }, [expense]);

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
    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    const finalAmountPaid = paymentStatus === "paid" 
      ? parsedAmount 
      : (parseFloat(amountPaid.replace(/,/g, "")) || 0);

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

    onSave({
      description: description.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: finalAmountPaid.toFixed(2),
      expenseDate,
      categoryId,
      paymentStatus,
      paidById: payerId,
      paidByName: payerName,
      splitType: splitType === "split" ? "custom" : "full",
      notes: notes.trim() || null,
      eventId,
      allocationStrategy: selectedEvents.length > 1 ? "equal" : "single",
      splits,
      eventAllocations: eventAllocations.length > 0 ? eventAllocations : undefined,
    });
  };

  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const parsedAmountPaid = parseFloat(amountPaid.replace(/,/g, "")) || 0;
  const remainingAmount = Math.max(0, parsedAmount - parsedAmountPaid);
  const isAllSelected = events.length > 0 && selectedEvents.length === events.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              data-testid="input-edit-expense-description"
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
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="0.00"
                  className="pl-7"
                  data-testid="input-edit-expense-amount"
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
                data-testid="input-edit-expense-date"
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
                  data-testid={`button-edit-event-${event.id}`}
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
                  data-testid="button-edit-event-all"
                >
                  All Events
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expense Category <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const label = CATEGORY_LABELS[cat.category] || cat.category;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      categoryId === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover-elevate"
                    }`}
                    data-testid={`button-edit-category-${cat.id}`}
                  >
                    {label}
                  </button>
                );
              })}
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
                data-testid="button-edit-payer-me"
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
                data-testid="button-edit-payer-partner"
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
                data-testid="button-edit-payer-me-partner"
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
                data-testid="button-edit-payer-bride"
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
                data-testid="button-edit-payer-groom"
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
                data-testid="button-edit-split-none"
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
                data-testid="button-edit-split-yes"
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
                    data-testid="input-edit-split-couple"
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
                    data-testid="input-edit-split-bride"
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
                    data-testid="input-edit-split-groom"
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("partial")}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentStatus === "partial"
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-edit-status-partial"
              >
                Partially Paid
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("paid")}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  paymentStatus === "paid"
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-edit-status-paid"
              >
                Fully Paid
              </button>
            </div>
          </div>

          {paymentStatus === "partial" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Amount Paid So Far
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  type="text"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="0.00"
                  className="pl-7"
                  data-testid="input-edit-expense-amount-paid"
                />
              </div>
              {parsedAmount > 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Remaining: ${remainingAmount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="min-h-[60px]"
              data-testid="input-edit-expense-notes"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !description.trim() || !categoryId}
              data-testid="button-save-edit-expense"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
