import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Users, 
  Phone, 
  Mail, 
  MessageCircle, 
  Gift, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Crown,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Heart
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Household, Event, Guest } from "@shared/schema";

interface HouseholdMember {
  name: string;
  email?: string;
  phone?: string;
  dietaryRestriction?: string;
}

interface HouseholdCardProps {
  household: Household;
  guests: Guest[];
  events: Event[];
  selectedEventIds?: string[];
  onEdit?: (household: Household) => void;
  onDelete?: (householdId: string) => void;
  onEventToggle?: (householdId: string, eventId: string, isAdded: boolean) => void;
  onGiftUpdate?: (householdId: string, data: { lifafaAmount?: string; giftDescription?: string; giftNotes?: string; thankYouSent?: boolean }) => void;
  onSendReminder?: (household: Household, method: 'whatsapp' | 'sms' | 'email') => void;
  compact?: boolean;
}

export function HouseholdCard({ 
  household, 
  guests, 
  events, 
  selectedEventIds = [],
  onEdit, 
  onDelete, 
  onEventToggle,
  onGiftUpdate,
  onSendReminder,
  compact = false 
}: HouseholdCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [giftAmount, setGiftAmount] = useState(household.lifafaAmount || "");
  const [giftDesc, setGiftDesc] = useState((household as any).giftDescription || "");
  const [giftNotes, setGiftNotes] = useState(household.giftNotes || "");
  const [thankYouSent, setThankYouSent] = useState((household as any).thankYouSent || false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const rawMembers = (household as any).members;
  const members: HouseholdMember[] = (() => {
    if (!rawMembers) return [];
    if (Array.isArray(rawMembers)) return rawMembers;
    if (typeof rawMembers === 'string') {
      try { return JSON.parse(rawMembers); } catch { return []; }
    }
    return [];
  })();
  const headOfHouseIndex = (household as any).headOfHouseIndex || 0;
  const headOfHouse = members[headOfHouseIndex] || members[0];
  
  const householdGuests = guests.filter(g => g.householdId === household.id);
  
  // Find the main contact guest (first guest with isMainHouseholdContact=true, or first guest)
  const mainContactGuest = householdGuests.find(g => g.isMainHouseholdContact) || householdGuests[0];
  const mainContactName = mainContactGuest?.name || headOfHouse?.name;
  const adultCount = householdGuests.length || household.maxCount || 1;
  
  const getAffiliationColor = () => {
    switch (household.affiliation) {
      case 'bride': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'groom': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    }
  };

  const getStatusBadge = () => {
    // Check main contact guest for contact info
    const hasContactInfo = mainContactGuest?.email || mainContactGuest?.phone || household.contactEmail;
    if (!hasContactInfo) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300">Needs Contact</Badge>;
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - touchStartX;
    setSwipeX(Math.max(-100, Math.min(100, diff)));
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeX > 60 && onSendReminder) {
      onSendReminder(household, 'whatsapp');
    } else if (swipeX < -60 && onEventToggle) {
      setIsExpanded(true);
    }
    setSwipeX(0);
  };

  const handleWhatsAppClick = () => {
    const phone = mainContactGuest?.phone || headOfHouse?.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Hi! This is a reminder about our wedding. We'd love to have you and your family join us!`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleSMSClick = () => {
    const phone = mainContactGuest?.phone || headOfHouse?.phone;
    if (phone) {
      window.open(`sms:${phone}`, '_blank');
    }
  };

  const handleEmailClick = () => {
    const email = mainContactGuest?.email || headOfHouse?.email || household.contactEmail;
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  };

  const handleSaveGift = () => {
    if (onGiftUpdate) {
      onGiftUpdate(household.id, {
        lifafaAmount: giftAmount,
        giftDescription: giftDesc,
        giftNotes: giftNotes,
        thankYouSent: thankYouSent,
      });
    }
    setGiftDialogOpen(false);
  };

  const hasGift = household.lifafaAmount || (household as any).giftDescription;
  const contactPhone = mainContactGuest?.phone || headOfHouse?.phone;
  const contactEmail = mainContactGuest?.email || headOfHouse?.email || household.contactEmail;

  return (
    <>
      <Card 
        ref={cardRef}
        className={`relative overflow-visible transition-transform touch-pan-y ${compact ? 'p-2' : ''}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid={`card-household-${household.id}`}
      >
        {swipeX > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-green-500 rounded-l-lg flex items-center justify-center -z-10">
            <SiWhatsapp className="h-6 w-6 text-white" />
          </div>
        )}
        {swipeX < 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-blue-500 rounded-r-lg flex items-center justify-center -z-10">
            <Calendar className="h-6 w-6 text-white" />
          </div>
        )}

        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold truncate flex items-center gap-2">
                {household.name}
                {hasGift && (
                  <Gift className="h-4 w-4 text-amber-500 flex-shrink-0" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <Badge className={`text-xs ${getAffiliationColor()}`}>
                  {household.affiliation === 'bride' ? "Bride's" : household.affiliation === 'groom' ? "Groom's" : "Mutual"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {adultCount}
                </Badge>
                {getStatusBadge()}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => onEdit(household)}
                  data-testid={`button-edit-household-${household.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          {(mainContactName || contactPhone || contactEmail) && (
            <div className="p-2 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{mainContactName || "Main Contact"}</p>
                    <p className="text-xs text-muted-foreground">Main Point of Contact</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {contactPhone && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-green-600"
                        onClick={handleWhatsAppClick}
                        data-testid={`button-whatsapp-${household.id}`}
                      >
                        <SiWhatsapp className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleSMSClick}
                        data-testid={`button-sms-${household.id}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {contactEmail && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleEmailClick}
                      data-testid={`button-email-${household.id}`}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {(contactPhone || contactEmail) && (
                <div className="text-xs text-muted-foreground space-y-0.5 pl-6">
                  {contactPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{contactPhone}</span>
                    </div>
                  )}
                  {contactEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{contactEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {members.length > 1 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Members:</span>{" "}
              {members.map((m, i) => m.name).filter(Boolean).join(", ")}
            </div>
          )}

          {events.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {events.map(event => {
                const isInvited = selectedEventIds.includes(event.id);
                return (
                  <Badge 
                    key={event.id}
                    variant={isInvited ? "default" : "outline"}
                    className={`text-xs cursor-pointer transition-colors ${
                      isInvited 
                        ? "bg-primary" 
                        : "opacity-50 hover:opacity-100"
                    }`}
                    onClick={() => onEventToggle?.(household.id, event.id, !isInvited)}
                    data-testid={`badge-event-${household.id}-${event.id}`}
                  >
                    {event.name}
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs gap-1.5"
              onClick={() => setGiftDialogOpen(true)}
              data-testid={`button-gift-${household.id}`}
            >
              <Gift className="h-3.5 w-3.5" />
              {hasGift ? "View Gift" : "Track Gift"}
            </Button>
            {(household as any).thankYouSent && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                <Heart className="h-3 w-3 mr-1" />
                Thanks Sent
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gift Tracking - {household.name}</DialogTitle>
            <DialogDescription>
              Track gifts received from this family
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Monetary Gift (Lifafa)</label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  placeholder="Amount"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  data-testid="input-gift-amount"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Physical Gifts</label>
              <Input 
                placeholder="e.g., Silver Set, Saree, Watch"
                value={giftDesc}
                onChange={(e) => setGiftDesc(e.target.value)}
                className="mt-1"
                data-testid="input-gift-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Any additional notes..."
                value={giftNotes}
                onChange={(e) => setGiftNotes(e.target.value)}
                className="mt-1"
                data-testid="input-gift-notes"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="thankYouSent"
                checked={thankYouSent}
                onCheckedChange={(checked) => setThankYouSent(!!checked)}
                data-testid="checkbox-thank-you"
              />
              <label htmlFor="thankYouSent" className="text-sm">Thank you note sent</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGift} data-testid="button-save-gift">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface EventFilterPillsProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
  householdCounts: Map<string, number>;
}

export function EventFilterPills({ events, selectedEventId, onSelectEvent, householdCounts }: EventFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
      <Badge 
        variant={selectedEventId === null ? "default" : "outline"}
        className="cursor-pointer text-sm px-3 py-1.5"
        onClick={() => onSelectEvent(null)}
        data-testid="badge-filter-all"
      >
        All Events
      </Badge>
      {events.map(event => {
        const count = householdCounts.get(event.id) || 0;
        const capacity = event.venueCapacity;
        const isOverCapacity = capacity && count > capacity;
        
        return (
          <Badge 
            key={event.id}
            variant={selectedEventId === event.id ? "default" : "outline"}
            className={`cursor-pointer text-sm px-3 py-1.5 gap-1.5 ${
              isOverCapacity ? "border-red-500 text-red-600" : ""
            }`}
            onClick={() => onSelectEvent(event.id)}
            data-testid={`badge-filter-${event.id}`}
          >
            {event.name}
            <span className={`text-xs ${isOverCapacity ? "text-red-500" : "text-muted-foreground"}`}>
              {count}{capacity ? `/${capacity}` : ""}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}

interface SideFilterToggleProps {
  selected: 'all' | 'bride' | 'groom';
  onSelect: (side: 'all' | 'bride' | 'groom') => void;
  counts: { bride: number; groom: number; mutual: number };
}

export function SideFilterToggle({ selected, onSelect, counts }: SideFilterToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      <Button 
        variant={selected === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSelect('all')}
        className="flex-1"
        data-testid="button-filter-all-sides"
      >
        All ({counts.bride + counts.groom + counts.mutual})
      </Button>
      <Button 
        variant={selected === 'bride' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSelect('bride')}
        className="flex-1 text-rose-600"
        data-testid="button-filter-bride"
      >
        Bride's ({counts.bride})
      </Button>
      <Button 
        variant={selected === 'groom' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSelect('groom')}
        className="flex-1 text-amber-600"
        data-testid="button-filter-groom"
      >
        Groom's ({counts.groom})
      </Button>
    </div>
  );
}

interface SummaryHeaderProps {
  totalHouseholds: number;
  totalGuests: number;
  rsvpPending: number;
  rsvpConfirmed: number;
  onSendReminders?: () => void;
}

export function SummaryHeader({ 
  totalHouseholds, 
  totalGuests, 
  rsvpPending, 
  rsvpConfirmed,
  onSendReminders 
}: SummaryHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-3 sm:p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{totalHouseholds}</p>
            <p className="text-xs text-muted-foreground">Families</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold">{totalGuests}</p>
            <p className="text-xs text-muted-foreground">Guests</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{rsvpConfirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">{rsvpPending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
        {onSendReminders && rsvpPending > 0 && (
          <Button 
            onClick={onSendReminders}
            className="gap-2 min-h-[44px]"
            data-testid="button-send-reminders"
          >
            <SiWhatsapp className="h-4 w-4" />
            <span className="hidden sm:inline">Send Reminders</span>
            <span className="sm:hidden">Remind</span>
          </Button>
        )}
      </div>
    </div>
  );
}
