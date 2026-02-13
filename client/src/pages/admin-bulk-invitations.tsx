import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MapPin,
  FileEdit,
  Eye,
  Save,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import type { Vendor, EmailTemplate } from "@shared/schema";

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

const DEFAULT_SUBJECT = "Claim Your Business Profile on Viah.me - {{vendorName}}";
const DEFAULT_HEADING = "Claim Your Profile on Viah.me";
const DEFAULT_BODY = `<p>Hello,</p>
<p>You're invited to claim your business profile <strong>{{vendorName}}</strong> on Viah.me, the premier South Asian wedding planning platform.</p>
<p>Claim your free profile to:</p>
<ul>
  <li>Update your photos and portfolio</li>
  <li>Respond directly to inquiries</li>
  <li>Showcase your services to engaged couples</li>
</ul>`;
const DEFAULT_CTA = "Claim Your Profile";
const DEFAULT_FOOTER = `<p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
<p style="color: #666; font-size: 12px;">If you don't want to receive these emails, you can ignore this message.</p>`;

function EmailTemplateEditor() {
  const { toast } = useToast();
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_BODY);
  const [ctaText, setCtaText] = useState(DEFAULT_CTA);
  const [footerHtml, setFooterHtml] = useState(DEFAULT_FOOTER);
  const [previewTab, setPreviewTab] = useState("edit");

  const { data: template, isLoading } = useQuery<EmailTemplate | null>({
    queryKey: ["/api/admin/email-templates", "vendor_claim_invitation"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email-templates/vendor_claim_invitation", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (template) {
      setSubject(template.subject);
      setHeading(template.heading);
      setBodyHtml(template.bodyHtml);
      setCtaText(template.ctaText || DEFAULT_CTA);
      setFooterHtml(template.footerHtml || DEFAULT_FOOTER);
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/email-templates/vendor_claim_invitation", {
        subject,
        heading,
        bodyHtml,
        ctaText,
        footerHtml,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates", "vendor_claim_invitation"] });
      toast({ title: "Template saved", description: "Your email template has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const replaceVars = (text: string) =>
    text.replace(/\{\{vendorName\}\}/g, "Elegant Events Co.").replace(/\{\{claimLink\}\}/g, "#");

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5" />
          Invitation Email Template
        </CardTitle>
        <CardDescription>
          Customize the email sent to vendors when inviting them to claim their profile.
          Use <code className="bg-muted px-1 rounded text-xs">{"{{vendorName}}"}</code> to insert the vendor's name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={previewTab} onValueChange={setPreviewTab}>
          <TabsList>
            <TabsTrigger value="edit" data-testid="tab-email-edit">
              <FileEdit className="h-4 w-4 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-email-preview">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject Line</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-heading">Email Heading</Label>
              <Input
                id="email-heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                data-testid="input-email-heading"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Body (HTML)</Label>
              <Textarea
                id="email-body"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                data-testid="textarea-email-body"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-cta">Button Text</Label>
                <Input
                  id="email-cta"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  data-testid="input-email-cta"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-footer">Footer (HTML)</Label>
              <Textarea
                id="email-footer"
                value={footerHtml}
                onChange={(e) => setFooterHtml(e.target.value)}
                rows={3}
                className="font-mono text-sm"
                data-testid="textarea-email-footer"
              />
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-template"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-md p-4 bg-white dark:bg-zinc-900">
              <div className="mb-3 pb-3 border-b">
                <span className="text-xs text-muted-foreground">Subject:</span>
                <p className="font-medium text-sm">{replaceVars(subject)}</p>
              </div>
              <div
                style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "0 auto" }}
                dangerouslySetInnerHTML={{
                  __html: `
                    <h1 style="color: #C2410C;">${replaceVars(heading)}</h1>
                    ${replaceVars(bodyHtml)}
                    <p style="margin: 30px 0;">
                      <a href="#" style="background-color: #C2410C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        ${replaceVars(ctaText)}
                      </a>
                    </p>
                    ${replaceVars(footerHtml)}
                  `,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
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

        <EmailTemplateEditor />

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
                    <TableHead className="text-center">Invites</TableHead>
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
                        data-testid={`row-vendor-${vendor.id}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleVendor(vendor.id)}
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
                          <div className="text-center text-sm font-medium">
                            {(vendor as any).claimInviteCount || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pendingInvite ? (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Invite Sent
                            </Badge>
                          ) : vendor.claimTokenExpires ? (
                            <Badge variant="secondary" className="text-xs">
                              Expired
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
