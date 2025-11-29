import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertContractSchema, type Contract, type Vendor, type Booking, type ContractSignature } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash2, FileSignature, CreditCard, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SignaturePad, type SignaturePadRef } from "@/components/contracts/signature-pad";
import { useLocation as useWouterLocation } from "wouter";

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

export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useWouterLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);

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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-contract">
              {editingContract ? "Edit Contract" : "Add Contract"}
            </DialogTitle>
            <DialogDescription>
              {editingContract ? "Update contract details" : "Add a new vendor contract"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
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
                    <FormLabel>Contract Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter contract terms and conditions..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-contract-terms"
                      />
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

              <DialogFooter>
                {editingContract && (
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
                )}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-contract"
                >
                  {editingContract ? "Update Contract" : "Add Contract"}
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
    </div>
  );
}
