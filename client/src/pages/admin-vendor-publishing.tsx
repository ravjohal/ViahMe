import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Search,
  Globe,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
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

interface PreviewVendor {
  id: string;
  name: string;
  category: string;
  categories: string[];
  city: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  approvalStatus: string;
  isPublished: boolean;
  claimed: boolean;
}

function buildPublishCriteria(approval: string, city: string, category: string) {
  const criteria: Record<string, any> = {};
  if (approval && approval !== "any") criteria.approvalStatus = approval;
  if (city && city !== "all") criteria.city = city;
  if (category && category !== "all") criteria.category = category;
  return criteria;
}

function buildUnpublishCriteria(city: string, category: string, reason: string) {
  const criteria: Record<string, any> = {};
  if (city && city !== "all") criteria.city = city;
  if (category && category !== "all") criteria.category = category;
  if (reason === "noEmail") criteria.noEmail = true;
  if (reason === "noWebsite") criteria.noWebsite = true;
  if (reason === "noPhone") criteria.noPhone = true;
  return criteria;
}

export default function AdminVendorPublishing() {
  const { toast } = useToast();
  const [publishCity, setPublishCity] = useState<string>("");
  const [publishCategory, setPublishCategory] = useState<string>("");
  const [publishApproval, setPublishApproval] = useState<string>("approved");
  const [unpublishCity, setUnpublishCity] = useState<string>("");
  const [unpublishCategory, setUnpublishCategory] = useState<string>("");
  const [unpublishReason, setUnpublishReason] = useState<string>("");

  const [previewVendors, setPreviewVendors] = useState<PreviewVendor[]>([]);
  const [previewMode, setPreviewMode] = useState<"publish" | "unpublish" | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: stats, isLoading } = useQuery<PublishStats>({
    queryKey: ["/api/admin/vendors/publish-stats"],
  });

  const loadPreview = useCallback(async (mode: "publish" | "unpublish") => {
    setPreviewLoading(true);
    setPreviewMode(mode);
    setSelectedIds(new Set());
    try {
      const criteria = mode === "publish"
        ? buildPublishCriteria(publishApproval, publishCity, publishCategory)
        : buildUnpublishCriteria(unpublishCity, unpublishCategory, unpublishReason);

      const res = await apiRequest("POST", "/api/admin/vendors/preview-filter", { criteria, mode });
      const data = await res.json();
      setPreviewVendors(data.vendors || []);
      const allIds = new Set((data.vendors || []).map((v: PreviewVendor) => v.id));
      setSelectedIds(allIds);
    } catch {
      toast({ title: "Error", description: "Failed to load preview", variant: "destructive" });
      setPreviewVendors([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [publishApproval, publishCity, publishCategory, unpublishCity, unpublishCategory, unpublishReason, toast]);

  const bulkPublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/admin/vendors/bulk-publish", { ids });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vendors Published",
        description: `${data.published} vendor(s) are now visible to couples.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/publish-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setPreviewVendors([]);
      setPreviewMode(null);
      setSelectedIds(new Set());
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const bulkUnpublishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/admin/vendors/bulk-unpublish", { ids });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vendors Unpublished",
        description: `${data.unpublished} vendor(s) have been hidden from couples.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors/publish-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setPreviewVendors([]);
      setPreviewMode(null);
      setSelectedIds(new Set());
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleExecute = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast({ title: "No vendors selected", description: "Select at least one vendor to proceed.", variant: "destructive" });
      return;
    }
    if (previewMode === "publish") {
      bulkPublishMutation.mutate(ids);
    } else {
      bulkUnpublishMutation.mutate(ids);
    }
  };

  const toggleVendor = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === previewVendors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(previewVendors.map(v => v.id)));
    }
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
  const isMutating = bulkPublishMutation.isPending || bulkUnpublishMutation.isPending;

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
                    These vendors have been approved but are not visible to couples. Use the
                    Bulk Publish filters below with "Approved" status to preview and publish them.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                Find unpublished vendors matching your criteria and publish them.
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
                onClick={() => loadPreview("publish")}
                disabled={previewLoading}
                variant="outline"
                className="w-full"
                data-testid="button-preview-publish"
              >
                {previewLoading && previewMode === "publish" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Preview Matching Vendors
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
                Find published vendors matching your criteria and hide them.
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
                onClick={() => loadPreview("unpublish")}
                disabled={previewLoading}
                variant="outline"
                className="w-full"
                data-testid="button-preview-unpublish"
              >
                {previewLoading && previewMode === "unpublish" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Preview Matching Vendors
              </Button>
            </CardContent>
          </Card>
        </div>

        {previewMode && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  {previewMode === "publish" ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-amber-600" />
                  )}
                  {previewMode === "publish" ? "Vendors to Publish" : "Vendors to Unpublish"}
                  <Badge variant="secondary">{previewVendors.length} found</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {previewVendors.length > 0 && (
                    <>
                      <Badge variant="outline">{selectedIds.size} selected</Badge>
                      <Button
                        onClick={handleExecute}
                        disabled={isMutating || selectedIds.size === 0}
                        size="sm"
                        data-testid="button-execute-action"
                      >
                        {isMutating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : previewMode === "publish" ? (
                          <Eye className="w-4 h-4 mr-2" />
                        ) : (
                          <EyeOff className="w-4 h-4 mr-2" />
                        )}
                        {previewMode === "publish" ? `Publish ${selectedIds.size}` : `Unpublish ${selectedIds.size}`}
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => { setPreviewMode(null); setPreviewVendors([]); setSelectedIds(new Set()); }}
                    variant="ghost"
                    size="sm"
                    data-testid="button-close-preview"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No vendors match the selected criteria.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <Checkbox
                      checked={selectedIds.size === previewVendors.length}
                      onCheckedChange={toggleAll}
                      data-testid="checkbox-select-all"
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto space-y-1">
                    {previewVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center gap-3 py-2 px-2 rounded-md hover-elevate"
                        data-testid={`row-vendor-${vendor.id}`}
                      >
                        <Checkbox
                          checked={selectedIds.has(vendor.id)}
                          onCheckedChange={() => toggleVendor(vendor.id)}
                          data-testid={`checkbox-vendor-${vendor.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{vendor.name}</span>
                            <Badge variant="secondary" className="text-xs">{vendor.category}</Badge>
                            {vendor.claimed && (
                              <Badge variant="outline" className="text-xs">Claimed</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{vendor.city || vendor.location || "No location"}</span>
                            <span className="flex items-center gap-0.5">
                              <Mail className="w-3 h-3" />
                              {vendor.email === "Yes" ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-muted-foreground/50" />
                              )}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-3 h-3" />
                              {vendor.phone === "Yes" ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-muted-foreground/50" />
                              )}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Globe className="w-3 h-3" />
                              {vendor.website === "Yes" ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-muted-foreground/50" />
                              )}
                            </span>
                            <span>Status: {vendor.approvalStatus}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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