import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, DollarSign, Phone, Mail, Send } from "lucide-react";
import type { Vendor, Event } from "@shared/schema";

interface VendorDetailModalProps {
  vendor: Vendor | null;
  events: Event[];
  open: boolean;
  onClose: () => void;
  onBookRequest: (vendorId: string, eventId: string, notes: string, estimatedCost: string) => void;
}

export function VendorDetailModal({
  vendor,
  events,
  open,
  onClose,
  onBookRequest,
}: VendorDetailModalProps) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  if (!vendor) return null;

  const rating = vendor.rating ? parseFloat(vendor.rating.toString()) : 0;

  const handleSubmit = () => {
    if (!selectedEvent) return;
    onBookRequest(vendor.id, selectedEvent, notes, estimatedCost);
    setSelectedEvent("");
    setNotes("");
    setEstimatedCost("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {vendor.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2">
                {vendor.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
              {vendor.description && (
                <p className="text-muted-foreground mt-2">{vendor.description}</p>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <span className="font-mono font-bold text-lg">{rating.toFixed(1)}</span>
                {vendor.reviewCount && vendor.reviewCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{vendor.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono font-semibold">{vendor.priceRange}</span>
            </div>
          </div>

          {vendor.culturalSpecialties && vendor.culturalSpecialties.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Cultural Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.culturalSpecialties.map((specialty: string) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {vendor.contact && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {vendor.contact.includes("@") ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.contact}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.contact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Request Booking</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-select" className="text-base">
                  Select Event
                </Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger id="event-select" data-testid="select-event-booking" className="mt-2">
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} {event.date && `- ${new Date(event.date).toLocaleDateString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimated-cost" className="text-base">
                  Estimated Cost (Optional)
                </Label>
                <Input
                  id="estimated-cost"
                  type="number"
                  placeholder="Enter estimated cost..."
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  data-testid="input-estimated-cost"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="booking-notes" className="text-base">
                  Message to Vendor (Optional)
                </Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Tell the vendor about your specific needs, preferences, or questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  data-testid="textarea-booking-notes"
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedEvent}
                className="w-full"
                data-testid="button-submit-booking"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Booking Request
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
