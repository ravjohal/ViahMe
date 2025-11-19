import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vendor, Booking, Contract, InsertVendor } from "@shared/schema";
import { insertVendorSchema } from "@shared/schema";
import { z } from "zod";
import {
  Star,
  MapPin,
  DollarSign,
  Mail,
  Phone,
  Edit,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function VendorDashboard() {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Vendor>>({});

  // DEMO LIMITATION: For demonstration purposes, this dashboard uses the first vendor
  // from the database. In a production environment with authentication, this would:
  // 1. Get the vendor ID from the authenticated user session/JWT
  // 2. Fetch only that specific vendor's data
  // 3. Prevent unauthorized access to other vendors' information
  // TODO: Integrate with authentication system once implemented
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const currentVendor = vendors?.[0];
  const vendorId = currentVendor?.id;

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/bookings/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
    enabled: !!vendorId,
  });

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

  const updateVendorMutation = useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      if (!vendorId) throw new Error("No vendor ID");
      return await apiRequest(`/api/vendors/${vendorId}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Profile Updated",
        description: "Your vendor profile has been updated successfully.",
      });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      return await apiRequest(`/api/bookings/${bookingId}`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/vendor", vendorId] });
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = () => {
    if (!currentVendor) return;
    setEditFormData({
      name: currentVendor.name,
      description: currentVendor.description || "",
      contact: currentVendor.contact || "",
      location: currentVendor.location,
      priceRange: currentVendor.priceRange,
      culturalSpecialties: currentVendor.culturalSpecialties || [],
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    try {
      if (!currentVendor) return;

      // Create a schema that enforces non-empty constraints even for partial updates
      const profileUpdateSchema = z.object({
        name: z.string().min(1, "Business name is required").optional(),
        location: z.string().min(1, "Location is required").optional(),
        priceRange: z.enum(['$', '$$', '$$$', '$$$$'], {
          errorMap: () => ({ message: "Please select a valid price range" })
        }).optional(),
        culturalSpecialties: z.array(z.string()).optional(),
        description: z.string().optional(),
        contact: z.string().optional(),
      }).refine((data) => {
        // Ensure at least one field is provided
        return Object.values(data).some(v => v !== undefined);
      }, {
        message: "Please make at least one change",
      }).refine((data) => {
        // Ensure required fields are not empty strings if provided
        if (data.name !== undefined && data.name.trim() === '') return false;
        if (data.location !== undefined && data.location.trim() === '') return false;
        return true;
      }, {
        message: "Required fields cannot be empty",
      });

      // Build updates object with only the edited fields (check !== undefined to catch empty strings)
      const updates: Record<string, any> = {};
      if (editFormData.name !== undefined) updates.name = editFormData.name;
      if (editFormData.location !== undefined) updates.location = editFormData.location;
      if (editFormData.priceRange !== undefined) updates.priceRange = editFormData.priceRange;
      if (editFormData.description !== undefined) updates.description = editFormData.description;
      if (editFormData.contact !== undefined) updates.contact = editFormData.contact;
      if (editFormData.culturalSpecialties !== undefined) updates.culturalSpecialties = editFormData.culturalSpecialties;

      // Validate the update payload with strict rules that prevent empty required fields
      const validatedUpdates = profileUpdateSchema.parse(updates) as Partial<Vendor>;

      updateVendorMutation.mutate(validatedUpdates);
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error?.issues?.[0]?.message || error?.message || "Please check your input and try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBooking = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  if (vendorsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!currentVendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Vendor Profile</CardTitle>
            <CardDescription>
              No vendor profile found. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const rating = currentVendor.rating ? parseFloat(currentVendor.rating.toString()) : 0;
  const pendingBookings = bookings.filter((b: Booking) => b.status === "pending");
  const confirmedBookings = bookings.filter((b: Booking) => b.status === "confirmed");
  const activeContracts = contracts.filter((c: Contract) => c.status === "active" || c.status === "signed");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground" data-testid="heading-vendor-dashboard">
                Vendor Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your bookings and profile
              </p>
            </div>
            <Button onClick={openEditDialog} data-testid="button-edit-profile">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Vendor Profile Card */}
        <Card className="mb-8" data-testid="card-vendor-profile">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-display" data-testid="text-vendor-name">
                  {currentVendor.name}
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  {currentVendor.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </CardDescription>
              </div>
              {rating > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span className="font-mono font-semibold" data-testid="text-vendor-rating">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({currentVendor.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium" data-testid="text-vendor-location">{currentVendor.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Price Range</p>
                  <p className="font-medium" data-testid="text-vendor-price">{currentVendor.priceRange}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium" data-testid="text-vendor-contact">
                    {currentVendor.contact || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
            {currentVendor.description && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-foreground" data-testid="text-vendor-description">
                  {currentVendor.description}
                </p>
              </div>
            )}
            {currentVendor.culturalSpecialties && currentVendor.culturalSpecialties.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Cultural Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {currentVendor.culturalSpecialties.map((specialty, idx) => (
                    <Badge key={idx} variant="outline" data-testid={`badge-specialty-${idx}`}>
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-1/10">
                <Clock className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-pending-bookings">
                  {pendingBookings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-2/10">
                <CheckCircle className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-confirmed-bookings">
                  {confirmedBookings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-3/10">
                <FileText className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Contracts</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-active-contracts">
                  {activeContracts.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10">
                <Calendar className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-total-bookings">
                  {bookings.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs for Bookings and Contracts */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="bookings" data-testid="tab-bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Booking Requests
            </TabsTrigger>
            <TabsTrigger value="contracts" data-testid="tab-contracts">
              <FileText className="w-4 h-4 mr-2" />
              Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookingsLoading ? (
              <Card className="p-6">
                <Skeleton className="h-32 w-full" />
              </Card>
            ) : bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Booking Requests</h3>
                <p className="text-muted-foreground">
                  You haven't received any booking requests yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="p-6" data-testid={`card-booking-${booking.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg" data-testid={`text-booking-event-${booking.id}`}>
                          Booking Request - Event ID: {booking.eventId}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Wedding ID: {booking.weddingId}
                        </p>
                      </div>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "pending"
                            ? "outline"
                            : "secondary"
                        }
                        data-testid={`badge-booking-status-${booking.id}`}
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    {booking.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Notes from couple:</p>
                        <p className="text-sm" data-testid={`text-booking-notes-${booking.id}`}>
                          {booking.notes}
                        </p>
                      </div>
                    )}

                    {booking.estimatedCost && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Estimated Cost:</p>
                        <p className="font-mono font-semibold" data-testid={`text-booking-cost-${booking.id}`}>
                          ${parseFloat(booking.estimatedCost).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {booking.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateBooking(booking.id, "confirmed")}
                          disabled={updateBookingMutation.isPending}
                          data-testid={`button-confirm-booking-${booking.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateBooking(booking.id, "declined")}
                          disabled={updateBookingMutation.isPending}
                          data-testid={`button-decline-booking-${booking.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            {contractsLoading ? (
              <Card className="p-6">
                <Skeleton className="h-32 w-full" />
              </Card>
            ) : contracts.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Contracts</h3>
                <p className="text-muted-foreground">
                  You don't have any contracts yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="p-6" data-testid={`card-contract-${contract.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Contract #{contract.id.slice(0, 8)}
                        </h3>
                        {contract.bookingId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Booking: {contract.bookingId.slice(0, 8)}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          contract.status === "active" || contract.status === "signed"
                            ? "default"
                            : contract.status === "draft"
                            ? "outline"
                            : "secondary"
                        }
                        data-testid={`badge-contract-status-${contract.id}`}
                      >
                        {contract.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-mono font-semibold text-lg">
                          ${parseFloat(contract.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      {contract.signedDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Signed Date</p>
                          <p className="font-medium">
                            {new Date(contract.signedDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {contract.contractTerms && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Contract Terms:</p>
                        <p className="text-sm">{contract.contractTerms}</p>
                      </div>
                    )}

                    {contract.paymentMilestones && Array.isArray(contract.paymentMilestones) && contract.paymentMilestones.length > 0 ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Payment Milestones:</p>
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
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
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
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-edit-profile">Edit Vendor Profile</DialogTitle>
            <DialogDescription>
              Update your vendor profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                rows={4}
                data-testid="textarea-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editFormData.location || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, location: e.target.value })
                  }
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={editFormData.contact || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, contact: e.target.value })
                  }
                  data-testid="input-contact"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priceRange">Price Range</Label>
              <Select
                value={editFormData.priceRange || ""}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, priceRange: value })
                }
              >
                <SelectTrigger id="priceRange" data-testid="select-price-range">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - Budget Friendly</SelectItem>
                  <SelectItem value="$$">$$ - Moderate</SelectItem>
                  <SelectItem value="$$$">$$$ - Premium</SelectItem>
                  <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updateVendorMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateVendorMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
