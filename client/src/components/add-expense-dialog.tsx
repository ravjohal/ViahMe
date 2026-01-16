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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Check, Calendar, DollarSign, User, FileText, Upload, Tag, Loader2 } from "lucide-react";
import { type BudgetBucket, type Event, type Expense, type ExpenseSplit } from "@shared/schema";
import { CEREMONY_MAPPINGS, getCeremonyIdFromEvent } from "@shared/ceremonies";
import { useBudgetCategories, useBudgetCategoryLookup } from "@/hooks/use-budget-bucket-categories";

// Type for line items fetched from API - uses UUID for budget bucket
interface LineItem {
  name: string;
  budgetBucketId: string; // UUID reference to budget_bucket_categories.id
  lowCost: number;
  highCost: number;
  unit: 'fixed' | 'per_person' | 'per_hour';
  notes?: string;
}

export interface ExpenseWithSplits extends Expense {
  splits?: ExpenseSplit[];
}

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  events: Event[];
  defaultEventId?: string;
  weddingTradition?: string;
  // Edit mode props
  expense?: ExpenseWithSplits | null;
  onUpdate?: (data: any) => void;
  isPendingUpdate?: boolean;
}

type PayerType = "me" | "partner" | "me_partner" | "bride_family" | "groom_family";

const STEPS = [
  { id: 1, title: "Ceremony", icon: Calendar, description: "Which ceremony is this for?" },
  { id: 2, title: "Category", icon: Tag, description: "What type of expense?" },
  { id: 3, title: "Payer", icon: User, description: "Who is paying?" },
  { id: 4, title: "Amount", icon: DollarSign, description: "How much and when?" },
  { id: 5, title: "Details", icon: FileText, description: "Description & notes" },
];

const PAYER_OPTIONS: { id: PayerType; label: string }[] = [
  { id: "me", label: "Me" },
  { id: "partner", label: "Partner" },
  { id: "me_partner", label: "Me & Partner" },
  { id: "bride_family", label: "Bride's Family" },
  { id: "groom_family", label: "Groom's Family" },
];

export function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  weddingId, 
  events,
  defaultEventId,
  weddingTradition = "sikh",
  expense,
  onUpdate,
  isPendingUpdate = false,
}: AddExpenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isEditMode = !!expense;
  
  // Get budget categories from database
  const { data: budgetCategories = [] } = useBudgetCategories();
  const { getCategoryLabel, allCategoryIds } = useBudgetCategoryLookup();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [selectedLineItem, setSelectedLineItem] = useState<string | null>(null);
  const [payer, setPayer] = useState<PayerType>("me_partner");
  const [amount, setAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"estimated" | "deposit_paid" | "paid">("paid");
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseName, setExpenseName] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);

  // Track the original bucket category ID from edit mode (to preserve on save)
  const [editOriginalBucketId, setEditOriginalBucketId] = useState<string | null>(null);

  // Initialize state from expense when in edit mode
  useEffect(() => {
    if (open && expense) {
      setSelectedCeremonyId(expense.ceremonyId || null);
      setExpenseName(expense.expenseName || "");
      setAmount(expense.amount?.toString() || "");
      setNotes(expense.notes || "");
      setExistingReceiptUrl(expense.receiptUrl || null);
      
      const dateValue = expense.expenseDate 
        ? new Date(expense.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setExpenseDate(dateValue);
      
      // Set payment due date from expense if available
      if (expense.paymentDueDate) {
        const dueDateValue = new Date(expense.paymentDueDate).toISOString().split('T')[0];
        setPaymentDueDate(dueDateValue);
      } else {
        setPaymentDueDate("");
      }
      
      // Set payment status based on amountPaid vs amount
      const expenseAmount = parseFloat(expense.amount || "0");
      const amountPaidValue = parseFloat(expense.amountPaid || "0");
      if (amountPaidValue >= expenseAmount && expenseAmount > 0) {
        setPaymentStatus("paid");
        setDepositAmount("");
      } else if (amountPaidValue > 0) {
        setPaymentStatus("deposit_paid");
        setDepositAmount(amountPaidValue.toString());
      } else {
        setPaymentStatus("estimated");
        setDepositAmount("");
      }
      
      // Set payer from expense
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
      
      // Preserve original bucket category ID for edit mode
      setEditOriginalBucketId(expense.bucketCategoryId || null);
      
      // Set line item from bucket category display name
      if (expense.bucketCategoryId) {
        const category = budgetCategories.find(c => c.id === expense.bucketCategoryId);
        if (category) {
          setSelectedLineItem(category.displayName);
        }
      }
    } else if (open && defaultEventId) {
      setSelectedCeremonyId(defaultEventId);
    }
  }, [open, expense, defaultEventId, budgetCategories]);

  const selectedEvent = useMemo(() => {
    if (!selectedCeremonyId) return null;
    return events.find(e => e.id === selectedCeremonyId) || null;
  }, [selectedCeremonyId, events]);

  // Get the ceremony template ID from the selected event - use the actual UUID from ceremonyTypeId
  const ceremonyTemplateId = useMemo(() => {
    if (!selectedEvent) return null;
    // Prefer the actual ceremony_type_id UUID if available
    if (selectedEvent.ceremonyTypeId) {
      return selectedEvent.ceremonyTypeId;
    }
    // Fallback to slug-based lookup for older events without ceremonyTypeId
    return getCeremonyIdFromEvent(selectedEvent.name, selectedEvent.type);
  }, [selectedEvent]);

  // Fetch line items from API
  const { data: lineItemsData, isLoading: isLoadingLineItems } = useQuery<{
    ceremonyId: string;
    ceremonyName: string;
    tradition: string;
    lineItems: LineItem[];
  }>({
    queryKey: ['/api/ceremony-types', ceremonyTemplateId, 'line-items'],
    enabled: !!ceremonyTemplateId && open,
  });

  const ceremonyLineItems = lineItemsData?.lineItems || [];

  // Get the budget bucket UUID from the selected line item (from API data)
  const derivedBucketId = useMemo((): string | null => {
    if (!selectedLineItem) return null;
    
    // Find the line item in the fetched data to get its budget bucket UUID
    const lineItem = ceremonyLineItems.find(item => item.name === selectedLineItem);
    if (lineItem) {
      return lineItem.budgetBucketId;
    }
    
    // In edit mode, check if the selectedLineItem matches a budget category display name
    const matchingCategory = budgetCategories.find(c => c.displayName === selectedLineItem);
    if (matchingCategory) {
      return matchingCategory.id;
    }
    
    // In edit mode, fall back to original bucket ID if line item hasn't changed
    if (isEditMode && editOriginalBucketId) {
      return editOriginalBucketId;
    }
    
    // Return null for custom/unknown line items - will use 'other' bucket UUID on server
    return null;
  }, [selectedLineItem, ceremonyLineItems, budgetCategories, isEditMode, editOriginalBucketId]);

  // Get the display label for the derived bucket
  const derivedBucketLabel = useMemo(() => {
    if (!derivedBucketId) return null;
    const category = budgetCategories.find(c => c.id === derivedBucketId);
    return category?.displayName || 'Other';
  }, [derivedBucketId, budgetCategories]);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedCeremonyId(null);
    setSelectedLineItem(null);
    setPayer("me_partner");
    setAmount("");
    setDepositAmount("");
    setPaymentStatus("paid");
    setPaymentDueDate("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseName("");
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingReceiptUrl(null);
    setEditOriginalBucketId(null);
  };

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", weddingId, "totals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", weddingId] });
      queryClient.invalidateQueries({ queryKey: [`/api/budget/ceremony-analytics/${weddingId}`] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Expense added!", description: "Your expense has been recorded and budgets updated." });
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
      toast({ title: "Please enter an expense description", variant: "destructive" });
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

    const splits = [{
      userId: payerId,
      userName: payerName,
      shareAmount: parsedAmount.toFixed(2),
      isPaid: paymentStatus === "paid", // Only mark as paid if fully paid
    }];

    // Calculate amount paid based on payment status
    let amountPaidValue = "0";
    if (paymentStatus === "paid") {
      amountPaidValue = parsedAmount.toFixed(2);
    } else if (paymentStatus === "deposit_paid") {
      const parsedDeposit = parseFloat(depositAmount.replace(/,/g, "") || "0");
      if (isNaN(parsedDeposit) || parsedDeposit <= 0) {
        toast({ title: "Please enter a deposit amount", variant: "destructive" });
        return;
      }
      if (parsedDeposit >= parsedAmount) {
        toast({ title: "Deposit must be less than total cost", variant: "destructive" });
        return;
      }
      amountPaidValue = parsedDeposit.toFixed(2);
    }

    const expenseData = {
      weddingId,
      bucketCategoryId: derivedBucketId || undefined, // UUID for budget bucket - server will resolve to 'other' if null
      lineItem: selectedLineItem,
      expenseName: expenseName.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: amountPaidValue,
      ceremonyId: selectedCeremonyId,
      paidById: payerId,
      paidByName: payerName,
      status: paymentStatus === "paid" ? "paid" : paymentStatus === "deposit_paid" ? "booked" : "estimated",
      notes: notes.trim() || null,
      expenseDate,
      paymentDueDate: paymentDueDate || null,
      splits,
    };

    if (isEditMode && onUpdate) {
      onUpdate(expenseData);
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedCeremonyId !== null;
      case 2: return selectedLineItem !== null;
      case 3: return payer !== null;
      case 4: return amount && parseFloat(amount.replace(/,/g, "")) > 0 && expenseDate;
      case 5: return expenseName.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      // When moving to step 5 (details), pre-fill the expense name with a smart default
      if (currentStep === 4 && !expenseName.trim()) {
        const defaultName = selectedLineItem 
          ? `${selectedLineItem} for ${selectedEvent?.name || 'ceremony'}`
          : "Expense";
        setExpenseName(defaultName);
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5 && canProceed()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 2) {
        setSelectedLineItem(null);
      }
      setCurrentStep(currentStep - 1);
    }
  };

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

  const progressPercent = (currentStep / 5) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Which ceremony is this expense for?</h3>
              <p className="text-sm text-muted-foreground mt-1">Select the ceremony to see its specific categories</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {events.map((event) => {
                // Prefer actual ceremonyTypeId UUID over slug-based lookup
                const eventCeremonyId = event.ceremonyTypeId || getCeremonyIdFromEvent(event.name, event.type);
                const hasCategories = !!eventCeremonyId;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedCeremonyId(event.id);
                      setSelectedLineItem(null);
                    }}
                    className={`p-4 rounded-lg text-left transition-all border-2 ${
                      selectedCeremonyId === event.id
                        ? "border-primary bg-primary/10"
                        : "border-muted hover-elevate"
                    }`}
                    data-testid={`button-ceremony-${event.id}`}
                  >
                    <div className="font-medium">{event.name}</div>
                    {event.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    )}
                    {hasCategories && (
                      <div className="text-xs text-primary mt-1">
                        Specific expense categories available
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No ceremonies found. Add ceremonies to your wedding first.</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">What is this expense for?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Categories for {selectedEvent?.name || "this ceremony"}
              </p>
            </div>
            {isLoadingLineItems ? (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : ceremonyLineItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {ceremonyLineItems.map((item, index) => {
                  // Look up the display name for this bucket UUID
                  const bucketCategory = budgetCategories.find(c => c.id === item.budgetBucketId);
                  const bucketLabel = bucketCategory?.displayName || 'Other';
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedLineItem(item.name)}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        selectedLineItem === item.name
                          ? "border-primary bg-primary/10"
                          : "border-muted hover-elevate"
                      }`}
                      data-testid={`button-lineitem-${index}`}
                    >
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {bucketLabel}
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSelectedLineItem("Other")}
                  className={`p-3 rounded-lg text-left transition-all border-2 ${
                    selectedLineItem === "Other"
                      ? "border-primary bg-primary/10"
                      : "border-muted hover-elevate"
                  }`}
                  data-testid="button-lineitem-other"
                >
                  <div className="text-sm font-medium">Other</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Miscellaneous expense
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  No specific categories for this ceremony. Choose a general category:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {budgetCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedLineItem(category.displayName)}
                      className={`p-3 rounded-lg text-center transition-all border-2 ${
                        selectedLineItem === category.displayName
                          ? "border-primary bg-primary/10"
                          : "border-muted hover-elevate"
                      }`}
                      data-testid={`button-bucket-${category.id}`}
                    >
                      <div className="text-sm font-medium">{category.displayName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Who is paying for this?</h3>
              <p className="text-sm text-muted-foreground mt-1">Track who covered this expense</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {PAYER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPayer(option.id)}
                  className={`p-4 rounded-lg text-left transition-all border-2 flex items-center gap-3 ${
                    payer === option.id
                      ? "border-primary bg-primary/10"
                      : "border-muted hover-elevate"
                  }`}
                  data-testid={`button-payer-${option.id}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    payer === option.id ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}>
                    {payer === option.id && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">How much is it?</h3>
              <p className="text-sm text-muted-foreground mt-1">Enter the total cost and payment details</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Total Cost</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">$</span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "");
                      setAmount(val);
                    }}
                    placeholder="0.00"
                    className="pl-10 text-2xl font-semibold h-14 text-center"
                    autoFocus
                    data-testid="input-expense-amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "estimated", label: "Estimated", desc: "Not yet booked" },
                    { id: "deposit_paid", label: "Deposit Paid", desc: "Partially paid" },
                    { id: "paid", label: "Paid in Full", desc: "Fully paid" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentStatus(option.id as typeof paymentStatus)}
                      className={`p-3 rounded-lg text-center transition-all border-2 ${
                        paymentStatus === option.id
                          ? "border-primary bg-primary/10"
                          : "border-muted hover-elevate"
                      }`}
                      data-testid={`button-status-${option.id}`}
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {paymentStatus === "deposit_paid" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deposit Amount Paid</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="text"
                      value={depositAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, "");
                        setDepositAmount(val);
                      }}
                      placeholder="0.00"
                      className="pl-8 h-12"
                      data-testid="input-deposit-amount"
                    />
                  </div>
                  {amount && depositAmount && (
                    <p className="text-xs text-muted-foreground">
                      Balance remaining: ${(parseFloat(amount.replace(/,/g, "")) - parseFloat(depositAmount.replace(/,/g, "") || "0")).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {(paymentStatus === "estimated" || paymentStatus === "deposit_paid") && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Due Date (optional)</Label>
                  <Input
                    type="date"
                    value={paymentDueDate}
                    onChange={(e) => setPaymentDueDate(e.target.value)}
                    className="h-12"
                    data-testid="input-payment-due-date"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">{paymentStatus === "paid" ? "Date of Payment" : "Date Added"}</Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="h-12"
                  data-testid="input-expense-date"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Add some details</h3>
              <p className="text-sm text-muted-foreground mt-1">Describe the expense and add any notes</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">What is this expense for? <span className="text-destructive">*</span></Label>
                <Input
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder={selectedLineItem ? `e.g., ${selectedLineItem} for ${selectedEvent?.name || 'ceremony'}` : "e.g., Vendor deposit"}
                  className="text-base"
                  autoFocus
                  data-testid="input-expense-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional details, vendor info, or reminders..."
                  className="min-h-[80px]"
                  data-testid="input-expense-notes"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Receipt Photo (optional)</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Receipt preview" className="max-h-32 mx-auto rounded" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        data-testid="button-remove-photo"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload a receipt</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        data-testid="input-expense-photo"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{isEditMode ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
          </div>
          <Progress value={progressPercent} className="h-1 mt-3" />
        </DialogHeader>

        <div className="flex gap-2 px-6 pt-4 pb-2 border-b overflow-x-auto">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                <span>{step.title}</span>
              </div>
            );
          })}
        </div>
        
        <div className="px-6 py-5 min-h-[320px] max-h-[400px] overflow-y-auto">
          {renderStepContent()}
        </div>

        {currentStep > 1 && (
          <div className="px-6 py-2 bg-muted/20 text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {currentStep > 1 && selectedEvent && <span>Ceremony: <strong>{selectedEvent.name}</strong></span>}
              {currentStep > 2 && selectedLineItem && (
                <span>Category: <strong>{selectedLineItem}</strong> → {derivedBucketLabel || 'Other'}</span>
              )}
              {currentStep > 3 && <span>Payer: <strong>{PAYER_OPTIONS.find(p => p.id === payer)?.label}</strong></span>}
              {currentStep > 4 && amount && <span>Amount: <strong>${parseFloat(amount.replace(/,/g, "")).toLocaleString()}</strong></span>}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || createExpenseMutation.isPending || isPendingUpdate}
            className="flex-1"
            data-testid="button-next"
          >
            {(createExpenseMutation.isPending || isPendingUpdate) ? (
              "Saving..."
            ) : currentStep === 5 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isEditMode ? "Save Changes" : "Save Expense"}
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
