import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDocumentSchema, type InsertDocument, type Document } from "@shared/schema";
import { FileText, Download, Trash2, Share2, Upload, FileCheck, Shield, Receipt, Building } from "lucide-react";
import { z } from "zod";

const uploadFormSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.enum(['contract', 'permit', 'license', 'invoice', 'receipt', 'other']),
  category: z.enum(['vendor', 'venue', 'legal', 'insurance', 'other']),
  eventId: z.string().optional(),
  notes: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

const documentTypeIcons = {
  contract: FileCheck,
  permit: Shield,
  license: Shield,
  invoice: Receipt,
  receipt: Receipt,
  other: FileText,
};

const categoryIcons = {
  vendor: Building,
  venue: Building,
  legal: Shield,
  insurance: Shield,
  other: FileText,
};

export default function Documents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>("");

  const { data: weddings } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events", wedding?.id],
    queryFn: () => (wedding?.id ? fetch(`/api/events/wedding/${wedding.id}`).then(r => r.json()) : []),
    enabled: !!wedding?.id,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents", wedding?.id],
    queryFn: () => (wedding?.id ? fetch(`/api/documents/wedding/${wedding.id}`).then(r => r.json()) : []),
    enabled: !!wedding?.id,
  });

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      name: "",
      type: "contract",
      category: "vendor",
      eventId: "",
      notes: "",
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: InsertDocument) => {
      return apiRequest("POST", "/api/documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully",
      });
      setUploadDialogOpen(false);
      form.reset();
      setUploadedFileUrl("");
      setUploadedFileName("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "Document has been removed successfully",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
    });
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      setUploadedFileUrl(file.uploadURL || "");
      setUploadedFileName(file.name || "");
      setUploadedFileSize(file.size || 0);
      setUploadedMimeType(file.type || "");
      
      if (file.name) {
        form.setValue("name", file.name);
      }
      
      toast({
        title: "File uploaded",
        description: "Now add document details and click Save Document",
      });
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!uploadedFileUrl || !wedding?.id) {
      toast({
        title: "Error",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    const normalizedUrl = uploadedFileUrl.replace("https://storage.googleapis.com", "");
    const objectPath = normalizedUrl.startsWith("/") ? `/objects${normalizedUrl.split("/").slice(3).join("/")}` : normalizedUrl;

    createDocumentMutation.mutate({
      weddingId: wedding.id,
      uploadedBy: "user-1",
      fileUrl: objectPath,
      fileSize: uploadedFileSize,
      mimeType: uploadedMimeType,
      ...data,
    });
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.fileUrl, "_blank");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (!wedding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Wedding Found</h2>
        <p className="text-muted-foreground">Please create a wedding first</p>
        <Button onClick={() => setLocation("/")} data-testid="button-start-onboarding">
          Start Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Upload and organize wedding documents, contracts, and permits</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="button-upload-document">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="text-upload-dialog-title">Upload Document</DialogTitle>
              <DialogDescription>
                Upload a document and fill in the details below
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex justify-center">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>{uploadedFileName || "Choose File to Upload"}</span>
                    </div>
                  </ObjectUploader>
                </div>

                {uploadedFileUrl && (
                  <div className="text-sm text-muted-foreground text-center">
                    File uploaded: {uploadedFileName} ({(uploadedFileSize / 1024).toFixed(2)} KB)
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Venue Contract" data-testid="input-document-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-document-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="permit">Permit</SelectItem>
                          <SelectItem value="license">License</SelectItem>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-document-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="venue">Venue</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-event">
                            <SelectValue placeholder="None - General document" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None - General document</SelectItem>
                          {events.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes" data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setUploadDialogOpen(false);
                    form.reset();
                    setUploadedFileUrl("");
                  }} data-testid="button-cancel-upload">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!uploadedFileUrl || createDocumentMutation.isPending} data-testid="button-save-document">
                    {createDocumentMutation.isPending ? "Saving..." : "Save Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center space-y-4 py-12">
            <div className="flex justify-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle>No Documents Yet</CardTitle>
            <CardDescription>
              Upload contracts, permits, and other wedding documents to keep everything organized
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedDocuments).map(([category, docs]) => {
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || FileText;
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5" />
                    {category.charAt(0).toUpperCase() + category.slice(1)} Documents
                  </CardTitle>
                  <CardDescription>
                    {docs.length} document{docs.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {docs.map((doc) => {
                      const TypeIcon = documentTypeIcons[doc.type as keyof typeof documentTypeIcons] || FileText;
                      return (
                        <div
                          key={doc.id}
                          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border hover-elevate"
                          data-testid={`document-card-${doc.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <TypeIcon className="h-8 w-8 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate" data-testid={`document-name-${doc.id}`}>{doc.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {doc.type} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : "Unknown size"}
                              </p>
                              {doc.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              data-testid={`button-download-${doc.id}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleteDocumentMutation.isPending}
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
