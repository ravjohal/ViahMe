import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  CheckCircle2,
  X,
} from "lucide-react";
import type { Household, Guest } from "@shared/schema";

type AddressSuggestion = {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  place_id: string;
};

function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
}: {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressSuggestion) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // Parse Geoapify response format
        const parsed: AddressSuggestion[] = (data.features || []).map((feature: any) => ({
          formatted: feature.properties?.formatted || "",
          street: feature.properties?.street || feature.properties?.address_line1 || "",
          city: feature.properties?.city || "",
          state: feature.properties?.state || "",
          postcode: feature.properties?.postcode || "",
          country: feature.properties?.country || "",
          place_id: feature.properties?.place_id || crypto.randomUUID(),
        }));
        setSuggestions(parsed);
      }
    } catch (error) {
      console.error("Address autocomplete error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.formatted);
    onAddressSelect(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="min-h-[48px] text-base"
        data-testid="input-wizard-address"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-3 py-3 text-left hover:bg-muted text-sm border-b last:border-b-0"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.formatted}
            </button>
          ))}
        </div>
      )}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

const RELATIONSHIP_TIERS = [
  { value: "immediate_family", label: "Immediate Family" },
  { value: "extended_family", label: "Extended Family" },
  { value: "friend", label: "Close Friend" },
  { value: "parents_friend", label: "Parent's Friend" },
  { value: "coworker", label: "Co-worker" },
];

type WizardStep = "household" | "members" | "review";

type GuestMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isMainContact: boolean;
};

const DEFAULT_MEMBER = (): GuestMember => ({
  id: crypto.randomUUID(),
  name: "",
  email: "",
  phone: "",
  isMainContact: false,
});

interface HouseholdWizardProps {
  weddingId: string;
  editingHousehold?: Household | null;
  existingGuests?: Guest[];
  onSave: (householdData: any, members: GuestMember[]) => void;
  onCancel: () => void;
}

export function HouseholdWizard({
  weddingId,
  editingHousehold,
  existingGuests = [],
  onSave,
  onCancel,
}: HouseholdWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("household");
  const [householdName, setHouseholdName] = useState(editingHousehold?.name || "");
  const [affiliation, setAffiliation] = useState<string>(editingHousehold?.affiliation || "bride");
  const [relationshipTier, setRelationshipTier] = useState(editingHousehold?.relationshipTier || "friend");
  const [priorityTier, setPriorityTier] = useState(editingHousehold?.priorityTier || "should_invite");
  const [fullAddress, setFullAddress] = useState("");
  const [addressStreet, setAddressStreet] = useState(editingHousehold?.addressStreet || "");
  const [addressCity, setAddressCity] = useState(editingHousehold?.addressCity || "");
  const [addressState, setAddressState] = useState(editingHousehold?.addressState || "");
  const [addressPostalCode, setAddressPostalCode] = useState(editingHousehold?.addressPostalCode || "");
  const [addressCountry, setAddressCountry] = useState(editingHousehold?.addressCountry || "");
  
  const [members, setMembers] = useState<GuestMember[]>(() => {
    if (editingHousehold && existingGuests.length > 0) {
      const householdGuests = existingGuests.filter(g => g.householdId === editingHousehold.id);
      if (householdGuests.length > 0) {
        return householdGuests.map(g => ({
          id: g.id,
          name: g.name,
          email: g.email || "",
          phone: g.phone || "",
          isMainContact: g.isMainHouseholdContact || false,
        }));
      }
    }
    return [DEFAULT_MEMBER()];
  });

  const steps: WizardStep[] = ["household", "members", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (editingHousehold) {
      const addressParts = [
        editingHousehold.addressStreet,
        editingHousehold.addressCity,
        editingHousehold.addressState,
        editingHousehold.addressPostalCode,
        editingHousehold.addressCountry
      ].filter(Boolean);
      setFullAddress(addressParts.join(", "));
    }
  }, [editingHousehold]);

  const handleAddressSelect = (address: AddressSuggestion) => {
    setAddressStreet(address.street || "");
    setAddressCity(address.city || "");
    setAddressState(address.state || "");
    setAddressPostalCode(address.postcode || "");
    setAddressCountry(address.country || "");
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "household":
        return householdName.trim() !== "";
      case "members":
        return members.some(m => m.name.trim() !== "");
      case "review":
        return true;
      default:
        return true;
    }
  };

  const addMember = () => {
    setMembers([...members, DEFAULT_MEMBER()]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof GuestMember, value: string | boolean) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "isMainContact" && value === true) {
      updated.forEach((m, i) => {
        if (i !== index) {
          m.isMainContact = false;
        }
      });
    }
    
    setMembers(updated);
  };

  const getValidMembers = () => members.filter(m => m.name.trim() !== "");

  const handleSave = () => {
    const validMembers = getValidMembers();
    const householdData = {
      name: householdName,
      affiliation,
      relationshipTier,
      priorityTier,
      addressStreet,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
      weddingId,
    };
    onSave(householdData, validMembers);
  };

  const validMembers = getValidMembers();
  const mainContact = members.find(m => m.isMainContact);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <p className="text-xs font-medium text-primary">
            {currentStep === "household" ? "Household Info" : currentStep === "members" ? "Add Members" : "Review"}
          </p>
        </div>
      </div>

      {currentStep === "household" && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Household Information</h3>
            <p className="text-sm text-muted-foreground">
              Enter the family name and details
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              Household Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g., The Sharma Family"
              className="min-h-[48px] text-base"
              data-testid="input-wizard-household-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Side</Label>
              <Select value={affiliation} onValueChange={setAffiliation}>
                <SelectTrigger className="min-h-[48px]" data-testid="select-wizard-affiliation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride's Side</SelectItem>
                  <SelectItem value="groom">Groom's Side</SelectItem>
                  <SelectItem value="mutual">Mutual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Relationship</Label>
              <Select value={relationshipTier} onValueChange={setRelationshipTier}>
                <SelectTrigger className="min-h-[48px]" data-testid="select-wizard-relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TIERS.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Priority</Label>
            <Select value={priorityTier} onValueChange={setPriorityTier}>
              <SelectTrigger className="min-h-[48px]" data-testid="select-wizard-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="must_invite">Must Invite</SelectItem>
                <SelectItem value="should_invite">Should Invite</SelectItem>
                <SelectItem value="nice_to_have">Nice to Have</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Mailing Address
            </Label>
            <AddressAutocomplete
              value={fullAddress}
              onChange={setFullAddress}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing an address..."
            />
            <p className="text-xs text-muted-foreground">
              Optional - for save-the-dates and invitations
            </p>
          </div>
        </div>
      )}

      {currentStep === "members" && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Add Family Members</h3>
            <p className="text-sm text-muted-foreground">
              Add each person in this household
            </p>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {members.map((member, index) => (
              <Card key={member.id} className={`p-4 ${member.isMainContact ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    {member.isMainContact && (
                      <Badge className="bg-primary text-primary-foreground">Main Contact</Badge>
                    )}
                  </div>
                  {members.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(index)}
                      data-testid={`button-remove-member-${index}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={member.name}
                      onChange={(e) => updateMember(index, "name", e.target.value)}
                      placeholder="Full name"
                      className="min-h-[44px]"
                      data-testid={`input-member-name-${index}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateMember(index, "email", e.target.value)}
                        placeholder="email@example.com"
                        className="min-h-[44px]"
                        data-testid={`input-member-email-${index}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </Label>
                      <Input
                        value={member.phone}
                        onChange={(e) => updateMember(index, "phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="min-h-[44px]"
                        data-testid={`input-member-phone-${index}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id={`main-contact-${index}`}
                      checked={member.isMainContact}
                      onCheckedChange={(checked) => updateMember(index, "isMainContact", checked as boolean)}
                      data-testid={`checkbox-main-contact-${index}`}
                    />
                    <Label htmlFor={`main-contact-${index}`} className="text-sm cursor-pointer">
                      Main Point of Contact for this household
                    </Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addMember}
            className="w-full min-h-[48px]"
            data-testid="button-add-member"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Member
          </Button>
        </div>
      )}

      {currentStep === "review" && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Review & Save</h3>
            <p className="text-sm text-muted-foreground">
              Confirm the household details
            </p>
          </div>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{householdName}</span>
                <Badge variant="outline">
                  {affiliation === "bride" ? "Bride's Side" : affiliation === "groom" ? "Groom's Side" : "Mutual"}
                </Badge>
              </div>

              {fullAddress && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {fullAddress}
                </p>
              )}

              <div className="flex gap-2">
                <Badge variant="secondary">
                  {RELATIONSHIP_TIERS.find(t => t.value === relationshipTier)?.label || relationshipTier}
                </Badge>
                <Badge variant="secondary">
                  {priorityTier === "must_invite" ? "Must Invite" : priorityTier === "should_invite" ? "Should Invite" : "Nice to Have"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Family Members</span>
                <Badge>{validMembers.length} {validMembers.length === 1 ? 'person' : 'people'}</Badge>
              </div>

              <div className="space-y-2">
                {validMembers.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium">{member.name}</span>
                      {member.isMainContact && (
                        <Badge className="ml-2 text-xs bg-primary text-primary-foreground">Main Contact</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.email || member.phone || "No contact info"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        {currentStepIndex > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="min-h-[48px]"
            data-testid="button-wizard-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-[48px]"
            data-testid="button-wizard-cancel"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}

        {currentStep === "review" ? (
          <Button
            type="button"
            onClick={handleSave}
            className="min-h-[48px]"
            disabled={validMembers.length === 0}
            data-testid="button-wizard-save"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {editingHousehold ? "Update Household" : "Save Household"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="min-h-[48px]"
            data-testid="button-wizard-next"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
