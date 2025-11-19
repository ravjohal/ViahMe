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
import { Plus, Search, Filter, Users, Check, X, Clock } from "lucide-react";
import type { Guest } from "@shared/schema";

interface GuestListManagerProps {
  guests: Guest[];
  onAddGuest?: () => void;
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

export function GuestListManager({ guests, onAddGuest, onEditGuest }: GuestListManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSide, setFilterSide] = useState<string>("all");
  const [filterRsvp, setFilterRsvp] = useState<string>("all");

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
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Guest List
          </h2>
          <p className="text-muted-foreground">
            Manage invitations and RSVPs
          </p>
        </div>
        {onAddGuest && (
          <Button onClick={onAddGuest} data-testid="button-add-guest">
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Guests</p>
              <p className="font-mono text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="font-mono text-2xl font-bold">{stats.confirmed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-mono text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Declined</p>
              <p className="font-mono text-2xl font-bold">{stats.declined}</p>
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
