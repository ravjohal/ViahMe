import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Search, 
  Mail, 
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Building2,
  ArrowLeft,
  Clock,
  MapPin
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import type { Vendor } from "@shared/schema";

interface BulkInviteResult {
  vendorId: string;
  success: boolean;
  message: string;
}

interface BulkInviteResponse {
  message: string;
  results: BulkInviteResult[];
  successCount: number;
  failCount: number;
}

export default function AdminBulkInvitations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [lastResults, setLastResults] = useState<BulkInviteResult[] | null>(null);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/unclaimed-with-email"],
    enabled: !!user && user.isSiteAdmin,
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async (vendorIds: string[]) => {
      const response = await apiRequest("POST", "/api/admin/vendors/bulk-claim-invitations", { vendorIds });
      return response.json() as Promise<BulkInviteResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/unclaimed-with-email"] });
      setLastResults(data.results);
      setSelectedVendorIds(new Set());
      toast({
        title: "Bulk invitations sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "An error occurred while sending invitations.",
        variant: "destructive",
      });
    },
  });

  const filteredVendors = vendors.filter(vendor => {
    const query = searchQuery.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(query) ||
      vendor.email?.toLowerCase().includes(query) ||
      vendor.city?.toLowerCase().includes(query) ||
      vendor.categories?.some(c => c.toLowerCase().includes(query))
    );
  });

  const toggleVendor = (vendorId: string) => {
    const newSet = new Set(selectedVendorIds);
    if (newSet.has(vendorId)) {
      newSet.delete(vendorId);
    } else {
      newSet.add(vendorId);
    }
    setSelectedVendorIds(newSet);
  };

  const toggleAll = () => {
    if (selectedVendorIds.size === filteredVendors.length) {
      setSelectedVendorIds(new Set());
    } else {
      setSelectedVendorIds(new Set(filteredVendors.map(v => v.id)));
    }
  };

  const handleSendInvitations = () => {
    if (selectedVendorIds.size === 0) return;
    bulkInviteMutation.mutate(Array.from(selectedVendorIds));
  };

  const hasPendingInvite = (vendor: Vendor) => {
    return vendor.claimTokenExpires && new Date(vendor.claimTokenExpires) > new Date();
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user?.isSiteAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Bulk Claim Invitations</h1>
            <p className="text-muted-foreground">
              Send claim invitations to multiple unclaimed vendors at once
            </p>
          </div>
        </div>

        {lastResults && (
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Last batch results:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {lastResults.map(result => (
                  <div key={result.vendorId} className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="truncate">{result.message}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setLastResults(null)}
                data-testid="button-dismiss-results"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Unclaimed Vendors
                </CardTitle>
                <CardDescription>
                  {vendors.length} approved vendors without an owner account
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-vendors"
                  />
                </div>
                <Button
                  onClick={handleSendInvitations}
                  disabled={selectedVendorIds.size === 0 || bulkInviteMutation.isPending}
                  data-testid="button-send-bulk-invitations"
                >
                  {bulkInviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to {selectedVendorIds.size} Selected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No unclaimed vendors found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedVendorIds.size === filteredVendors.length && filteredVendors.length > 0}
                        onCheckedChange={toggleAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map(vendor => {
                    const pendingInvite = hasPendingInvite(vendor);
                    const isSelected = selectedVendorIds.has(vendor.id);
                    
                    return (
                      <TableRow 
                        key={vendor.id}
                        className={pendingInvite ? "opacity-60" : ""}
                        data-testid={`row-vendor-${vendor.id}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleVendor(vendor.id)}
                            disabled={pendingInvite}
                            data-testid={`checkbox-vendor-${vendor.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{vendor.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {vendor.city || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {vendor.categories?.slice(0, 2).map(cat => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {formatCategory(cat)}
                              </Badge>
                            ))}
                            {(vendor.categories?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(vendor.categories?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pendingInvite ? (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Invite Pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Ready
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
