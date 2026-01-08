import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Calendar, DollarSign, User, FileText, Upload, Tag } from "lucide-react";
import { BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket, type Event } from "@shared/schema";
import { 
  CEREMONY_COST_BREAKDOWNS, 
  CEREMONY_MAPPINGS, 
  getLineItemBucket, 
  getCeremonyIdFromEvent,
  type CostCategory 
} from "@shared/ceremonies";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  events: Event[];
  defaultEventId?: string;
  weddingTradition?: string;
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
  weddingTradition = "sikh"
}: AddExpenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [selectedLineItem, setSelectedLineItem] = useState<string | null>(null);
  const [payer, setPayer] = useState<PayerType>("me_partner");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseName, setExpenseName] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaultEventId) {
      setSelectedCeremonyId(defaultEventId);
    }
  }, [open, defaultEventId]);

  const selectedEvent = useMemo(() => {
    if (!selectedCeremonyId) return null;
    return events.find(e => e.id === selectedCeremonyId) || null;
  }, [selectedCeremonyId, events]);

  const ceremonyLineItems = useMemo((): CostCategory[] => {
    if (!selectedEvent) return [];
    
    const ceremonyId = getCeremonyIdFromEvent(selectedEvent.name, selectedEvent.type);
    if (ceremonyId && CEREMONY_COST_BREAKDOWNS[ceremonyId]) {
      return CEREMONY_COST_BREAKDOWNS[ceremonyId];
    }
    
    return [];
  }, [selectedEvent]);

  const derivedBucket = useMemo((): BudgetBucket | null => {
    if (!selectedLineItem) return null;
    return getLineItemBucket(selectedLineItem);
  }, [selectedLineItem]);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedCeremonyId(null);
    setSelectedLineItem(null);
    setPayer("me_partner");
    setAmount("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseName("");
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
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

    const bucket = derivedBucket || "other";

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
      isPaid: true,
    }];

    createExpenseMutation.mutate({
      weddingId,
      parentCategory: bucket,
      lineItem: selectedLineItem,
      expenseName: expenseName.trim(),
      amount: parsedAmount.toFixed(2),
      amountPaid: parsedAmount.toFixed(2),
      ceremonyId: selectedCeremonyId,
      paidById: payerId,
      paidByName: payerName,
      status: "paid",
      notes: notes.trim() || null,
      expenseDate,
      splits,
    });
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
                const ceremonyId = getCeremonyIdFromEvent(event.name, event.type);
                const hasCategories = ceremonyId && CEREMONY_COST_BREAKDOWNS[ceremonyId];
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
                        {CEREMONY_COST_BREAKDOWNS[ceremonyId!].length} expense categories
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
            {ceremonyLineItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {ceremonyLineItems.map((item, index) => {
                  const bucket = getLineItemBucket(item.category);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedLineItem(item.category)}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        selectedLineItem === item.category
                          ? "border-primary bg-primary/10"
                          : "border-muted hover-elevate"
                      }`}
                      data-testid={`button-lineitem-${index}`}
                    >
                      <div className="text-sm font-medium">{item.category}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {BUDGET_BUCKET_LABELS[bucket]}
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
                  {BUDGET_BUCKETS.map((bucket) => (
                    <button
                      key={bucket}
                      type="button"
                      onClick={() => setSelectedLineItem(BUDGET_BUCKET_LABELS[bucket])}
                      className={`p-3 rounded-lg text-center transition-all border-2 ${
                        selectedLineItem === BUDGET_BUCKET_LABELS[bucket]
                          ? "border-primary bg-primary/10"
                          : "border-muted hover-elevate"
                      }`}
                      data-testid={`button-bucket-${bucket}`}
                    >
                      <div className="text-sm font-medium">{BUDGET_BUCKET_LABELS[bucket]}</div>
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
              <h3 className="text-lg font-semibold">How much was it?</h3>
              <p className="text-sm text-muted-foreground mt-1">Enter the amount and date of payment</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount</Label>
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
                <Label className="text-sm font-medium">Date of Payment</Label>
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
            <DialogTitle className="text-lg font-semibold">Add Expense</DialogTitle>
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
                <span>Category: <strong>{selectedLineItem}</strong> → {derivedBucket && BUDGET_BUCKET_LABELS[derivedBucket]}</span>
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
            disabled={!canProceed() || createExpenseMutation.isPending}
            className="flex-1"
            data-testid="button-next"
          >
            {createExpenseMutation.isPending ? (
              "Saving..."
            ) : currentStep === 5 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Expense
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
