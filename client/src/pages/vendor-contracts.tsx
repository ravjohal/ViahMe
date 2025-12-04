import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vendor, Contract } from "@shared/schema";
import { useLocation } from "wouter";
import { FileText, DollarSign, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

export default function VendorContracts() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

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
  const draftContracts = contracts.filter(c => c.status === "draft");
  const completedContracts = contracts.filter(c => c.status === "completed");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "signed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
      <VendorHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground mt-1">View and manage your service contracts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold" data-testid="stat-drafts">{draftContracts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold" data-testid="stat-completed">{completedContracts.length}</p>
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
              <Card key={contract.id} className="p-6" data-testid={`card-contract-${contract.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(contract.status)}
                      <h3 className="font-semibold text-lg">
                        Contract #{contract.id.slice(0, 8)}
                      </h3>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-mono font-semibold text-lg" data-testid={`text-contract-amount-${contract.id}`}>
                        ${parseFloat(contract.totalAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {contract.signedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Signed Date</p>
                        <p className="font-medium">
                          {new Date(contract.signedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {contract.contractTerms && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Contract Terms:</p>
                    <p className="text-sm bg-muted/30 p-3 rounded-lg">{contract.contractTerms}</p>
                  </div>
                )}

                {contract.paymentMilestones && Array.isArray(contract.paymentMilestones) && contract.paymentMilestones.length > 0 && (
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
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
