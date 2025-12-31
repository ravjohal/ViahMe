import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VendorDirectory } from "@/components/vendor-directory";
import { VendorDetailModal } from "@/components/vendor-detail-modal";
import { VendorComparisonModal } from "@/components/vendor-comparison-modal";
import { SubmitVendorModal } from "@/components/submit-vendor-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation, useSearch } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, CheckCircle, Clock, XCircle, Briefcase, Star, MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";
import type { Wedding, Vendor, Event, Booking } from "@shared/schema";

export default function Vendors() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [comparisonVendors, setComparisonVendors] = useState<Vendor[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showSubmitVendor, setShowSubmitVendor] = useState(false);
  const [previewHandled, setPreviewHandled] = useState(false);

  // Parse query params for initial view
  const params = new URLSearchParams(searchString);
  const initialView = params.get('view') === 'booked' ? 'my-vendors' : 'browse';
  const [activeTab, setActiveTab] = useState(initialView);

  // Only fetch weddings if user is authenticated
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !!user && user.role === "couple",
  });

  const wedding = weddings?.[0];

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch bookings for the wedding
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings", wedding?.id],
    enabled: !!wedding?.id,
  });

  // Get booked vendors with their booking info
  const bookedVendorsData = useMemo(() => {
    if (!bookings.length || !vendors.length) return [];
    
    const vendorBookings = new Map<string, { vendor: Vendor; bookings: Booking[]; events: Event[] }>();
    
    bookings.forEach(booking => {
      const vendor = vendors.find(v => v.id === booking.vendorId);
      if (!vendor) return;
      
      if (!vendorBookings.has(vendor.id)) {
        vendorBookings.set(vendor.id, { vendor, bookings: [], events: [] });
      }
      
      const data = vendorBookings.get(vendor.id)!;
      data.bookings.push(booking);
      
      const event = events.find(e => e.id === booking.eventId);
      if (event && !data.events.find(e => e.id === event.id)) {
        data.events.push(event);
      }
    });
    
    return Array.from(vendorBookings.values());
  }, [bookings, vendors, events]);

  // Handle preview parameter from vendor profile dropdown
  useEffect(() => {
    if (!previewHandled && searchString) {
      const params = new URLSearchParams(searchString);
      const previewId = params.get('preview');
      if (previewId) {
        // First check if vendor is in public list
        const vendorToPreview = vendors.find(v => v.id === previewId);
        if (vendorToPreview) {
          setSelectedVendor(vendorToPreview);
          setPreviewHandled(true);
          setLocation('/vendors', { replace: true });
        } else if (!vendorsLoading) {
          // Vendor not in public list - fetch directly (for unpublished vendors)
          fetch(`/api/vendors/${previewId}`)
            .then(res => res.ok ? res.json() : null)
            .then(vendor => {
              if (vendor) {
                setSelectedVendor(vendor);
              }
            })
            .finally(() => {
              setPreviewHandled(true);
              setLocation('/vendors', { replace: true });
            });
        }
      }
    }
  }, [vendors, vendorsLoading, searchString, previewHandled, setLocation]);

  const bookingMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      eventIds: string[];
      notes: string;
    }) => {
      // Check if user is authenticated before booking
      if (!user || user.role !== "couple") {
        throw new Error("Authentication required");
      }
      
      if (!wedding) {
        throw new Error("No wedding found");
      }

      const bookingPromises = data.eventIds.map(eventId =>
        apiRequest("POST", "/api/bookings", {
          weddingId: wedding.id,
          vendorId: data.vendorId,
          eventId: eventId,
          coupleNotes: data.notes,
          status: "pending",
        })
      );
      return Promise.all(bookingPromises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      // Also invalidate lead inbox so vendor sees the new booking immediately
      queryClient.invalidateQueries({ queryKey: ["/api/lead-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      const eventCount = variables.eventIds.length;
      toast({
        title: "Booking Request Sent",
        description: `Your request for ${eventCount} ${eventCount === 1 ? 'event' : 'events'} has been sent to the vendor.`,
      });
    },
    onError: (error: Error) => {
      if (error.message === "Authentication required") {
        toast({
          title: "Sign In Required",
          description: "Please create an account to book vendors.",
          variant: "destructive",
        });
        setLocation("/onboarding");
      } else {
        toast({
          title: "Error",
          description: "Failed to send booking request. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const offlineBookingMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      eventIds: string[];
      notes: string;
    }) => {
      if (!user || user.role !== "couple") {
        throw new Error("Authentication required");
      }
      
      if (!wedding) {
        throw new Error("No wedding found");
      }

      const bookingPromises = data.eventIds.map(eventId =>
        apiRequest("POST", "/api/bookings", {
          weddingId: wedding.id,
          vendorId: data.vendorId,
          eventId: eventId,
          coupleNotes: data.notes,
          status: "confirmed",
          bookingSource: "offline",
        })
      );
      return Promise.all(bookingPromises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      const eventCount = variables.eventIds.length;
      toast({
        title: "Vendor Marked as Booked",
        description: `${eventCount} ${eventCount === 1 ? 'event' : 'events'} marked as booked with this vendor.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save offline booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToComparison = (vendor: Vendor) => {
    if (comparisonVendors.find(v => v.id === vendor.id)) {
      setComparisonVendors(comparisonVendors.filter(v => v.id !== vendor.id));
      toast({
        title: "Removed from comparison",
        description: `${vendor.name} has been removed from your comparison list.`,
      });
    } else {
      if (comparisonVendors.length >= 4) {
        toast({
          title: "Maximum reached",
          description: "You can compare up to 4 vendors at a time.",
          variant: "destructive",
        });
        return;
      }
      setComparisonVendors([...comparisonVendors, vendor]);
      toast({
        title: "Added to comparison",
        description: `${vendor.name} has been added to your comparison list.`,
      });
    }
  };

  const handleRemoveFromComparison = (vendorId: string) => {
    setComparisonVendors(comparisonVendors.filter(v => v.id !== vendorId));
  };

  const handleClearComparison = () => {
    setComparisonVendors([]);
    setShowComparison(false);
  };

  if (vendorsLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        {!user && (
          <div className="h-16 border-b flex items-center justify-between px-6">
            <Skeleton className="h-8 w-48" />
          </div>
        )}
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Confirmed</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!user && (
        <header className="h-20 border-b flex items-center px-6 sticky top-0 z-50 bg-background">
          <img 
            src={logoUrl}
            alt="Viah.me"
            className="h-16 object-contain cursor-pointer hover-elevate rounded-md p-1"
            onClick={() => setLocation("/")}
            data-testid="img-logo-home"
          />
        </header>
      )}
      <main className="container mx-auto px-6 py-8">
        {user && user.role === "couple" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="browse" data-testid="tab-browse-vendors">
                <Search className="w-4 h-4 mr-2" />
                Browse Vendors
              </TabsTrigger>
              <TabsTrigger value="my-vendors" data-testid="tab-my-vendors">
                <Briefcase className="w-4 h-4 mr-2" />
                My Vendors ({bookedVendorsData.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              <VendorDirectory
                vendors={vendors}
                onSelectVendor={setSelectedVendor}
                tradition={wedding?.tradition}
                wedding={wedding}
                onAddToComparison={handleAddToComparison}
                comparisonVendors={comparisonVendors}
                onOpenComparison={() => setShowComparison(true)}
                isLoggedIn={!!user}
                onSubmitVendor={() => setShowSubmitVendor(true)}
              />
            </TabsContent>

            <TabsContent value="my-vendors">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">My Vendors</h1>
                  <p className="text-muted-foreground">
                    Vendors you've booked or requested for your wedding
                  </p>
                </div>

                {bookedVendorsData.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No Vendors Booked Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start browsing to find and book vendors for your wedding
                    </p>
                    <Button onClick={() => setActiveTab("browse")} data-testid="button-browse-vendors">
                      Browse Vendors
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookedVendorsData.map(({ vendor, bookings: vendorBookings, events: vendorEvents }) => {
                      const primaryCategory = vendor.categories?.[0] || 'Vendor';
                      const overallStatus = vendorBookings.some(b => b.status === 'confirmed') ? 'confirmed' 
                        : vendorBookings.some(b => b.status === 'pending') ? 'pending' : 'cancelled';
                      
                      return (
                        <Card 
                          key={vendor.id} 
                          className="overflow-hidden hover-elevate cursor-pointer"
                          onClick={() => setSelectedVendor(vendor)}
                          data-testid={`card-booked-vendor-${vendor.id}`}
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">{vendor.name}</h3>
                                <p className="text-sm text-muted-foreground">{primaryCategory}</p>
                              </div>
                              {getStatusBadge(overallStatus)}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {vendorEvents.map(event => (
                                <Badge key={event.id} variant="outline" className="text-xs">
                                  {event.name}
                                </Badge>
                              ))}
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              {vendor.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{vendor.location}</span>
                                </div>
                              )}
                              {vendor.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3" />
                                  <span>{vendor.phone}</span>
                                </div>
                              )}
                              {vendor.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{vendor.email}</span>
                                </div>
                              )}
                            </div>

                            {vendor.priceRange && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-primary">{vendor.priceRange}</span>
                                {vendor.rating && (
                                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {vendor.rating}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="pt-2 border-t flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                {getStatusIcon(overallStatus)}
                                <span className="text-muted-foreground">
                                  {vendorBookings.length} event{vendorBookings.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVendor(vendor);
                                }}
                                data-testid={`button-view-vendor-${vendor.id}`}
                              >
                                View Details
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <VendorDirectory
            vendors={vendors}
            onSelectVendor={setSelectedVendor}
            tradition={wedding?.tradition}
            wedding={wedding}
            onAddToComparison={handleAddToComparison}
            comparisonVendors={comparisonVendors}
            onOpenComparison={() => setShowComparison(true)}
            isLoggedIn={!!user}
            onSubmitVendor={() => setShowSubmitVendor(true)}
          />
        )}
      </main>

      <VendorDetailModal
        vendor={selectedVendor}
        events={events}
        open={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onBookRequest={(vendorId, eventIds, notes) => {
          bookingMutation.mutate({ vendorId, eventIds, notes });
        }}
        onOfflineBooking={(vendorId, eventIds, notes) => {
          offlineBookingMutation.mutate({ vendorId, eventIds, notes });
        }}
        isAuthenticated={!!user && user.role === "couple"}
        onAuthRequired={() => setLocation("/onboarding")}
        weddingId={wedding?.id}
        coupleName={wedding?.coupleName1 && wedding?.coupleName2 
          ? `${wedding.coupleName1} & ${wedding.coupleName2}` 
          : wedding?.coupleName1 || undefined}
        weddingDate={wedding?.date || undefined}
        tradition={wedding?.tradition || undefined}
        city={wedding?.city || undefined}
      />

      <VendorComparisonModal
        vendors={comparisonVendors}
        open={showComparison}
        onOpenChange={setShowComparison}
        onRemoveVendor={handleRemoveFromComparison}
        onClearAll={handleClearComparison}
      />

      <SubmitVendorModal
        open={showSubmitVendor}
        onOpenChange={setShowSubmitVendor}
      />
    </div>
  );
}
