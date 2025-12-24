import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Mail, 
  Phone, 
  Send,
  ShieldCheck, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  Eye,
  Clock,
  MapPin,
  FileText,
  Users
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import type { Vendor, VendorClaimStaging } from "@shared/schema";

export default function AdminVendorClaims() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [claimSearchQuery, setClaimSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<VendorClaimStaging | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [vendorApprovalDialogOpen, setVendorApprovalDialogOpen] = useState(false);
  const [selectedApprovalVendor, setSelectedApprovalVendor] = useState<Vendor | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [activeTab, setActiveTab] = useState("claims");

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/unclaimed"],
    enabled: !!user,
  });

  const { data: pendingClaims = [], isLoading: isLoadingClaims } = useQuery<VendorClaimStaging[]>({
    queryKey: ["/api/admin/vendor-claims"],
    enabled: !!user && user.role === 'admin',
  });

  // Vendors pending registration approval
  const { data: pendingApprovalVendors = [], isLoading: isLoadingApproval } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/pending-approval"],
    enabled: !!user && user.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: async ({ claimId, notes }: { claimId: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/vendor-claims/${claimId}/approve`, { adminNotes: notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-claims'] });
      setReviewDialogOpen(false);
      toast({
        title: "Claim approved!",
        description: "Verification email has been sent to the claimant.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve claim.",
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ claimId, notes }: { claimId: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/vendor-claims/${claimId}/deny`, { adminNotes: notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-claims'] });
      setReviewDialogOpen(false);
      toast({
        title: "Claim denied",
        description: "The claim has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Denial failed",
        description: error.message || "Failed to deny claim.",
        variant: "destructive",
      });
    },
  });

  // Vendor approval mutations (for new vendor registrations)
  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, notes }: { vendorId: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/vendors/${vendorId}/approve`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors/pending-approval'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      setReviewDialogOpen(false);
      toast({
        title: "Vendor approved!",
        description: "The vendor is now visible in the directory.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve vendor.",
        variant: "destructive",
      });
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async ({ vendorId, notes }: { vendorId: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/admin/vendors/${vendorId}/reject`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors/pending-approval'] });
      setReviewDialogOpen(false);
      toast({
        title: "Vendor rejected",
        description: "The vendor has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message || "Failed to reject vendor.",
        variant: "destructive",
      });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await apiRequest("POST", `/api/admin/vendors/${vendorId}/send-claim-invitation`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/unclaimed"] });
      toast({
        title: "Invitation sent!",
        description: data.message,
      });
      setInviteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "Unable to send claim invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setInviteDialogOpen(true);
  };

  const handleConfirmSend = () => {
    if (selectedVendor) {
      sendInviteMutation.mutate(selectedVendor.id);
    }
  };

  const handleReviewClaim = (claim: VendorClaimStaging) => {
    setSelectedClaim(claim);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  const handleApproveClaim = () => {
    if (selectedClaim) {
      approveMutation.mutate({ claimId: selectedClaim.id, notes: adminNotes });
    }
  };

  const handleDenyClaim = () => {
    if (selectedClaim) {
      denyMutation.mutate({ claimId: selectedClaim.id, notes: adminNotes });
    }
  };

  // Vendor approval handlers
  const handleReviewVendorApproval = (vendor: Vendor) => {
    setSelectedApprovalVendor(vendor);
    setApprovalNotes("");
    setVendorApprovalDialogOpen(true);
  };

  const handleApproveVendor = () => {
    if (selectedApprovalVendor) {
      approveVendorMutation.mutate({ vendorId: selectedApprovalVendor.id, notes: approvalNotes });
      setVendorApprovalDialogOpen(false);
    }
  };

  const handleRejectVendor = () => {
    if (selectedApprovalVendor) {
      rejectVendorMutation.mutate({ vendorId: selectedApprovalVendor.id, notes: approvalNotes });
      setVendorApprovalDialogOpen(false);
    }
  };

  const filteredPendingClaims = pendingClaims
    .filter(c => c.status === 'pending')
    .filter((claim) => {
      if (!claimSearchQuery) return true;
      const query = claimSearchQuery.toLowerCase();
      return (
        claim.vendorName.toLowerCase().includes(query) ||
        claim.claimantEmail.toLowerCase().includes(query) ||
        (claim.claimantName?.toLowerCase().includes(query) ?? false)
      );
    });

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredVendors = vendors.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const categoryMatch = v.categories?.some(cat => cat.toLowerCase().includes(query)) || false;
    return (
      v.name.toLowerCase().includes(query) ||
      v.location.toLowerCase().includes(query) ||
      categoryMatch ||
      v.email?.toLowerCase().includes(query) ||
      v.phone?.includes(query)
    );
  });

  const vendorsWithEmail = vendors.filter(v => v.email);
  const vendorsWithPhone = vendors.filter(v => v.phone);
  const vendorsWithPendingToken = vendors.filter(v => v.claimToken && v.claimTokenExpires && new Date(v.claimTokenExpires) > new Date());

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access admin features.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Vendor Claim Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Review claim requests and send invitations to unclaimed vendors
              </p>
            </div>
            <Link href="/claim-your-business">
              <Button variant="outline" data-testid="button-view-claim-page">
                <Eye className="h-4 w-4 mr-2" />
                View Public Claim Page
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredPendingClaims.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Claims</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendors.length}</p>
                    <p className="text-sm text-muted-foreground">Unclaimed Profiles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendorsWithEmail.length}</p>
                    <p className="text-sm text-muted-foreground">With Email</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendorsWithPendingToken.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="approval" className="flex items-center gap-2" data-testid="tab-approval">
                <ShieldCheck className="h-4 w-4" />
                Vendor Approval
                {pendingApprovalVendors.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{pendingApprovalVendors.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="claims" className="flex items-center gap-2" data-testid="tab-claims">
                <FileText className="h-4 w-4" />
                Pending Claims
                {filteredPendingClaims.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{filteredPendingClaims.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vendors" className="flex items-center gap-2" data-testid="tab-vendors">
                <Users className="h-4 w-4" />
                Unclaimed Vendors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approval">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Registration Approval</CardTitle>
                  <CardDescription>
                    Review and approve new vendor registrations before they appear in the vendor directory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingApproval ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : pendingApprovalVendors.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">All caught up!</h3>
                      <p className="text-muted-foreground">
                        No vendors pending approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingApprovalVendors.map((vendor) => (
                        <Card key={vendor.id} className="hover-elevate" data-testid={`card-approval-${vendor.id}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-primary" />
                                      {vendor.name}
                                    </h3>
                                    {vendor.categories && vendor.categories.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {vendor.categories.slice(0, 3).map((cat) => (
                                          <Badge key={cat} variant="outline" className="text-xs">
                                            {getCategoryLabel(cat)}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="shrink-0">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending Approval
                                  </Badge>
                                </div>
                                
                                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                  {vendor.email && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Email:</p>
                                      <p className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {vendor.email}
                                      </p>
                                    </div>
                                  )}
                                  {vendor.location && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Location:</p>
                                      <p className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {vendor.location}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {vendor.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {vendor.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewVendorApproval(vendor)}
                                  data-testid={`button-review-approval-${vendor.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Claim Requests</CardTitle>
                  <CardDescription>
                    Review and approve vendor claim requests from users who want to claim profiles without email on file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by vendor name, claimant email..."
                      value={claimSearchQuery}
                      onChange={(e) => setClaimSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-claims"
                    />
                  </div>

                  {isLoadingClaims ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredPendingClaims.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-medium">All caught up!</h3>
                      <p className="text-muted-foreground">
                        No pending claim requests to review.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPendingClaims.map((claim) => (
                        <Card key={claim.id} className="hover-elevate" data-testid={`card-claim-${claim.id}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-primary" />
                                      {claim.vendorName}
                                    </h3>
                                    {claim.vendorCategories && claim.vendorCategories.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {claim.vendorCategories.slice(0, 2).map((cat) => (
                                          <Badge key={cat} variant="outline" className="text-xs">
                                            {getCategoryLabel(cat)}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="shrink-0">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending Review
                                  </Badge>
                                </div>
                                
                                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Claimant:</p>
                                    <p className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {claim.claimantEmail}
                                    </p>
                                    {claim.claimantName && <p className="text-muted-foreground">{claim.claimantName}</p>}
                                  </div>
                                  {claim.vendorLocation && (
                                    <div>
                                      <p className="text-muted-foreground text-xs">Location:</p>
                                      <p className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {claim.vendorLocation}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {claim.notes && (
                                  <div className="bg-muted/50 p-2 rounded text-sm">
                                    <span className="text-muted-foreground">Notes: </span>
                                    {claim.notes}
                                  </div>
                                )}
                              </div>
                              
                              <Button 
                                onClick={() => handleReviewClaim(claim)}
                                data-testid={`button-review-${claim.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendors">
              <Card>
                <CardHeader>
                  <CardTitle>Unclaimed Vendor Profiles</CardTitle>
                  <CardDescription>
                    These vendors have profiles but haven't claimed them yet. Send invitations to help them take control.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, location, category, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-vendors"
                    />
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredVendors.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {searchQuery 
                          ? `No unclaimed vendors found matching "${searchQuery}"`
                          : "No unclaimed vendor profiles found."
                        }
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Business</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVendors.map((vendor) => {
                            const hasPendingInvite = vendor.claimToken && vendor.claimTokenExpires && new Date(vendor.claimTokenExpires) > new Date();
                            const hasContact = vendor.email || vendor.phone;
                            
                            return (
                              <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                                <TableCell>
                                  <p className="font-medium">{vendor.name}</p>
                                  {vendor.source === "google_places" && (
                                    <Badge variant="outline" className="text-xs mt-1">Google Places</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{getCategoryLabel(vendor.categories?.[0] || 'vendor')}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {vendor.city || vendor.location}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1 text-sm">
                                    {vendor.email && (
                                      <p className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <span className="truncate max-w-[150px]">{vendor.email}</span>
                                      </p>
                                    )}
                                    {vendor.phone && (
                                      <p className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {vendor.phone}
                                      </p>
                                    )}
                                    {!hasContact && (
                                      <span className="text-muted-foreground">No contact info</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{vendor.viewCount || 0}</span>
                                </TableCell>
                                <TableCell>
                                  {hasPendingInvite ? (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Invite Pending
                                    </Badge>
                                  ) : hasContact ? (
                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                      Ready to Invite
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-400">
                                      Missing Contact
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendInvite(vendor)}
                                    disabled={!hasContact || sendInviteMutation.isPending}
                                    data-testid={`button-invite-${vendor.id}`}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    {hasPendingInvite ? "Resend" : "Send Invite"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {filteredVendors.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing {filteredVendors.length} of {vendors.length} unclaimed vendors
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Claim Invitation
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to help this vendor claim their profile.
            </DialogDescription>
          </DialogHeader>

          {selectedVendor && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium">{selectedVendor.name}</p>
                <p className="text-sm text-muted-foreground">{getCategoryLabel(selectedVendor.categories?.[0] || 'vendor')}</p>
                <div className="text-sm space-y-1 mt-2">
                  {selectedVendor.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {selectedVendor.email}
                    </p>
                  )}
                  {selectedVendor.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {selectedVendor.phone}
                    </p>
                  )}
                </div>
              </div>
              
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  A verification link will be sent that expires in 48 hours. 
                  The vendor can use it to create an account and claim their profile.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} data-testid="button-cancel-invite">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSend} 
              disabled={sendInviteMutation.isPending}
              data-testid="button-confirm-invite"
            >
              {sendInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Review Claim: {selectedClaim?.vendorName}
            </DialogTitle>
            <DialogDescription>
              Approve or deny this vendor ownership claim
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vendor</p>
                  <p className="font-medium">{selectedClaim.vendorName}</p>
                  {selectedClaim.vendorLocation && (
                    <p className="text-sm text-muted-foreground">{selectedClaim.vendorLocation}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Claimant</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {selectedClaim.claimantEmail}
                  </p>
                  {selectedClaim.claimantName && (
                    <p className="text-sm">{selectedClaim.claimantName}</p>
                  )}
                  {selectedClaim.claimantPhone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {selectedClaim.claimantPhone}
                    </p>
                  )}
                </div>
                {selectedClaim.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Claimant Notes</p>
                    <p className="text-sm">{selectedClaim.notes}</p>
                  </div>
                )}
              </div>

              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Approving</strong> will update the vendor's email to the claimant's address and 
                  send them a verification link to complete the claim.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes for this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="input-admin-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
              disabled={approveMutation.isPending || denyMutation.isPending}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDenyClaim}
              disabled={approveMutation.isPending || denyMutation.isPending}
              data-testid="button-deny-claim"
            >
              {denyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Denying...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny
                </>
              )}
            </Button>
            <Button 
              onClick={handleApproveClaim}
              disabled={approveMutation.isPending || denyMutation.isPending}
              data-testid="button-approve-claim"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vendorApprovalDialogOpen} onOpenChange={setVendorApprovalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Review Vendor: {selectedApprovalVendor?.name}
            </DialogTitle>
            <DialogDescription>
              Approve or reject this vendor's registration for the directory
            </DialogDescription>
          </DialogHeader>

          {selectedApprovalVendor && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Business Name</p>
                  <p className="font-medium">{selectedApprovalVendor.name}</p>
                </div>
                {selectedApprovalVendor.categories && selectedApprovalVendor.categories.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Categories</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedApprovalVendor.categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {getCategoryLabel(cat)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApprovalVendor.location && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {selectedApprovalVendor.location}
                    </p>
                  </div>
                )}
                {selectedApprovalVendor.email && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {selectedApprovalVendor.email}
                    </p>
                  </div>
                )}
                {selectedApprovalVendor.description && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                    <p className="text-sm">{selectedApprovalVendor.description}</p>
                  </div>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Approving</strong> will make this vendor visible in the public directory.
                  <strong> Rejecting</strong> will keep the vendor hidden from the directory.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">Notes (optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes for this decision..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="input-approval-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setVendorApprovalDialogOpen(false)}
              disabled={approveVendorMutation.isPending || rejectVendorMutation.isPending}
              data-testid="button-cancel-approval"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectVendor}
              disabled={approveVendorMutation.isPending || rejectVendorMutation.isPending}
              data-testid="button-reject-vendor"
            >
              {rejectVendorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
            <Button 
              onClick={handleApproveVendor}
              disabled={approveVendorMutation.isPending || rejectVendorMutation.isPending}
              data-testid="button-approve-vendor"
            >
              {approveVendorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
