import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, User, Lock, Bell, LogOut, Trash2, Heart, MapPin, Calendar, Users, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Wedding } from "@shared/schema";
import { TRADITION_HIERARCHY, getSubTraditionsForMain, getAllSubTraditions } from "@/lib/tradition-hierarchy";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [partner1Name, setPartner1Name] = useState("");
  const [partner2Name, setPartner2Name] = useState("");
  const [weddingLocation, setWeddingLocation] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [guestCountEstimate, setGuestCountEstimate] = useState("");
  const [tradition, setTradition] = useState("");
  const [subTradition, setSubTradition] = useState<string | null>(null);
  const [subTraditions, setSubTraditions] = useState<string[]>([]);
  const [isSavingWedding, setIsSavingWedding] = useState(false);

  const availableSubTraditions = useMemo(() => {
    if (tradition === "mixed") {
      return getAllSubTraditions();
    }
    return getSubTraditionsForMain(tradition);
  }, [tradition]);

  const handleMainTraditionChange = (value: string) => {
    setTradition(value);
    setSubTradition(null);
    setSubTraditions([]);
  };

  const handleSubTraditionMultiSelect = (subValue: string, checked: boolean) => {
    if (checked) {
      setSubTraditions((prev) => [...prev, subValue]);
    } else {
      setSubTraditions((prev) => prev.filter((v) => v !== subValue));
    }
  };

  const METRO_AREAS = [
    { value: "San Francisco Bay Area", label: "San Francisco Bay Area" },
    { value: "New York City", label: "New York City Metro" },
    { value: "Los Angeles", label: "Los Angeles Metro" },
    { value: "Chicago", label: "Chicago Metro" },
    { value: "Seattle", label: "Seattle Metro" },
    { value: "Fresno", label: "Fresno Metro" },
    { value: "Sacramento", label: "Sacramento Metro" },
  ];

  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: !!user && user.role === "couple",
  });

  const wedding = weddings?.[0];

  useEffect(() => {
    if (wedding) {
      setPartner1Name(wedding.partner1Name || "");
      setPartner2Name(wedding.partner2Name || "");
      setWeddingLocation(wedding.location || "");
      setWeddingDate(wedding.weddingDate ? new Date(wedding.weddingDate).toISOString().split('T')[0] : "");
      setGuestCountEstimate(wedding.guestCountEstimate?.toString() || "");
      setTradition(wedding.tradition || "");
      setSubTradition(wedding.subTradition || null);
      setSubTraditions(wedding.subTraditions || []);
    }
  }, [wedding]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleSaveWeddingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wedding) return;

    if (!partner1Name.trim() || !partner2Name.trim()) {
      toast({
        title: "Error",
        description: "Both partner names are required",
        variant: "destructive",
      });
      return;
    }

    if (!weddingLocation) {
      toast({
        title: "Error",
        description: "Please select a metro area for your wedding",
        variant: "destructive",
      });
      return;
    }

    setIsSavingWedding(true);
    try {
      // Normalize tradition data based on main tradition type
      let normalizedSubTradition: string | null = null;
      let normalizedSubTraditions: string[] | null = null;
      
      if (tradition === "mixed") {
        // Mixed traditions: use subTraditions array, clear subTradition
        normalizedSubTradition = null;
        normalizedSubTraditions = subTraditions.length > 0 ? subTraditions : null;
      } else if (tradition !== "other" && tradition) {
        // Non-mixed, non-other traditions: use single subTradition, clear subTraditions
        normalizedSubTradition = subTradition || null;
        normalizedSubTraditions = null;
      }
      // "other" tradition has neither subTradition nor subTraditions
      
      await apiRequest("PATCH", `/api/weddings/${wedding.id}`, {
        partner1Name: partner1Name.trim(),
        partner2Name: partner2Name.trim(),
        location: weddingLocation,
        weddingDate: weddingDate || undefined,
        guestCountEstimate: guestCountEstimate ? parseInt(guestCountEstimate) : undefined,
        tradition: tradition || undefined,
        subTradition: normalizedSubTradition,
        subTraditions: normalizedSubTraditions,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/weddings"] });

      toast({
        title: "Wedding Details Updated",
        description: "Your wedding details have been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wedding details",
        variant: "destructive",
      });
    } finally {
      setIsSavingWedding(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await apiRequest("DELETE", "/api/auth/account");
      
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Log out and redirect to landing page
      await logout();
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Account Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Account Information</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-lg font-medium" data-testid="text-user-email">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Role</Label>
                <p className="text-lg font-medium capitalize" data-testid="text-user-role">{user.role}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Account Status</Label>
                <p className="text-lg font-medium" data-testid="text-account-status">
                  {user.emailVerified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-yellow-600">Unverified</span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* Wedding Details - Only for couples */}
          {user.role === "couple" && wedding && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-pink-100">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold">Wedding Details</h2>
              </div>
              <Separator className="mb-4" />
              <form onSubmit={handleSaveWeddingDetails} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner1-name">Your Name</Label>
                    <Input
                      id="partner1-name"
                      type="text"
                      value={partner1Name}
                      onChange={(e) => setPartner1Name(e.target.value)}
                      placeholder="Enter your name"
                      data-testid="input-partner1-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partner2-name">Partner's Name</Label>
                    <Input
                      id="partner2-name"
                      type="text"
                      value={partner2Name}
                      onChange={(e) => setPartner2Name(e.target.value)}
                      placeholder="Enter your partner's name"
                      data-testid="input-partner2-name"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="wedding-location">Metro Area</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Where will most of your wedding events take place? This helps us show you vendors in your area.
                  </p>
                  <Select value={weddingLocation} onValueChange={setWeddingLocation}>
                    <SelectTrigger data-testid="select-wedding-location">
                      <SelectValue placeholder="Select your metro area" />
                    </SelectTrigger>
                    <SelectContent>
                      {METRO_AREAS.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      <Label>Wedding Tradition</Label>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      What cultural traditions will your wedding celebrate?
                    </p>
                    <Select value={tradition} onValueChange={handleMainTraditionChange}>
                      <SelectTrigger data-testid="select-tradition-settings">
                        <SelectValue placeholder="Select your main tradition" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADITION_HIERARCHY.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{t.label}</span>
                              <span className="text-xs text-muted-foreground">{t.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {tradition === "mixed" && availableSubTraditions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Traditions to Blend</Label>
                      <p className="text-sm text-muted-foreground mb-2">Choose all the traditions that will be part of your celebration</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-background">
                        {availableSubTraditions.map((sub) => (
                          <div key={sub.value} className="flex items-center space-x-2 p-2 rounded hover-elevate">
                            <Checkbox
                              id={`settings-sub-${sub.value}`}
                              checked={subTraditions.includes(sub.value)}
                              onCheckedChange={(checked) => handleSubTraditionMultiSelect(sub.value, !!checked)}
                              data-testid={`settings-checkbox-${sub.value}`}
                            />
                            <label
                              htmlFor={`settings-sub-${sub.value}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {sub.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {subTraditions.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {subTraditions.length} tradition{subTraditions.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {tradition !== "mixed" && tradition !== "other" && availableSubTraditions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Specific Tradition</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Help us personalize your experience with the specific regional tradition
                      </p>
                      <Select value={subTradition || ""} onValueChange={setSubTradition}>
                        <SelectTrigger data-testid="select-sub-tradition-settings">
                          <SelectValue placeholder="Select specific tradition (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubTraditions.map((sub) => (
                            <SelectItem key={sub.value} value={sub.value}>
                              {sub.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {tradition === "other" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        We'll help you create a custom wedding experience. You can add specific cultural elements in your planning dashboard.
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="wedding-date">Wedding Date</Label>
                    </div>
                    <Input
                      id="wedding-date"
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      data-testid="input-wedding-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="guest-count">Estimated Guest Count</Label>
                    </div>
                    <Input
                      id="guest-count"
                      type="number"
                      value={guestCountEstimate}
                      onChange={(e) => setGuestCountEstimate(e.target.value)}
                      placeholder="e.g., 300"
                      data-testid="input-guest-count"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingWedding}
                  className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  data-testid="button-save-wedding-details"
                >
                  {isSavingWedding ? "Saving..." : "Save Wedding Details"}
                </Button>
              </form>
            </Card>
          )}

          {/* Change Password */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange/10">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold">Change Password</h2>
            </div>
            <Separator className="mb-4" />
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  data-testid="input-current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  required
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                data-testid="button-change-password"
              >
                {isChangingPassword ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue/10">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Email notifications are enabled for important updates about your wedding planning.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll receive notifications for vendor responses, booking confirmations, and task reminders.
              </p>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-6">
              {/* Logout */}
              <div>
                <h3 className="font-semibold mb-2">Log Out</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Once you log out, you'll need to sign in again to access your account.
                </p>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>

              <Separator />

              {/* Delete Account */}
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isDeletingAccount}
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Wedding details and events</li>
                          <li>Guest lists and RSVPs</li>
                          <li>Vendor bookings and contracts</li>
                          <li>Budget information</li>
                          <li>Photos and documents</li>
                          <li>All other personal data</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        Yes, Delete My Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
