import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
  Loader2,
  Building2,
  Eye,
  Clock,
  MapPin
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import type { Vendor } from "@shared/schema";

export default function AdminVendorClaims() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/unclaimed"],
    enabled: !!user,
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

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredVendors = vendors.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(query) ||
      v.location.toLowerCase().includes(query) ||
      v.category.toLowerCase().includes(query) ||
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
                Send claim invitations to unclaimed vendor profiles
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
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendorsWithPhone.length}</p>
                    <p className="text-sm text-muted-foreground">With Phone</p>
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
                              <Badge variant="secondary">{getCategoryLabel(vendor.category)}</Badge>
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
                <p className="text-sm text-muted-foreground">{getCategoryLabel(selectedVendor.category)}</p>
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
    </div>
  );
}
