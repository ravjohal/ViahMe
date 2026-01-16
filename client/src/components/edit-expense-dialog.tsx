import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, FileText, ExternalLink } from "lucide-react";
import { type BudgetBucket, type Event, type Expense, type ExpenseSplit } from "@shared/schema";
import { getCeremonyIdFromEvent } from "@shared/ceremonies";
import { useBudgetCategories, useBudgetCategoryLookup } from "@/hooks/use-budget-bucket-categories";

type PayerType = "me" | "partner" | "me_partner" | "bride_family" | "groom_family";
type ExpenseStatus = "estimated" | "booked" | "paid";

interface LineItem {
  name: string;
  budgetBucketId: string; // UUID reference to budget_bucket_categories.id
  lowCost: number;
  highCost: number;
  unit: 'fixed' | 'per_person' | 'per_hour';
  notes?: string;
}

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
  weddingId?: string;
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  events,
  onSave,
  isPending,
  weddingId,
}: EditExpenseDialogProps) {
  // Get budget categories from database
  const { data: budgetCategories = [] } = useBudgetCategories();
  const { getCategoryLabel } = useBudgetCategoryLookup();
  
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [selectedLineItem, setSelectedLineItem] = useState<string | null>(null);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExpenseStatus>("paid");
  const [payer, setPayer] = useState<PayerType>("me_partner");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);

  // Get the selected event and its ceremony template ID
  const selectedEvent = useMemo(() => {
    if (!selectedCeremonyId) return null;
    return events.find(e => e.id === selectedCeremonyId) || null;
  }, [selectedCeremonyId, events]);

  const ceremonyTemplateId = useMemo(() => {
    if (!selectedEvent) return null;
    return getCeremonyIdFromEvent(selectedEvent.name, selectedEvent.type);
  }, [selectedEvent]);

  // Fetch line items from API
  const { data: lineItemsData, isLoading: isLoadingLineItems, isError: isLineItemsError } = useQuery<{
    ceremonyId: string;
    ceremonyName: string;
    tradition: string;
    lineItems: LineItem[];
  }>({
    queryKey: ['/api/ceremony-types', ceremonyTemplateId, 'line-items'],
    enabled: !!ceremonyTemplateId && open,
    retry: false,
  });

  const ceremonyLineItems = lineItemsData?.lineItems || [];

  // Derive the budget bucket UUID from the selected line item
  const derivedBucketId = useMemo((): string | null => {
    if (!selectedLineItem) return null;
    
    const lineItem = ceremonyLineItems.find(item => item.name === selectedLineItem);
    if (lineItem) {
      return lineItem.budgetBucketId;
    }
    
    // Check if it's a bucket label (from fallback)
    const matchingCategory = budgetCategories.find(c => c.displayName === selectedLineItem);
    if (matchingCategory) {
      return matchingCategory.id;
    }
    
    return null;
  }, [selectedLineItem, ceremonyLineItems, budgetCategories]);

  useEffect(() => {
    if (expense) {
      setExpenseName(expense.expenseName || "");
      setAmount(expense.amount?.toString() || "");
      setAmountPaid(expense.amountPaid?.toString() || "0");
      const dateValue = expense.expenseDate 
        ? new Date(expense.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setExpenseDate(dateValue);
      setSelectedCeremonyId(expense.ceremonyId || null);
      setStatus((expense.status as ExpenseStatus) || "paid");
      setNotes(expense.notes || "");
      setExistingReceiptUrl(expense.receiptUrl || null);
      setPhotoFile(null);
      setPhotoPreview(null);
      
      // Set the line item based on the bucket UUID
      // For ceremony-specific expenses, the line items will be checked after they load
      // For general expenses, use the bucket label for category matching
      if (expense.bucketCategoryId) {
        // Look up the category display name from the UUID
        const category = budgetCategories.find(c => c.id === expense.bucketCategoryId);
        if (category) {
          setSelectedLineItem(category.displayName);
        } else {
          setSelectedLineItem(null);
        }
      } else {
        setSelectedLineItem(null);
      }
      
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
    }
  }, [expense]);

  // When ceremony line items load, check if we should update the selected line item
  // to match the expense name (if it matches a line item in the template)
  useEffect(() => {
    if (expense && ceremonyLineItems.length > 0) {
      // Check if expense name matches any line item
      const matchingLineItem = ceremonyLineItems.find(
        item => item.name === expense.expenseName
      );
      if (matchingLineItem) {
        setSelectedLineItem(matchingLineItem.name);
      }
    }
  }, [ceremonyLineItems, expense]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
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

    onSave({
      bucketCategoryId: derivedBucketId || undefined, // UUID for budget bucket
      expenseName: expenseName.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: finalAmountPaid.toFixed(2),
      expenseDate,
      ceremonyId: selectedCeremonyId,
      status,
      paidById: payerId,
      paidByName: payerName,
      notes: notes.trim() || null,
      photoFile,
      existingReceiptUrl: existingReceiptUrl,
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
              For which ceremony? (Optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCeremonyId(null);
                  setSelectedLineItem(null);
                }}
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
                  onClick={() => {
                    setSelectedCeremonyId(event.id);
                    setSelectedLineItem(null);
                  }}
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
              Category <span className="text-destructive">*</span>
            </Label>
            {isLoadingLineItems && ceremonyTemplateId ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            ) : ceremonyLineItems.length > 0 && !isLineItemsError ? (
              <div className="flex flex-wrap gap-2">
                {ceremonyLineItems.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedLineItem(item.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedLineItem === item.name
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover-elevate"
                    }`}
                    data-testid={`button-edit-lineitem-${index}`}
                  >
                    {item.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedLineItem("Other")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLineItem === "Other"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover-elevate"
                  }`}
                  data-testid="button-edit-lineitem-other"
                >
                  Other
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {budgetCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedLineItem(category.displayName)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedLineItem === category.displayName
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover-elevate"
                    }`}
                    data-testid={`button-edit-category-${category.id}`}
                  >
                    {category.displayName}
                  </button>
                ))}
              </div>
            )}
            {derivedBucket && selectedLineItem && (
              <p className="text-xs text-muted-foreground">
                Budget category: {getCategoryLabel(derivedBucket)}
              </p>
            )}
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

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Receipt / Attachment (optional)
            </Label>
            
            {existingReceiptUrl && !photoPreview && (
              <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Current receipt attached</span>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={existingReceiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    data-testid="link-view-receipt"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View
                  </a>
                </div>
              </div>
            )}
            
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Receipt preview" className="max-h-32 mx-auto rounded" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={removePhoto}
                  data-testid="button-remove-receipt"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  data-testid="input-edit-receipt"
                />
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {existingReceiptUrl ? "Upload new receipt" : "Click to upload a receipt"}
                </span>
              </label>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !expenseName.trim() || !derivedBucket}
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
