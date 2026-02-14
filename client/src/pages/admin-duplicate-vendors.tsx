import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Trash2,
  Shield,
  Search,
  MapPin,
  Mail,
  Globe,
  Phone,
  Star,
  Calendar,
  FileText,
  MessageSquare,
  Heart,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";

interface VendorUsage {
  reviews: number;
  bookings: number;
  contracts: number;
  expenses: number;
  messages: number;
  favorites: number;
  leads: number;
  claims: number;
}

interface DuplicateVendor {
  id: string;
  name: string;
  slug: string;
  location: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  categories: string[];
  claimed: boolean;
  isGhostProfile: boolean;
  verified: boolean;
  createdAt: string;
  description: string;
  usage: VendorUsage;
  totalUsage: number;
}

interface DuplicateGroup {
  name: string;
  city: string | null;
  count: number;
  vendors: DuplicateVendor[];
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function AdminDuplicateVendors() {
  const { toast } = useToast();
  const [searchFilter, setSearchFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [keepSelections, setKeepSelections] = useState<Record<string, string>>({});

  const { data: groups, isLoading } = useQuery<DuplicateGroup[]>({
    queryKey: ["/api/admin/duplicate-vendors"],
  });

  const removeMutation = useMutation({
    mutationFn: async ({ keepVendorId, removeVendorIds }: { keepVendorId: string; removeVendorIds: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/duplicate-vendors/remove", { keepVendorId, removeVendorIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Duplicates removed", description: `Deleted ${data.deleted} duplicate(s) and reassigned their data.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duplicate-vendors"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove duplicates.", variant: "destructive" });
    },
  });

  const autoCleanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/duplicate-vendors/auto-clean", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Auto-clean complete", description: `Cleaned ${data.groupsCleaned} groups, deleted ${data.totalDeleted} duplicates.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duplicate-vendors"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to auto-clean duplicates.", variant: "destructive" });
    },
  });

  const cities = groups ? [...new Set(groups.map(g => g.city || "Unknown"))].sort() : [];

  const filtered = (groups || []).filter(g => {
    if (searchFilter && !g.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (cityFilter !== "all" && (g.city || "Unknown") !== cityFilter) return false;
    return true;
  });

  const totalDuplicateCount = filtered.reduce((sum, g) => sum + g.count - 1, 0);

  const getGroupKey = (g: DuplicateGroup) => `${g.name}|||${g.city || ''}`;

  const getSelectedKeepId = (group: DuplicateGroup): string => {
    const key = getGroupKey(group);
    if (keepSelections[key]) return keepSelections[key];
    const best = [...group.vendors].sort((a, b) => {
      if (a.claimed !== b.claimed) return a.claimed ? -1 : 1;
      if (a.totalUsage !== b.totalUsage) return b.totalUsage - a.totalUsage;
      if (!!a.email !== !!b.email) return a.email ? -1 : 1;
      if (!!a.website !== !!b.website) return a.website ? -1 : 1;
      return 0;
    });
    return best[0]?.id || group.vendors[0]?.id;
  };

  const handleRemoveGroup = (group: DuplicateGroup) => {
    const keepId = getSelectedKeepId(group);
    const removeIds = group.vendors.filter(v => v.id !== keepId).map(v => v.id);
    removeMutation.mutate({ keepVendorId: keepId, removeVendorIds: removeIds });
  };

  const usageLabel = (usage: VendorUsage): string => {
    const parts: string[] = [];
    if (usage.bookings) parts.push(`${usage.bookings} booking${usage.bookings > 1 ? 's' : ''}`);
    if (usage.contracts) parts.push(`${usage.contracts} contract${usage.contracts > 1 ? 's' : ''}`);
    if (usage.reviews) parts.push(`${usage.reviews} review${usage.reviews > 1 ? 's' : ''}`);
    if (usage.expenses) parts.push(`${usage.expenses} expense${usage.expenses > 1 ? 's' : ''}`);
    if (usage.messages) parts.push(`${usage.messages} message${usage.messages > 1 ? 's' : ''}`);
    if (usage.favorites) parts.push(`${usage.favorites} favorite${usage.favorites > 1 ? 's' : ''}`);
    if (usage.leads) parts.push(`${usage.leads} lead${usage.leads > 1 ? 's' : ''}`);
    if (usage.claims) parts.push(`${usage.claims} claim${usage.claims > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(", ") : "No usage";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link href="/admin" data-testid="link-back-admin">
            <Button variant="ghost" size="icon" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Duplicate Vendor Remover</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${filtered.length} duplicate groups, ${totalDuplicateCount} extra copies to remove`}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!groups?.length || autoCleanMutation.isPending}
                data-testid="button-auto-clean"
              >
                <Zap className="h-4 w-4 mr-2" />
                {autoCleanMutation.isPending ? "Cleaning..." : "Auto-Clean All"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Auto-clean all duplicates?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will automatically keep the best vendor from each duplicate group (preferring claimed vendors, those with usage data, email, and website) and delete the rest. Any relationships from deleted vendors will be reassigned to the kept vendor. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-auto-clean">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => autoCleanMutation.mutate()}
                  data-testid="button-confirm-auto-clean"
                >
                  Clean All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendor name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9"
              data-testid="input-search-vendor"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-city-filter">
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="text-lg font-medium" data-testid="text-no-duplicates">No duplicates found</p>
              <p className="text-sm text-muted-foreground">All vendors are unique.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((group) => {
              const groupKey = getGroupKey(group);
              const keepId = getSelectedKeepId(group);
              return (
                <Card key={groupKey} data-testid={`card-group-${groupKey}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {group.count} copies
                        </Badge>
                        {group.city && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <MapPin className="h-3 w-3" /> {group.city}
                          </Badge>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={removeMutation.isPending}
                            data-testid={`button-remove-group-${groupKey}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove {group.count - 1} duplicate{group.count > 2 ? 's' : ''}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove duplicates for "{group.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will keep the selected vendor and delete {group.count - 1} duplicate{group.count > 2 ? 's' : ''}. Any bookings, reviews, or other data from deleted vendors will be moved to the kept vendor. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveGroup(group)}>
                              Remove Duplicates
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Keep</TableHead>
                          <TableHead>Vendor Details</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Usage / Relationships</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.vendors.map((vendor) => {
                          const isKept = vendor.id === keepId;
                          return (
                            <TableRow
                              key={vendor.id}
                              className={isKept ? "bg-green-50/50 dark:bg-green-950/20" : "bg-red-50/30 dark:bg-red-950/10"}
                              data-testid={`row-vendor-${vendor.id}`}
                            >
                              <TableCell>
                                <input
                                  type="radio"
                                  name={`keep-${groupKey}`}
                                  checked={isKept}
                                  onChange={() => setKeepSelections(prev => ({ ...prev, [groupKey]: vendor.id }))}
                                  className="h-4 w-4"
                                  data-testid={`radio-keep-${vendor.id}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm" data-testid={`text-vendor-name-${vendor.id}`}>
                                      {vendor.name}
                                    </span>
                                    {isKept && (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-200 gap-1">
                                        <CheckCircle className="h-3 w-3" /> Keeping
                                      </Badge>
                                    )}
                                    {!isKept && (
                                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30 gap-1">
                                        <Trash2 className="h-3 w-3" /> Will remove
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    {vendor.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {vendor.location}
                                      </span>
                                    )}
                                    {vendor.categories?.slice(0, 2).map(cat => (
                                      <Badge key={cat} variant="outline" className="text-xs">
                                        {formatCategory(cat)}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                    ID: {vendor.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-xs">
                                  {vendor.email ? (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      <span className="truncate max-w-[180px]">{vendor.email}</span>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">No email</span>
                                  )}
                                  {vendor.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-muted-foreground" /> {vendor.phone}
                                    </span>
                                  )}
                                  {vendor.website && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3 text-muted-foreground" />
                                      <span className="truncate max-w-[180px]">{vendor.website}</span>
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {vendor.claimed && (
                                    <Badge variant="default" className="text-xs gap-1">
                                      <Shield className="h-3 w-3" /> Claimed
                                    </Badge>
                                  )}
                                  {vendor.verified && (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 gap-1">
                                      <CheckCircle className="h-3 w-3" /> Verified
                                    </Badge>
                                  )}
                                  {vendor.isGhostProfile && !vendor.claimed && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                                      Ghost
                                    </Badge>
                                  )}
                                  {vendor.createdAt && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(vendor.createdAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {vendor.totalUsage > 0 ? (
                                  <div className="space-y-1">
                                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 gap-1">
                                      <AlertTriangle className="h-3 w-3" /> Has data
                                    </Badge>
                                    <div className="text-xs text-muted-foreground">
                                      {usageLabel(vendor.usage)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No usage data</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
