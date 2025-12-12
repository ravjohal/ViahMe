import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { Vendor, Booking, Contract, InsertVendor, ServicePackage, InsertServicePackage } from "@shared/schema";
import { insertVendorSchema, insertServicePackageSchema, VENDOR_CATEGORIES, WEDDING_TRADITIONS } from "@shared/schema";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { VendorSetupWizard } from "@/components/vendor-setup-wizard";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import {
  Star,
  MapPin,
  DollarSign,
  Mail,
  Phone,
  Edit,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  Eye,
  Users,
  BarChart3,
  Package,
  User,
  Building2,
  AlertCircle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import viahLogo from "@assets/viah-logo_1763669612969.png";
import { VendorHeader } from "@/components/vendor-header";

interface AlternateSlot {
  date: string;
  timeSlot: string;
  notes?: string;
}

export default function VendorDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [showWizard, setShowWizard] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Vendor>>({});
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  
  // Check for ?edit=profile query parameter to auto-open profile panel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'profile') {
      setProfilePanelOpen(true);
      // Clear the query parameter from URL without triggering navigation
      window.history.replaceState({}, '', '/vendor-dashboard');
    }
  }, [location]);
  
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedBookingForDecline, setSelectedBookingForDecline] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [alternateSlots, setAlternateSlots] = useState<AlternateSlot[]>([]);
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotTime, setNewSlotTime] = useState("morning");
  const [newSlotNotes, setNewSlotNotes] = useState("");
  
  // Service Packages state
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [packageFormData, setPackageFormData] = useState<Partial<InsertServicePackage>>({
    name: "",
    description: "",
    price: "0",
    traditions: [],
    categories: [],
    features: [],
    isActive: true,
  });
  const [newFeature, setNewFeature] = useState("");

  // Fetch vendor profile for authenticated user
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "vendor",
  });

  // Find vendor by user ID
  const currentVendor = vendors?.find(v => v.userId === user?.id);
  const vendorId = currentVendor?.id;

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/bookings/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
    enabled: !!vendorId,
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts/vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await fetch(`/api/contracts/vendor/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Analytics data
  interface AnalyticsSummary {
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: string;
    averageBookingValue: string;
    averageRating: string;
    totalReviews: number;
    conversionRate: string;
  }

  interface BookingTrend {
    date: string;
    bookings: number;
    confirmed: number;
  }

  interface RevenueTrend {
    date: string;
    revenue: string;
  }

  const defaultAnalytics: AnalyticsSummary = {
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: "0",
    averageBookingValue: "0",
    averageRating: "0",
    totalReviews: 0,
    conversionRate: "0",
  };

  const { data: analyticsSummaryData, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/vendor", vendorId, "summary"],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/vendor/${vendorId}/summary`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!vendorId,
  });
  
  const analyticsSummary = analyticsSummaryData || defaultAnalytics;

  const { data: bookingTrends = [] } = useQuery<BookingTrend[]>({
    queryKey: ["/api/analytics/vendor", vendorId, "booking-trends"],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/vendor/${vendorId}/booking-trends`);
      if (!response.ok) throw new Error("Failed to fetch booking trends");
      return response.json();
    },
    enabled: !!vendorId,
  });

  const { data: revenueTrends = [] } = useQuery<RevenueTrend[]>({
    queryKey: ["/api/analytics/vendor", vendorId, "revenue-trends"],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/vendor/${vendorId}/revenue-trends`);
      if (!response.ok) throw new Error("Failed to fetch revenue trends");
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Service Packages query - uses default fetcher
  const { data: servicePackages = [], isLoading: packagesLoading } = useQuery<ServicePackage[]>({
    queryKey: [`/api/service-packages/vendor/${vendorId}`],
    enabled: !!vendorId,
  });

  // Pending timeline change acknowledgments
  interface PendingAcknowledgment {
    id: string;
    changeId: string;
    weddingId: string;
    eventId: string;
    status: 'pending' | 'acknowledged' | 'declined';
    change: {
      id: string;
      changeType: string;
      oldValue: string | null;
      newValue: string;
      note: string | null;
      createdAt: string;
    };
  }

  const { data: pendingAcks = [], refetch: refetchAcks } = useQuery<PendingAcknowledgment[]>({
    queryKey: ["/api/vendor/pending-acknowledgments"],
    enabled: !!vendorId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ changeId, status, message }: { changeId: string; status: 'acknowledged' | 'declined'; message?: string }) => {
      return await apiRequest("POST", `/api/timeline-changes/${changeId}/acknowledge`, { status, message });
    },
    onSuccess: () => {
      refetchAcks();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/pending-acknowledgments"] });
      toast({
        title: "Response submitted",
        description: "Your acknowledgment has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit acknowledgment",
        variant: "destructive",
      });
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: InsertServicePackage) => {
      // Validate with schema before sending
      const validated = insertServicePackageSchema.parse(data);
      const response = await apiRequest("POST", "/api/service-packages", validated);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-packages/vendor/${vendorId}`] });
      toast({
        title: "Package Created",
        description: "Your service package has been created successfully.",
      });
      setPackageDialogOpen(false);
      resetPackageForm();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error?.message || "Failed to create service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertServicePackage> }) => {
      // Validate with partial schema before sending
      const validated = insertServicePackageSchema.partial().parse(data);
      const response = await apiRequest("PATCH", `/api/service-packages/${id}`, validated);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-packages/vendor/${vendorId}`] });
      toast({
        title: "Package Updated",
        description: "Your service package has been updated successfully.",
      });
      setPackageDialogOpen(false);
      resetPackageForm();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/service-packages/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/service-packages/vendor/${vendorId}`] });
      toast({
        title: "Package Deleted",
        description: "Your service package has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Validation errors state for package form
  const [packageFormErrors, setPackageFormErrors] = useState<Record<string, string>>({});

  const validatePackageForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!packageFormData.name?.trim()) {
      errors.name = "Package name is required";
    }
    
    if (!packageFormData.price || parseFloat(packageFormData.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }
    
    if (!packageFormData.traditions?.length) {
      errors.traditions = "Select at least one wedding tradition";
    }
    
    if (!packageFormData.categories?.length) {
      errors.categories = "Select at least one service category";
    }
    
    setPackageFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetPackageForm = () => {
    setEditingPackage(null);
    setPackageFormData({
      name: "",
      description: "",
      price: "",
      traditions: [],
      categories: [],
      features: [],
      isActive: true,
    });
    setNewFeature("");
    setPackageFormErrors({});
  };

  const openPackageDialog = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageFormData({
        name: pkg.name,
        description: pkg.description || "",
        price: pkg.price,
        traditions: pkg.traditions || [],
        categories: pkg.categories || [],
        features: (pkg.features as string[]) || [],
        isActive: pkg.isActive ?? true,
      });
    } else {
      resetPackageForm();
    }
    setPackageDialogOpen(true);
  };

  const handleSavePackage = () => {
    if (!vendorId) return;
    
    // Validate form before submitting
    if (!validatePackageForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const packageData: InsertServicePackage = {
      vendorId,
      name: packageFormData.name?.trim() || "",
      description: packageFormData.description?.trim() || "",
      price: packageFormData.price || "0",
      traditions: packageFormData.traditions || [],
      categories: packageFormData.categories || [],
      features: packageFormData.features || [],
      isActive: packageFormData.isActive ?? true,
      sortOrder: editingPackage?.sortOrder || servicePackages.length,
    };

    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: packageData });
    } else {
      createPackageMutation.mutate(packageData);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setPackageFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setPackageFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const toggleTradition = (tradition: string) => {
    setPackageFormData(prev => {
      const traditions = prev.traditions || [];
      if (traditions.includes(tradition)) {
        return { ...prev, traditions: traditions.filter(t => t !== tradition) };
      } else {
        return { ...prev, traditions: [...traditions, tradition] };
      }
    });
  };

  const toggleCategory = (category: string) => {
    setPackageFormData(prev => {
      const categories = prev.categories || [];
      if (categories.includes(category)) {
        return { ...prev, categories: categories.filter(c => c !== category) };
      } else {
        return { ...prev, categories: [...categories, category] };
      }
    });
  };
  
  // Helper to safely parse currency values
  const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    return isNaN(num) ? "$0" : `$${num.toLocaleString()}`;
  };
  
  const formatPercent = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? "0%" : `${num.toFixed(1)}%`;
  };

  const createVendorMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return await response.json();
    },
    onSuccess: async () => {
      // Wait for cache invalidation to complete
      await queryClient.invalidateQueries({ queryKey: ["/api/vendors"], exact: false });
      toast({
        title: "Profile Created",
        description: "Your vendor profile has been created successfully.",
      });
      setShowWizard(false);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error?.message || "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      if (!vendorId) throw new Error("No vendor ID");
      const response = await apiRequest("PATCH", `/api/vendors/${vendorId}`, data);
      return await response.json();
    },
    onSuccess: async () => {
      // Wait for cache invalidation to complete
      await queryClient.invalidateQueries({ queryKey: ["/api/vendors"], exact: false });
      toast({
        title: "Profile Updated",
        description: "Your vendor profile has been updated successfully.",
      });
      setShowWizard(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      status, 
      declineReason, 
      alternateSlots 
    }: { 
      bookingId: string; 
      status: string; 
      declineReason?: string;
      alternateSlots?: AlternateSlot[];
    }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}`, { 
        status, 
        declineReason, 
        alternateSlots 
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/vendor", vendorId] });
      const isDecline = variables.status === "declined";
      toast({
        title: isDecline ? "Booking Declined" : "Booking Updated",
        description: isDecline 
          ? (variables.alternateSlots?.length 
              ? "Booking declined with alternate dates suggested." 
              : "Booking has been declined.")
          : "Booking status has been updated successfully.",
      });
      if (isDecline) {
        setDeclineDialogOpen(false);
        setSelectedBookingForDecline(null);
        setDeclineReason("");
        setAlternateSlots([]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openWizard = () => {
    setEditFormData({});
    setShowWizard(true);
  };

  const handleWizardComplete = async (data: any) => {
    try {
      if (!user) return;

      const newVendorData: InsertVendor = {
        userId: user.id,
        name: data.name?.trim() || "",
        category: (data.categories as any)?.[0] || "photographer",
        categories: (data.categories as any) || ["photographer"],
        preferredWeddingTraditions: (data.preferredWeddingTraditions as any) || [],
        location: data.location?.trim() || "",
        city: "San Francisco Bay Area",
        priceRange: data.priceRange || "$",
        description: data.description?.trim() || "",
        contact: data.contact?.trim() || "",
        email: data.email?.trim() || "",
        phone: data.phone?.trim() || "",
        culturalSpecialties: [],
        availability: null,
      };

      const validatedData = insertVendorSchema.parse(newVendorData);

      if (currentVendor && vendorId) {
        // Update existing - don't close wizard, let mutation handle success
        updateVendorMutation.mutate(validatedData);
      } else {
        // Create new - don't close wizard, let mutation handle success
        createVendorMutation.mutate(validatedData);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save vendor profile",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = () => {
    try {
      if (!user) return;

      const isCreating = !currentVendor;

      if (isCreating) {
        // Creating a new vendor profile - all required fields must be present
        // Use insertVendorSchema directly (no need to extend - userId is already optional)
        const newVendorData: InsertVendor = {
          userId: user.id,
          name: editFormData.name?.trim() || "",
          category: (editFormData.categories as any)?.[0] || "photographer",
          categories: (editFormData.categories as any) || ["photographer"],
          preferredWeddingTraditions: (editFormData.preferredWeddingTraditions as any) || [],
          location: editFormData.location?.trim() || "",
          city: "San Francisco Bay Area", // Default city
          priceRange: (editFormData.priceRange as any) || "$",
          description: editFormData.description?.trim() || "",
          contact: editFormData.contact?.trim() || "",
          email: editFormData.email?.trim() || "",
          phone: editFormData.phone?.trim() || "",
          culturalSpecialties: editFormData.culturalSpecialties || [],
          availability: editFormData.availability || null,
        };

        // Validate with the schema
        const validatedData = insertVendorSchema.parse(newVendorData);
        createVendorMutation.mutate(validatedData);
      } else {
        // Updating existing profile - partial updates allowed
        const profileUpdateSchema = z.object({
          name: z.string().min(1, "Business name is required").optional(),
          location: z.string().min(1, "Location is required").optional(),
          categories: z.array(z.string()).min(1, "Select at least one category").optional(),
          preferredWeddingTraditions: z.array(z.string()).optional(),
          priceRange: z.enum(['$', '$$', '$$$', '$$$$'], {
            errorMap: () => ({ message: "Please select a valid price range" })
          }).optional(),
          culturalSpecialties: z.array(z.string()).optional(),
          description: z.string().optional(),
          contact: z.string().optional(),
          email: z.string().email("Invalid email address").optional(),
          phone: z.string().optional(),
          availability: z.any().optional(),
        }).refine((data) => {
          return Object.values(data).some(v => v !== undefined);
        }, {
          message: "Please make at least one change",
        }).refine((data) => {
          if (data.name !== undefined && data.name.trim() === '') return false;
          if (data.location !== undefined && data.location.trim() === '') return false;
          return true;
        }, {
          message: "Required fields cannot be empty",
        });

        const updates: Record<string, any> = {};
        if (editFormData.name !== undefined) updates.name = editFormData.name.trim();
        if (editFormData.location !== undefined) updates.location = editFormData.location.trim();
        if (editFormData.priceRange !== undefined) updates.priceRange = editFormData.priceRange;
        if (editFormData.description !== undefined) updates.description = editFormData.description?.trim();
        if (editFormData.contact !== undefined) updates.contact = editFormData.contact?.trim();
        if (editFormData.email !== undefined) updates.email = editFormData.email?.trim();
        if (editFormData.phone !== undefined) updates.phone = editFormData.phone?.trim();
        if (editFormData.culturalSpecialties !== undefined) updates.culturalSpecialties = editFormData.culturalSpecialties;
        if (editFormData.availability !== undefined) updates.availability = editFormData.availability;

        const validatedUpdates = profileUpdateSchema.parse(updates) as Partial<Vendor>;
        updateVendorMutation.mutate(validatedUpdates);
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error?.issues?.[0]?.message || error?.message || "Please check your input and try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBooking = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  const openDeclineDialog = (booking: Booking) => {
    setSelectedBookingForDecline(booking);
    setDeclineReason("");
    setAlternateSlots([]);
    setNewSlotDate("");
    setNewSlotTime("morning");
    setNewSlotNotes("");
    setDeclineDialogOpen(true);
  };

  const addAlternateSlot = () => {
    if (!newSlotDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for the alternate slot.",
        variant: "destructive",
      });
      return;
    }
    setAlternateSlots([...alternateSlots, {
      date: newSlotDate,
      timeSlot: newSlotTime,
      notes: newSlotNotes || undefined,
    }]);
    setNewSlotDate("");
    setNewSlotTime("morning");
    setNewSlotNotes("");
  };

  const removeAlternateSlot = (index: number) => {
    setAlternateSlots(alternateSlots.filter((_, i) => i !== index));
  };

  const handleDeclineWithSlots = () => {
    if (!selectedBookingForDecline) return;
    updateBookingMutation.mutate({
      bookingId: selectedBookingForDecline.id,
      status: "declined",
      declineReason: declineReason || undefined,
      alternateSlots: alternateSlots.length > 0 ? alternateSlots : undefined,
    });
  };

  const formatTimeSlot = (slot: string) => {
    switch (slot) {
      case "morning": return "Morning (8am - 12pm)";
      case "afternoon": return "Afternoon (12pm - 5pm)";
      case "evening": return "Evening (5pm - 11pm)";
      case "full_day": return "Full Day";
      default: return slot;
    }
  };

  // Redirect if not authenticated - ONLY after auth loading completes
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/vendor-login");
    }
    // Redirect non-vendor users to couple dashboard
    if (!authLoading && user && user.role !== "vendor") {
      setLocation("/dashboard");
    }
  }, [authLoading, user, setLocation]);

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  // Redirect non-vendor users (shown briefly during redirect)
  if (user.role !== "vendor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  if (vendorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const hasProfile = !!currentVendor;
  const rating = currentVendor?.rating ? parseFloat(currentVendor.rating.toString()) : 0;
  const pendingBookings = bookings.filter((b: Booking) => b.status === "pending");
  const confirmedBookings = bookings.filter((b: Booking) => b.status === "confirmed");
  const activeContracts = contracts.filter((c: Contract) => c.status === "active" || c.status === "signed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-background dark:to-background">
      <VendorHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user.emailVerified && (
          <Card className="mb-6 border-orange-300 bg-gradient-to-r from-orange-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Mail className="w-5 h-5" />
                Email Verification Required
              </CardTitle>
              <CardDescription className="text-orange-600">
                Please verify your email address to unlock all vendor features and start receiving
                bookings from couples.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/verify-email">
                <Button
                  variant="default"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  data-testid="button-verify-email"
                >
                  Verify Email Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!hasProfile && (
          <Card className="mb-6 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Sparkles className="w-5 h-5" />
                Complete Your Vendor Profile
              </CardTitle>
              <CardDescription className="text-purple-600">
                Set up your business profile to appear in search results and start receiving
                booking requests from couples planning their weddings.
                {!user.emailVerified && (
                  <span className="block mt-2 text-sm text-orange-600 font-medium">
                    Note: Verify your email to maximize your profile visibility.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                onClick={openWizard}
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-setup-profile"
              >
                <Settings className="w-4 h-4 mr-2" />
                Set Up Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {currentVendor && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => setLocation("/vendor-bookings?filter=pending")} data-testid="card-pending-requests">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-1/10">
                <Clock className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-pending-bookings">
                  {pendingBookings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => setLocation("/vendor-bookings?filter=confirmed")} data-testid="card-confirmed-bookings">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-2/10">
                <CheckCircle className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-confirmed-bookings">
                  {confirmedBookings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => setLocation("/vendor-contracts")} data-testid="card-active-contracts">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-3/10">
                <FileText className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Contracts</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-active-contracts">
                  {activeContracts.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => setLocation("/vendor-bookings")} data-testid="card-total-bookings">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10">
                <Calendar className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="font-mono text-2xl font-bold" data-testid="stat-total-bookings">
                  {bookings.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => setLocation("/lead-inbox")} data-testid="card-lead-inbox">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lead Inbox</p>
                <p className="font-medium text-primary flex items-center gap-2">
                  View Inquiries
                  <span className="text-xs text-muted-foreground">→</span>
                </p>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Analytics Overview Section */}
        {currentVendor && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Analytics Overview
                </h2>
                <p className="text-sm text-muted-foreground">Your business performance at a glance</p>
              </div>
              <Link href="/vendor-analytics">
                <Button variant="outline" size="sm" data-testid="button-view-full-analytics">
                  View Full Analytics
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600" data-testid="dashboard-metric-revenue">
                        {formatCurrency(analyticsSummary.totalRevenue)}
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-7 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-yellow-600" data-testid="dashboard-metric-rating">
                        {analyticsSummary.averageRating || '0.0'}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({analyticsSummary.totalReviews} reviews)
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold" data-testid="dashboard-metric-avg-value">
                        {formatCurrency(analyticsSummary.averageBookingValue)}
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-7 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-purple-600" data-testid="dashboard-metric-conversion">
                        {formatPercent(analyticsSummary.conversionRate)}
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue Trend Chart */}
            {revenueTrends.length > 0 && (
              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Revenue Trend
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* Pending Timeline Acknowledgments Alert */}
        {pendingAcks.length > 0 && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                Timeline Changes Require Your Attention
              </CardTitle>
              <CardDescription className="text-orange-600/80 dark:text-orange-400/80">
                Please acknowledge the following schedule changes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAcks.map((ack) => (
                <div key={ack.id} className="flex items-center justify-between p-4 rounded-lg bg-white/70 dark:bg-black/20 border border-orange-200 dark:border-orange-800/50" data-testid={`pending-ack-${ack.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">
                        Time Change
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {ack.change.createdAt && format(new Date(ack.change.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-muted-foreground">{ack.change.oldValue || 'Not set'}</span>
                      <span className="text-orange-600 dark:text-orange-400">→</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{ack.change.newValue}</span>
                    </div>
                    {ack.change.note && (
                      <p className="text-sm text-muted-foreground mt-1 italic">"{ack.change.note}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeMutation.mutate({ changeId: ack.changeId, status: 'declined' })}
                      disabled={acknowledgeMutation.isPending}
                      data-testid={`button-decline-ack-${ack.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acknowledgeMutation.mutate({ changeId: ack.changeId, status: 'acknowledged' })}
                      disabled={acknowledgeMutation.isPending}
                      data-testid={`button-confirm-ack-${ack.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </main>

      {/* Vendor Setup Wizard Modal */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-vendor-setup-wizard">
          <DialogHeader>
            <DialogTitle>Set Up Your Vendor Profile</DialogTitle>
            <DialogDescription>
              Complete these steps to showcase your business to couples
            </DialogDescription>
          </DialogHeader>
          <VendorSetupWizard
            initialData={currentVendor}
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-edit-profile">Edit Vendor Profile</DialogTitle>
            <DialogDescription>
              Update your vendor profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>

            <div>
              <Label>Service Categories (Select at least one)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 p-3 border rounded-md bg-muted/30">
                {VENDOR_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={(editFormData.categories as string[] || []).includes(category)}
                      onCheckedChange={(checked) => {
                        const current = (editFormData.categories as string[] || []);
                        if (checked) {
                          setEditFormData({
                            ...editFormData,
                            categories: [...current, category]
                          });
                        } else {
                          setEditFormData({
                            ...editFormData,
                            categories: current.filter(c => c !== category)
                          });
                        }
                      }}
                      data-testid={`checkbox-category-${category}`}
                    />
                    <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer">
                      {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Wedding Traditions</Label>
              <div className="grid grid-cols-2 gap-3 mt-2 p-3 border rounded-md bg-muted/30">
                {(['sikh', 'hindu', 'muslim', 'gujarati', 'south_indian', 'mixed', 'general'] as const).map((tradition) => (
                  <div key={tradition} className="flex items-center gap-2">
                    <Checkbox
                      id={`tradition-${tradition}`}
                      checked={(editFormData.preferredWeddingTraditions as string[] || []).includes(tradition)}
                      onCheckedChange={(checked) => {
                        const current = (editFormData.preferredWeddingTraditions as string[] || []);
                        if (checked) {
                          setEditFormData({
                            ...editFormData,
                            preferredWeddingTraditions: [...current, tradition]
                          });
                        } else {
                          setEditFormData({
                            ...editFormData,
                            preferredWeddingTraditions: current.filter(t => t !== tradition)
                          });
                        }
                      }}
                      data-testid={`checkbox-tradition-${tradition}`}
                    />
                    <Label htmlFor={`tradition-${tradition}`} className="font-normal cursor-pointer">
                      {tradition === 'south_indian' ? 'South Indian' : tradition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave blank to work with all traditions</p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                rows={4}
                data-testid="textarea-description"
              />
            </div>

            <div>
              <Label htmlFor="location">Business Address</Label>
              <AddressAutocomplete
                value={editFormData.location || ""}
                onChange={(address) =>
                  setEditFormData({ ...editFormData, location: address })
                }
                placeholder="Enter your business address"
                testid="input-location"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Start typing to search for your business address
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="business@example.com"
                  value={editFormData.email || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={editFormData.phone || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priceRange">Price Range</Label>
              <Select
                value={editFormData.priceRange || ""}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, priceRange: value })
                }
              >
                <SelectTrigger id="priceRange" data-testid="select-price-range">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - Budget Friendly</SelectItem>
                  <SelectItem value="$$">$$ - Moderate</SelectItem>
                  <SelectItem value="$$$">$$$ - Premium</SelectItem>
                  <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="availability">Availability Notes</Label>
              <Textarea
                id="availability"
                value={
                  typeof editFormData.availability === 'string'
                    ? editFormData.availability
                    : editFormData.availability
                    ? JSON.stringify(editFormData.availability)
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  // Try to parse as JSON, otherwise store as string
                  try {
                    const parsed = value ? JSON.parse(value) : null;
                    setEditFormData({ ...editFormData, availability: parsed });
                  } catch {
                    setEditFormData({ ...editFormData, availability: value });
                  }
                }}
                rows={3}
                placeholder="e.g., Available all weekends in June, Booked June 15-17"
                data-testid="textarea-availability"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe your availability or unavailable dates for couples to see
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {}}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updateVendorMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateVendorMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Booking Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="dialog-decline-booking">
          <DialogHeader>
            <DialogTitle>Decline Booking Request</DialogTitle>
            <DialogDescription>
              You can decline this booking and optionally suggest alternative dates that work better for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedBookingForDecline?.requestedDate && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Originally Requested Date</p>
                <p className="font-medium">
                  {format(new Date(selectedBookingForDecline.requestedDate), 'MMMM d, yyyy')}
                  {selectedBookingForDecline.timeSlot && ` - ${formatTimeSlot(selectedBookingForDecline.timeSlot)}`}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="decline-reason">Reason for Declining (Optional)</Label>
              <Textarea
                id="decline-reason"
                placeholder="e.g., Already booked for this date, Outside service area, etc."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={2}
                data-testid="textarea-decline-reason"
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Suggest Alternative Dates</Label>
                <span className="text-xs text-muted-foreground">{alternateSlots.length} slot(s) added</span>
              </div>

              {alternateSlots.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  {alternateSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(slot.date), 'MMM d, yyyy')}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{formatTimeSlot(slot.timeSlot)}</span>
                        {slot.notes && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground text-xs">{slot.notes}</span>
                          </>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAlternateSlot(idx)}
                        data-testid={`button-remove-slot-${idx}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="new-slot-date" className="text-xs">Date</Label>
                  <Input
                    id="new-slot-date"
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    data-testid="input-new-slot-date"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-slot-time" className="text-xs">Time Slot</Label>
                  <Select value={newSlotTime} onValueChange={setNewSlotTime}>
                    <SelectTrigger id="new-slot-time" className="mt-1" data-testid="select-new-slot-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="full_day">Full Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="new-slot-notes" className="text-xs">Notes for this slot (Optional)</Label>
                <Input
                  id="new-slot-notes"
                  placeholder="e.g., Available with discount"
                  value={newSlotNotes}
                  onChange={(e) => setNewSlotNotes(e.target.value)}
                  data-testid="input-new-slot-notes"
                  className="mt-1"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAlternateSlot}
                className="w-full"
                data-testid="button-add-alternate-slot"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Alternative Date
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeclineDialogOpen(false);
                setSelectedBookingForDecline(null);
                setDeclineReason("");
                setAlternateSlots([]);
              }}
              data-testid="button-cancel-decline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclineWithSlots}
              disabled={updateBookingMutation.isPending}
              variant="destructive"
              data-testid="button-confirm-decline"
            >
              {updateBookingMutation.isPending ? "Declining..." : "Decline Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Package Create/Edit Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setPackageDialogOpen(false);
          resetPackageForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-package-title">
              {editingPackage ? "Edit Service Package" : "Create Service Package"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage 
                ? "Update your service package details and offerings."
                : "Create a bundled service package to offer couples complete wedding solutions."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Package Name */}
            <div className="space-y-2">
              <Label htmlFor="package-name">Package Name <span className="text-destructive">*</span></Label>
              <Input
                id="package-name"
                placeholder="e.g., Sikh Wedding Photography Package"
                value={packageFormData.name || ""}
                onChange={(e) => {
                  setPackageFormData(prev => ({ ...prev, name: e.target.value }));
                  if (packageFormErrors.name) setPackageFormErrors(prev => ({ ...prev, name: "" }));
                }}
                className={packageFormErrors.name ? "border-destructive" : ""}
                data-testid="input-package-name"
              />
              {packageFormErrors.name && (
                <p className="text-sm text-destructive">{packageFormErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="package-description">Description</Label>
              <Textarea
                id="package-description"
                placeholder="Describe what's included in this package..."
                value={packageFormData.description || ""}
                onChange={(e) => setPackageFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                data-testid="input-package-description"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="package-price">Price ($) <span className="text-destructive">*</span></Label>
              <Input
                id="package-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={packageFormData.price || ""}
                onChange={(e) => {
                  setPackageFormData(prev => ({ ...prev, price: e.target.value }));
                  if (packageFormErrors.price) setPackageFormErrors(prev => ({ ...prev, price: "" }));
                }}
                className={packageFormErrors.price ? "border-destructive" : ""}
                data-testid="input-package-price"
              />
              {packageFormErrors.price && (
                <p className="text-sm text-destructive">{packageFormErrors.price}</p>
              )}
            </div>

            {/* Traditions */}
            <div className="space-y-2">
              <Label>Wedding Traditions <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">Select which wedding traditions this package is designed for</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {WEDDING_TRADITIONS.map((tradition) => (
                  <div key={tradition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tradition-${tradition}`}
                      checked={(packageFormData.traditions || []).includes(tradition)}
                      onCheckedChange={() => {
                        toggleTradition(tradition);
                        if (packageFormErrors.traditions) setPackageFormErrors(prev => ({ ...prev, traditions: "" }));
                      }}
                      data-testid={`checkbox-tradition-${tradition}`}
                    />
                    <Label htmlFor={`tradition-${tradition}`} className="text-sm cursor-pointer">
                      {tradition}
                    </Label>
                  </div>
                ))}
              </div>
              {packageFormErrors.traditions && (
                <p className="text-sm text-destructive">{packageFormErrors.traditions}</p>
              )}
            </div>

            {/* Service Categories */}
            <div className="space-y-2">
              <Label>Service Categories <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">Select what services are included in this package</p>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-1">
                {VENDOR_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={(packageFormData.categories || []).includes(category)}
                      onCheckedChange={() => {
                        toggleCategory(category);
                        if (packageFormErrors.categories) setPackageFormErrors(prev => ({ ...prev, categories: "" }));
                      }}
                      data-testid={`checkbox-category-${category}`}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                      {category.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
              {packageFormErrors.categories && (
                <p className="text-sm text-destructive">{packageFormErrors.categories}</p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>What's Included</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 8 hours of coverage"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  data-testid="input-new-feature"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFeature}
                  disabled={!newFeature.trim()}
                  data-testid="button-add-feature"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {(packageFormData.features || []).length > 0 && (
                <ul className="space-y-2 mt-3">
                  {(packageFormData.features || []).map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFeature(idx)}
                        data-testid={`button-remove-feature-${idx}`}
                      >
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="package-active"
                checked={packageFormData.isActive ?? true}
                onCheckedChange={(checked) => setPackageFormData(prev => ({ ...prev, isActive: !!checked }))}
                data-testid="checkbox-package-active"
              />
              <Label htmlFor="package-active" className="cursor-pointer">
                Active (visible to couples)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPackageDialogOpen(false);
                resetPackageForm();
              }}
              data-testid="button-cancel-package"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePackage}
              disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
              data-testid="button-save-package"
            >
              {(createPackageMutation.isPending || updatePackageMutation.isPending) 
                ? "Saving..." 
                : editingPackage 
                  ? "Update Package" 
                  : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Slide-out Panel */}
      <Sheet open={profilePanelOpen} onOpenChange={setProfilePanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Profile
            </SheetTitle>
            <SheetDescription>
              View and manage your business information
            </SheetDescription>
          </SheetHeader>

          {currentVendor && (
            <div className="space-y-6">
              {/* Business Name & Categories */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold" data-testid="sheet-vendor-name">
                  {currentVendor.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentVendor.categories?.map((cat: string) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Rating */}
              {rating > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span className="font-mono font-semibold text-lg">{rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({currentVendor.reviewCount || 0} reviews)
                  </span>
                </div>
              )}

              {/* Contact Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="sheet-vendor-location">{currentVendor.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="sheet-vendor-price">Price Range: {currentVendor.priceRange}</span>
                  </div>
                  {currentVendor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{currentVendor.email}</span>
                    </div>
                  )}
                  {currentVendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{currentVendor.phone}</span>
                    </div>
                  )}
                  {currentVendor.contact && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{currentVendor.contact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {currentVendor.description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    About
                  </h4>
                  <p className="text-sm leading-relaxed" data-testid="sheet-vendor-description">
                    {currentVendor.description}
                  </p>
                </div>
              )}

              {/* Cultural Specialties */}
              {currentVendor.culturalSpecialties && currentVendor.culturalSpecialties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Cultural Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentVendor.culturalSpecialties.map((specialty, idx) => (
                      <Badge key={idx} variant="outline" data-testid={`sheet-badge-specialty-${idx}`}>
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Traditions */}
              {currentVendor.preferredWeddingTraditions && currentVendor.preferredWeddingTraditions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Wedding Traditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentVendor.preferredWeddingTraditions.map((tradition, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tradition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Profile Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setProfilePanelOpen(false);
                    openWizard();
                  }}
                  className="w-full"
                  data-testid="button-edit-profile-sheet"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
