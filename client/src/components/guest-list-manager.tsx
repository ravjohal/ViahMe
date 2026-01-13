import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter, Users, Check, X, Clock, Upload, MoreHorizontal, Edit, UserX, Trash2, Mail, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Guest, Household } from "@shared/schema";

interface GuestListManagerProps {
  guests: Guest[];
  households?: Household[];
  onAddGuest?: () => void;
  onImportGuests?: () => void;
  onEditGuest?: (guest: Guest) => void;
  onUninviteGuest?: (guest: Guest) => void;
  onDeleteGuest?: (guest: Guest) => void;
  onSendInvitation?: (guest: Guest) => void;
}

const RSVP_STATUS_ICONS = {
  confirmed: <Check className="w-4 h-4 text-green-600" />,
  declined: <X className="w-4 h-4 text-red-600" />,
  pending: <Clock className="w-4 h-4 text-yellow-600" />,
  uninvited: <UserX className="w-4 h-4 text-gray-500" />,
};

const RSVP_STATUS_LABELS = {
  confirmed: "Confirmed",
  declined: "Declined",
  pending: "Pending",
  uninvited: "Uninvited",
};

const normalizeString = (str: string): string => {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  const maxLen = Math.max(m, n);
  return maxLen === 0 ? 1 : 1 - dp[m][n] / maxLen;
};

export function GuestListManager({ guests, households = [], onAddGuest, onImportGuests, onEditGuest, onUninviteGuest, onDeleteGuest, onSendInvitation }: GuestListManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSide, setFilterSide] = useState<string>("all");
  const [filterFamilySide, setFilterFamilySide] = useState<string>("all");
  const [filterRsvp, setFilterRsvp] = useState<string>("all");
  
  const householdById = new Map(households.map(h => [h.id, h]));

  const getPotentialDuplicates = (guest: Guest): Guest[] => {
    return guests.filter(other => {
      if (other.id === guest.id) return false;
      const similarity = calculateStringSimilarity(guest.name, other.name);
      return similarity >= 0.9;
    });
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSide = filterSide === "all" || guest.side === filterSide;
    const matchesFamilySide = filterFamilySide === "all" || 
      (filterFamilySide === "unset" && !guest.familySide) ||
      guest.familySide === filterFamilySide;
    const matchesRsvp = filterRsvp === "all" || guest.rsvpStatus === filterRsvp;
    return matchesSearch && matchesSide && matchesFamilySide && matchesRsvp;
  });

  const stats = {
    total: guests.filter((g) => g.rsvpStatus !== "uninvited").length,
    confirmed: guests.filter((g) => g.rsvpStatus === "confirmed").length,
    pending: guests.filter((g) => g.rsvpStatus === "pending").length,
    declined: guests.filter((g) => g.rsvpStatus === "declined").length,
    uninvited: guests.filter((g) => g.rsvpStatus === "uninvited").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Guest List ✨
          </h2>
          <p className="text-lg font-semibold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Manage invitations and RSVPs 🎊
          </p>
        </div>
        <div className="flex gap-2">
          {onImportGuests && (
            <Button onClick={onImportGuests} variant="outline" data-testid="button-import-guests" className="shadow-sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          )}
          {onAddGuest && (
            <Button onClick={onAddGuest} data-testid="button-add-guest" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Guest
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-600">Total Guests</p>
              <p className="font-mono text-2xl font-bold text-purple-700">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-600">Confirmed</p>
              <p className="font-mono text-2xl font-bold text-green-700">{stats.confirmed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-600">Pending</p>
              <p className="font-mono text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
              <X className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600">Declined</p>
              <p className="font-mono text-2xl font-bold text-red-700">{stats.declined}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-guests"
            />
          </div>

          <Select value={filterSide} onValueChange={setFilterSide}>
            <SelectTrigger className="w-full md:w-[150px]" data-testid="select-filter-side">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="bride">Bride's Side</SelectItem>
              <SelectItem value="groom">Groom's Side</SelectItem>
              <SelectItem value="mutual">Mutual</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterFamilySide} onValueChange={setFilterFamilySide}>
            <SelectTrigger className="w-full md:w-[160px]" data-testid="select-filter-family-side">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Family side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Family</SelectItem>
              <SelectItem value="nanke">Nanke (Maternal)</SelectItem>
              <SelectItem value="dadke">Dadke (Paternal)</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="unset">Not Set</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRsvp} onValueChange={setFilterRsvp}>
            <SelectTrigger className="w-full md:w-[180px]" data-testid="select-filter-rsvp">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by RSVP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RSVPs</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="uninvited">Uninvited ({stats.uninvited})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Guests Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterSide !== "all" || filterFamilySide !== "all" || filterRsvp !== "all"
                ? "Try adjusting your filters"
                : "Start building your guest list"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Household</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>RSVP Status</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow
                    key={guest.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => onEditGuest?.(guest)}
                    data-testid={`row-guest-${guest.id}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {(guest as any).plusOneForGuestId ? (
                          <>
                            <span className="text-muted-foreground">{guest.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              +1
                            </Badge>
                          </>
                        ) : (
                          <>
                            {guest.name}
                            {guest.isMainHouseholdContact && guest.householdId && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                Main
                              </Badge>
                            )}
                            {guest.plusOne && (
                              <Badge variant="outline" className="text-xs text-primary border-primary">
                                +1
                              </Badge>
                            )}
                          </>
                        )}
                        {(() => {
                          const duplicates = getPotentialDuplicates(guest);
                          if (duplicates.length === 0) return null;
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help" onClick={(e) => e.stopPropagation()}>
                                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm font-medium">Possible duplicate</p>
                                <p className="text-xs text-muted-foreground">
                                  Similar to: {duplicates.map(d => d.name).join(', ')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {guest.householdId ? (
                        <span className="text-sm">
                          {householdById.get(guest.householdId)?.name || "—"}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.side && (
                        <Badge variant="outline">
                          {guest.side.charAt(0).toUpperCase() + guest.side.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.familySide ? (
                        <Badge 
                          variant="secondary" 
                          className={
                            guest.familySide === 'nanke' 
                              ? 'bg-pink-100 text-pink-700 border-pink-300' 
                              : guest.familySide === 'dadke'
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : ''
                          }
                        >
                          {guest.familySide === 'nanke' ? 'Nanke' : guest.familySide === 'dadke' ? 'Dadke' : 'Other'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {guest.email || guest.phone || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {RSVP_STATUS_ICONS[guest.rsvpStatus as keyof typeof RSVP_STATUS_ICONS]}
                        <span className="text-sm">
                          {RSVP_STATUS_LABELS[guest.rsvpStatus as keyof typeof RSVP_STATUS_LABELS]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {guest.eventIds?.length || 0} events
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-actions-${guest.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditGuest?.(guest);
                            }}
                            data-testid={`action-edit-${guest.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Guest
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendInvitation?.(guest);
                            }}
                            data-testid={`action-send-invitation-${guest.id}`}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Invitation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {guest.rsvpStatus === "confirmed" ? (
                            <DropdownMenuItem
                              disabled
                              className="text-muted-foreground cursor-not-allowed"
                              data-testid={`action-uninvite-disabled-${guest.id}`}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Cannot uninvite (RSVP'd)
                            </DropdownMenuItem>
                          ) : guest.rsvpStatus !== "uninvited" ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onUninviteGuest?.(guest);
                              }}
                              className="text-orange-600"
                              data-testid={`action-uninvite-${guest.id}`}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Uninvite Guest
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onUninviteGuest?.(guest);
                              }}
                              className="text-green-600"
                              data-testid={`action-reinvite-${guest.id}`}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Re-invite Guest
                            </DropdownMenuItem>
                          )}
                          {guest.rsvpStatus === "confirmed" ? (
                            <DropdownMenuItem
                              disabled
                              className="text-muted-foreground cursor-not-allowed"
                              data-testid={`action-delete-disabled-${guest.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cannot delete (RSVP'd)
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteGuest?.(guest);
                              }}
                              className="text-destructive"
                              data-testid={`action-delete-${guest.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Guest
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
