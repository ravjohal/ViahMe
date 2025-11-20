import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Playlist, PlaylistSong, Event, InsertPlaylist, InsertPlaylistSong } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Music, ThumbsUp, Share2, Trash2, Pencil, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlaylistSchema, insertPlaylistSongSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function PlaylistsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [voterId] = useState(() => `voter_${Math.random().toString(36).substr(2, 9)}`);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<any[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings[weddings.length - 1];

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/wedding", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: songs = [] } = useQuery<PlaylistSong[]>({
    queryKey: ["/api/playlists", selectedPlaylist?.id, "songs"],
    enabled: !!selectedPlaylist?.id,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: InsertPlaylist) => {
      return await apiRequest("POST", "/api/playlists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/wedding", wedding?.id] });
      setPlaylistDialogOpen(false);
      toast({
        title: "Playlist created",
        description: "Your music playlist has been created successfully.",
      });
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async (data: InsertPlaylistSong) => {
      return await apiRequest("POST", "/api/songs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", selectedPlaylist?.id, "songs"] });
      setSongDialogOpen(false);
      toast({
        title: "Song added",
        description: "The song has been added to your playlist.",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ songId, voterName }: { songId: string; voterName?: string }) => {
      return await apiRequest("POST", "/api/votes", { songId, voterId, voterName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", selectedPlaylist?.id, "songs"] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been added!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Already voted",
        description: error?.message || "You've already voted for this song.",
        variant: "destructive",
      });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/wedding", wedding?.id] });
      setSelectedPlaylist(null);
      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed.",
      });
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/songs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", selectedPlaylist?.id, "songs"] });
      toast({
        title: "Song removed",
        description: "The song has been removed from the playlist.",
      });
    },
  });

  const playlistForm = useForm<InsertPlaylist>({
    resolver: zodResolver(insertPlaylistSchema),
    defaultValues: {
      weddingId: "",
      name: "",
      description: null,
      eventId: undefined as any,
      sharedWithVendors: null,
      isPublic: false,
    },
  });

  // Update weddingId when wedding data loads
  useEffect(() => {
    if (wedding?.id && playlistForm.getValues("weddingId") !== wedding.id) {
      playlistForm.setValue("weddingId", wedding.id);
    }
  }, [wedding?.id, playlistForm]);

  const songForm = useForm<InsertPlaylistSong>({
    resolver: zodResolver(insertPlaylistSongSchema.omit({ playlistId: true })),
    defaultValues: {
      title: "",
      artist: "",
      requestedBy: "",
      notes: "",
    },
  });

  const handleCreatePlaylist = (data: InsertPlaylist) => {
    // Ensure proper defaults for optional fields
    const playlistData: InsertPlaylist = {
      ...data,
      weddingId: wedding.id,
      sharedWithVendors: Array.isArray(data.sharedWithVendors) ? data.sharedWithVendors : null, // Ensure array or null
      isPublic: data.isPublic ?? false,
      description: data.description || null,
    };
    createPlaylistMutation.mutate(playlistData);
  };

  const handleAddSong = (data: Omit<InsertPlaylistSong, "playlistId">) => {
    if (!selectedPlaylist) return;
    addSongMutation.mutate({ ...data, playlistId: selectedPlaylist.id });
  };

  const handleVote = (songId: string) => {
    voteMutation.mutate({ songId });
  };

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-display text-3xl">Create Your Wedding Profile</CardTitle>
              <CardDescription>
                You need to complete your wedding profile before creating playlists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/")} data-testid="button-start-onboarding">
                Start Planning
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (playlistsLoading || weddingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-6">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2" data-testid="text-page-title">
              Music Playlists
            </h1>
            <p className="text-muted-foreground text-lg">
              Collaborate on music for your Sangeet and Reception
            </p>
          </div>
          <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" data-testid="button-create-playlist">
                <Plus className="w-5 h-5" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create Music Playlist</DialogTitle>
                <DialogDescription>
                  Create a collaborative playlist for your wedding event
                </DialogDescription>
              </DialogHeader>
              <Form {...playlistForm}>
                <form onSubmit={playlistForm.handleSubmit(handleCreatePlaylist)} className="space-y-6">
                  <FormField
                    control={playlistForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Playlist Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Sangeet Bangers, Reception Dance Mix"
                            data-testid="input-playlist-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={playlistForm.control}
                    name="eventId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-event">
                              <SelectValue placeholder="Select an event" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {events.map((event) => (
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
                    control={playlistForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Add notes about the vibe or style of music..."
                            data-testid="input-playlist-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPlaylistDialogOpen(false)}
                      data-testid="button-cancel-playlist"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPlaylistMutation.isPending}
                      data-testid="button-submit-playlist"
                    >
                      {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">No Playlists Yet</CardTitle>
              <CardDescription className="text-base">
                Create your first music playlist to start collaborating with family, friends, and your DJ!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => {
              const event = events.find((e) => e.id === playlist.eventId);
              return (
                <Card
                  key={playlist.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedPlaylist(playlist)}
                  data-testid={`card-playlist-${playlist.id}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-display text-xl mb-2 truncate">
                        {playlist.name}
                      </CardTitle>
                      {event && (
                        <Badge variant="secondary" className="mb-2" data-testid={`badge-event-${playlist.id}`}>
                          {event.name}
                        </Badge>
                      )}
                      {playlist.description && (
                        <CardDescription className="line-clamp-2">
                          {playlist.description}
                        </CardDescription>
                      )}
                    </div>
                    <Music className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {songs.filter((s) => s.playlistId === playlist.id).length} songs
                      </span>
                      {playlist.isPublic && (
                        <Badge variant="outline" className="gap-1">
                          <Share2 className="w-3 h-3" />
                          Shared
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Selected Playlist Detail View */}
        {selectedPlaylist && (
          <Dialog open={!!selectedPlaylist} onOpenChange={() => setSelectedPlaylist(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="font-display text-3xl mb-2">
                      {selectedPlaylist.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedPlaylist.description || "Collaborative music playlist"}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = { isPublic: !selectedPlaylist.isPublic };
                        apiRequest("PATCH", `/api/playlists/${selectedPlaylist.id}`, updated)
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/playlists/wedding", wedding?.id] });
                            toast({
                              title: updated.isPublic ? "Shared with guests" : "Made private",
                              description: updated.isPublic
                                ? "Guests can now view and vote on this playlist"
                                : "Playlist is now private",
                            });
                          });
                      }}
                      data-testid="button-toggle-share"
                    >
                      <Share2 className="w-4 h-4" />
                      {selectedPlaylist.isPublic ? "Make Private" : "Share with Guests"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this playlist?")) {
                          deletePlaylistMutation.mutate(selectedPlaylist.id);
                        }
                      }}
                      data-testid="button-delete-playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Songs ({songs.length})</h3>
                  <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-song">
                        <Plus className="w-4 h-4" />
                        Add Song
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-display text-xl">Add Song Request</DialogTitle>
                        <DialogDescription>
                          Request a song to be added to the playlist
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...songForm}>
                        <form onSubmit={songForm.handleSubmit(handleAddSong)} className="space-y-4">
                          <FormField
                            control={songForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Song Title</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Gal Mithi Mithi, Desi Girl"
                                    data-testid="input-song-title"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={songForm.control}
                            name="artist"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Artist (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="e.g., Diljit Dosanjh"
                                    data-testid="input-artist"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={songForm.control}
                            name="requestedBy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Requested By (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Your name"
                                    data-testid="input-requested-by"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={songForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Special instructions or dedications..."
                                    data-testid="input-song-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-3 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setSongDialogOpen(false)}
                              data-testid="button-cancel-song"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={addSongMutation.isPending}
                              data-testid="button-submit-song"
                            >
                              {addSongMutation.isPending ? "Adding..." : "Add Song"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {songs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No songs yet. Add your first song request!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {songs.map((song, index) => (
                      <Card key={song.id} className="hover-elevate" data-testid={`card-song-${song.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <span className="font-mono text-sm text-muted-foreground mt-1">
                                  #{index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base truncate" data-testid={`text-song-title-${song.id}`}>
                                    {song.title}
                                  </h4>
                                  {song.artist && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {song.artist}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {song.requestedBy && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  Requested by {song.requestedBy}
                                </p>
                              )}
                              {song.notes && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {song.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVote(song.id)}
                                disabled={voteMutation.isPending}
                                className="gap-2"
                                data-testid={`button-vote-${song.id}`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="font-mono font-semibold">
                                  {song.voteCount || 0}
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Remove this song from the playlist?")) {
                                    deleteSongMutation.mutate(song.id);
                                  }
                                }}
                                data-testid={`button-delete-song-${song.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
