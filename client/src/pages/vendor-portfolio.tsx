import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VendorHeader } from "@/components/vendor-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAuth } from "@/hooks/use-auth";
import type { Vendor, PhotoGallery, Photo } from "@shared/schema";
import {
  Plus,
  Upload,
  Trash2,
  Image,
  Eye,
  EyeOff,
  Folder,
  MoreVertical,
  Pencil,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function VendorPortfolio() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedGallery, setSelectedGallery] = useState<PhotoGallery | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoDeleteDialogOpen, setPhotoDeleteDialogOpen] = useState(false);
  const [selectedPhotoForDelete, setSelectedPhotoForDelete] = useState<Photo | null>(null);
  
  const [newGalleryData, setNewGalleryData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });
  
  const fileUploadPathsRef = useRef<Map<string, string>>(new Map());

  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
    enabled: !!user && user.role === "vendor",
  });

  const vendorId = vendor?.id;

  const { data: galleries = [], isLoading: galleriesLoading } = useQuery<PhotoGallery[]>({
    queryKey: ["/api/galleries/vendor", vendorId],
    enabled: !!vendorId,
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos/gallery", selectedGallery?.id],
    enabled: !!selectedGallery?.id,
  });

  const createGalleryMutation = useMutation({
    mutationFn: async (data: typeof newGalleryData) => {
      if (!vendorId) throw new Error("No vendor found");
      return await apiRequest("POST", "/api/galleries", {
        ...data,
        type: "vendor_portfolio",
        vendorId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/galleries/vendor", vendorId] });
      setCreateDialogOpen(false);
      setNewGalleryData({ name: "", description: "", isPublic: true });
      toast({
        title: "Gallery Created",
        description: "Your portfolio gallery has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create gallery.",
        variant: "destructive",
      });
    },
  });

  const updateGalleryMutation = useMutation({
    mutationFn: async (data: Partial<PhotoGallery>) => {
      if (!selectedGallery) throw new Error("No gallery selected");
      return await apiRequest("PATCH", `/api/galleries/${selectedGallery.id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/galleries/vendor", vendorId] });
      setEditDialogOpen(false);
      toast({
        title: "Gallery Updated",
        description: "Your portfolio gallery has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update gallery.",
        variant: "destructive",
      });
    },
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGallery) throw new Error("No gallery selected");
      return await apiRequest("DELETE", `/api/galleries/${selectedGallery.id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/galleries/vendor", vendorId] });
      setDeleteDialogOpen(false);
      setSelectedGallery(null);
      toast({
        title: "Gallery Deleted",
        description: "Your portfolio gallery has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete gallery.",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { galleryId: string; url: string; caption?: string }) => {
      return await apiRequest("POST", "/api/photos", {
        galleryId: data.galleryId,
        url: data.url,
        caption: data.caption || "",
        order: photos.length,
      });
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/photos/gallery", variables.galleryId] });
      toast({
        title: "Photo Uploaded",
        description: "Your photo has been added to the gallery.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo.",
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return await apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/photos/gallery", selectedGallery?.id] });
      setPhotoDeleteDialogOpen(false);
      setSelectedPhotoForDelete(null);
      toast({
        title: "Photo Deleted",
        description: "The photo has been removed from your gallery.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = async (result: any) => {
    if (!selectedGallery || !result.successful?.length) return;
    
    for (const uploadedFile of result.successful) {
      const fileId = uploadedFile.id;
      const objectPath = fileUploadPathsRef.current.get(fileId);
      
      if (objectPath) {
        uploadPhotoMutation.mutate({
          galleryId: selectedGallery.id,
          url: objectPath,
        });
        fileUploadPathsRef.current.delete(fileId);
      }
    }
    
    if (result.failed?.length) {
      for (const failedFile of result.failed) {
        fileUploadPathsRef.current.delete(failedFile.id);
      }
    }
  };

  const getUploadParams = async (file?: any) => {
    const res = await fetch("/api/objects/upload", { method: "POST" });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const data = await res.json();
    
    if (file?.id) {
      fileUploadPathsRef.current.set(file.id, data.objectPath);
    }
    
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const openEditDialog = () => {
    if (selectedGallery) {
      setNewGalleryData({
        name: selectedGallery.name,
        description: selectedGallery.description || "",
        isPublic: selectedGallery.isPublic ?? true,
      });
      setEditDialogOpen(true);
    }
  };

  if (vendorLoading || galleriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
        <VendorHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
        <VendorHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Vendor Profile</h3>
              <p className="text-muted-foreground">
                Create a vendor profile first to manage your portfolio.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
      <VendorHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-muted-foreground mt-1">
              Showcase your best work to attract couples
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-gallery">
            <Plus className="w-4 h-4 mr-2" />
            New Gallery
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Galleries</CardTitle>
                <CardDescription>
                  {galleries.length} {galleries.length === 1 ? "gallery" : "galleries"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {galleries.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No galleries yet. Create your first portfolio gallery.
                    </p>
                  </div>
                ) : (
                  galleries.map((gallery) => (
                    <Card
                      key={gallery.id}
                      className={`cursor-pointer hover-elevate ${
                        selectedGallery?.id === gallery.id
                          ? "ring-2 ring-primary border-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedGallery(gallery)}
                      data-testid={`card-gallery-${gallery.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Folder className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium truncate">{gallery.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {gallery.isPublic ? (
                              <Badge variant="secondary" className="text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedGallery ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedGallery.name}
                        {selectedGallery.isPublic ? (
                          <Badge variant="secondary" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </CardTitle>
                      {selectedGallery.description && (
                        <CardDescription className="mt-1">
                          {selectedGallery.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <ObjectUploader
                        maxNumberOfFiles={10}
                        maxFileSize={10485760}
                        onGetUploadParameters={getUploadParams}
                        onComplete={handlePhotoUpload}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photos
                      </ObjectUploader>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" data-testid="button-gallery-menu">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={openEditDialog} data-testid="menu-edit-gallery">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Gallery
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                            data-testid="menu-delete-gallery"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Gallery
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {photosLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="text-center py-12">
                      <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Photos Yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload photos to showcase your work in this gallery.
                      </p>
                      <ObjectUploader
                        maxNumberOfFiles={10}
                        maxFileSize={10485760}
                        onGetUploadParameters={getUploadParams}
                        onComplete={handlePhotoUpload}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Photo
                      </ObjectUploader>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                          data-testid={`photo-${photo.id}`}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || "Portfolio photo"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => {
                                setSelectedPhotoForDelete(photo);
                                setPhotoDeleteDialogOpen(true);
                              }}
                              data-testid={`button-delete-photo-${photo.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select a Gallery</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a gallery from the left to view and manage photos, or create a new one.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-gallery">
          <DialogHeader>
            <DialogTitle>Create Portfolio Gallery</DialogTitle>
            <DialogDescription>
              Organize your work into galleries to showcase different styles or events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-name">Gallery Name</Label>
              <Input
                id="gallery-name"
                placeholder="e.g., Wedding Highlights, Reception Decor"
                value={newGalleryData.name}
                onChange={(e) => setNewGalleryData({ ...newGalleryData, name: e.target.value })}
                data-testid="input-gallery-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-description">Description (Optional)</Label>
              <Textarea
                id="gallery-description"
                placeholder="Describe this gallery..."
                value={newGalleryData.description}
                onChange={(e) => setNewGalleryData({ ...newGalleryData, description: e.target.value })}
                data-testid="input-gallery-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="gallery-public">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Couples can view public galleries on your profile
                </p>
              </div>
              <Switch
                id="gallery-public"
                checked={newGalleryData.isPublic}
                onCheckedChange={(checked) => setNewGalleryData({ ...newGalleryData, isPublic: checked })}
                data-testid="switch-gallery-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create-gallery">
              Cancel
            </Button>
            <Button
              onClick={() => createGalleryMutation.mutate(newGalleryData)}
              disabled={!newGalleryData.name.trim() || createGalleryMutation.isPending}
              data-testid="button-save-gallery"
            >
              {createGalleryMutation.isPending ? "Creating..." : "Create Gallery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-gallery">
          <DialogHeader>
            <DialogTitle>Edit Gallery</DialogTitle>
            <DialogDescription>
              Update your gallery information and visibility settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-gallery-name">Gallery Name</Label>
              <Input
                id="edit-gallery-name"
                value={newGalleryData.name}
                onChange={(e) => setNewGalleryData({ ...newGalleryData, name: e.target.value })}
                data-testid="input-edit-gallery-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gallery-description">Description</Label>
              <Textarea
                id="edit-gallery-description"
                value={newGalleryData.description}
                onChange={(e) => setNewGalleryData({ ...newGalleryData, description: e.target.value })}
                data-testid="input-edit-gallery-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-gallery-public">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Couples can view public galleries on your profile
                </p>
              </div>
              <Switch
                id="edit-gallery-public"
                checked={newGalleryData.isPublic}
                onCheckedChange={(checked) => setNewGalleryData({ ...newGalleryData, isPublic: checked })}
                data-testid="switch-edit-gallery-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit-gallery">
              Cancel
            </Button>
            <Button
              onClick={() => updateGalleryMutation.mutate({
                name: newGalleryData.name,
                description: newGalleryData.description,
                isPublic: newGalleryData.isPublic,
              })}
              disabled={!newGalleryData.name.trim() || updateGalleryMutation.isPending}
              data-testid="button-update-gallery"
            >
              {updateGalleryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gallery?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedGallery?.name}" and all photos in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-gallery">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGalleryMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-gallery"
            >
              {deleteGalleryMutation.isPending ? "Deleting..." : "Delete Gallery"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={photoDeleteDialogOpen} onOpenChange={setPhotoDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this photo from your gallery. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-photo">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPhotoForDelete && deletePhotoMutation.mutate(selectedPhotoForDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-photo"
            >
              {deletePhotoMutation.isPending ? "Deleting..." : "Delete Photo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
