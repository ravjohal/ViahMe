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
import { Plus, Search, Filter, Users, Check, X, Clock, Upload } from "lucide-react";
import type { Guest, Household } from "@shared/schema";

interface GuestListManagerProps {
  guests: Guest[];
  households?: Household[];
  onAddGuest?: () => void;
  onImportGuests?: () => void;
  onEditGuest?: (guest: Guest) => void;
}

const RSVP_STATUS_ICONS = {
  confirmed: <Check className="w-4 h-4 text-green-600" />,
  declined: <X className="w-4 h-4 text-red-600" />,
  pending: <Clock className="w-4 h-4 text-yellow-600" />,
};

const RSVP_STATUS_LABELS = {
  confirmed: "Confirmed",
  declined: "Declined",
  pending: "Pending",
};

export function GuestListManager({ guests, households = [], onAddGuest, onImportGuests, onEditGuest }: GuestListManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSide, setFilterSide] = useState<string>("all");
  const [filterRsvp, setFilterRsvp] = useState<string>("all");
  
  const householdById = new Map(households.map(h => [h.id, h]));

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSide = filterSide === "all" || guest.side === filterSide;
    const matchesRsvp = filterRsvp === "all" || guest.rsvpStatus === filterRsvp;
    return matchesSearch && matchesSide && matchesRsvp;
  });

  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvpStatus === "confirmed").length,
    pending: guests.filter((g) => g.rsvpStatus === "pending").length,
    declined: guests.filter((g) => g.rsvpStatus === "declined").length,
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
            <SelectTrigger className="w-full md:w-[180px]" data-testid="select-filter-side">
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
            </SelectContent>
          </Select>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Guests Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterSide !== "all" || filterRsvp !== "all"
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
                  <TableHead>Main Contact</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>RSVP Status</TableHead>
                  <TableHead>Events</TableHead>
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
                      {guest.name}
                      {guest.plusOne && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          +1
                        </Badge>
                      )}
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
                      {guest.householdId && guest.isMainHouseholdContact ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Yes</Badge>
                      ) : guest.householdId ? (
                        <span className="text-sm text-muted-foreground">No</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.side && (
                        <Badge variant="outline">
                          {guest.side.charAt(0).toUpperCase() + guest.side.slice(1)}
                        </Badge>
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
