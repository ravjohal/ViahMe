import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Upload, Trash2, Calendar, Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { PhotoGallery, Photo, Wedding, Event } from "@shared/schema";

export default function PhotoGallery() {
  const { toast } = useToast();
  const [selectedGalleryType, setSelectedGalleryType] = useState<'inspiration' | 'event_photos' | 'vendor_portfolio'>('inspiration');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<PhotoGallery | null>(null);
  
  // Form state
  const [newGallery, setNewGallery] = useState({
    name: '',
    description: '',
    type: 'inspiration' as 'inspiration' | 'vendor_portfolio' | 'event_photos',
    eventId: null as string | null,
  });

  // Fetch the most recent wedding
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ['/api/weddings'],
  });
  const wedding = weddings?.[0];

  // Fetch events for the wedding
  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events', wedding?.id],
    enabled: !!wedding?.id,
  });

  // Fetch galleries by type
  const { data: galleries, isLoading } = useQuery<PhotoGallery[]>({
    queryKey: ['/api/galleries/type', selectedGalleryType],
    enabled: !!wedding?.id,
  });

  // Fetch photos for selected gallery
  const { data: photos } = useQuery<Photo[]>({
    queryKey: ['/api/photos/gallery', selectedGallery?.id],
    enabled: !!selectedGallery?.id,
  });

  // Create gallery mutation
  const createGalleryMutation = useMutation({
    mutationFn: async (data: typeof newGallery) => {
      if (!wedding?.id) throw new Error("No wedding found");
      return await apiRequest('/api/galleries', 'POST', {
        ...data,
        weddingId: wedding.id,
        metadata: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/galleries/type'] });
      setCreateDialogOpen(false);
      setNewGallery({
        name: '',
        description: '',
        type: 'inspiration',
        eventId: null,
      });
      toast({
        title: "Gallery created",
        description: "Your photo gallery has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create gallery. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { url: string; caption?: string }) => {
      if (!selectedGallery) throw new Error("No gallery selected");
      return await apiRequest('/api/photos', 'POST', {
        galleryId: selectedGallery.id,
        url: data.url,
        caption: data.caption || '',
        tags: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos/gallery', selectedGallery?.id] });
      toast({
        title: "Photo uploaded",
        description: "Your photo has been added to the gallery.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return await apiRequest(`/api/photos/${photoId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos/gallery', selectedGallery?.id] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from the gallery.",
      });
    },
  });

  const handleCreateGallery = () => {
    createGalleryMutation.mutate(newGallery);
  };

  const getGalleryTitle = (gallery: PhotoGallery) => {
    return gallery.name || 'Untitled Gallery';
  };

  const handlePhotoUpload = (urls: string[]) => {
    urls.forEach((url) => {
      uploadPhotoMutation.mutate({ url });
    });
    setUploadDialogOpen(false);
  };

  const getGalleryIcon = (type: string) => {
    switch (type) {
      case 'inspiration':
        return <Heart className="h-5 w-5" />;
      case 'event_photos':
        return <Camera className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Photo Gallery</CardTitle>
            <CardDescription>
              Please complete the onboarding process to start managing your wedding photos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-2">Photo Gallery</h1>
          <p className="text-muted-foreground">
            Manage your inspiration boards, event photos, and vendor portfolios
          </p>
        </div>

        {/* Gallery Type Tabs */}
        <Tabs value={selectedGalleryType} onValueChange={(v) => setSelectedGalleryType(v as any)} className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="inspiration" data-testid="tab-inspiration">
                <Heart className="h-4 w-4 mr-2" />
                Inspiration Board
              </TabsTrigger>
              <TabsTrigger value="event_photos" data-testid="tab-event-photos">
                <Camera className="h-4 w-4 mr-2" />
                Event Photos
              </TabsTrigger>
            </TabsList>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-gallery">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gallery
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-create-gallery">
                <DialogHeader>
                  <DialogTitle>Create New Gallery</DialogTitle>
                  <DialogDescription>
                    Create a new photo gallery to organize your wedding inspiration or event photos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Gallery Title</Label>
                    <Input
                      id="name"
                      data-testid="input-gallery-title"
                      placeholder="e.g., Mehndi Inspiration, Sangeet Photos"
                      value={newGallery.name}
                      onChange={(e) => setNewGallery({ ...newGallery, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="input-gallery-description"
                      placeholder="Describe what this gallery is for..."
                      value={newGallery.description}
                      onChange={(e) => setNewGallery({ ...newGallery, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Gallery Type</Label>
                    <Select
                      value={newGallery.type}
                      onValueChange={(v) => setNewGallery({ ...newGallery, type: v as any })}
                    >
                      <SelectTrigger id="type" data-testid="select-gallery-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspiration">Inspiration Board</SelectItem>
                        <SelectItem value="event_photos">Event Photos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newGallery.type === 'event_photos' && (
                    <div>
                      <Label htmlFor="event">Link to Event (Optional)</Label>
                      <Select
                        value={newGallery.eventId || ''}
                        onValueChange={(v) => setNewGallery({ ...newGallery, eventId: v || null })}
                      >
                        <SelectTrigger id="event" data-testid="select-event">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel-gallery"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGallery}
                    disabled={!newGallery.name || createGalleryMutation.isPending}
                    data-testid="button-save-gallery"
                  >
                    {createGalleryMutation.isPending ? "Creating..." : "Create Gallery"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="inspiration" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-xl" />
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : galleries && galleries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleries.map((gallery) => (
                  <Card
                    key={gallery.id}
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => {
                      setSelectedGallery(gallery);
                      setUploadDialogOpen(true);
                    }}
                    data-testid={`card-gallery-${gallery.id}`}
                  >
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-t-xl flex items-center justify-center">
                      {getGalleryIcon(gallery.type)}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{getGalleryTitle(gallery)}</CardTitle>
                      <CardDescription>{gallery.description || 'No description'}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No inspiration boards yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first gallery to start collecting inspiration for your wedding.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-gallery">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Gallery
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="event_photos" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-xl" />
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : galleries && galleries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleries.map((gallery) => (
                  <Card
                    key={gallery.id}
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => {
                      setSelectedGallery(gallery);
                      setUploadDialogOpen(true);
                    }}
                    data-testid={`card-gallery-${gallery.id}`}
                  >
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-xl flex items-center justify-center">
                      {getGalleryIcon(gallery.type)}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{getGalleryTitle(gallery)}</CardTitle>
                      <CardDescription>{gallery.description || 'No description'}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No event photos yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create galleries to organize photos from your wedding events.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-event-gallery">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event Gallery
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Photo Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-gallery-photos">
            <DialogHeader>
              <DialogTitle>{selectedGallery ? getGalleryTitle(selectedGallery) : 'Gallery'}</DialogTitle>
              <DialogDescription>{selectedGallery?.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed rounded-xl p-6">
                <ObjectUploader
                  maxNumberOfFiles={10}
                  onGetUploadParameters={async () => {
                    const response = await fetch('/api/documents/upload-url');
                    const { url } = await response.json();
                    return { method: 'PUT' as const, url };
                  }}
                  onComplete={(result) => {
                    const urls = (result.successful || []).map((file: any) => {
                      const url = new URL(file.uploadURL);
                      return `${url.origin}${url.pathname}`;
                    });
                    handlePhotoUpload(urls);
                  }}
                  data-testid="uploader-photos"
                >
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload photos or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Up to 10 images at a time
                    </p>
                  </div>
                </ObjectUploader>
              </div>

              {/* Existing Photos */}
              {photos && photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Gallery Photos ({photos.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-xl overflow-hidden"
                        data-testid={`photo-${photo.id}`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Gallery photo'}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => deletePhotoMutation.mutate(photo.id)}
                            data-testid={`button-delete-photo-${photo.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-white text-sm">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
