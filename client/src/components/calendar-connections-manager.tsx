import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Link2,
  AlertCircle,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Radio,
  CheckCircle2,
  XCircle,
  Edit2,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import type { VendorCalendarAccount, VendorCalendar as VendorCalendarType } from "@shared/schema";

interface CalendarConnectionsManagerProps {
  vendorId: string;
  onConnectionsChange?: () => void;
  compact?: boolean;
}

interface CalendarAccountWithCalendars extends VendorCalendarAccount {
  calendars: VendorCalendarType[];
}

export function CalendarConnectionsManager({ 
  vendorId, 
  onConnectionsChange, 
  compact = false 
}: CalendarConnectionsManagerProps) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState("");

  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useQuery<VendorCalendarAccount[]>({
    queryKey: ['/api/vendor-calendar-accounts/vendor', vendorId],
    enabled: !!vendorId,
  });

  const { data: allCalendars = [] } = useQuery<VendorCalendarType[]>({
    queryKey: ['/api/vendor-calendars/vendor', vendorId],
    enabled: !!vendorId,
  });

  const accountsWithCalendars: CalendarAccountWithCalendars[] = accounts.map(account => ({
    ...account,
    calendars: allCalendars.filter(cal => cal.accountId === account.id),
  }));

  const hasConnectedAccounts = accounts.length > 0;
  const hasSelectedCalendars = allCalendars.some(cal => cal.isSelected);
  const writeTargetCalendar = allCalendars.find(cal => cal.isWriteTarget);

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest("DELETE", `/api/vendor-calendar-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-calendar-accounts/vendor', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-calendars/vendor', vendorId] });
      toast({
        title: "Account disconnected",
        description: "The calendar account has been removed",
      });
      onConnectionsChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect account",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      return apiRequest("PATCH", `/api/vendor-calendar-accounts/${id}`, { label });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-calendar-accounts/vendor', vendorId] });
      setEditingLabel(null);
      toast({
        title: "Label updated",
        description: "The account label has been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update label",
        variant: "destructive",
      });
    },
  });

  const updateCalendarMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VendorCalendarType> }) => {
      return apiRequest("PATCH", `/api/vendor-calendars/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-calendars/vendor', vendorId] });
      onConnectionsChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update calendar",
        variant: "destructive",
      });
    },
  });

  const toggleAccountExpanded = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleCalendarToggle = (calendar: VendorCalendarType) => {
    updateCalendarMutation.mutate({
      id: calendar.id,
      updates: { isSelected: !calendar.isSelected },
    });
  };

  const handleSetWriteTarget = (calendar: VendorCalendarType) => {
    updateCalendarMutation.mutate({
      id: calendar.id,
      updates: { isWriteTarget: true },
    });
    toast({
      title: "Write target set",
      description: `New bookings will be created in "${calendar.displayName}"`,
    });
  };

  const handleStartEditLabel = (account: VendorCalendarAccount) => {
    setEditingLabel(account.id);
    setLabelValue(account.label || "");
  };

  const handleSaveLabel = () => {
    if (editingLabel) {
      updateAccountMutation.mutate({ id: editingLabel, label: labelValue });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <SiGoogle className="h-4 w-4" />;
      case 'outlook':
        return <Mail className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Calendar Accounts</span>
          </div>
          <ConnectAccountButton vendorId={vendorId} onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/vendor-calendar-accounts/vendor', vendorId] });
            onConnectionsChange?.();
          }} />
        </div>

        {accountsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>No calendar accounts connected</p>
            <p className="text-xs mt-1">Connect your Google or Outlook calendar to sync availability</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accountsWithCalendars.map(account => (
              <div key={account.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  {getProviderIcon(account.provider)}
                  <span className="text-sm truncate max-w-[150px]">{account.label || account.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusBadge(account.status)}
                  <Badge variant="outline" className="text-xs">
                    {account.calendars.filter(c => c.isSelected).length}/{account.calendars.length}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Connections
            </CardTitle>
            <CardDescription>
              Connect multiple calendar accounts to aggregate your availability
            </CardDescription>
          </div>
          <ConnectAccountButton vendorId={vendorId} onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/vendor-calendar-accounts/vendor', vendorId] });
            onConnectionsChange?.();
          }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No calendar accounts connected</p>
            <p className="text-sm mt-1">Connect your Google or Outlook calendar to sync your availability with couples</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accountsWithCalendars.map(account => (
              <Collapsible 
                key={account.id} 
                open={expandedAccounts.has(account.id)}
                onOpenChange={() => toggleAccountExpanded(account.id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover-elevate rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getProviderIcon(account.provider)}
                        </div>
                        <div>
                          {editingLabel === account.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={labelValue}
                                onChange={(e) => setLabelValue(e.target.value)}
                                placeholder="Account label"
                                className="h-7 text-sm w-40"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`input-account-label-${account.id}`}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveLabel();
                                }}
                                data-testid={`button-save-label-${account.id}`}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{account.label || account.email}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditLabel(account);
                                }}
                                data-testid={`button-edit-label-${account.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(account.status)}
                        <Badge variant="outline">
                          {account.calendars.filter(c => c.isSelected).length}/{account.calendars.length} calendars
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-disconnect-${account.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disconnect Calendar Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the connection to {account.email} and all associated calendars. 
                                Your availability data from this account will no longer sync.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-disconnect">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAccountMutation.mutate(account.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="button-confirm-disconnect"
                              >
                                Disconnect
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {expandedAccounts.has(account.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t p-3 space-y-2 bg-muted/20">
                      {account.calendars.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No calendars found. Try reconnecting this account.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            Select calendars to include in your availability. The write target calendar is where new bookings will be created.
                          </p>
                          {account.calendars.map(calendar => (
                            <div 
                              key={calendar.id} 
                              className="flex items-center justify-between p-2 rounded-lg border bg-background"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={`cal-${calendar.id}`}
                                  checked={calendar.isSelected}
                                  onCheckedChange={() => handleCalendarToggle(calendar)}
                                  data-testid={`checkbox-calendar-${calendar.id}`}
                                />
                                <div className="flex items-center gap-2">
                                  {calendar.color && (
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: calendar.color }}
                                    />
                                  )}
                                  <Label 
                                    htmlFor={`cal-${calendar.id}`} 
                                    className="text-sm cursor-pointer"
                                  >
                                    {calendar.displayName}
                                    {calendar.isPrimary && (
                                      <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                                    )}
                                  </Label>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {calendar.isWriteTarget ? (
                                  <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                                    <Check className="h-3 w-3 mr-1" />
                                    Write Target
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-7"
                                    onClick={() => handleSetWriteTarget(calendar)}
                                    disabled={!calendar.isSelected}
                                    data-testid={`button-write-target-${calendar.id}`}
                                  >
                                    Set as write target
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}

        {hasConnectedAccounts && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How calendar sync works</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Your availability is the union of busy slots across all selected calendars</li>
                  <li>When a couple books you, the event is created in your write target calendar</li>
                  <li>Keep all relevant work calendars selected to avoid double-booking</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ConnectAccountButtonProps {
  vendorId: string;
  onSuccess: () => void;
}

function ConnectAccountButton({ vendorId, onSuccess }: ConnectAccountButtonProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (provider: 'google' | 'outlook') => {
    setIsConnecting(true);
    setSelectedProvider(provider);
    
    try {
      const authEndpoint = provider === 'google' 
        ? '/api/calendar/auth-url'
        : '/api/outlook-calendar/auth-url';
      
      const response = await fetch(authEndpoint);
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to start calendar connection",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-calendar-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Calendar Account</DialogTitle>
          <DialogDescription>
            Connect a Google or Outlook calendar to sync your availability. 
            You can connect multiple accounts from different email addresses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => handleConnect('google')}
            disabled={isConnecting}
            data-testid="button-connect-google"
          >
            {isConnecting && selectedProvider === 'google' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SiGoogle className="h-5 w-5 text-red-500" />
            )}
            <div className="text-left">
              <p className="font-medium">Google Calendar</p>
              <p className="text-xs text-muted-foreground">Connect your Gmail or Google Workspace calendar</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => handleConnect('outlook')}
            disabled={isConnecting}
            data-testid="button-connect-outlook"
          >
            {isConnecting && selectedProvider === 'outlook' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mail className="h-5 w-5 text-blue-500" />
            )}
            <div className="text-left">
              <p className="font-medium">Outlook Calendar</p>
              <p className="text-xs text-muted-foreground">Connect your Microsoft or Office 365 calendar</p>
            </div>
          </Button>
        </div>

        <DialogFooter className="text-xs text-muted-foreground">
          <p>You'll be redirected to authorize access to your calendar</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
