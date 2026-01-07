import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket, type Event, type Expense, type ExpenseSplit } from "@shared/schema";

type PayerType = "me" | "partner" | "me_partner" | "bride_family" | "groom_family";
type ExpenseStatus = "estimated" | "booked" | "paid";

export interface ExpenseWithDetails extends Expense {
  splits?: ExpenseSplit[];
}

interface EditExpenseDialogProps {
  expense: ExpenseWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  onSave: (data: any) => void;
  isPending: boolean;
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  events,
  onSave,
  isPending,
}: EditExpenseDialogProps) {
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<BudgetBucket | null>(null);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExpenseStatus>("paid");
  const [payer, setPayer] = useState<PayerType>("me_partner");
  const [notes, setNotes] = useState("");
  const [splitType, setSplitType] = useState<"full" | "split">("full");
  const [splitPercentages, setSplitPercentages] = useState({
    couple: "50",
    bride_family: "25",
    groom_family: "25",
  });

  useEffect(() => {
    if (expense) {
      setExpenseName(expense.expenseName || "");
      setAmount(expense.amount?.toString() || "");
      setAmountPaid(expense.amountPaid?.toString() || "0");
      const dateValue = expense.expenseDate 
        ? (typeof expense.expenseDate === 'string' 
            ? expense.expenseDate.split('T')[0] 
            : new Date(expense.expenseDate).toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0];
      setExpenseDate(dateValue);
      setSelectedBucket((expense.parentCategory as BudgetBucket) || null);
      setSelectedCeremonyId(expense.ceremonyId || null);
      setStatus((expense.status as ExpenseStatus) || "paid");
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
      
      if (expense.splits && expense.splits.length > 1) {
        setSplitType("split");
        const totalAmount = parseFloat(expense.amount?.toString() || "1") || 1;
        const newPercentages = { couple: "0", bride_family: "0", groom_family: "0" };
        for (const split of expense.splits) {
          const percent = ((parseFloat(split.shareAmount?.toString() || "0") / totalAmount) * 100).toFixed(0);
          if (split.userId === "me-partner") {
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

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!selectedBucket) return;
    
    const finalAmountPaid = status === "paid" 
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

    onSave({
      parentCategory: selectedBucket,
      expenseName: expenseName.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: finalAmountPaid.toFixed(2),
      expenseDate,
      ceremonyId: selectedCeremonyId,
      status,
      paidById: payerId,
      paidByName: payerName,
      notes: notes.trim() || null,
      splits,
    });
  };

  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const parsedAmountPaid = parseFloat(amountPaid.replace(/,/g, "")) || 0;
  const remainingAmount = Math.max(0, parsedAmount - parsedAmountPaid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expense Name
            </Label>
            <Input
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              placeholder="What was this expense for?"
              data-testid="input-edit-expense-name"
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
                  data-testid={`button-edit-category-${bucket}`}
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
                data-testid="button-edit-ceremony-none"
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
                  data-testid={`button-edit-ceremony-${event.id}`}
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
                data-testid="button-edit-status-estimated"
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
                data-testid="button-edit-status-booked"
              >
                Booked
              </button>
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  status === "paid"
                    ? "bg-green-100 text-green-700 ring-2 ring-green-300 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid="button-edit-status-paid"
              >
                Paid
              </button>
            </div>
          </div>

          {status === "booked" && (
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
              disabled={isPending || !expenseName.trim() || !selectedBucket}
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
