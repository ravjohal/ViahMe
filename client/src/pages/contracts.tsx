import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertContractSchema, type Contract, type Vendor, type Event, type ContractSignature, type ContractTemplate } from "@shared/schema";
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
import { FileText, Plus, Edit, Trash2, FileSignature, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Eye, Sparkles, ScrollText, CheckCircle2, Calendar, MapPin, Users, Building2, ArrowLeft, ArrowRight, FileEdit, DollarSign, Clock, Wand2, MessageSquare, Lightbulb, AlertCircle, Loader2, Bot, Copy, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SignaturePad, type SignaturePadRef } from "@/components/contracts/signature-pad";
import { useLocation as useWouterLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

type ContractFormData = z.infer<typeof insertContractSchema>;

const statusColors: Record<string, string> = {
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

type WizardStep = "list" | "select-event" | "select-vendor" | "choose-template" | "customize" | "review";

const EVENT_ICONS: Record<string, string> = {
  paath: "🙏",
  mehndi: "🎨",
  maiyan: "✨",
  sangeet: "🎵",
  anand_karaj: "🛕",
  reception: "🎉",
  custom: "📅",
};

export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useWouterLocation();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("list");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [skippedTemplates, setSkippedTemplates] = useState(false);
  
  // Edit/View state
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Signature state
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  
  // AI Assistant state
  const [showAiDraftDialog, setShowAiDraftDialog] = useState(false);
  const [showAiReviewDialog, setShowAiReviewDialog] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<string>("");
  const [aiReviewResult, setAiReviewResult] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [servicesDescription, setServicesDescription] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");

  // Fetch wedding data
  const { data: weddings } = useQuery({
    queryKey: ["/api/weddings"],
  });
  const wedding = Array.isArray(weddings) && weddings.length > 0 ? weddings[weddings.length - 1] : undefined;

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch events for the wedding
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch contract templates
  const { data: allTemplates = [] } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/contract-templates"],
  });

  // Get selected event and vendor objects
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  // Filter templates by selected vendor category
  const filteredTemplates = useMemo(() => {
    if (!selectedVendor?.category) return allTemplates;
    return allTemplates.filter(t => t.vendorCategory === selectedVendor.category);
  }, [allTemplates, selectedVendor?.category]);

  // Form setup
  const form = useForm<ContractFormData>({
    resolver: zodResolver(insertContractSchema),
    defaultValues: {
      weddingId: wedding?.id || "",
      eventId: "",
      vendorId: "",
      bookingId: null,
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
      resetWizard();
      toast({
        title: "Contract created!",
        description: "Your contract has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
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
      setShowEditDialog(false);
      setEditingContract(null);
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
      setShowEditDialog(false);
      setEditingContract(null);
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

  // AI Draft Contract Mutation
  const aiDraftMutation = useMutation({
    mutationFn: async (data: {
      vendorName: string;
      vendorCategory: string;
      eventName: string;
      eventDate?: string;
      eventLocation?: string;
      totalAmount: number;
      servicesDescription: string;
      specialRequirements?: string;
      tradition?: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/contract/draft", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiDraftResult(data.contract || "");
      toast({
        title: "Contract drafted",
        description: "AI has generated a contract draft for you to review",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to draft contract",
        variant: "destructive",
      });
    },
  });

  // AI Review Contract Mutation
  const aiReviewMutation = useMutation({
    mutationFn: async (data: {
      contractText: string;
      vendorCategory?: string;
      tradition?: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/contract/review", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiReviewResult(data.review || "");
      setShowAiReviewDialog(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review contract",
        variant: "destructive",
      });
    },
  });

  // AI Suggestions Mutation
  const aiSuggestionsMutation = useMutation({
    mutationFn: async (data: {
      currentTerms: string;
      vendorCategory: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/contract/suggestions", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions || []);
    },
    onError: () => {
      setAiSuggestions([]);
    },
  });

  // Handle AI draft request
  const handleAiDraft = () => {
    if (!selectedVendor || !selectedEvent) {
      toast({
        title: "Missing information",
        description: "Please select an event and vendor first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(form.getValues("totalAmount") || "0");
    if (amount <= 0) {
      toast({
        title: "Amount required",
        description: "Please enter a contract amount first",
        variant: "destructive",
      });
      return;
    }

    if (!servicesDescription.trim()) {
      toast({
        title: "Services required",
        description: "Please describe the services to include in the contract",
        variant: "destructive",
      });
      return;
    }

    aiDraftMutation.mutate({
      vendorName: selectedVendor.name,
      vendorCategory: selectedVendor.category || "General",
      eventName: selectedEvent.name,
      eventDate: selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : undefined,
      eventLocation: selectedEvent.location || undefined,
      totalAmount: amount,
      servicesDescription,
      specialRequirements: specialRequirements.trim() || undefined,
      tradition: wedding?.tradition || undefined,
    });
  };

  // Handle applying AI draft to form
  const applyAiDraft = () => {
    form.setValue("contractTerms", aiDraftResult);
    setShowAiDraftDialog(false);
    setAiDraftResult("");
    setServicesDescription("");
    setSpecialRequirements("");
    toast({
      title: "Draft applied",
      description: "The AI-generated contract has been added. Review and customize as needed.",
    });
  };

  // Handle AI review request
  const handleAiReview = () => {
    const terms = form.getValues("contractTerms");
    if (!terms || terms.trim().length === 0) {
      toast({
        title: "No contract to review",
        description: "Please add contract terms first",
        variant: "destructive",
      });
      return;
    }

    aiReviewMutation.mutate({
      contractText: terms,
      vendorCategory: selectedVendor?.category || undefined,
      tradition: wedding?.tradition || undefined,
    });
  };

  // Get improvement suggestions
  const getSuggestions = () => {
    const terms = form.getValues("contractTerms");
    if (!terms || terms.trim().length < 50) {
      return;
    }
    aiSuggestionsMutation.mutate({
      currentTerms: terms,
      vendorCategory: selectedVendor?.category || "General",
    });
  };

  // Reset wizard to initial state
  const resetWizard = () => {
    setCurrentStep("list");
    setSelectedEventId("");
    setSelectedVendorId("");
    setSelectedTemplate(null);
    setSkippedTemplates(false);
    form.reset({
      weddingId: wedding?.id || "",
      eventId: "",
      vendorId: "",
      bookingId: null,
      contractTerms: "",
      totalAmount: "",
      paymentMilestones: [],
      status: "draft",
    });
  };

  // Start creating a new contract
  const startNewContract = () => {
    resetWizard();
    setCurrentStep("select-event");
  };

  // Handle event selection and proceed
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    form.setValue("eventId", eventId);
    setCurrentStep("select-vendor");
  };

  // Handle vendor selection and proceed
  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    form.setValue("vendorId", vendorId);
    setCurrentStep("choose-template");
  };

  // Apply template and proceed to customize
  const applyTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setSkippedTemplates(false);
    form.setValue("contractTerms", template.templateContent);
    
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
    setCurrentStep("customize");
  };

  // Skip templates and write from scratch
  const handleSkipTemplates = () => {
    setSkippedTemplates(true);
    setSelectedTemplate(null);
    form.setValue("contractTerms", "");
    form.setValue("paymentMilestones", []);
    setCurrentStep("customize");
  };

  // Proceed to review
  const proceedToReview = () => {
    const eventId = form.getValues("eventId");
    const vendorId = form.getValues("vendorId");
    const terms = form.getValues("contractTerms");
    const amount = form.getValues("totalAmount");
    
    // Validate event and vendor are selected
    if (!eventId) {
      toast({
        title: "Event required",
        description: "Please select an event for this contract.",
        variant: "destructive",
      });
      setCurrentStep("select-event");
      return;
    }
    
    if (!vendorId) {
      toast({
        title: "Vendor required",
        description: "Please select a vendor for this contract.",
        variant: "destructive",
      });
      setCurrentStep("select-vendor");
      return;
    }
    
    if (!terms || terms.trim().length === 0) {
      toast({
        title: "Contract terms required",
        description: "Please add contract terms before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Contract amount required",
        description: "Please enter a valid contract amount.",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep("review");
  };

  // Create the contract
  const handleCreateContract = () => {
    const data = form.getValues();
    
    // Final validation before creating
    if (!data.eventId || !data.vendorId) {
      toast({
        title: "Missing required fields",
        description: "Event and vendor are required to create a contract.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.contractTerms || data.contractTerms.trim().length === 0) {
      toast({
        title: "Contract terms required",
        description: "Please add contract terms before creating the contract.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.totalAmount || parseFloat(data.totalAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid contract amount.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate({
      ...data,
      weddingId: wedding?.id || "",
    });
  };

  // Handle signing
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

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract);
    form.reset({
      weddingId: contract.weddingId,
      eventId: contract.eventId || "",
      vendorId: contract.vendorId,
      bookingId: contract.bookingId || null,
      contractTerms: contract.contractTerms || "",
      totalAmount: contract.totalAmount,
      paymentMilestones: contract.paymentMilestones as any,
      status: contract.status as any,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (data: ContractFormData) => {
    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data });
    }
  };

  // Get step number for progress
  const getStepNumber = (): number => {
    const steps: WizardStep[] = ["select-event", "select-vendor", "choose-template", "customize", "review"];
    const idx = steps.indexOf(currentStep);
    return idx >= 0 ? idx + 1 : 0;
  };

  const totalSteps = 5;

  // Render Contract List View
  const renderContractList = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Vendor Contracts
          </h1>
          <p className="text-muted-foreground">
            Manage contracts with your wedding vendors
          </p>
        </div>
        <Button 
          onClick={startNewContract}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          data-testid="button-new-contract"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Contract
        </Button>
      </div>

      {!isLoading && contracts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Contracts</p>
                  <div className="text-3xl font-bold text-foreground" data-testid="stat-total-contracts">
                    {contracts.length}
                  </div>
                </div>
                <FileText className="w-8 h-8 text-indigo-500 opacity-40" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Contract Value</p>
                  <div className="text-3xl font-bold text-foreground" data-testid="stat-total-value">
                    ${contracts.reduce((sum, c) => sum + parseFloat(c.totalAmount), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500 opacity-40" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Signed Contracts</p>
                  <div className="text-3xl font-bold text-foreground" data-testid="stat-signed-contracts">
                    {contracts.filter(c => c.status === "signed" || c.status === "active" || c.status === "completed").length}
                  </div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-40" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-xl mb-2">No Contracts Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create contracts with your vendors to formalize agreements, track payments, and get signatures.
          </p>
          <Button 
            onClick={startNewContract}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            data-testid="button-create-first-contract"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Contract
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const vendor = vendors.find(v => v.id === contract.vendorId);
            const event = events.find(e => e.id === contract.eventId);
            
            return (
              <Card 
                key={contract.id} 
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => openEditDialog(contract)}
                data-testid={`card-contract-${contract.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-semibold text-lg">
                          {vendor?.name || "Unknown Vendor"}
                        </h3>
                        <Badge className={`${statusColors[contract.status]} text-white`}>
                          {contract.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {event && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {event.name}
                          </span>
                        )}
                        {vendor?.category && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {vendor.category}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        ${parseFloat(contract.totalAmount).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Contract Value
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(contract);
                      }}
                      data-testid={`button-edit-contract-${contract.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {contract.status === "draft" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSignatureDialog(contract);
                        }}
                        data-testid={`button-sign-contract-${contract.id}`}
                      >
                        <FileSignature className="w-4 h-4 mr-1" />
                        Sign
                      </Button>
                    )}
                    {contract.status === "signed" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vendor-deposit?contractId=${contract.id}`);
                        }}
                        data-testid={`button-pay-contract-${contract.id}`}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pay Deposit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render Step 1: Select Event
  const renderSelectEvent = () => (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={resetWizard}
        className="mb-6"
        data-testid="button-back-to-list"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Contracts
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
            1
          </div>
          <span className="text-sm text-muted-foreground">Step 1 of {totalSteps}</span>
        </div>
        <Progress value={(1 / totalSteps) * 100} className="h-2 mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Which event is this contract for?
        </h2>
        <p className="text-muted-foreground">
          Select the event where this vendor will provide their services
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">No Events Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create events in your timeline first, then come back to create contracts.
          </p>
          <Button onClick={() => navigate("/timeline")} data-testid="button-go-to-timeline">
            Go to Timeline
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {events.sort((a, b) => a.order - b.order).map((event) => (
            <Card 
              key={event.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedEventId === event.id ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleEventSelect(event.id)}
              data-testid={`card-select-event-${event.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {EVENT_ICONS[event.type] || EVENT_ICONS.custom}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                      {event.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.date), "MMM d, yyyy")}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                      {event.guestCount && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.guestCount} guests
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render Step 2: Select Vendor
  const renderSelectVendor = () => (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentStep("select-event")}
        className="mb-6"
        data-testid="button-back-to-events"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
            2
          </div>
          <span className="text-sm text-muted-foreground">Step 2 of {totalSteps}</span>
        </div>
        <Progress value={(2 / totalSteps) * 100} className="h-2 mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Which vendor is this contract with?
        </h2>
        <p className="text-muted-foreground">
          Select the vendor you're creating a contract with for{" "}
          <span className="font-medium text-foreground">{selectedEvent?.name}</span>
        </p>
      </div>

      {vendors.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">No Vendors Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add vendors first, then come back to create contracts.
          </p>
          <Button onClick={() => navigate("/vendors")} data-testid="button-go-to-vendors">
            Go to Vendors
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vendors.map((vendor) => (
            <Card 
              key={vendor.id}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedVendorId === vendor.id ? "ring-2 ring-indigo-500" : ""
              }`}
              onClick={() => handleVendorSelect(vendor.id)}
              data-testid={`card-select-vendor-${vendor.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {vendor.category && (
                        <Badge variant="outline">{vendor.category}</Badge>
                      )}
                      {vendor.city && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {vendor.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render Step 3: Choose Template
  const renderChooseTemplate = () => (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentStep("select-vendor")}
        className="mb-6"
        data-testid="button-back-to-vendors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Vendors
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
            3
          </div>
          <span className="text-sm text-muted-foreground">Step 3 of {totalSteps}</span>
        </div>
        <Progress value={(3 / totalSteps) * 100} className="h-2 mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Start with a template?
        </h2>
        <p className="text-muted-foreground">
          Choose a professional template for{" "}
          <span className="font-medium text-foreground">{selectedVendor?.name}</span>{" "}
          or write your own contract from scratch
        </p>
      </div>

      <div className="grid gap-3 mb-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className="cursor-pointer transition-all hover-elevate"
            onClick={() => applyTemplate(template)}
            data-testid={`card-template-${template.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center shrink-0">
                  <ScrollText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    {template.isDefault && (
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  {template.keyTerms && Array.isArray(template.keyTerms) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(template.keyTerms as string[]).slice(0, 3).map((term, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card 
        className="cursor-pointer transition-all hover-elevate border-dashed"
        onClick={handleSkipTemplates}
        data-testid="card-write-from-scratch"
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Write from scratch</h3>
              <p className="text-sm text-muted-foreground">
                Create your own custom contract terms
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Step 4: Customize Contract
  const renderCustomize = () => (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentStep("choose-template")}
        className="mb-6"
        data-testid="button-back-to-templates"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Templates
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
            4
          </div>
          <span className="text-sm text-muted-foreground">Step 4 of {totalSteps}</span>
        </div>
        <Progress value={(4 / totalSteps) * 100} className="h-2 mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Customize your contract
        </h2>
        <p className="text-muted-foreground">
          {selectedTemplate 
            ? `Customize the ${selectedTemplate.name} template for ${selectedVendor?.name}`
            : `Write your contract terms for ${selectedVendor?.name}`
          }
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-500" />
                Contract Amount
              </CardTitle>
              <CardDescription>
                Enter the total value of this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8 text-xl font-semibold"
                          data-testid="input-contract-amount"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Contract Terms
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate 
                      ? "Edit the template below. Replace placeholders like [VENDOR_NAME] with actual values."
                      : "Write your contract terms, conditions, and agreements."
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAiDraftDialog(true)}
                    data-testid="button-ai-draft"
                  >
                    <Wand2 className="w-4 h-4 mr-1" />
                    AI Draft
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={handleAiReview}
                    disabled={aiReviewMutation.isPending || !form.getValues("contractTerms")}
                    data-testid="button-ai-review"
                  >
                    {aiReviewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-1" />
                    )}
                    AI Review
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contractTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter your contract terms and conditions..."
                        className="min-h-[300px] font-mono text-sm"
                        data-testid="textarea-contract-terms"
                        onBlur={() => getSuggestions()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {aiSuggestions.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-sm">AI Suggestions</span>
                  </div>
                  <ul className="space-y-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              onClick={proceedToReview}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              data-testid="button-proceed-to-review"
            >
              Continue to Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );

  // Render Step 5: Review
  const renderReview = () => (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => setCurrentStep("customize")}
        className="mb-6"
        data-testid="button-back-to-customize"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customize
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
            5
          </div>
          <span className="text-sm text-muted-foreground">Step 5 of {totalSteps}</span>
        </div>
        <Progress value={(5 / totalSteps) * 100} className="h-2 mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Review your contract
        </h2>
        <p className="text-muted-foreground">
          Double-check everything before creating your contract
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Contract Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Event</p>
                <p className="font-medium flex items-center gap-2">
                  <span className="text-lg">{EVENT_ICONS[selectedEvent?.type || "custom"]}</span>
                  {selectedEvent?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{selectedVendor?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contract Value</p>
                <p className="font-bold text-2xl text-indigo-600">
                  ${parseFloat(form.getValues("totalAmount") || "0").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Template Used</p>
                <p className="font-medium">
                  {selectedTemplate?.name || "Written from scratch"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Terms Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded-lg border p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {form.getValues("contractTerms")}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline"
            onClick={() => setCurrentStep("customize")}
            data-testid="button-edit-contract"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Contract
          </Button>
          <Button 
            onClick={handleCreateContract}
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            data-testid="button-create-contract"
          >
            {createMutation.isPending ? (
              "Creating..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Contract
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Main render based on current step
  const renderContent = () => {
    switch (currentStep) {
      case "list":
        return renderContractList();
      case "select-event":
        return renderSelectEvent();
      case "select-vendor":
        return renderSelectVendor();
      case "choose-template":
        return renderChooseTemplate();
      case "customize":
        return renderCustomize();
      case "review":
        return renderReview();
      default:
        return renderContractList();
    }
  };

  return (
    <>
      {renderContent()}

      {/* Edit Contract Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update contract details for {vendors.find(v => v.id === editingContract?.vendorId)?.name}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="pl-8"
                          data-testid="input-edit-amount"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contract-status">
                          <SelectValue placeholder="Select status" />
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

              <FormField
                control={form.control}
                name="contractTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        className="min-h-[200px] font-mono text-sm"
                        data-testid="textarea-edit-terms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => editingContract && deleteMutation.mutate(editingContract.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-contract"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-contract"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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

      {/* AI Draft Contract Dialog */}
      <Dialog open={showAiDraftDialog} onOpenChange={setShowAiDraftDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-500" />
              AI Contract Draft Assistant
            </DialogTitle>
            <DialogDescription>
              Describe what services the vendor will provide and our AI will draft a professional contract for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{selectedVendor?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedVendor?.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event</p>
                <p className="font-medium">{selectedEvent?.name}</p>
                {selectedEvent?.date && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedEvent.date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contract Amount</p>
                <p className="font-medium text-indigo-600">
                  ${parseFloat(form.getValues("totalAmount") || "0").toLocaleString()}
                </p>
              </div>
              {wedding?.tradition && (
                <div>
                  <p className="text-sm text-muted-foreground">Tradition</p>
                  <p className="font-medium capitalize">{wedding.tradition}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Services Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={servicesDescription}
                onChange={(e) => setServicesDescription(e.target.value)}
                placeholder="Describe the services the vendor will provide...&#10;&#10;Example: Photography coverage for 8 hours including ceremony and reception, one lead photographer and one assistant, 500+ edited digital images, online gallery, 30-minute engagement session..."
                className="min-h-[120px]"
                data-testid="textarea-services-description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Special Requirements (Optional)
              </label>
              <Textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Any special requirements or cultural considerations...&#10;&#10;Example: Must be comfortable photographing Sikh ceremony at Gurdwara, need to cover multiple events over 3 days..."
                className="min-h-[80px]"
                data-testid="textarea-special-requirements"
              />
            </div>

            {aiDraftResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Generated Contract Draft</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(aiDraftResult);
                        toast({ title: "Copied to clipboard" });
                      }}
                      data-testid="button-copy-draft"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAiDraft}
                      disabled={aiDraftMutation.isPending}
                      data-testid="button-regenerate-draft"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px] rounded-lg border p-4 bg-background">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{aiDraftResult}</pre>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAiDraftDialog(false);
                setAiDraftResult("");
              }}
              data-testid="button-cancel-ai-draft"
            >
              Cancel
            </Button>
            {aiDraftResult ? (
              <Button
                type="button"
                onClick={applyAiDraft}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                data-testid="button-apply-draft"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Use This Draft
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleAiDraft}
                disabled={aiDraftMutation.isPending || !servicesDescription.trim()}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                data-testid="button-generate-draft"
              >
                {aiDraftMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Drafting...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Draft
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Review Contract Dialog */}
      <Dialog open={showAiReviewDialog} onOpenChange={setShowAiReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              AI Contract Review
            </DialogTitle>
            <DialogDescription>
              Our AI has analyzed your contract and identified potential issues and improvements.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] rounded-lg border p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{aiReviewResult}</pre>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAiReviewDialog(false)}
              data-testid="button-close-review"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(aiReviewResult);
                toast({ title: "Review copied to clipboard" });
              }}
              data-testid="button-copy-review"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
