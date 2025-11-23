import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GuestListManager } from "@/components/guest-list-manager";
import { GuestImportDialog } from "@/components/guest-import-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestSchema, insertHouseholdSchema, type Wedding, type Guest, type Event, type Household } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Trash2, Upload, Users, Link as LinkIcon, MailCheck, Copy, Send, BarChart3, Download, QrCode } from "lucide-react";
import QRCode from "qrcode";

const guestFormSchema = insertGuestSchema.extend({
  eventIds: z.array(z.string()).optional(),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

const householdFormSchema = insertHouseholdSchema.extend({
  maxCount: z.number().min(1, "Max count must be at least 1"),
  contactEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

type HouseholdFormData = z.infer<typeof householdFormSchema>;

// CSV export utility function
function exportToCSV(households: Household[], guests: Guest[]) {
  const householdById = new Map(households.map(h => [h.id, h]));
  
  // Create CSV header
  const headers = ['Household Name', 'Affiliation', 'Relationship Tier', 'Max Seats', 'Guest Count', 'Guest Names', 'Contact Email'];
  
  // Create CSV rows
  const rows = households.map(household => {
    const householdGuests = guests.filter(g => g.householdId === household.id);
    const guestNames = householdGuests.map(g => g.name).join('; ');
    
    return [
      household.name,
      household.affiliation === 'bride' ? "Bride's Side" : household.affiliation === 'groom' ? "Groom's Side" : "Mutual",
      household.relationshipTier === 'immediate_family' ? 'Immediate Family' :
        household.relationshipTier === 'extended_family' ? 'Extended Family' :
        household.relationshipTier === 'parents_friend' ? "Parent's Friends" : 'Friends',
      household.maxCount || 0,
      householdGuests.length,
      guestNames || 'No guests added',
      household.contactEmail || 'Not provided'
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `guest-allocations-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function Guests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  // Household state
  const [householdDialogOpen, setHouseholdDialogOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [householdTokens, setHouseholdTokens] = useState<Map<string, string>>(new Map());

  // Bulk invitation state
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [selectedHouseholds, setSelectedHouseholds] = useState<string[]>([]);
  const [selectedInviteEvents, setSelectedInviteEvents] = useState<string[]>([]);
  const [personalMessage, setPersonalMessage] = useState("");

  // Allocation view filters
  const [affiliationFilter, setAffiliationFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // QR code state
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [selectedHouseholdForQR, setSelectedHouseholdForQR] = useState<Household | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: guests = [], isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: [`/api/events/${wedding?.id}`],
    enabled: !!wedding?.id,
  });

  // Fetch households
  const { data: households = [], isLoading: householdsLoading } = useQuery<Household[]>({
    queryKey: ["/api/households", wedding?.id],
    enabled: !!wedding?.id,
  });

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      side: "bride",
      rsvpStatus: "pending",
      plusOne: false,
      eventIds: [],
      weddingId: wedding?.id || "",
    },
  });

  const householdForm = useForm<HouseholdFormData>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: {
      name: "",
      contactEmail: "",
      maxCount: 1,
      affiliation: "bride",
      relationshipTier: "friend",
      weddingId: wedding?.id || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      return await apiRequest("POST", "/api/guests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest added",
        description: "Guest has been added to your list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add guest",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GuestFormData> }) => {
      return await apiRequest("PATCH", `/api/guests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest updated",
        description: "Guest has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/guests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      setSelectedEvents([]);
      toast({
        title: "Guest deleted",
        description: "Guest has been removed from your list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      });
    },
  });

  // Household mutations
  const createHouseholdMutation = useMutation({
    mutationFn: async (data: HouseholdFormData) => {
      return await apiRequest("POST", "/api/households", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      setHouseholdDialogOpen(false);
      householdForm.reset();
      toast({
        title: "Household created",
        description: "Household has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create household",
        variant: "destructive",
      });
    },
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HouseholdFormData> }) => {
      return await apiRequest("PATCH", `/api/households/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      setHouseholdDialogOpen(false);
      setEditingHousehold(null);
      householdForm.reset();
      toast({
        title: "Household updated",
        description: "Household has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update household",
        variant: "destructive",
      });
    },
  });

  const deleteHouseholdMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/households/${id}`);
    },
    onSuccess: (_, householdId) => {
      // Remove token from local state
      setHouseholdTokens(prev => {
        const newMap = new Map(prev);
        newMap.delete(householdId);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      setHouseholdDialogOpen(false);
      setEditingHousehold(null);
      householdForm.reset();
      toast({
        title: "Household deleted",
        description: "Household has been removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete household",
        variant: "destructive",
      });
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async (householdId: string) => {
      const response = await apiRequest("POST", `/api/households/${householdId}/generate-token`, {});
      const result = await response.json();
      return { householdId, token: result.token };
    },
    onSuccess: (data) => {
      // Store the token locally
      setHouseholdTokens(prev => new Map(prev).set(data.householdId, data.token));
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      
      // Auto-copy the link
      const magicLink = `${window.location.origin}/rsvp/${data.token}`;
      navigator.clipboard.writeText(magicLink).then(() => {
        toast({
          title: "Magic link generated & copied",
          description: "Invitation link has been copied to clipboard",
        });
      }).catch(() => {
        toast({
          title: "Magic link generated",
          description: "Invitation link has been generated successfully",
        });
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate magic link",
        variant: "destructive",
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (householdId: string) => {
      return await apiRequest("POST", `/api/households/${householdId}/revoke-token`, {});
    },
    onSuccess: (_, householdId) => {
      // Remove token from local state
      setHouseholdTokens(prev => {
        const newMap = new Map(prev);
        newMap.delete(householdId);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/households", wedding?.id] });
      toast({
        title: "Link revoked",
        description: "Invitation link has been revoked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke invitation link",
        variant: "destructive",
      });
    },
  });

  const handleGenerateQRCode = async (household: Household) => {
    const token = householdTokens.get(household.id);
    if (!token) {
      toast({
        title: "No invitation link",
        description: "Please generate an invitation link first",
        variant: "destructive",
      });
      return;
    }

    try {
      const rsvpUrl = `${window.location.origin}/rsvp?token=${token}`;
      const qrDataURL = await QRCode.toDataURL(rsvpUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setSelectedHouseholdForQR(household);
      setQrCodeDataURL(qrDataURL);
      setQrCodeDialogOpen(true);
    } catch (error) {
      console.error('QR code generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeDataURL || !selectedHouseholdForQR) return;

    const link = document.createElement('a');
    link.download = `qr-code-${selectedHouseholdForQR.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeDataURL;
    link.click();

    toast({
      title: "QR Code downloaded",
      description: `QR code for ${selectedHouseholdForQR.name} has been downloaded`,
    });
  };

  const sendBulkInvitationsMutation = useMutation({
    mutationFn: async (data: {
      householdIds: string[];
      weddingId: string;
      eventIds: string[];
      personalMessage?: string;
    }) => {
      const response = await apiRequest("POST", "/api/households/send-invitations", data);
      return await response.json();
    },
    onSuccess: (result) => {
      setBulkInviteDialogOpen(false);
      setSelectedHouseholds([]);
      setSelectedInviteEvents([]);
      setPersonalMessage("");
      
      toast({
        title: "Invitations sent",
        description: `Successfully sent ${result.success} invitation(s)${result.errors?.length ? `, ${result.errors.length} failed` : ""}`,
      });

      // Show detailed errors if any
      if (result.errors && result.errors.length > 0) {
        console.error("Bulk invitation errors:", result.errors);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "An error occurred while sending invitations",
        variant: "destructive",
      });
    },
  });

  const handleBulkImport = async (guests: any[]) => {
    try {
      const guestsWithWeddingId = guests.map(guest => ({
        ...guest,
        weddingId: wedding?.id || "",
      }));

      const response = await apiRequest("POST", "/api/guests/bulk", {
        guests: guestsWithWeddingId,
      });
      
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      
      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.success} guest${result.success > 1 ? 's' : ''}${result.failed > 0 ? `. ${result.failed} failed to import.` : ''}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No guests were imported. Please check your file format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while importing guests. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect to onboarding if no wedding exists
  useEffect(() => {
    if (!weddingsLoading && !wedding) {
      setLocation("/onboarding");
    }
  }, [weddingsLoading, wedding, setLocation]);

  // Update form when wedding is loaded
  useEffect(() => {
    if (wedding?.id) {
      form.setValue("weddingId", wedding.id);
    }
  }, [wedding?.id, form]);

  const handleAddGuest = () => {
    setEditingGuest(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      side: "bride" as const,
      rsvpStatus: "pending" as const,
      plusOne: false,
      eventIds: [],
      weddingId: wedding?.id || "",
    });
    setSelectedEvents([]);
    setDialogOpen(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    form.reset({
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      side: (guest.side || "bride") as "bride" | "groom" | "mutual",
      rsvpStatus: (guest.rsvpStatus || "pending") as "confirmed" | "declined" | "pending",
      plusOne: guest.plusOne || false,
      eventIds: guest.eventIds || [],
      weddingId: guest.weddingId,
    });
    setSelectedEvents(guest.eventIds || []);
    setDialogOpen(true);
  };

  const handleSubmit = (data: GuestFormData) => {
    const guestData = {
      ...data,
      eventIds: selectedEvents,
    };

    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data: guestData });
    } else {
      createMutation.mutate(guestData);
    }
  };

  const handleDelete = () => {
    if (editingGuest) {
      deleteMutation.mutate(editingGuest.id);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  // Household handlers
  const handleAddHousehold = () => {
    setEditingHousehold(null);
    householdForm.reset({
      name: "",
      contactEmail: "",
      maxCount: 1,
      affiliation: "bride" as const,
      relationshipTier: "friend" as const,
      weddingId: wedding?.id || "",
    });
    setHouseholdDialogOpen(true);
  };

  const handleEditHousehold = (household: Household) => {
    setEditingHousehold(household);
    householdForm.reset({
      name: household.name,
      contactEmail: household.contactEmail || "",
      maxCount: household.maxCount,
      affiliation: household.affiliation || "bride",
      relationshipTier: household.relationshipTier || "friend",
      weddingId: household.weddingId,
    });
    setHouseholdDialogOpen(true);
  };

  const handleHouseholdSubmit = (data: HouseholdFormData) => {
    if (editingHousehold) {
      updateHouseholdMutation.mutate({ id: editingHousehold.id, data });
    } else {
      createHouseholdMutation.mutate(data);
    }
  };

  const handleDeleteHousehold = () => {
    if (editingHousehold) {
      deleteHouseholdMutation.mutate(editingHousehold.id);
    }
  };

  const handleGenerateToken = (householdId: string) => {
    generateTokenMutation.mutate(householdId);
  };

  const handleRevokeToken = (householdId: string) => {
    revokeTokenMutation.mutate(householdId);
  };

  const handleCopyMagicLink = async (household: Household) => {
    const token = householdTokens.get(household.id);
    
    if (!token || !household.magicLinkTokenHash || !household.magicLinkExpires) {
      toast({
        title: "Token unavailable",
        description: "Please regenerate the invitation link to copy it",
        variant: "destructive",
      });
      return;
    }

    const magicLink = `${window.location.origin}/rsvp/${token}`;
    
    try {
      await navigator.clipboard.writeText(magicLink);
      toast({
        title: "Link copied",
        description: "Invitation link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Bulk invitation handlers
  const handleOpenBulkInvite = () => {
    setSelectedHouseholds([]);
    setSelectedInviteEvents([]);
    setPersonalMessage("");
    setBulkInviteDialogOpen(true);
  };

  const handleToggleHousehold = (householdId: string) => {
    setSelectedHouseholds(prev =>
      prev.includes(householdId)
        ? prev.filter(id => id !== householdId)
        : [...prev, householdId]
    );
  };

  const handleToggleInviteEvent = (eventId: string) => {
    setSelectedInviteEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSendBulkInvitations = () => {
    if (selectedHouseholds.length === 0) {
      toast({
        title: "No households selected",
        description: "Please select at least one household to send invitations",
        variant: "destructive",
      });
      return;
    }

    if (selectedInviteEvents.length === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event for the invitation",
        variant: "destructive",
      });
      return;
    }

    // Preflight validation: ensure all selected households have contact emails
    const householdsWithoutEmail = selectedHouseholds.filter(id => {
      const household = households.find(h => h.id === id);
      return !household?.contactEmail;
    });

    if (householdsWithoutEmail.length > 0) {
      toast({
        title: "Missing contact emails",
        description: `${householdsWithoutEmail.length} selected household(s) don't have contact emails. Please add them first or deselect these households.`,
        variant: "destructive",
      });
      return;
    }

    sendBulkInvitationsMutation.mutate({
      householdIds: selectedHouseholds,
      weddingId: wedding?.id || "",
      eventIds: selectedInviteEvents,
      personalMessage: personalMessage || undefined,
    });
  };

  if (weddingsLoading || guestsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b flex items-center justify-between px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="guests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="guests" data-testid="tab-guests">
              Individual Guests
            </TabsTrigger>
            <TabsTrigger value="households" data-testid="tab-households">
              <Users className="w-4 h-4 mr-2" />
              Households
            </TabsTrigger>
            <TabsTrigger value="allocation" data-testid="tab-allocation">
              <BarChart3 className="w-4 h-4 mr-2" />
              Allocation View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
            <GuestListManager
              guests={guests}
              onAddGuest={handleAddGuest}
              onImportGuests={() => setImportDialogOpen(true)}
              onEditGuest={handleEditGuest}
            />
          </TabsContent>

          <TabsContent value="households" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Household Management</h2>
                <p className="text-muted-foreground mt-1">
                  Group families together and manage invitation links
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenBulkInvite} variant="default" data-testid="button-bulk-invite">
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitations
                </Button>
                <Button onClick={handleAddHousehold} variant="outline" data-testid="button-add-household">
                  <Users className="w-4 h-4 mr-2" />
                  Add Household
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {households.map((household) => {
                const householdGuests = guests.filter(g => g.householdId === household.id);
                const hasActiveLink = household.magicLinkTokenHash && household.magicLinkExpires && new Date(household.magicLinkExpires) > new Date();

                return (
                  <Card key={household.id} className="hover-elevate" data-testid={`card-household-${household.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{household.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {household.maxCount} {household.maxCount === 1 ? 'seat' : 'seats'} • {householdGuests.length} {householdGuests.length === 1 ? 'guest' : 'guests'}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditHousehold(household)}
                          data-testid={`button-edit-household-${household.id}`}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" data-testid={`badge-affiliation-${household.id}`}>
                          {household.affiliation === 'bride' ? "Bride's Side" : household.affiliation === 'groom' ? "Groom's Side" : "Mutual"}
                        </Badge>
                        <Badge variant="secondary" data-testid={`badge-tier-${household.id}`}>
                          {household.relationshipTier?.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                        {hasActiveLink && (
                          <Badge variant="default" data-testid={`badge-link-active-${household.id}`}>
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Link Active
                          </Badge>
                        )}
                      </div>

                      {householdGuests.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium mb-1">Members:</div>
                          <ul className="space-y-0.5">
                            {householdGuests.map((guest) => (
                              <li key={guest.id}>{guest.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {hasActiveLink ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyMagicLink(household)}
                              className="flex-1"
                              data-testid={`button-copy-link-${household.id}`}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateQRCode(household)}
                              data-testid={`button-qr-code-${household.id}`}
                            >
                              <QrCode className="w-3 h-3 mr-1" />
                              QR Code
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeToken(household.id)}
                              data-testid={`button-revoke-link-${household.id}`}
                            >
                              Revoke
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateToken(household.id)}
                            className="flex-1"
                            data-testid={`button-generate-link-${household.id}`}
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Generate Link
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {households.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No households yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create households to group families together and manage invitations
                    </p>
                    <Button onClick={handleAddHousehold} data-testid="button-add-first-household">
                      <Users className="w-4 h-4 mr-2" />
                      Add Your First Household
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="allocation" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Guest Allocation Overview</h2>
                <p className="text-muted-foreground mt-1">
                  View guest counts and seat allocations by bride/groom side
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={affiliationFilter} onValueChange={setAffiliationFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-affiliation-filter">
                    <SelectValue placeholder="Filter by side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sides</SelectItem>
                    <SelectItem value="bride">Bride's Side</SelectItem>
                    <SelectItem value="groom">Groom's Side</SelectItem>
                    <SelectItem value="mutual">Mutual</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="immediate_family">Immediate Family</SelectItem>
                    <SelectItem value="extended_family">Extended Family</SelectItem>
                    <SelectItem value="friend">Friends</SelectItem>
                    <SelectItem value="parents_friend">Parent's Friends</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    const filteredHouseholds = households.filter(h => {
                      const matchesAffiliation = affiliationFilter === 'all' || h.affiliation === affiliationFilter;
                      const matchesTier = tierFilter === 'all' || h.relationshipTier === tierFilter;
                      return matchesAffiliation && matchesTier;
                    });
                    const filteredGuests = guests.filter(g => {
                      const household = households.find(h => h.id === g.householdId);
                      if (!household) return false;
                      const matchesAffiliation = affiliationFilter === 'all' || household.affiliation === affiliationFilter;
                      const matchesTier = tierFilter === 'all' || household.relationshipTier === tierFilter;
                      return matchesAffiliation && matchesTier;
                    });
                    exportToCSV(filteredHouseholds, filteredGuests);
                    toast({
                      title: "Export successful",
                      description: `Exported ${filteredHouseholds.length} households to CSV`,
                    });
                  }}
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {(() => {
              // Pre-index households by id for efficient lookups
              const householdById = new Map(households.map(h => [h.id, h]));

              // Apply filters
              const filteredHouseholds = households.filter(h => {
                const matchesAffiliation = affiliationFilter === 'all' || h.affiliation === affiliationFilter;
                const matchesTier = tierFilter === 'all' || h.relationshipTier === tierFilter;
                return matchesAffiliation && matchesTier;
              });

              const filteredGuests = guests.filter(g => {
                const household = householdById.get(g.householdId);
                if (!household) return false;
                const matchesAffiliation = affiliationFilter === 'all' || household.affiliation === affiliationFilter;
                const matchesTier = tierFilter === 'all' || household.relationshipTier === tierFilter;
                return matchesAffiliation && matchesTier;
              });

              // Calculate allocation metrics using filtered data
              const brideHouseholds = filteredHouseholds.filter(h => h.affiliation === 'bride');
              const groomHouseholds = filteredHouseholds.filter(h => h.affiliation === 'groom');
              const mutualHouseholds = filteredHouseholds.filter(h => h.affiliation === 'mutual');

              const brideSeats = brideHouseholds.reduce((sum, h) => sum + (h.maxCount || 0), 0);
              const groomSeats = groomHouseholds.reduce((sum, h) => sum + (h.maxCount || 0), 0);
              const mutualSeats = mutualHouseholds.reduce((sum, h) => sum + (h.maxCount || 0), 0);

              // Count guests by affiliation using filtered guests
              const brideGuests = filteredGuests.filter(g => {
                const household = householdById.get(g.householdId);
                return household?.affiliation === 'bride';
              });
              const groomGuests = filteredGuests.filter(g => {
                const household = householdById.get(g.householdId);
                return household?.affiliation === 'groom';
              });
              const mutualGuests = filteredGuests.filter(g => {
                const household = householdById.get(g.householdId);
                return household?.affiliation === 'mutual';
              });

              const totalSeats = brideSeats + groomSeats + mutualSeats;
              const totalGuests = brideGuests.length + groomGuests.length + mutualGuests.length;

              const tierBreakdown = (affiliationHouseholds: Household[], affiliationGuests: Guest[]) => {
                const immediate = affiliationHouseholds.filter(h => h.relationshipTier === 'immediate_family');
                const extended = affiliationHouseholds.filter(h => h.relationshipTier === 'extended_family');
                const friends = affiliationHouseholds.filter(h => h.relationshipTier === 'friend');
                const parentsF = affiliationHouseholds.filter(h => h.relationshipTier === 'parents_friend');

                // Count actual guests per tier by mapping guest to household tier
                const immediateGuests = affiliationGuests.filter(g => {
                  const household = householdById.get(g.householdId);
                  return household && household.relationshipTier === 'immediate_family';
                });
                const extendedGuests = affiliationGuests.filter(g => {
                  const household = householdById.get(g.householdId);
                  return household && household.relationshipTier === 'extended_family';
                });
                const friendGuests = affiliationGuests.filter(g => {
                  const household = householdById.get(g.householdId);
                  return household && household.relationshipTier === 'friend';
                });
                const parentsFGuests = affiliationGuests.filter(g => {
                  const household = householdById.get(g.householdId);
                  return household && household.relationshipTier === 'parents_friend';
                });

                return {
                  immediate: { 
                    households: immediate.length, 
                    seats: immediate.reduce((sum, h) => sum + (h.maxCount || 0), 0),
                    guests: immediateGuests.length
                  },
                  extended: { 
                    households: extended.length, 
                    seats: extended.reduce((sum, h) => sum + (h.maxCount || 0), 0),
                    guests: extendedGuests.length
                  },
                  friends: { 
                    households: friends.length, 
                    seats: friends.reduce((sum, h) => sum + (h.maxCount || 0), 0),
                    guests: friendGuests.length
                  },
                  parentsF: { 
                    households: parentsF.length, 
                    seats: parentsF.reduce((sum, h) => sum + (h.maxCount || 0), 0),
                    guests: parentsFGuests.length
                  },
                };
              };

              const brideTiers = tierBreakdown(brideHouseholds, brideGuests);
              const groomTiers = tierBreakdown(groomHouseholds, groomGuests);
              const mutualTiers = tierBreakdown(mutualHouseholds, mutualGuests);

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card data-testid="card-total-allocation">
                      <CardHeader className="pb-3">
                        <CardDescription>Total Allocation</CardDescription>
                        <CardTitle className="text-3xl">{totalSeats}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {households.length} households • {totalGuests} guests added
                        </p>
                      </CardContent>
                    </Card>

                    <Card data-testid="card-bride-allocation" className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardDescription>Bride's Side</CardDescription>
                        <CardTitle className="text-3xl">{brideSeats}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {brideHouseholds.length} households • {brideGuests.length} guests
                        </p>
                      </CardContent>
                    </Card>

                    <Card data-testid="card-groom-allocation" className="border-l-4 border-l-accent">
                      <CardHeader className="pb-3">
                        <CardDescription>Groom's Side</CardDescription>
                        <CardTitle className="text-3xl">{groomSeats}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {groomHouseholds.length} households • {groomGuests.length} guests
                        </p>
                      </CardContent>
                    </Card>

                    <Card data-testid="card-mutual-allocation" className="border-l-4 border-l-muted">
                      <CardHeader className="pb-3">
                        <CardDescription>Mutual</CardDescription>
                        <CardTitle className="text-3xl">{mutualSeats}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {mutualHouseholds.length} households • {mutualGuests.length} guests
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bride's Side Breakdown */}
                    <Card data-testid="breakdown-bride">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          Bride's Side Breakdown
                        </CardTitle>
                        <CardDescription>{brideHouseholds.length} total households</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Immediate Family</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{brideTiers.immediate.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{brideTiers.immediate.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Extended Family</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{brideTiers.extended.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{brideTiers.extended.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Friends</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{brideTiers.friends.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{brideTiers.friends.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Parent's Friends</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{brideTiers.parentsF.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{brideTiers.parentsF.seats} seats</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Groom's Side Breakdown */}
                    <Card data-testid="breakdown-groom">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-accent" />
                          Groom's Side Breakdown
                        </CardTitle>
                        <CardDescription>{groomHouseholds.length} total households</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Immediate Family</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{groomTiers.immediate.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{groomTiers.immediate.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Extended Family</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{groomTiers.extended.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{groomTiers.extended.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Friends</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{groomTiers.friends.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{groomTiers.friends.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Parent's Friends</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{groomTiers.parentsF.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{groomTiers.parentsF.seats} seats</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mutual Breakdown */}
                    <Card data-testid="breakdown-mutual">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                          Mutual Breakdown
                        </CardTitle>
                        <CardDescription>{mutualHouseholds.length} total households</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Immediate Family</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{mutualTiers.immediate.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{mutualTiers.immediate.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Extended Family</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{mutualTiers.extended.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{mutualTiers.extended.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Friends</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{mutualTiers.friends.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{mutualTiers.friends.seats} seats</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Parent's Friends</span>
                            <div className="flex flex-col items-end">
                              <Badge variant="outline">{mutualTiers.parentsF.guests} guests</Badge>
                              <span className="text-xs text-muted-foreground">{mutualTiers.parentsF.seats} seats</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Empty State */}
                  {households.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No allocation data yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create households to see guest allocation breakdowns by bride/groom side
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}
          </TabsContent>
        </Tabs>
      </main>

      <GuestImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        weddingId={wedding.id}
        events={events}
        onImport={handleBulkImport}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-guest">
              {editingGuest ? "Edit Guest" : "Add Guest"}
            </DialogTitle>
            <DialogDescription>
              {editingGuest
                ? "Update guest information and event assignments"
                : "Add a new guest to your wedding"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Guest name"
                  data-testid="input-guest-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="guest@example.com"
                  data-testid="input-guest-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="(555) 123-4567"
                  data-testid="input-guest-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="side">
                  Side <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("side")}
                  onValueChange={(value) => form.setValue("side", value as "bride" | "groom" | "mutual")}
                >
                  <SelectTrigger id="side" data-testid="select-guest-side">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">Bride's Side</SelectItem>
                    <SelectItem value="groom">Groom's Side</SelectItem>
                    <SelectItem value="mutual">Mutual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rsvpStatus">
                  RSVP Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("rsvpStatus")}
                  onValueChange={(value) => form.setValue("rsvpStatus", value as "confirmed" | "declined" | "pending")}
                >
                  <SelectTrigger id="rsvpStatus" data-testid="select-guest-rsvp">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="plusOne"
                  checked={form.watch("plusOne") || false}
                  onCheckedChange={(checked) => form.setValue("plusOne", !!checked)}
                  data-testid="checkbox-guest-plus-one"
                />
                <Label htmlFor="plusOne" className="cursor-pointer">
                  Plus One
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Event Assignments</Label>
              <p className="text-sm text-muted-foreground">
                Select which events this guest will attend
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No events created yet. Add events to assign guests.
                  </p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        data-testid={`checkbox-event-${event.id}`}
                      />
                      <Label
                        htmlFor={`event-${event.id}`}
                        className="cursor-pointer flex-1"
                      >
                        {event.name}
                        {event.date && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({new Date(event.date).toLocaleDateString()})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-between">
              {editingGuest && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-guest"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-guest"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-guest"
                >
                  {editingGuest ? "Update Guest" : "Add Guest"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={householdDialogOpen} onOpenChange={setHouseholdDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-household">
              {editingHousehold ? "Edit Household" : "Add Household"}
            </DialogTitle>
            <DialogDescription>
              {editingHousehold
                ? "Update household information and allocation"
                : "Create a new household group for your wedding"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={householdForm.handleSubmit(handleHouseholdSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="household-name">
                Household Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="household-name"
                {...householdForm.register("name")}
                placeholder="e.g., The Patel Family"
                data-testid="input-household-name"
              />
              {householdForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {householdForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-contactEmail">
                Contact Email
              </Label>
              <Input
                id="household-contactEmail"
                type="email"
                {...householdForm.register("contactEmail")}
                placeholder="e.g., patel@example.com"
                data-testid="input-household-contact-email"
              />
              {householdForm.formState.errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {householdForm.formState.errors.contactEmail.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Email address for sending invitations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-maxCount">
                Max Seats <span className="text-destructive">*</span>
              </Label>
              <Input
                id="household-maxCount"
                type="number"
                min="1"
                {...householdForm.register("maxCount", { valueAsNumber: true })}
                placeholder="e.g., 4"
                data-testid="input-household-max-count"
              />
              {householdForm.formState.errors.maxCount && (
                <p className="text-sm text-destructive">
                  {householdForm.formState.errors.maxCount.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Total number of people in this household
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-affiliation">
                Affiliation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={householdForm.watch("affiliation")}
                onValueChange={(value) => householdForm.setValue("affiliation", value as "bride" | "groom" | "mutual")}
              >
                <SelectTrigger id="household-affiliation" data-testid="select-household-affiliation">
                  <SelectValue placeholder="Select affiliation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride's Side</SelectItem>
                  <SelectItem value="groom">Groom's Side</SelectItem>
                  <SelectItem value="mutual">Mutual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="household-tier">
                Relationship Tier <span className="text-destructive">*</span>
              </Label>
              <Select
                value={householdForm.watch("relationshipTier")}
                onValueChange={(value) => householdForm.setValue("relationshipTier", value)}
              >
                <SelectTrigger id="household-tier" data-testid="select-household-tier">
                  <SelectValue placeholder="Select relationship tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate_family">Immediate Family</SelectItem>
                  <SelectItem value="extended_family">Extended Family</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="parents_friend">Parent's Friend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 justify-between pt-4 border-t">
              {editingHousehold && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteHousehold}
                  disabled={deleteHouseholdMutation.isPending}
                  data-testid="button-delete-household"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHouseholdDialogOpen(false)}
                  data-testid="button-cancel-household"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createHouseholdMutation.isPending || updateHouseholdMutation.isPending}
                  data-testid="button-save-household"
                >
                  {editingHousehold ? "Update Household" : "Add Household"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-bulk-invite">Send Bulk Invitations</DialogTitle>
            <DialogDescription>
              Select households and events to send invitation emails with magic RSVP links
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Household Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Households</Label>
              <p className="text-sm text-muted-foreground">
                Choose which families should receive invitations
              </p>
              <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                {households.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No households available. Create households first.
                  </p>
                ) : (
                  households.map((household) => {
                    const householdGuests = guests.filter(g => g.householdId === household.id);
                    const missingEmail = !household.contactEmail;
                    
                    return (
                      <div
                        key={household.id}
                        className={`flex items-start space-x-3 p-2 rounded ${!missingEmail ? 'hover-elevate' : 'opacity-60'}`}
                        data-testid={`checkbox-household-${household.id}`}
                      >
                        <Checkbox
                          id={`household-${household.id}`}
                          checked={selectedHouseholds.includes(household.id)}
                          onCheckedChange={() => {
                            if (!missingEmail) {
                              handleToggleHousehold(household.id);
                            }
                          }}
                          disabled={missingEmail}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`household-${household.id}`}
                            className={`text-sm font-medium ${!missingEmail ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          >
                            {household.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {householdGuests.length} {householdGuests.length === 1 ? 'guest' : 'guests'}
                            {household.contactEmail && ` • ${household.contactEmail}`}
                          </p>
                          {missingEmail && (
                            <p className="text-xs text-destructive mt-1">
                              No contact email - please add one to send invitations
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedHouseholds.length} household{selectedHouseholds.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Event Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Events</Label>
              <p className="text-sm text-muted-foreground">
                Choose which events to include in the invitation
              </p>
              <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events available
                  </p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-2 rounded hover-elevate"
                      data-testid={`checkbox-event-${event.id}`}
                    >
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={selectedInviteEvents.includes(event.id)}
                        onCheckedChange={() => handleToggleInviteEvent(event.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`event-${event.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {event.name}
                        </label>
                        {event.date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedInviteEvents.length} event{selectedInviteEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Personal Message */}
            <div className="space-y-2">
              <Label htmlFor="personal-message">Personal Message (Optional)</Label>
              <Textarea
                id="personal-message"
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                rows={4}
                data-testid="textarea-personal-message"
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the invitation email
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedHouseholds.length > 0 && selectedInviteEvents.length > 0 && (
                  <span>
                    Ready to send {selectedHouseholds.length} invitation{selectedHouseholds.length !== 1 ? 's' : ''} for {selectedInviteEvents.length} event{selectedInviteEvents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkInviteDialogOpen(false)}
                  data-testid="button-cancel-bulk-invite"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBulkInvitations}
                  disabled={sendBulkInvitationsMutation.isPending || selectedHouseholds.length === 0 || selectedInviteEvents.length === 0}
                  data-testid="button-send-bulk-invitations"
                >
                  {sendBulkInvitationsMutation.isPending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-qr-code">
          <DialogHeader>
            <DialogTitle>QR Code for {selectedHouseholdForQR?.name}</DialogTitle>
            <DialogDescription>
              Scan this QR code to access the RSVP portal. You can download and print it on physical invitation cards.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeDataURL && (
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrCodeDataURL} 
                  alt="QR Code for RSVP"
                  className="w-64 h-64"
                  data-testid="img-qr-code"
                />
              </div>
            )}
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setQrCodeDialogOpen(false)}
                className="flex-1"
                data-testid="button-close-qr-dialog"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadQRCode}
                className="flex-1"
                data-testid="button-download-qr-code"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
