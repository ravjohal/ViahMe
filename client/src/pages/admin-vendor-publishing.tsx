import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  Filter,
  AlertTriangle,
} from "lucide-react";

interface PublishStats {
  total: number;
  published: number;
  unpublished: number;
  approved: number;
  approvedUnpublished: number;
  byCity: Array<{ city: string; published: number; unpublished: number }>;
  byCategory: Array<{ category: string; published: number; unpublished: number }>;
}

export default function AdminVendorPublishing() {
  const { toast } = useToast();
  const [publishCity, setPublishCity] = useState<string>("");
  const [publishCategory, setPublishCategory] = useState<string>("");
  const [publishApproval, setPublishApproval] = useState<string>("approved");
  const [unpublishCity, setUnpublishCity] = useState<string>("");
  const [unpublishCategory, setUnpublishCategory] = useState<string>("");
  const [unpublishReason, setUnpublishReason] = useState<string>("");

  const { data: stats, isLoading } = useQuery<PublishStats>({
    queryKey: ["/api/admin/vendors/publish-stats"],
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async (criteria: Record<string, any>) => {
      const res = await apiRequest("POST", "/api/admin/vendors/bulk-publish", { criteria });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vendors Published",
        description: `${data.published} vendor(s) are now visible to couples.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/publish-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const bulkUnpublishMutation = useMutation({
    mutationFn: async (criteria: Record<string, any>) => {
      const res = await apiRequest("POST", "/api/admin/vendors/bulk-unpublish", { criteria });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vendors Unpublished",
        description: `${data.unpublished} vendor(s) have been hidden from couples.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/publish-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleBulkPublish = () => {
    const criteria: Record<string, any> = {};
    if (publishApproval && publishApproval !== "any") criteria.approvalStatus = publishApproval;
    if (publishCity && publishCity !== "all") criteria.city = publishCity;
    if (publishCategory && publishCategory !== "all") criteria.category = publishCategory;
    bulkPublishMutation.mutate(criteria);
  };

  const handleBulkUnpublish = () => {
    const criteria: Record<string, any> = {};
    if (unpublishCity && unpublishCity !== "all") criteria.city = unpublishCity;
    if (unpublishCategory && unpublishCategory !== "all") criteria.category = unpublishCategory;
    if (unpublishReason === "noEmail") criteria.noEmail = true;
    if (unpublishReason === "noWebsite") criteria.noWebsite = true;
    if (unpublishReason === "noPhone") criteria.noPhone = true;
    bulkUnpublishMutation.mutate(criteria);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  const cities = stats?.byCity || [];
  const categories = stats?.byCategory || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Admin
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Vendor Publishing
            </h1>
            <p className="text-muted-foreground text-sm">
              Control which vendors are visible to couples
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold" data-testid="text-total-vendors">{stats?.total || 0}</div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600" data-testid="text-published-count">{stats?.published || 0}</div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600" data-testid="text-unpublished-count">{stats?.unpublished || 0}</div>
              <p className="text-sm text-muted-foreground">Unpublished</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600" data-testid="text-approved-unpublished">{stats?.approvedUnpublished || 0}</div>
              <p className="text-sm text-muted-foreground">Approved but Unpublished</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Bulk Publish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Make matching unpublished vendors visible to couples.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Approval Status</label>
                  <Select value={publishApproval} onValueChange={setPublishApproval}>
                    <SelectTrigger data-testid="select-publish-approval">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="any">Any Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Metro Area</label>
                  <Select value={publishCity} onValueChange={setPublishCity}>
                    <SelectTrigger data-testid="select-publish-city">
                      <SelectValue placeholder="All metro areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Metro Areas</SelectItem>
                      {cities.filter(c => c.unpublished > 0).map((c) => (
                        <SelectItem key={c.city} value={c.city}>
                          {c.city} ({c.unpublished} unpublished)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={publishCategory} onValueChange={setPublishCategory}>
                    <SelectTrigger data-testid="select-publish-category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.filter(c => c.unpublished > 0).map((c) => (
                        <SelectItem key={c.category} value={c.category}>
                          {c.category} ({c.unpublished} unpublished)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleBulkPublish}
                disabled={bulkPublishMutation.isPending}
                className="w-full"
                data-testid="button-bulk-publish"
              >
                {bulkPublishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Publish Matching Vendors
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-amber-600" />
                Bulk Unpublish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hide matching published vendors from couples.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Metro Area</label>
                  <Select value={unpublishCity} onValueChange={setUnpublishCity}>
                    <SelectTrigger data-testid="select-unpublish-city">
                      <SelectValue placeholder="All metro areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Metro Areas</SelectItem>
                      {cities.filter(c => c.published > 0).map((c) => (
                        <SelectItem key={c.city} value={c.city}>
                          {c.city} ({c.published} published)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={unpublishCategory} onValueChange={setUnpublishCategory}>
                    <SelectTrigger data-testid="select-unpublish-category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.filter(c => c.published > 0).map((c) => (
                        <SelectItem key={c.category} value={c.category}>
                          {c.category} ({c.published} published)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Data Quality Filter</label>
                  <Select value={unpublishReason} onValueChange={setUnpublishReason}>
                    <SelectTrigger data-testid="select-unpublish-reason">
                      <SelectValue placeholder="No filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Filter</SelectItem>
                      <SelectItem value="noEmail">Missing Email</SelectItem>
                      <SelectItem value="noWebsite">Missing Website</SelectItem>
                      <SelectItem value="noPhone">Missing Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleBulkUnpublish}
                disabled={bulkUnpublishMutation.isPending}
                variant="outline"
                className="w-full"
                data-testid="button-bulk-unpublish"
              >
                {bulkUnpublishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4 mr-2" />
                )}
                Unpublish Matching Vendors
              </Button>
            </CardContent>
          </Card>
        </div>

        {(stats?.approvedUnpublished || 0) > 0 && (
          <Card className="mb-8 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">
                    {stats?.approvedUnpublished} approved vendor(s) are not published
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    These vendors have been approved but are not visible to couples. You can use the
                    Bulk Publish tool above with "Approved" status to publish them all at once.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                By Metro Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vendor data available yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cities.map((c) => (
                    <div key={c.city} className="flex items-center justify-between py-1.5" data-testid={`row-city-${c.city}`}>
                      <span className="text-sm truncate mr-2">{c.city || "Unknown"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">{c.published} published</Badge>
                        {c.unpublished > 0 && (
                          <Badge variant="outline">{c.unpublished} hidden</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                By Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vendor data available yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between py-1.5" data-testid={`row-category-${c.category}`}>
                      <span className="text-sm truncate mr-2">{c.category || "Unknown"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">{c.published} published</Badge>
                        {c.unpublished > 0 && (
                          <Badge variant="outline">{c.unpublished} hidden</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}