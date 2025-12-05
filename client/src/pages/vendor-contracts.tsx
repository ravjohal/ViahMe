import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Vendor, Contract, ContractSignature, ContractDocument, ContractPayment } from "@shared/schema";
import { useLocation } from "wouter";
import SignatureCanvas from "react-signature-canvas";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Pen, 
  Upload, 
  Download, 
  Trash2,
  CreditCard,
  FileCheck,
  PlusCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";
import { format } from "date-fns";

type PaymentSummary = {
  totalAmount: number;
  totalPaid: number;
  remaining: number;
  paymentCount: number;
  completedPayments: number;
  pendingPayments: number;
};

export default function VendorContracts() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "vendor",
  });

  const currentVendor = vendors?.find(v => v.userId === user?.id);
  const vendorId = currentVendor?.id;

  const { data: contracts = [], isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/contracts/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    enabled: !!vendorId,
  });

  const { data: signatures = [] } = useQuery<ContractSignature[]>({
    queryKey: ["/api/contracts", selectedContract?.id, "signatures"],
    queryFn: async () => {
      if (!selectedContract?.id) return [];
      const response = await fetch(`/api/contracts/${selectedContract.id}/signatures`);
      if (!response.ok) throw new Error("Failed to fetch signatures");
      return response.json();
    },
    enabled: !!selectedContract?.id,
  });

  const { data: documents = [] } = useQuery<ContractDocument[]>({
    queryKey: ["/api/contracts", selectedContract?.id, "documents"],
    queryFn: async () => {
      if (!selectedContract?.id) return [];
      const response = await fetch(`/api/contracts/${selectedContract.id}/documents`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
    enabled: !!selectedContract?.id,
  });

  const { data: payments = [] } = useQuery<ContractPayment[]>({
    queryKey: ["/api/contracts", selectedContract?.id, "payments"],
    queryFn: async () => {
      if (!selectedContract?.id) return [];
      const response = await fetch(`/api/contracts/${selectedContract.id}/payments`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
    enabled: !!selectedContract?.id,
  });

  const { data: paymentSummary } = useQuery<PaymentSummary>({
    queryKey: ["/api/contracts", selectedContract?.id, "payment-summary"],
    queryFn: async () => {
      if (!selectedContract?.id) return { totalAmount: 0, totalPaid: 0, remaining: 0, paymentCount: 0, completedPayments: 0, pendingPayments: 0 };
      const response = await fetch(`/api/contracts/${selectedContract.id}/payment-summary`);
      if (!response.ok) throw new Error("Failed to fetch payment summary");
      return response.json();
    },
    enabled: !!selectedContract?.id,
  });

  const signMutation = useMutation({
    mutationFn: async (data: { signatureData: string }) => {
      if (!selectedContract || !user || !currentVendor) throw new Error("Missing required data");
      return apiRequest("POST", `/api/contracts/${selectedContract.id}/sign`, {
        signatureData: data.signatureData,
        signerName: currentVendor.name,
        signerEmail: user.email,
        signerRole: "vendor",
      });
    },
    onSuccess: () => {
      toast({ title: "Contract signed successfully" });
      setSignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "signatures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/vendor", vendorId] });
      signatureRef.current?.clear();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to sign contract", description: error.message, variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: { amount: string; paymentMethod: string; paymentType: string; notes?: string; dueDate?: string }) => {
      if (!selectedContract) throw new Error("No contract selected");
      return apiRequest("POST", `/api/contracts/${selectedContract.id}/payments`, data);
    },
    onSuccess: () => {
      toast({ title: "Payment recorded successfully" });
      setPaymentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "payment-summary"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to record payment", description: error.message, variant: "destructive" });
    },
  });

  const markPaymentCompleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!selectedContract) throw new Error("No contract selected");
      return apiRequest("PATCH", `/api/contracts/${selectedContract.id}/payments/${paymentId}`, {
        status: "completed",
        paidDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({ title: "Payment marked as completed" });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "payment-summary"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update payment", description: error.message, variant: "destructive" });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { fileName: string; fileUrl: string; fileType: string; documentType: string; description?: string }) => {
      if (!selectedContract) throw new Error("No contract selected");
      return apiRequest("POST", `/api/contracts/${selectedContract.id}/documents`, data);
    },
    onSuccess: () => {
      toast({ title: "Document uploaded successfully" });
      setDocumentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to upload document", description: error.message, variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!selectedContract) throw new Error("No contract selected");
      return apiRequest("DELETE", `/api/contracts/${selectedContract.id}/documents/${documentId}`);
    },
    onSuccess: () => {
      toast({ title: "Document deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "documents"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete document", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background flex items-center justify-center">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  if (user.role !== "vendor") {
    setLocation("/dashboard");
    return null;
  }

  const activeContracts = contracts.filter(c => c.status === "active" || c.status === "signed");
  const draftContracts = contracts.filter(c => c.status === "draft" || c.status === "sent");
  const completedContracts = contracts.filter(c => c.status === "completed");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "signed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "draft":
      case "sent":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "active":
      case "signed":
        return "default";
      case "draft":
      case "sent":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleSign = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({ title: "Please provide your signature", variant: "destructive" });
      return;
    }
    const signatureData = signatureRef.current.toDataURL();
    signMutation.mutate({ signatureData });
  };

  const handleRecordPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    recordPaymentMutation.mutate({
      amount: formData.get("amount") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      paymentType: formData.get("paymentType") as string,
      notes: formData.get("notes") as string,
      dueDate: formData.get("dueDate") as string,
    });
  };

  const handleUploadDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    uploadDocumentMutation.mutate({
      fileName: formData.get("fileName") as string,
      fileUrl: formData.get("fileUrl") as string,
      fileType: formData.get("fileType") as string || "application/pdf",
      documentType: formData.get("documentType") as string,
      description: formData.get("description") as string,
    });
  };

  const hasVendorSigned = (contractId: string) => {
    return signatures.some(s => s.contractId === contractId && s.signerRole === "vendor");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
      <VendorHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Contract Management</h1>
          <p className="text-muted-foreground mt-1">Manage your contracts, signatures, payments, and documents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold" data-testid="stat-active">{activeContracts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold" data-testid="stat-drafts">{draftContracts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold" data-testid="stat-completed">{completedContracts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold font-mono" data-testid="stat-total-value">
                  ${contracts.reduce((sum, c) => sum + parseFloat(c.totalAmount || '0'), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {contractsLoading || vendorsLoading ? (
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ) : contracts.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Contracts</h3>
            <p className="text-muted-foreground">
              You don't have any contracts yet. Contracts are created when bookings are confirmed.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card 
                key={contract.id} 
                className={`transition-all ${selectedContract?.id === contract.id ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-contract-${contract.id}`}
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => {
                    if (expandedContract === contract.id) {
                      setExpandedContract(null);
                      setSelectedContract(null);
                    } else {
                      setExpandedContract(contract.id);
                      setSelectedContract(contract);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(contract.status)}
                      <div>
                        <CardTitle className="text-lg">
                          Contract #{contract.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Created: {format(new Date(contract.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(contract.status)} data-testid={`badge-contract-status-${contract.id}`}>
                        {contract.status}
                      </Badge>
                      <span className="font-mono font-bold text-lg" data-testid={`text-contract-amount-${contract.id}`}>
                        ${parseFloat(contract.totalAmount || '0').toLocaleString()}
                      </span>
                      {expandedContract === contract.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedContract === contract.id && (
                  <CardContent>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="details" data-testid="tab-details">
                          <FileText className="w-4 h-4 mr-2" />
                          Details
                        </TabsTrigger>
                        <TabsTrigger value="signature" data-testid="tab-signature">
                          <Pen className="w-4 h-4 mr-2" />
                          Signature
                        </TabsTrigger>
                        <TabsTrigger value="payments" data-testid="tab-payments">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payments
                        </TabsTrigger>
                        <TabsTrigger value="documents" data-testid="tab-documents">
                          <Upload className="w-4 h-4 mr-2" />
                          Documents
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Wedding ID</p>
                            <p className="font-medium">{contract.weddingId.slice(0, 8)}</p>
                          </div>
                          {contract.bookingId && (
                            <div>
                              <p className="text-sm text-muted-foreground">Booking ID</p>
                              <p className="font-medium">{contract.bookingId.slice(0, 8)}</p>
                            </div>
                          )}
                          {contract.signedDate && (
                            <div>
                              <p className="text-sm text-muted-foreground">Signed Date</p>
                              <p className="font-medium">{format(new Date(contract.signedDate), "MMM d, yyyy")}</p>
                            </div>
                          )}
                        </div>
                        
                        {contract.contractTerms && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Contract Terms</p>
                            <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap">
                              {contract.contractTerms}
                            </div>
                          </div>
                        )}

                        {contract.paymentMilestones && Array.isArray(contract.paymentMilestones) && contract.paymentMilestones.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Payment Milestones</p>
                            <div className="space-y-2">
                              {contract.paymentMilestones.map((milestone: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                  data-testid={`milestone-${contract.id}-${idx}`}
                                >
                                  <div>
                                    <p className="font-medium">{milestone.name}</p>
                                    {milestone.dueDate && (
                                      <p className="text-sm text-muted-foreground">
                                        Due: {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono font-semibold">
                                      ${parseFloat(milestone.amount).toLocaleString()}
                                    </p>
                                    <Badge variant="outline" className="mt-1">
                                      {milestone.status || "pending"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="signature" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold">Signature Status</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {signatures.some(s => s.signerRole === 'couple') ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-600" />
                                )}
                                <span className="font-medium">Couple</span>
                              </div>
                              {signatures.filter(s => s.signerRole === 'couple').map(sig => (
                                <div key={sig.id} className="text-sm text-muted-foreground">
                                  <p>{sig.signerName}</p>
                                  <p>{format(new Date(sig.signedAt), "MMM d, yyyy h:mm a")}</p>
                                </div>
                              ))}
                              {!signatures.some(s => s.signerRole === 'couple') && (
                                <p className="text-sm text-muted-foreground">Awaiting signature</p>
                              )}
                            </Card>

                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {hasVendorSigned(contract.id) ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-yellow-600" />
                                )}
                                <span className="font-medium">Vendor (You)</span>
                              </div>
                              {signatures.filter(s => s.signerRole === 'vendor').map(sig => (
                                <div key={sig.id} className="text-sm text-muted-foreground">
                                  <p>{sig.signerName}</p>
                                  <p>{format(new Date(sig.signedAt), "MMM d, yyyy h:mm a")}</p>
                                </div>
                              ))}
                              {!hasVendorSigned(contract.id) && (
                                <p className="text-sm text-muted-foreground">Awaiting your signature</p>
                              )}
                            </Card>
                          </div>

                          {!hasVendorSigned(contract.id) && (
                            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                              <DialogTrigger asChild>
                                <Button className="w-full" data-testid="button-sign-contract">
                                  <Pen className="w-4 h-4 mr-2" />
                                  Sign Contract
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Sign Contract</DialogTitle>
                                  <DialogDescription>
                                    Please review the contract terms above and provide your digital signature below.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4 py-4">
                                  <div className="border rounded-lg bg-white">
                                    <SignatureCanvas
                                      ref={signatureRef}
                                      canvasProps={{
                                        className: "w-full h-48",
                                        style: { width: '100%', height: '192px' }
                                      }}
                                      backgroundColor="white"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => signatureRef.current?.clear()}
                                      className="flex-1"
                                      data-testid="button-clear-signature"
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setSignDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleSign}
                                    disabled={signMutation.isPending}
                                    data-testid="button-confirm-signature"
                                  >
                                    {signMutation.isPending ? "Signing..." : "Confirm Signature"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="payments" className="space-y-4">
                        {paymentSummary && (
                          <Card className="p-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-xl font-bold font-mono">${paymentSummary.totalAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Paid</p>
                                <p className="text-xl font-bold font-mono text-green-600">${paymentSummary.totalPaid.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Remaining</p>
                                <p className="text-xl font-bold font-mono text-orange-600">${paymentSummary.remaining.toLocaleString()}</p>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Payment Progress</span>
                                <span>{Math.round((paymentSummary.totalPaid / paymentSummary.totalAmount) * 100) || 0}%</span>
                              </div>
                              <Progress 
                                value={(paymentSummary.totalPaid / paymentSummary.totalAmount) * 100 || 0} 
                                className="h-2"
                              />
                            </div>
                          </Card>
                        )}

                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Payment Records</h4>
                          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" data-testid="button-record-payment">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Record Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record Payment</DialogTitle>
                                <DialogDescription>
                                  Add a new payment record for this contract.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="amount">Amount ($)</Label>
                                    <Input 
                                      id="amount" 
                                      name="amount" 
                                      type="number" 
                                      step="0.01" 
                                      required 
                                      data-testid="input-payment-amount"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Select name="paymentMethod" required>
                                      <SelectTrigger data-testid="select-payment-method">
                                        <SelectValue placeholder="Select method" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="venmo">Venmo</SelectItem>
                                        <SelectItem value="zelle">Zelle</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="paymentType">Payment Type</Label>
                                    <Select name="paymentType" required>
                                      <SelectTrigger data-testid="select-payment-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="deposit">Deposit</SelectItem>
                                        <SelectItem value="milestone">Milestone</SelectItem>
                                        <SelectItem value="final">Final Payment</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="refund">Refund</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input 
                                      id="dueDate" 
                                      name="dueDate" 
                                      type="date" 
                                      data-testid="input-payment-due-date"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Notes</Label>
                                  <Textarea 
                                    id="notes" 
                                    name="notes" 
                                    placeholder="Additional notes..."
                                    data-testid="input-payment-notes"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={recordPaymentMutation.isPending} data-testid="button-submit-payment">
                                    {recordPaymentMutation.isPending ? "Saving..." : "Save Payment"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {payments.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No payment records yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {payments.map((payment) => (
                              <Card key={payment.id} className="p-4" data-testid={`payment-record-${payment.id}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {payment.status === 'completed' ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Clock className="w-5 h-5 text-yellow-600" />
                                    )}
                                    <div>
                                      <p className="font-medium font-mono">${parseFloat(payment.amount).toLocaleString()}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {payment.paymentType} - {payment.paymentMethod.replace('_', ' ')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={payment.status === 'completed' ? 'default' : 'outline'}>
                                      {payment.status}
                                    </Badge>
                                    {payment.status === 'pending' && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => markPaymentCompleteMutation.mutate(payment.id)}
                                        disabled={markPaymentCompleteMutation.isPending}
                                        data-testid={`button-mark-paid-${payment.id}`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {payment.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>
                                )}
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="documents" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Contract Documents</h4>
                          <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" data-testid="button-upload-document">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                                <DialogDescription>
                                  Add a document to this contract.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleUploadDocument} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="fileName">File Name</Label>
                                  <Input 
                                    id="fileName" 
                                    name="fileName" 
                                    required 
                                    placeholder="contract-v1.pdf"
                                    data-testid="input-document-name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="fileUrl">File URL</Label>
                                  <Input 
                                    id="fileUrl" 
                                    name="fileUrl" 
                                    required 
                                    placeholder="https://..."
                                    data-testid="input-document-url"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="documentType">Document Type</Label>
                                    <Select name="documentType" required>
                                      <SelectTrigger data-testid="select-document-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="amendment">Amendment</SelectItem>
                                        <SelectItem value="invoice">Invoice</SelectItem>
                                        <SelectItem value="receipt">Receipt</SelectItem>
                                        <SelectItem value="proposal">Proposal</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="fileType">File Type</Label>
                                    <Input 
                                      id="fileType" 
                                      name="fileType" 
                                      placeholder="application/pdf"
                                      defaultValue="application/pdf"
                                      data-testid="input-document-file-type"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="description">Description</Label>
                                  <Textarea 
                                    id="description" 
                                    name="description"
                                    placeholder="Document description..."
                                    data-testid="input-document-description"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setDocumentDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={uploadDocumentMutation.isPending} data-testid="button-submit-document">
                                    {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {documents.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No documents uploaded yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {documents.map((doc) => (
                              <Card key={doc.id} className="p-4" data-testid={`document-${doc.id}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{doc.fileName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {doc.documentType} • {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                      data-testid={`button-view-document-${doc.id}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                      data-testid={`button-download-document-${doc.id}`}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                      disabled={deleteDocumentMutation.isPending}
                                      data-testid={`button-delete-document-${doc.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground mt-2">{doc.description}</p>
                                )}
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
