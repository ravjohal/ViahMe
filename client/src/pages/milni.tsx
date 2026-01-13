import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Plus, Trash2, GripVertical, Gift, 
  DollarSign, Check, ChevronDown, ChevronUp, 
  UserPlus, Search, ArrowUpDown
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { 
  Wedding, Event, MilniList, MilniParticipant, MilniPair, 
  MilniPairWithParticipants, MilniListWithDetails 
} from "@shared/schema";
import { MILNI_RELATION_OPTIONS } from "@shared/schema";

interface SortablePairCardProps {
  pair: MilniPairWithParticipants;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (cents: number | null) => string;
}

function SortablePairCard({ pair, onEdit, onDelete, formatCurrency }: SortablePairCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pair.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const totalGifts = (pair.giftFromGroomAmount || 0) + (pair.giftFromBrideAmount || 0);

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-2 bg-card border rounded-lg p-3 hover-elevate">
      <div {...attributes} {...listeners} className="flex items-center cursor-grab active:cursor-grabbing px-1">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">#{pair.sequence + 1}</Badge>
          <span className="font-medium text-sm truncate">{pair.relationLabel || "Custom Pair"}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Bride's Side</span>
            <span className="font-medium truncate block">
              {pair.brideParticipant?.displayName || <span className="text-muted-foreground italic">Not assigned</span>}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Groom's Side</span>
            <span className="font-medium truncate block">
              {pair.groomParticipant?.displayName || <span className="text-muted-foreground italic">Not assigned</span>}
            </span>
          </div>
        </div>
        
        {totalGifts > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Gift className="h-3 w-3" />
            <span>Gifts: {formatCurrency(totalGifts)}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-pair-${pair.id}`}>
          <DollarSign className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-pair-${pair.id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MilniContent({ weddingId }: { weddingId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [isAddParticipantDialogOpen, setIsAddParticipantDialogOpen] = useState(false);
  const [isEditPairDialogOpen, setIsEditPairDialogOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<MilniPairWithParticipants | null>(null);
  const [participantSide, setParticipantSide] = useState<'bride' | 'groom'>('bride');
  
  const [newListTitle, setNewListTitle] = useState("Milni Ceremony");
  const [newListDescription, setNewListDescription] = useState("");
  const [useDefaultPairs, setUseDefaultPairs] = useState(true);
  
  const [participantName, setParticipantName] = useState("");
  const [participantRelation, setParticipantRelation] = useState("");
  const [participantPhone, setParticipantPhone] = useState("");
  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const [pairBrideParticipantId, setPairBrideParticipantId] = useState<string | null>(null);
  const [pairGroomParticipantId, setPairGroomParticipantId] = useState<string | null>(null);
  const [pairGiftFromGroomAmount, setPairGiftFromGroomAmount] = useState("");
  const [pairGiftFromGroomDescription, setPairGiftFromGroomDescription] = useState("");
  const [pairGiftFromBrideAmount, setPairGiftFromBrideAmount] = useState("");
  const [pairGiftFromBrideDescription, setPairGiftFromBrideDescription] = useState("");
  const [pairNotes, setPairNotes] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: milniLists = [], isLoading: listsLoading } = useQuery<MilniList[]>({
    queryKey: ["/api/milni/wedding", weddingId],
  });

  const { data: selectedList, isLoading: listLoading } = useQuery<MilniListWithDetails>({
    queryKey: ["/api/milni/lists", selectedListId],
    enabled: !!selectedListId,
  });

  const { data: searchResults = [] } = useQuery<Array<{ id: string; name: string; side: string; relation?: string }>>({
    queryKey: ["/api/milni/wedding", weddingId, "guests/search", { q: guestSearchQuery, side: participantSide }],
    queryFn: async () => {
      if (!guestSearchQuery || guestSearchQuery.length < 2) return [];
      const response = await fetch(`/api/milni/wedding/${weddingId}/guests/search?q=${encodeURIComponent(guestSearchQuery)}&side=${participantSide}`);
      if (!response.ok) throw new Error("Failed to search guests");
      return response.json();
    },
    enabled: guestSearchQuery.length >= 2,
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { weddingId: string; title: string; description?: string; useDefaultPairs: boolean }) => {
      const response = await apiRequest("POST", "/api/milni/lists", data);
      return response.json();
    },
    onSuccess: (list) => {
      queryClient.invalidateQueries({ queryKey: ["/api/milni/wedding", weddingId] });
      setSelectedListId(list.id);
      setIsCreateListDialogOpen(false);
      resetListForm();
      toast({ title: "Milni list created!", description: "You can now add participants and manage pairings." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create milni list.", variant: "destructive" });
    },
  });

  const createParticipantMutation = useMutation({
    mutationFn: async (data: { displayName: string; side: 'bride' | 'groom'; relation: string; guestId?: string; phone?: string }) => {
      const response = await apiRequest("POST", `/api/milni/lists/${selectedListId}/participants`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milni/lists", selectedListId] });
      setIsAddParticipantDialogOpen(false);
      resetParticipantForm();
      toast({ title: "Participant added!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add participant.", variant: "destructive" });
    },
  });

  const updatePairMutation = useMutation({
    mutationFn: async (data: { pairId: string; updates: Partial<MilniPair> }) => {
      const response = await apiRequest("PATCH", `/api/milni/pairs/${data.pairId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milni/lists", selectedListId] });
      setIsEditPairDialogOpen(false);
      setSelectedPair(null);
      resetPairForm();
      toast({ title: "Pair updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update pair.", variant: "destructive" });
    },
  });

  const deletePairMutation = useMutation({
    mutationFn: async (pairId: string) => {
      const response = await apiRequest("DELETE", `/api/milni/pairs/${pairId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milni/lists", selectedListId] });
      toast({ title: "Pair removed." });
    },
  });

  const addPairMutation = useMutation({
    mutationFn: async (data: { relationSlug?: string; relationLabel?: string }) => {
      const response = await apiRequest("POST", `/api/milni/lists/${selectedListId}/pairs`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milni/lists", selectedListId] });
      toast({ title: "New pair added!" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (pairIds: string[]) => {
      const response = await apiRequest("PUT", `/api/milni/lists/${selectedListId}/pairs/reorder`, { pairIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milni/lists", selectedListId] });
    },
  });

  const resetListForm = () => {
    setNewListTitle("Milni Ceremony");
    setNewListDescription("");
    setUseDefaultPairs(true);
  };

  const resetParticipantForm = () => {
    setParticipantName("");
    setParticipantRelation("");
    setParticipantPhone("");
    setGuestSearchQuery("");
    setSelectedGuestId(null);
  };

  const resetPairForm = () => {
    setPairBrideParticipantId(null);
    setPairGroomParticipantId(null);
    setPairGiftFromGroomAmount("");
    setPairGiftFromGroomDescription("");
    setPairGiftFromBrideAmount("");
    setPairGiftFromBrideDescription("");
    setPairNotes("");
  };

  const handleCreateList = () => {
    createListMutation.mutate({
      weddingId,
      title: newListTitle,
      description: newListDescription || undefined,
      useDefaultPairs,
    });
  };

  const handleAddParticipant = () => {
    if (!participantName.trim() || !participantRelation) {
      toast({ title: "Please fill in name and relation", variant: "destructive" });
      return;
    }
    createParticipantMutation.mutate({
      displayName: participantName.trim(),
      side: participantSide,
      relation: participantRelation,
      guestId: selectedGuestId || undefined,
      phone: participantPhone || undefined,
    });
  };

  const handleEditPair = (pair: MilniPairWithParticipants) => {
    setSelectedPair(pair);
    setPairBrideParticipantId(pair.brideParticipantId);
    setPairGroomParticipantId(pair.groomParticipantId);
    setPairGiftFromGroomAmount(pair.giftFromGroomAmount ? (pair.giftFromGroomAmount / 100).toString() : "");
    setPairGiftFromGroomDescription(pair.giftFromGroomDescription || "");
    setPairGiftFromBrideAmount(pair.giftFromBrideAmount ? (pair.giftFromBrideAmount / 100).toString() : "");
    setPairGiftFromBrideDescription(pair.giftFromBrideDescription || "");
    setPairNotes(pair.notes || "");
    setIsEditPairDialogOpen(true);
  };

  const handleSavePair = () => {
    if (!selectedPair) return;
    
    updatePairMutation.mutate({
      pairId: selectedPair.id,
      updates: {
        brideParticipantId: pairBrideParticipantId,
        groomParticipantId: pairGroomParticipantId,
        giftFromGroomAmount: pairGiftFromGroomAmount ? Math.round(parseFloat(pairGiftFromGroomAmount) * 100) : null,
        giftFromGroomDescription: pairGiftFromGroomDescription || null,
        giftFromBrideAmount: pairGiftFromBrideAmount ? Math.round(parseFloat(pairGiftFromBrideAmount) * 100) : null,
        giftFromBrideDescription: pairGiftFromBrideDescription || null,
        notes: pairNotes || null,
      },
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedList) return;

    const oldIndex = selectedList.pairs.findIndex(p => p.id === active.id);
    const newIndex = selectedList.pairs.findIndex(p => p.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(selectedList.pairs, oldIndex, newIndex);
      reorderMutation.mutate(newOrder.map(p => p.id));
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "$0";
    return `$${(cents / 100).toLocaleString()}`;
  };

  const brideParticipants = selectedList?.participants.filter(p => p.side === 'bride') || [];
  const groomParticipants = selectedList?.participants.filter(p => p.side === 'groom') || [];

  const totalGiftFromGroom = selectedList?.pairs.reduce((sum, p) => sum + (p.giftFromGroomAmount || 0), 0) || 0;
  const totalGiftFromBride = selectedList?.pairs.reduce((sum, p) => sum + (p.giftFromBrideAmount || 0), 0) || 0;

  if (listsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-milni">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="milni-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Milni List</h1>
          <p className="text-muted-foreground">
            Manage the milni ceremony pairings and track shagun gifts.
          </p>
        </div>
        {milniLists.length > 0 && (
          <Badge variant="outline" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {selectedList?.pairs.length || 0} pairings
          </Badge>
        )}
      </div>

      {milniLists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Milni List Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Create a milni list to manage the traditional garland exchange ceremony. 
              We'll help you pair family members and track shagun gifts.
            </p>
            <Button onClick={() => setIsCreateListDialogOpen(true)} data-testid="button-create-milni-list">
              <Plus className="h-4 w-4 mr-2" />
              Create Milni List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {milniLists.length > 1 && (
            <Select 
              value={selectedListId || milniLists[0]?.id} 
              onValueChange={setSelectedListId}
            >
              <SelectTrigger className="w-full max-w-xs" data-testid="select-milni-list">
                <SelectValue placeholder="Select a milni list" />
              </SelectTrigger>
              <SelectContent>
                {milniLists.map(list => (
                  <SelectItem key={list.id} value={list.id}>{list.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedList && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-lg">Milni Pairings</CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addPairMutation.mutate({ relationLabel: "Custom Pair" })}
                        data-testid="button-add-pair"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Pair
                      </Button>
                    </div>
                    <CardDescription>
                      Drag to reorder. Click the $ icon to assign participants and track gifts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedList.pairs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No pairings yet. Add pairs to start planning.
                      </p>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={selectedList.pairs.map(p => p.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {selectedList.pairs.map(pair => (
                              <SortablePairCard
                                key={pair.id}
                                pair={pair}
                                onEdit={() => handleEditPair(pair)}
                                onDelete={() => deletePairMutation.mutate(pair.id)}
                                formatCurrency={formatCurrency}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Gift Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">From Groom's Side:</span>
                      <span className="font-semibold">{formatCurrency(totalGiftFromGroom)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">From Bride's Side:</span>
                      <span className="font-semibold">{formatCurrency(totalGiftFromBride)}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                      <span className="font-medium">Total Shagun:</span>
                      <span className="font-bold text-lg">{formatCurrency(totalGiftFromGroom + totalGiftFromBride)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Participants</CardTitle>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsAddParticipantDialogOpen(true)}
                        data-testid="button-add-participant"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="bride" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="bride" className="flex-1" data-testid="tab-bride-participants">
                          Bride ({brideParticipants.length})
                        </TabsTrigger>
                        <TabsTrigger value="groom" className="flex-1" data-testid="tab-groom-participants">
                          Groom ({groomParticipants.length})
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="bride" className="mt-3">
                        {brideParticipants.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-4">
                            No participants from bride's side yet.
                          </p>
                        ) : (
                          <ScrollArea className="h-48">
                            <div className="space-y-2">
                              {brideParticipants.map(p => (
                                <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                                  <span className="font-medium truncate flex-1">{p.displayName}</span>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {p.relationLabel || p.relation}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </TabsContent>
                      <TabsContent value="groom" className="mt-3">
                        {groomParticipants.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-4">
                            No participants from groom's side yet.
                          </p>
                        ) : (
                          <ScrollArea className="h-48">
                            <div className="space-y-2">
                              {groomParticipants.map(p => (
                                <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                                  <span className="font-medium truncate flex-1">{p.displayName}</span>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {p.relationLabel || p.relation}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Milni List</DialogTitle>
            <DialogDescription>
              Set up your milni ceremony. We'll pre-populate common pairings for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-title">Title</Label>
              <Input
                id="list-title"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="Milni Ceremony"
                data-testid="input-list-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="list-description">Description (optional)</Label>
              <Textarea
                id="list-description"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Notes about the ceremony..."
                data-testid="input-list-description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-default-pairs"
                checked={useDefaultPairs}
                onChange={(e) => setUseDefaultPairs(e.target.checked)}
                className="rounded border-gray-300"
                data-testid="checkbox-use-default-pairs"
              />
              <Label htmlFor="use-default-pairs" className="text-sm">
                Pre-populate with traditional milni pairings (grandfathers, fathers, uncles, etc.)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateListDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={createListMutation.isPending} data-testid="button-confirm-create-list">
              {createListMutation.isPending ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddParticipantDialogOpen} onOpenChange={setIsAddParticipantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add a family member who will participate in the milni ceremony.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Side</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={participantSide === 'bride' ? 'default' : 'outline'}
                  onClick={() => setParticipantSide('bride')}
                  className="flex-1"
                  data-testid="button-side-bride"
                >
                  Bride's Side
                </Button>
                <Button
                  type="button"
                  variant={participantSide === 'groom' ? 'default' : 'outline'}
                  onClick={() => setParticipantSide('groom')}
                  className="flex-1"
                  data-testid="button-side-groom"
                >
                  Groom's Side
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="participant-name">Name</Label>
              <Input
                id="participant-name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter name"
                data-testid="input-participant-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-relation">Relation</Label>
              <Select value={participantRelation} onValueChange={setParticipantRelation}>
                <SelectTrigger data-testid="select-participant-relation">
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {MILNI_RELATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-phone">Phone (optional)</Label>
              <Input
                id="participant-phone"
                value={participantPhone}
                onChange={(e) => setParticipantPhone(e.target.value)}
                placeholder="Phone number"
                data-testid="input-participant-phone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddParticipantDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParticipant} disabled={createParticipantMutation.isPending} data-testid="button-confirm-add-participant">
              {createParticipantMutation.isPending ? "Adding..." : "Add Participant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPairDialogOpen} onOpenChange={setIsEditPairDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pairing</DialogTitle>
            <DialogDescription>
              Assign participants and track gifts for this milni exchange.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bride's Side Participant</Label>
                  <Select 
                    value={pairBrideParticipantId || ""} 
                    onValueChange={(v) => setPairBrideParticipantId(v || null)}
                  >
                    <SelectTrigger data-testid="select-pair-bride">
                      <SelectValue placeholder="Select participant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not assigned</SelectItem>
                      {brideParticipants.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName} ({p.relationLabel || p.relation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Groom's Side Participant</Label>
                  <Select 
                    value={pairGroomParticipantId || ""} 
                    onValueChange={(v) => setPairGroomParticipantId(v || null)}
                  >
                    <SelectTrigger data-testid="select-pair-groom">
                      <SelectValue placeholder="Select participant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not assigned</SelectItem>
                      {groomParticipants.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName} ({p.relationLabel || p.relation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift from Groom's Side to Bride's Side
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      value={pairGiftFromGroomAmount}
                      onChange={(e) => setPairGiftFromGroomAmount(e.target.value)}
                      placeholder="0.00"
                      data-testid="input-gift-from-groom-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={pairGiftFromGroomDescription}
                      onChange={(e) => setPairGiftFromGroomDescription(e.target.value)}
                      placeholder="e.g., Cash shagun"
                      data-testid="input-gift-from-groom-desc"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift from Bride's Side to Groom's Side
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      value={pairGiftFromBrideAmount}
                      onChange={(e) => setPairGiftFromBrideAmount(e.target.value)}
                      placeholder="0.00"
                      data-testid="input-gift-from-bride-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={pairGiftFromBrideDescription}
                      onChange={(e) => setPairGiftFromBrideDescription(e.target.value)}
                      placeholder="e.g., Watch, suit"
                      data-testid="input-gift-from-bride-desc"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={pairNotes}
                  onChange={(e) => setPairNotes(e.target.value)}
                  placeholder="Any notes for this pairing..."
                  data-testid="input-pair-notes"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPairDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePair} disabled={updatePairMutation.isPending} data-testid="button-save-pair">
              {updatePairMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MilniPage() {
  const { data: wedding, isLoading } = useQuery<Wedding>({
    queryKey: ["/api/weddings/current"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-wedding">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4" data-testid="no-wedding">
        <h2 className="text-xl font-semibold mb-2">No Wedding Found</h2>
        <p className="text-muted-foreground">Please complete onboarding first to access milni planning.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 px-4">
      <MilniContent weddingId={wedding.id} />
    </div>
  );
}
