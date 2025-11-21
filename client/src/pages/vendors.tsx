import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VendorDirectory } from "@/components/vendor-directory";
import { VendorDetailModal } from "@/components/vendor-detail-modal";
import { VendorComparisonModal } from "@/components/vendor-comparison-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Wedding, Vendor, Event } from "@shared/schema";

export default function Vendors() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [comparisonVendors, setComparisonVendors] = useState<Vendor[]>([]);
  const [showComparison, setShowComparison] = useState(false);

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
          notes: data.notes,
          status: "pending",
        })
      );
      return Promise.all(bookingPromises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
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

  if (vendorsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <VendorDirectory
          vendors={vendors}
          onSelectVendor={setSelectedVendor}
          tradition={wedding?.tradition}
          onAddToComparison={handleAddToComparison}
          comparisonVendors={comparisonVendors}
          onOpenComparison={() => setShowComparison(true)}
        />
      </main>

      <VendorDetailModal
        vendor={selectedVendor}
        events={events}
        open={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onBookRequest={(vendorId, eventIds, notes) => {
          bookingMutation.mutate({ vendorId, eventIds, notes });
        }}
        isAuthenticated={!!user && user.role === "couple"}
        onAuthRequired={() => setLocation("/onboarding")}
      />

      <VendorComparisonModal
        vendors={comparisonVendors}
        open={showComparison}
        onOpenChange={setShowComparison}
        onRemoveVendor={handleRemoveFromComparison}
        onClearAll={handleClearComparison}
      />
    </div>
  );
}
