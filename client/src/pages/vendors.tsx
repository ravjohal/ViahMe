import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard-header";
import { VendorDirectory } from "@/components/vendor-directory";
import { VendorDetailModal } from "@/components/vendor-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Wedding, Vendor, Event } from "@shared/schema";

export default function Vendors() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
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
      eventId: string;
      notes: string;
      estimatedCost: string;
    }) => {
      return apiRequest("POST", "/api/bookings", {
        weddingId: wedding?.id,
        vendorId: data.vendorId,
        eventId: data.eventId,
        notes: data.notes,
        estimatedCost: data.estimatedCost,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Request Sent",
        description: "The vendor will receive your request and respond soon.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect to onboarding if no wedding exists
  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  if (weddingsLoading || vendorsLoading) {
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

  if (!wedding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader wedding={wedding} />

      <main className="container mx-auto px-6 py-8">
        <VendorDirectory
          vendors={vendors}
          onSelectVendor={setSelectedVendor}
          tradition={wedding.tradition}
        />
      </main>

      <VendorDetailModal
        vendor={selectedVendor}
        events={events}
        open={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onBookRequest={(vendorId, eventId, notes, estimatedCost) => {
          bookingMutation.mutate({ vendorId, eventId, notes, estimatedCost });
        }}
      />
    </div>
  );
}
