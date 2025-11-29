import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertContractSchema, type Contract, type Vendor, type Booking, type ContractSignature, type ContractTemplate } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash2, FileSignature, CreditCard, CheckCircle, FileCheck, ChevronRight, ChevronLeft, Eye, Sparkles, ScrollText, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SignaturePad, type SignaturePadRef } from "@/components/contracts/signature-pad";
import { useLocation as useWouterLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";

type ContractFormData = z.infer<typeof insertContractSchema>;

const statusColors = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  signed: "bg-green-500",
  active: "bg-emerald-500",
  completed: "bg-teal-500",
  cancelled: "bg-red-500",
};

const signatureFormSchema = z.object({
  signerName: z.string().min(1, "Name is required"),
  signerEmail: z.string().email("Valid email is required"),
});

type SignatureFormData = z.infer<typeof signatureFormSchema>;

type ContractWizardStep = "select-vendor" | "choose-template" | "customize" | "review";

export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useWouterLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  
  // Contract creation wizard state
  const [wizardStep, setWizardStep] = useState<ContractWizardStep>("select-vendor");
  const [selectedVendorCategory, setSelectedVendorCategory] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
  const [skippedTemplates, setSkippedTemplates] = useState(false);
  const [showChangeTemplateConfirm, setShowChangeTemplateConfirm] = useState(false);
  const [hasCustomizedContract, setHasCustomizedContract] = useState(false);

  // Fetch wedding data
  const { data: weddings } = useQuery({
    queryKey: ["/api/weddings"],
  });
  // Use the most recently created wedding (last in array)
  const wedding = Array.isArray(weddings) && weddings.length > 0 ? weddings[weddings.length - 1] : undefined;

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch vendors and bookings for dropdown
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch contract templates
  const { data: allTemplates = [] } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/contract-templates"],
  });

  // Filter templates by selected vendor category
  const filteredTemplates = useMemo(() => {
    if (!selectedVendorCategory) return allTemplates;
    return allTemplates.filter(t => t.vendorCategory === selectedVendorCategory);
  }, [allTemplates, selectedVendorCategory]);

  // Get unique vendor categories from vendors
  const vendorCategories = useMemo(() => {
    const categories = new Set(vendors.map(v => v.category).filter(Boolean));
    return Array.from(categories);
  }, [vendors]);

  // Form setup
  const form = useForm<ContractFormData>({
    resolver: zodResolver(insertContractSchema),
    defaultValues: {
      weddingId: wedding?.id || "",
      bookingId: "",
      vendorId: "",
      contractTerms: "",
      totalAmount: "",
      paymentMilestones: [],
      status: "draft",
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      return await apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", wedding?.id] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Contract created",
        description: "Contract has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContractFormData> }) => {
      return await apiRequest("PATCH", `/api/contracts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", wedding?.id] });
      setDialogOpen(false);
      setEditingContract(null);
      form.reset();
      toast({
        title: "Contract updated",
        description: "Contract has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", wedding?.id] });
      setDialogOpen(false);
      setEditingContract(null);
      form.reset();
      toast({
        title: "Contract deleted",
        description: "Contract has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive",
      });
    },
  });

  const getDefaultSignerName = () => {
    const p1 = wedding?.partner1Name?.trim();
    const p2 = wedding?.partner2Name?.trim();
    if (p1 && p2) return `${p1} & ${p2}`;
    if (p1) return p1;
    if (p2) return p2;
    return '';
  };

  const signatureForm = useForm<SignatureFormData>({
    resolver: zodResolver(signatureFormSchema),
    defaultValues: {
      signerName: getDefaultSignerName(),
      signerEmail: wedding?.coupleEmail || user?.email || '',
    },
  });

  const signContractMutation = useMutation({
    mutationFn: async (data: SignatureFormData & { contractId: string; signatureData: string }) => {
      return await apiRequest("POST", `/api/contracts/${data.contractId}/sign`, {
        signatureData: data.signatureData,
        signerName: data.signerName,
        signerEmail: data.signerEmail,
        signerRole: "couple",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", wedding?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setShowSignatureDialog(false);
      setSigningContract(null);
      signatureForm.reset();
      toast({
        title: "Contract signed",
        description: "Your e-signature has been recorded",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign contract",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractFormData) => {
    // For new contracts, validate contract terms aren't empty
    if (!editingContract && !validateBeforeSubmit()) {
      return;
    }
    
    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data });
    } else {
      createMutation.mutate({ ...data, weddingId: wedding?.id || "" });
    }
  };

  const handleSignContract = async (data: SignatureFormData) => {
    if (!signingContract) return;
    
    if (signaturePadRef.current?.isEmpty()) {
      toast({
        title: "Signature required",
        description: "Please draw your signature in the signature pad",
        variant: "destructive",
      });
      return;
    }
    
    const signatureData = signaturePadRef.current?.getSignatureData();
    if (!signatureData) {
      toast({
        title: "Signature required",
        description: "Unable to capture signature. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    signContractMutation.mutate({
      ...data,
      contractId: signingContract.id,
      signatureData,
    });
  };

  const openSignatureDialog = (contract: Contract) => {
    setSigningContract(contract);
    setShowSignatureDialog(true);
    signatureForm.reset({
      signerName: getDefaultSignerName(),
      signerEmail: wedding?.coupleEmail || user?.email || '',
    });
  };

  const openAddDialog = () => {
    setEditingContract(null);
    setWizardStep("select-vendor");
    setSelectedVendorCategory("");
    setSelectedTemplate(null);
    setSkippedTemplates(false);
    setHasCustomizedContract(false);
    form.reset({
      weddingId: wedding?.id || "",
      bookingId: "",
      vendorId: "",
      contractTerms: "",
      totalAmount: "",
      paymentMilestones: [],
      status: "draft",
    });
    setDialogOpen(true);
  };

  // Apply template to form
  const applyTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setSkippedTemplates(false);
    form.setValue("contractTerms", template.templateContent);
    
    // Apply suggested milestones if available
    if (template.suggestedMilestones && Array.isArray(template.suggestedMilestones)) {
      const milestones = (template.suggestedMilestones as any[]).map((m: any, idx: number) => ({
        name: m.name || `Milestone ${idx + 1}`,
        percentage: m.percentage || 25,
        description: m.description || "",
        dueDate: new Date().toISOString().split('T')[0],
        amount: "0",
        status: "pending",
      }));
      form.setValue("paymentMilestones", milestones);
    }
    setWizardStep("customize");
  };

  // Handle skipping template selection
  const handleSkipTemplates = () => {
    setSkippedTemplates(true);
    setSelectedTemplate(null);
    form.setValue("contractTerms", "");
    form.setValue("paymentMilestones", []);
    setWizardStep("customize");
  };

  // Handle going back to template selection with confirmation if customized
  const handleBackToTemplates = () => {
    if (hasCustomizedContract) {
      setShowChangeTemplateConfirm(true);
    } else {
      setWizardStep("choose-template");
    }
  };

  // Confirm template change
  const confirmTemplateChange = () => {
    setShowChangeTemplateConfirm(false);
    setHasCustomizedContract(false);
    setWizardStep("choose-template");
  };

  // Validate before submission
  const validateBeforeSubmit = (): boolean => {
    const contractTerms = form.getValues("contractTerms");
    if (!contractTerms || contractTerms.trim().length === 0) {
      toast({
        title: "Contract terms required",
        description: "Please add contract terms before creating the contract.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Wizard step helpers
  const getWizardProgress = () => {
    const steps = ["select-vendor", "choose-template", "customize", "review"];
    return ((steps.indexOf(wizardStep) + 1) / steps.length) * 100;
  };

  const canProceedFromVendor = () => {
    const vendorId = form.watch("vendorId");
    return !!vendorId;
  };

  const handleVendorSelect = (vendorId: string) => {
    form.setValue("vendorId", vendorId);
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor?.category) {
      setSelectedVendorCategory(vendor.category);
    }
  };

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract);
    form.reset({
      weddingId: contract.weddingId,
      bookingId: contract.bookingId,
      vendorId: contract.vendorId,
      contractTerms: contract.contractTerms || "",
      totalAmount: contract.totalAmount,
      paymentMilestones: contract.paymentMilestones as any,
      status: contract.status as any,
    });
    setDialogOpen(true);
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.name || "Unknown Vendor";
  };

  if (isLoading) {
    return <div className="p-6">Loading contracts...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }} data-testid="heading-contracts">
            Contract Management ✨
          </h1>
          <p className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Manage vendor contracts and payment milestones 🎊
          </p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-contract" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 font-semibold">Total Contracts</CardDescription>
            <CardTitle className="text-2xl text-purple-700" data-testid="text-total-contracts">{contracts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-semibold">Active</CardDescription>
            <CardTitle className="text-2xl text-green-700" data-testid="text-active-contracts">
              {contracts.filter((c) => c.status === "active").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-semibold">Signed</CardDescription>
            <CardTitle className="text-2xl text-blue-700" data-testid="text-signed-contracts">
              {contracts.filter((c) => c.status === "signed").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600 font-semibold">Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-700" data-testid="text-pending-contracts">
              {contracts.filter((c) => c.status === "draft" || c.status === "sent").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Contract List */}
      <div className="space-y-4">
        {contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Contracts Yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Start by adding vendor contracts</p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Contract
              </Button>
            </CardContent>
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="hover-elevate" data-testid={`card-contract-${contract.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getVendorName(contract.vendorId)}
                      <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                        {contract.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Contract ID: {contract.id.substring(0, 8)}...
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {(contract.status === 'draft' || contract.status === 'sent') && (
                      <Button
                        onClick={() => openSignatureDialog(contract)}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                        data-testid={`button-sign-contract-${contract.id}`}
                      >
                        <FileSignature className="w-4 h-4 mr-2" />
                        Sign
                      </Button>
                    )}
                    {contract.status === 'signed' && contract.bookingId && (() => {
                      const booking = bookings.find(b => b.id === contract.bookingId);
                      if (booking && !booking.depositPaid) {
                        return (
                          <Button
                            onClick={() => navigate(`/pay-deposit/${contract.bookingId}`)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            data-testid={`button-pay-deposit-${contract.id}`}
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay Deposit
                          </Button>
                        );
                      }
                      if (booking?.depositPaid) {
                        return (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Deposit Paid
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(contract)}
                      data-testid={`button-edit-contract-${contract.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">${parseFloat(contract.totalAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Signed Date</p>
                    <p className="text-lg font-semibold">
                      {contract.signedDate ? new Date(contract.signedDate).toLocaleDateString() : "Not signed"}
                    </p>
                  </div>
                </div>
                {contract.contractTerms && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Contract Terms</p>
                    <p className="text-sm">{contract.contractTerms}</p>
                  </div>
                )}
                {contract.paymentMilestones && Array.isArray(contract.paymentMilestones) && contract.paymentMilestones.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Payment Milestones</p>
                    <div className="space-y-2">
                      {(contract.paymentMilestones as any[]).map((milestone: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="text-sm font-medium">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">${parseFloat(milestone.amount).toLocaleString()}</p>
                            <Badge variant={milestone.status === "paid" ? "default" : "secondary"} className="text-xs">
                              {milestone.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog with Wizard */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-contract">
              {editingContract ? "Edit Contract" : "Create New Contract"}
            </DialogTitle>
            <DialogDescription>
              {editingContract 
                ? "Update contract details" 
                : wizardStep === "select-vendor" 
                  ? "Step 1: Choose the vendor for this contract"
                  : wizardStep === "choose-template"
                    ? "Step 2: Pick a professional template to start with"
                    : wizardStep === "customize"
                      ? "Step 3: Customize the contract terms"
                      : "Step 4: Review and save your contract"
              }
            </DialogDescription>
            {!editingContract && (
              <div className="mt-4">
                <Progress value={getWizardProgress()} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span className={wizardStep === "select-vendor" ? "font-semibold text-primary" : ""}>1. Vendor</span>
                  <span className={wizardStep === "choose-template" ? "font-semibold text-primary" : ""}>2. Template</span>
                  <span className={wizardStep === "customize" ? "font-semibold text-primary" : ""}>3. Customize</span>
                  <span className={wizardStep === "review" ? "font-semibold text-primary" : ""}>4. Review</span>
                </div>
              </div>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto py-4">
                {/* Step 1: Select Vendor (for new contracts only) */}
                {!editingContract && wizardStep === "select-vendor" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="bookingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link to Booking (optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-booking">
                                <SelectValue placeholder="Select a booking to link" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bookings.map((booking) => (
                                <SelectItem key={booking.id} value={booking.id}>
                                  {getVendorName(booking.vendorId)} - ${booking.estimatedCost}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Vendor</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleVendorSelect(value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor">
                                <SelectValue placeholder="Choose a vendor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  {vendor.name} - {vendor.category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedVendorCategory && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <p className="text-sm text-indigo-700">
                          <Sparkles className="w-4 h-4 inline mr-2" />
                          Great choice! We have professional templates for <strong>{selectedVendorCategory}</strong> vendors ready for you.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Choose Template */}
                {!editingContract && wizardStep === "choose-template" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Professional Templates</h3>
                      {selectedVendorCategory && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {selectedVendorCategory}
                        </Badge>
                      )}
                    </div>

                    {filteredTemplates.length === 0 ? (
                      <div className="text-center py-8">
                        <ScrollText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No templates found for this vendor category.</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => {
                            form.setValue("contractTerms", "");
                            setWizardStep("customize");
                          }}
                        >
                          Create from Scratch
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates.map((template) => (
                          <Card 
                            key={template.id} 
                            className={`cursor-pointer hover-elevate transition-all ${
                              selectedTemplate?.id === template.id 
                                ? "ring-2 ring-primary border-primary" 
                                : ""
                            }`}
                            onClick={() => applyTemplate(template)}
                            data-testid={`card-template-${template.id}`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <CardTitle className="text-base">{template.name}</CardTitle>
                                  <CardDescription className="text-xs mt-1">
                                    {template.description}
                                  </CardDescription>
                                </div>
                                {template.isDefault && (
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              {template.keyTerms && Array.isArray(template.keyTerms) && (
                                <div className="flex flex-wrap gap-1">
                                  {(template.keyTerms as string[]).slice(0, 3).map((term, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {term}
                                    </Badge>
                                  ))}
                                  {(template.keyTerms as string[]).length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(template.keyTerms as string[]).length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="pt-2">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="ml-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTemplate(template);
                                  setShowTemplatePreview(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={handleSkipTemplates}
                        data-testid="button-skip-templates"
                      >
                        Skip templates and write from scratch
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Customize Contract */}
                {(editingContract || wizardStep === "customize") && (
                  <div className="space-y-4">
                    {selectedTemplate && !editingContract && (
                      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-700">
                          Using template: <strong>{selectedTemplate.name}</strong>
                        </p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={handleBackToTemplates}
                          data-testid="button-change-template"
                        >
                          Change
                        </Button>
                      </div>
                    )}
                    {skippedTemplates && !editingContract && (
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-700">
                          Writing contract from scratch
                        </p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={handleBackToTemplates}
                          data-testid="button-use-template"
                        >
                          Use a Template Instead
                        </Button>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Contract Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="10000.00"
                              {...field}
                              data-testid="input-total-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter or customize the contract terms..."
                              className="min-h-[300px] font-mono text-sm"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!hasCustomizedContract && e.target.value !== selectedTemplate?.templateContent) {
                                  setHasCustomizedContract(true);
                                }
                              }}
                              data-testid="textarea-contract-terms"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Tip: Replace placeholders like [VENDOR_NAME] and [WEDDING_DATE] with actual values.
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="signed">Signed</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Edit form for existing contracts - show vendor selection */}
                {editingContract && (
                  <div className="space-y-4 mb-4">
                    <FormField
                      control={form.control}
                      name="bookingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-booking">
                                <SelectValue placeholder="Select booking" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bookings.map((booking) => (
                                <SelectItem key={booking.id} value={booking.id}>
                                  {getVendorName(booking.vendorId)} - ${booking.estimatedCost}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor">
                                <SelectValue placeholder="Select vendor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  {vendor.name} - {vendor.category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="border-t pt-4">
                {/* Navigation for wizard steps */}
                {!editingContract && wizardStep === "select-vendor" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel-contract"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setWizardStep("choose-template")}
                      disabled={!canProceedFromVendor()}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                      Next: Choose Template
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}

                {!editingContract && wizardStep === "choose-template" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWizardStep("select-vendor")}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel-contract"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {!editingContract && wizardStep === "customize" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWizardStep("choose-template")}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel-contract"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                      data-testid="button-save-contract"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Contract"}
                    </Button>
                  </>
                )}

                {/* Edit mode footer */}
                {editingContract && (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(editingContract.id)}
                      disabled={deleteMutation.isPending}
                      data-testid="button-delete-contract"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel-contract"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      data-testid="button-save-contract"
                    >
                      {updateMutation.isPending ? "Updating..." : "Update Contract"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] border rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {previewTemplate?.templateContent}
            </pre>
          </ScrollArea>
          {previewTemplate?.keyTerms && Array.isArray(previewTemplate.keyTerms) && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Key Terms Included:</h4>
              <div className="flex flex-wrap gap-2">
                {(previewTemplate.keyTerms as string[]).map((term, idx) => (
                  <Badge key={idx} variant="outline">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                if (previewTemplate) {
                  applyTemplate(previewTemplate);
                  setShowTemplatePreview(false);
                }
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* E-Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign Contract</DialogTitle>
            <DialogDescription>
              Please review and sign this contract digitally. Your signature will be legally binding.
            </DialogDescription>
          </DialogHeader>

          <Form {...signatureForm}>
            <form onSubmit={signatureForm.handleSubmit(handleSignContract)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={signatureForm.control}
                  name="signerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your full name" data-testid="input-signer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signatureForm.control}
                  name="signerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="your@email.com" data-testid="input-signer-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Digital Signature</label>
                <SignaturePad ref={signaturePadRef} />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSignatureDialog(false)}
                  data-testid="button-cancel-signature"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={signContractMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                  data-testid="button-submit-signature"
                >
                  {signContractMutation.isPending ? "Signing..." : "Sign & Submit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Template Confirmation Dialog */}
      <Dialog open={showChangeTemplateConfirm} onOpenChange={setShowChangeTemplateConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Template?</DialogTitle>
            <DialogDescription>
              You've made changes to the contract. Switching to a different template will replace your current work. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowChangeTemplateConfirm(false)}
            >
              Keep My Changes
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmTemplateChange}
            >
              Replace with New Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
