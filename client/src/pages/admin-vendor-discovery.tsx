import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  Zap,
  Eye,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Terminal,
  X,
  Settings,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { Link } from "wouter";
import type { DiscoveryJob, StagedVendor, MetroArea } from "@shared/schema";

interface DiscoveryLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, any>;
}

const SPECIALTIES = [
  "photographer",
  "videographer",
  "caterer",
  "banquet_hall",
  "decorator",
  "florist",
  "wedding_planner",
  "makeup_artist",
  "mehndi_artist",
  "dj",
  "dhol_player",
  "bridal_wear",
  "groom_wear",
  "jeweler",
  "invitation_designer",
  "turban_tier",
  "officiant",
  "sangeet_choreographer",
  "lighting",
  "transportation",
];

function formatSpecialty(s: string) {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

function statusBadge(status: string) {
  switch (status) {
    case "staged":
      return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Staged</Badge>;
    case "approved":
      return <Badge variant="default" className="bg-green-600 border-green-600" data-testid={`badge-status-${status}`}>Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Rejected</Badge>;
    case "duplicate":
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>Duplicate</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  }
}

export default function AdminVendorDiscovery() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("jobs");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("staged");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [discoveryLogs, setDiscoveryLogs] = useState<DiscoveryLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [settingsRunHour, setSettingsRunHour] = useState(2);
  const [settingsDailyCap, setSettingsDailyCap] = useState(50);

  const schedulerConfigQuery = useQuery<{ runHour: number; dailyCap: number; timezone: string }>({
    queryKey: ["/api/admin/scheduler-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/scheduler-config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scheduler config");
      return res.json();
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: { runHour?: number; dailyCap?: number }) => {
      const res = await apiRequest("PUT", "/api/admin/scheduler-config", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler-config"] });
      setSettingsRunHour(data.runHour);
      setSettingsDailyCap(data.dailyCap);
      toast({ title: "Scheduler settings updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update settings", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (schedulerConfigQuery.data) {
      setSettingsRunHour(schedulerConfigQuery.data.runHour);
      setSettingsDailyCap(schedulerConfigQuery.data.dailyCap);
    }
  }, [schedulerConfigQuery.data]);

  const metroAreasQuery = useQuery<MetroArea[]>({
    queryKey: ["/api/metro-areas/all"],
  });

  const activeMetroAreas = (metroAreasQuery.data || [])
    .filter(a => a.isActive && a.slug !== 'other')
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  const [newJob, setNewJob] = useState({
    area: "",
    specialty: SPECIALTIES[0],
    countPerRun: 20,
    maxTotal: 100,
    notes: "",
  });

  useEffect(() => {
    if (activeMetroAreas.length > 0 && !newJob.area) {
      setNewJob(prev => ({ ...prev, area: activeMetroAreas[0].label }));
    }
  }, [activeMetroAreas.length]);

  const jobsQuery = useQuery<DiscoveryJob[]>({
    queryKey: ["/api/admin/discovery-jobs"],
  });

  const stagedQuery = useQuery<StagedVendor[]>({
    queryKey: ["/api/admin/staged-vendors", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all"
        ? "/api/admin/staged-vendors"
        : `/api/admin/staged-vendors?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch staged vendors");
      return res.json();
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: typeof newJob) => {
      const res = await apiRequest("POST", "/api/admin/discovery-jobs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discovery-jobs"] });
      setCreateDialogOpen(false);
      toast({ title: "Discovery job created" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create job", description: err.message, variant: "destructive" });
    },
  });

  const toggleJobMutation = useMutation({
    mutationFn: async ({ id, paused }: { id: string; paused: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/discovery-jobs/${id}`, { paused });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discovery-jobs"] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/discovery-jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discovery-jobs"] });
      toast({ title: "Job deleted" });
    },
  });

  const runNowMutation = useMutation({
    mutationFn: async (id: string) => {
      setDiscoveryLogs([]);
      setShowLogs(true);
      setIsPolling(true);
      const res = await apiRequest("POST", `/api/admin/discovery-jobs/${id}/run-now`);
      return res.json();
    },
    onSuccess: (data: { runId: string; status: string }) => {
      setActiveRunId(data.runId);
      toast({ title: "Discovery started", description: "Running in background..." });
    },
    onError: (err: Error) => {
      setIsPolling(false);
      toast({ title: "Discovery failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!activeRunId || !isPolling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/discovery-runs/${activeRunId}`, { credentials: "include" });
        if (!res.ok) return;
        const run = await res.json();
        if (run.status === 'completed' || run.status === 'failed' || run.status === 'skipped') {
          setIsPolling(false);
          queryClient.invalidateQueries({ queryKey: ["/api/admin/discovery-jobs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/staged-vendors"] });
          if (run.status === 'completed') {
            toast({ title: "Discovery complete", description: `Staged ${run.vendorsStaged} new vendor(s), ${run.duplicatesFound} duplicate(s)` });
          } else if (run.status === 'failed') {
            toast({ title: "Discovery failed", description: run.error || "Unknown error", variant: "destructive" });
          } else {
            toast({ title: "Discovery skipped", description: "Job had no capacity or was invalid" });
          }
        }
      } catch { }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRunId, isPolling]);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/staged-vendors/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staged-vendors"] });
      toast({ title: "Vendor approved and added to platform" });
    },
    onError: (err: Error) => {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/staged-vendors/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staged-vendors"] });
      toast({ title: "Vendor rejected" });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/admin/staged-vendors/bulk-approve", { ids });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staged-vendors"] });
      setSelectedVendors(new Set());
      toast({ title: `Approved ${data.approved} vendors` });
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/admin/staged-vendors/bulk-reject", { ids });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staged-vendors"] });
      setSelectedVendors(new Set());
      toast({ title: `Rejected ${data.rejected} vendors` });
    },
  });

  const toggleSelectVendor = (id: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!stagedQuery.data) return;
    const stageable = stagedQuery.data.filter((v) => v.status === "staged");
    if (selectedVendors.size === stageable.length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(stageable.map((v) => v.id)));
    }
  };

  const jobs = jobsQuery.data || [];
  const stagedVendors = stagedQuery.data || [];
  const stageableCount = stagedVendors.filter((v) => v.status === "staged").length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back-admin">
              <ArrowLeft />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Vendor Discovery</h1>
            <p className="text-sm text-muted-foreground">
              Automated vendor discovery using AI. Configure jobs to find new vendors and review them before publishing.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-discovery">
            <TabsTrigger value="jobs" data-testid="tab-jobs">Discovery Jobs</TabsTrigger>
            <TabsTrigger value="staged" data-testid="tab-staged">
              Staged Vendors
              {stageableCount > 0 && (
                <Badge variant="secondary" className="ml-2">{stageableCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Jobs run daily at {schedulerConfigQuery.data ? formatHour(schedulerConfigQuery.data.runHour) : "..."} PST.
                  Daily cap: {schedulerConfigQuery.data?.dailyCap ?? "..."} vendors.
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  data-testid="button-toggle-settings"
                >
                  <Settings />
                </Button>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-job">
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </div>

            {showSettings && (
              <Card className="mb-4" data-testid="card-scheduler-settings">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Scheduler Settings
                  </CardTitle>
                  <CardDescription>Configure when jobs run and how many vendors can be discovered daily.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="run-hour">Run Time (PST)</Label>
                      <Select
                        value={String(settingsRunHour)}
                        onValueChange={(v) => setSettingsRunHour(Number(v))}
                      >
                        <SelectTrigger className="w-48" data-testid="select-run-hour">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)} data-testid={`option-hour-${i}`}>
                              {formatHour(i)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="daily-cap">Daily Cap (vendors)</Label>
                      <Input
                        id="daily-cap"
                        type="number"
                        min={1}
                        max={500}
                        value={settingsDailyCap}
                        onChange={(e) => setSettingsDailyCap(Number(e.target.value))}
                        className="w-32"
                        data-testid="input-daily-cap"
                      />
                    </div>
                    <Button
                      onClick={() => updateConfigMutation.mutate({ runHour: settingsRunHour, dailyCap: settingsDailyCap })}
                      disabled={updateConfigMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {updateConfigMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {jobsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No discovery jobs yet. Create one to start finding vendors automatically.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Card key={job.id} data-testid={`card-job-${job.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" data-testid={`text-job-area-${job.id}`}>{job.area}</span>
                            <Badge variant="outline">{formatSpecialty(job.specialty)}</Badge>
                            {job.isActive && !job.paused && (
                              <Badge className="bg-green-600 border-green-600">Active</Badge>
                            )}
                            {job.paused && (
                              <Badge variant="secondary">Paused</Badge>
                            )}
                            {!job.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                            <span>{job.totalDiscovered} / {job.maxTotal || "\u221E"} discovered</span>
                            <span>{job.countPerRun} per run</span>
                            {job.lastRunAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last: {new Date(job.lastRunAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {job.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{job.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => runNowMutation.mutate(job.id)}
                            disabled={runNowMutation.isPending || isPolling}
                            title="Run now"
                            data-testid={`button-run-job-${job.id}`}
                          >
                            {(runNowMutation.isPending || isPolling) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleJobMutation.mutate({ id: job.id, paused: !job.paused })}
                            title={job.paused ? "Resume" : "Pause"}
                            data-testid={`button-toggle-job-${job.id}`}
                          >
                            {job.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this discovery job?")) {
                                deleteJobMutation.mutate(job.id);
                              }
                            }}
                            title="Delete"
                            data-testid={`button-delete-job-${job.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staged" className="mt-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staged">Staged</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => stagedQuery.refetch()}
                  data-testid="button-refresh-staged"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {selectedVendors.size > 0 && statusFilter === "staged" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">{selectedVendors.size} selected</span>
                  <Button
                    size="sm"
                    onClick={() => bulkApproveMutation.mutate(Array.from(selectedVendors))}
                    disabled={bulkApproveMutation.isPending}
                    data-testid="button-bulk-approve"
                  >
                    {bulkApproveMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => bulkRejectMutation.mutate(Array.from(selectedVendors))}
                    disabled={bulkRejectMutation.isPending}
                    data-testid="button-bulk-reject"
                  >
                    {bulkRejectMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                    Reject All
                  </Button>
                </div>
              )}
            </div>

            {stagedQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : stagedVendors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No staged vendors with status "{statusFilter}". Run a discovery job to find new vendors.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {statusFilter === "staged" && stageableCount > 0 && (
                  <div className="flex items-center gap-2 px-1 py-2">
                    <Checkbox
                      checked={selectedVendors.size === stageableCount && stageableCount > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <Label className="text-sm text-muted-foreground cursor-pointer" onClick={toggleSelectAll}>
                      Select all ({stageableCount})
                    </Label>
                  </div>
                )}
                {stagedVendors.map((vendor) => (
                  <Card key={vendor.id} data-testid={`card-staged-${vendor.id}`}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        {vendor.status === "staged" && (
                          <Checkbox
                            checked={selectedVendors.has(vendor.id)}
                            onCheckedChange={() => toggleSelectVendor(vendor.id)}
                            className="mt-1"
                            data-testid={`checkbox-vendor-${vendor.id}`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" data-testid={`text-vendor-name-${vendor.id}`}>{vendor.name}</span>
                            {statusBadge(vendor.status)}
                            {vendor.categories?.map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {formatSpecialty(cat)}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            {vendor.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {vendor.location}
                              </span>
                            )}
                            {vendor.priceRange && (
                              <span>{vendor.priceRange}</span>
                            )}
                          </div>

                          {expandedVendor === vendor.id && (
                            <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                              {vendor.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{vendor.phone}</span>
                                </div>
                              )}
                              {vendor.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span>{vendor.email}</span>
                                </div>
                              )}
                              {vendor.website && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <a href={vendor.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    {vendor.website}
                                  </a>
                                </div>
                              )}
                              {vendor.culturalSpecialties && vendor.culturalSpecialties.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-muted-foreground">Cultural:</span>
                                  {vendor.culturalSpecialties.map((cs) => (
                                    <Badge key={cs} variant="outline" className="text-xs">{cs}</Badge>
                                  ))}
                                </div>
                              )}
                              {vendor.preferredWeddingTraditions && vendor.preferredWeddingTraditions.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-muted-foreground">Traditions:</span>
                                  {vendor.preferredWeddingTraditions.map((t) => (
                                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              )}
                              {vendor.notes && (
                                <p className="text-muted-foreground">{vendor.notes}</p>
                              )}
                              {vendor.specialty && (
                                <p className="text-muted-foreground">Specialty: {vendor.specialty}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                            data-testid={`button-expand-${vendor.id}`}
                          >
                            {expandedVendor === vendor.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          {vendor.status === "staged" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => approveMutation.mutate(vendor.id)}
                                disabled={approveMutation.isPending}
                                title="Approve"
                                data-testid={`button-approve-${vendor.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => rejectMutation.mutate(vendor.id)}
                                disabled={rejectMutation.isPending}
                                title="Reject"
                                data-testid={`button-reject-${vendor.id}`}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showLogs && (
          <Card className="mt-4" data-testid="card-discovery-logs">
            <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Discovery Run Logs</CardTitle>
                {isPolling && (
                  <Badge variant="secondary" className="ml-2">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Running...
                  </Badge>
                )}
                {!isPolling && discoveryLogs.length > 0 && (
                  <Badge variant="outline" className="ml-2">{discoveryLogs.length} entries</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowLogs(false)} data-testid="button-close-logs">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <div
                className="bg-muted/50 rounded-md p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-1"
                data-testid="container-log-entries"
              >
                {discoveryLogs.length === 0 && isPolling && (
                  <div className="text-muted-foreground py-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Discovery running in background...
                  </div>
                )}
                {discoveryLogs.length === 0 && !isPolling && (
                  <div className="text-muted-foreground py-4 text-center">No logs available.</div>
                )}
                {discoveryLogs.map((entry, i) => {
                  const levelColor = entry.level === 'error' ? 'text-red-500'
                    : entry.level === 'warn' ? 'text-yellow-500'
                    : entry.level === 'debug' ? 'text-muted-foreground'
                    : 'text-foreground';
                  const time = entry.timestamp.split('T')[1]?.split('.')[0] || entry.timestamp;
                  return (
                    <div key={i} className={`${levelColor} leading-relaxed`} data-testid={`log-entry-${i}`}>
                      <span className="text-muted-foreground mr-2">[{time}]</span>
                      <span className="uppercase mr-2 font-semibold">{entry.level}</span>
                      <span>{entry.message}</span>
                      {entry.data && (
                        <pre className="ml-6 text-muted-foreground whitespace-pre-wrap break-all">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discovery Job</DialogTitle>
              <DialogDescription>
                Configure automated vendor discovery for a specific area and vendor type.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Metro Area</Label>
                <Select value={newJob.area} onValueChange={(v) => setNewJob({ ...newJob, area: v })}>
                  <SelectTrigger data-testid="select-area">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMetroAreas.map((area) => (
                      <SelectItem key={area.id} value={area.label}>{area.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor Specialty</Label>
                <Select value={newJob.specialty} onValueChange={(v) => setNewJob({ ...newJob, specialty: v })}>
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{formatSpecialty(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Per Run</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={newJob.countPerRun}
                    onChange={(e) => setNewJob({ ...newJob, countPerRun: parseInt(e.target.value) || 20 })}
                    data-testid="input-count-per-run"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Total</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newJob.maxTotal}
                    onChange={(e) => setNewJob({ ...newJob, maxTotal: parseInt(e.target.value) || 100 })}
                    data-testid="input-max-total"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={newJob.notes}
                  onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                  placeholder="Any notes about this job"
                  data-testid="input-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button
                onClick={() => createJobMutation.mutate(newJob)}
                disabled={createJobMutation.isPending}
                data-testid="button-submit-create"
              >
                {createJobMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
