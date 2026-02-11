import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  FileText,
  Settings,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Save,
  X,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import type { BlogPost, BlogSchedulerConfig } from "@shared/schema";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function SchedulerSettings() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<BlogSchedulerConfig>({
    queryKey: ["/api/admin/blog-scheduler-config"],
  });

  const [newTopic, setNewTopic] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BlogSchedulerConfig>) => {
      const res = await apiRequest("PUT", "/api/admin/blog-scheduler-config", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-scheduler-config"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const addTopic = () => {
    if (!newTopic.trim() || !config) return;
    const updated = [...(config.topicQueue || []), newTopic.trim()];
    updateMutation.mutate({ topicQueue: updated });
    setNewTopic("");
  };

  const removeTopic = (index: number) => {
    if (!config) return;
    const updated = (config.topicQueue || []).filter((_, i) => i !== index);
    updateMutation.mutate({ topicQueue: updated });
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!config) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Scheduler Settings
        </CardTitle>
        <CardDescription>
          Configure when and how blog posts are automatically generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-Generation Enabled</Label>
            <p className="text-sm text-muted-foreground">Generate a blog post on the configured schedule</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateMutation.mutate({ enabled })}
            data-testid="switch-scheduler-enabled"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select
              value={String(config.dayOfWeek)}
              onValueChange={(val) => updateMutation.mutate({ dayOfWeek: Number(val) })}
            >
              <SelectTrigger data-testid="select-day-of-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hour (PST)</Label>
            <Select
              value={String(config.hourPst)}
              onValueChange={(val) => updateMutation.mutate({ hourPst: Number(val) })}
            >
              <SelectTrigger data-testid="select-hour-pst">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-Publish</Label>
            <p className="text-sm text-muted-foreground">Publish posts immediately, or keep as drafts for review</p>
          </div>
          <Switch
            checked={config.autoPublish}
            onCheckedChange={(autoPublish) => updateMutation.mutate({ autoPublish })}
            data-testid="switch-auto-publish"
          />
        </div>

        <div className="space-y-3">
          <Label>Topic Queue</Label>
          <p className="text-sm text-muted-foreground">
            Queued topics will be used in order. When empty, AI picks a fresh topic automatically.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a topic, e.g. 'Navigating interfaith ceremonies'"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
              data-testid="input-new-topic"
            />
            <Button onClick={addTopic} disabled={!newTopic.trim()} data-testid="button-add-topic">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {(config.topicQueue || []).length > 0 && (
            <div className="space-y-2">
              {(config.topicQueue || []).map((topic, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                    <span className="text-sm">{topic}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTopic(i)}
                    data-testid={`button-remove-topic-${i}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GenerateButton() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [showInput, setShowInput] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (topicStr?: string) => {
      const res = await apiRequest("POST", "/api/admin/blog-posts/generate", { topic: topicStr || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      setTopic("");
      setShowInput(false);
      toast({ title: "Blog post generated", description: `"${data.title}" created as draft.` });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex items-center gap-2">
      {showInput && (
        <Input
          placeholder="Optional: specific topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-64"
          data-testid="input-generate-topic"
        />
      )}
      <Button
        variant="outline"
        onClick={() => {
          if (!showInput) {
            setShowInput(true);
          } else {
            generateMutation.mutate(topic || undefined);
          }
        }}
        disabled={generateMutation.isPending}
        data-testid="button-generate-now"
      >
        {generateMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {generateMutation.isPending ? "Generating..." : showInput ? "Generate" : "Generate Now"}
      </Button>
      {showInput && !generateMutation.isPending && (
        <Button variant="ghost" size="icon" onClick={() => { setShowInput(false); setTopic(""); }}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function PostsList() {
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog-posts"],
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/blog-posts/${id}/publish`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({ title: "Post published" });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/blog-posts/${id}/unpublish`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({ title: "Post unpublished" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/blog-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      toast({ title: "Post deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No blog posts yet. Generate your first one or wait for the scheduler.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id} data-testid={`row-blog-${post.id}`}>
            <TableCell>
              <div className="font-medium max-w-xs truncate">{post.title}</div>
              <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">{post.category}</Badge>
            </TableCell>
            <TableCell>
              {post.status === "published" ? (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Published
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Draft
                </Badge>
              )}
            </TableCell>
            <TableCell>
              {post.generatedByAi ? (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Manual</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <a href={`/blog/${post.slug}?preview=admin`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" data-testid={`button-preview-${post.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </a>
                {post.status === "draft" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => publishMutation.mutate(post.id)}
                    disabled={publishMutation.isPending}
                    data-testid={`button-publish-${post.id}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => unpublishMutation.mutate(post.id)}
                    disabled={unpublishMutation.isPending}
                    data-testid={`button-unpublish-${post.id}`}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("Delete this blog post?")) {
                      deleteMutation.mutate(post.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${post.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminBlog() {
  const { user } = useAuth();

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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Blog Management</h1>
              <p className="text-muted-foreground">
                Manage AI-generated blog posts and scheduler settings
              </p>
            </div>
          </div>
          <GenerateButton />
        </div>

        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts" data-testid="tab-posts">
              <FileText className="h-4 w-4 mr-1" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="scheduler" data-testid="tab-scheduler">
              <Settings className="h-4 w-4 mr-1" />
              Scheduler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  All Blog Posts
                </CardTitle>
                <CardDescription>
                  Manage published and draft blog posts. AI-generated posts are created as drafts for review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PostsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler" className="mt-4">
            <SchedulerSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
