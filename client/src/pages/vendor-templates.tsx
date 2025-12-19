import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { VendorHeader } from "@/components/vendor-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Vendor, QuickReplyTemplate, InsertQuickReplyTemplate } from "@shared/schema";
import {
  Zap,
  Plus,
  Trash2,
  Edit,
  FileText,
  Copy,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function VendorTemplates() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState<Partial<InsertQuickReplyTemplate>>({
    name: "",
    content: "",
    category: "general",
  });
  
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "vendor",
  });
  
  const currentVendor = vendors?.find(v => v.userId === user?.id);
  const vendorId = currentVendor?.id;
  
  const { data: templates = [], isLoading: templatesLoading } = useQuery<QuickReplyTemplate[]>({
    queryKey: ["/api/quick-reply-templates/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/quick-reply-templates/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
    enabled: !!vendorId,
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertQuickReplyTemplate) => {
      return apiRequest("POST", "/api/quick-reply-templates", data);
    },
    onSuccess: () => {
      toast({ title: "Template saved successfully!" });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to save template", variant: "destructive" });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertQuickReplyTemplate> }) => {
      return apiRequest("PATCH", `/api/quick-reply-templates/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Template updated successfully!" });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/quick-reply-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/quick-reply-templates/vendor", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });
  
  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateFormData({ name: "", content: "", category: "general" });
  };
  
  const handleEditTemplate = (template: QuickReplyTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      content: template.content,
      category: template.category,
    });
    setTemplateDialogOpen(true);
  };
  
  const handleSaveTemplate = () => {
    if (!vendorId || !templateFormData.name || !templateFormData.content) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: templateFormData,
      });
    } else {
      createTemplateMutation.mutate({
        ...templateFormData,
        vendorId,
      } as InsertQuickReplyTemplate);
    }
  };
  
  const handleCopyTemplate = (template: QuickReplyTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({ title: "Template copied to clipboard" });
  };
  
  if (authLoading || vendorsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please log in as a vendor to access Templates.</p>
            <Button className="mt-4" onClick={() => setLocation("/vendor-login")}>
              Go to Vendor Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!currentVendor) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader />
        <div className="flex items-center justify-center p-6 mt-20">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
              <p className="text-muted-foreground mb-4">Complete your vendor profile to access Templates.</p>
              <Button onClick={() => setLocation("/vendor-dashboard")}>
                Set Up Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <VendorHeader />
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-7 w-7 text-primary" />
              Quick Reply Templates
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Save time with pre-written responses you can use again and again
            </p>
          </div>
          <Button 
            onClick={() => {
              resetTemplateForm();
              setTemplateDialogOpen(true);
            }}
            data-testid="button-create-template"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
        
        {templatesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No templates yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first template to speed up your replies
              </p>
              <Button 
                onClick={() => {
                  resetTemplateForm();
                  setTemplateDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover-elevate" data-testid={`template-card-${template.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Used {template.usageCount} times
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyTemplate(template)}
                        data-testid={`button-copy-template-${template.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTemplate(template)}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? "Update your quick reply template"
                : "Create a reusable message template for faster responses"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Initial Response, Pricing Info"
                value={templateFormData.name || ""}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-template-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <select
                id="template-category"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={templateFormData.category || "general"}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, category: e.target.value }))}
                data-testid="select-template-category"
              >
                <option value="general">General</option>
                <option value="pricing">Pricing</option>
                <option value="availability">Availability</option>
                <option value="follow-up">Follow Up</option>
                <option value="thank-you">Thank You</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-content">Message Content</Label>
              <Textarea
                id="template-content"
                placeholder="Write your template message here..."
                value={templateFormData.content || ""}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[150px]"
                data-testid="textarea-template-content"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) 
                ? "Saving..." 
                : editingTemplate ? "Update Template" : "Create Template"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
