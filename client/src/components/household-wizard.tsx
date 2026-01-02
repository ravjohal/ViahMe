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
  Minus,
  Trash2,
  User,
  Mail,
  Phone,
  CheckCircle2,
  X,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";
import { type Household, type Guest, DIETARY_OPTIONS, getDietaryLabel } from "@shared/schema";

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

type WizardStep = "household" | "main_contact" | "members" | "review";

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
  // Household info
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
  
  // New fields for step 1
  const [memberCount, setMemberCount] = useState(() => {
    if (editingHousehold && existingGuests.length > 0) {
      return existingGuests.filter(g => g.householdId === editingHousehold.id).length;
    }
    return 1;
  });
  const [addMembersIndividually, setAddMembersIndividually] = useState(() => {
    // Default to true when editing (so they can see existing members)
    return !!editingHousehold;
  });
  const [dietaryRestriction, setDietaryRestriction] = useState(editingHousehold?.dietaryRestriction || "none");
  
  // Main contact info (step 2)
  const [mainContactName, setMainContactName] = useState("");
  const [mainContactEmail, setMainContactEmail] = useState("");
  const [mainContactPhone, setMainContactPhone] = useState("");
  
  // Additional members (step 3)
  const [additionalMembers, setAdditionalMembers] = useState<GuestMember[]>([]);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("household");

  // Calculate steps based on checkbox - memoize to avoid recalculation issues
  const steps: WizardStep[] = addMembersIndividually 
    ? ["household", "main_contact", "members", "review"]
    : ["household", "main_contact", "review"];

  // Ensure currentStep is valid when checkbox changes
  useEffect(() => {
    if (!steps.includes(currentStep)) {
      // If current step is no longer valid (e.g., "members" when checkbox unchecked),
      // move to the last valid step before the invalid one
      if (currentStep === "members") {
        setCurrentStep("main_contact");
      } else {
        setCurrentStep("household");
      }
    }
  }, [addMembersIndividually, currentStep, steps]);

  const currentStepIndex = steps.indexOf(currentStep);
  const safeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const progressPercent = ((safeStepIndex + 1) / steps.length) * 100;

  // Initialize from existing data when editing
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
      
      // Load existing guests
      const householdGuests = existingGuests.filter(g => g.householdId === editingHousehold.id);
      const mainContact = householdGuests.find(g => g.isMainHouseholdContact);
      const others = householdGuests.filter(g => !g.isMainHouseholdContact);
      
      if (mainContact) {
        setMainContactName(mainContact.name);
        setMainContactEmail(mainContact.email || "");
        setMainContactPhone(mainContact.phone || "");
      } else if (householdGuests.length > 0) {
        // If no main contact designated, use first guest
        setMainContactName(householdGuests[0].name);
        setMainContactEmail(householdGuests[0].email || "");
        setMainContactPhone(householdGuests[0].phone || "");
      }
      
      if (others.length > 0) {
        setAdditionalMembers(others.map(g => ({
          id: g.id,
          name: g.name,
          email: g.email || "",
          phone: g.phone || "",
          isMainContact: false,
        })));
        setAddMembersIndividually(true);
      }
    }
  }, [editingHousehold, existingGuests]);

  const handleAddressSelect = (address: AddressSuggestion) => {
    setAddressStreet(address.street || "");
    setAddressCity(address.city || "");
    setAddressState(address.state || "");
    setAddressPostalCode(address.postcode || "");
    setAddressCountry(address.country || "");
  };

  const handleNext = () => {
    const nextIndex = safeStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = safeStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "household":
        return householdName.trim() !== "" && memberCount >= 1;
      case "main_contact":
        return mainContactName.trim() !== "";
      case "members":
        return true; // Additional members are optional
      case "review":
        return true;
      default:
        return true;
    }
  };

  const addAdditionalMember = () => {
    setAdditionalMembers([...additionalMembers, DEFAULT_MEMBER()]);
  };

  const removeAdditionalMember = (index: number) => {
    setAdditionalMembers(additionalMembers.filter((_, i) => i !== index));
  };

  const updateAdditionalMember = (index: number, field: keyof GuestMember, value: string | boolean) => {
    const updated = [...additionalMembers];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalMembers(updated);
  };

  const getAllMembers = (): GuestMember[] => {
    // Main contact is always first and marked as main contact
    const mainContact: GuestMember = {
      id: editingHousehold 
        ? existingGuests.find(g => g.householdId === editingHousehold.id && g.isMainHouseholdContact)?.id 
          || existingGuests.find(g => g.householdId === editingHousehold.id)?.id 
          || crypto.randomUUID()
        : crypto.randomUUID(),
      name: mainContactName,
      email: mainContactEmail,
      phone: mainContactPhone,
      isMainContact: true,
    };

    if (addMembersIndividually) {
      // Return main contact + individually added members
      const validAdditional = additionalMembers.filter(m => m.name.trim() !== "");
      return [mainContact, ...validAdditional];
    } else {
      // Create placeholder members based on count
      const placeholders: GuestMember[] = [];
      for (let i = 1; i < memberCount; i++) {
        placeholders.push({
          id: crypto.randomUUID(),
          name: `${householdName} Guest ${i + 1}`,
          email: "",
          phone: "",
          isMainContact: false,
        });
      }
      return [mainContact, ...placeholders];
    }
  };

  const handleSave = () => {
    const allMembers = getAllMembers();
    const householdData = {
      name: householdName,
      affiliation,
      relationshipTier,
      dietaryRestriction: dietaryRestriction === "none" ? null : dietaryRestriction,
      addressStreet,
      addressCity,
      addressState,
      addressPostalCode,
      addressCountry,
      weddingId,
    };
    onSave(householdData, allMembers);
  };

  const getStepLabel = (step: WizardStep): string => {
    switch (step) {
      case "household": return "Family Info";
      case "main_contact": return "Main Contact";
      case "members": return "Add Members";
      case "review": return "Review";
      default: return "";
    }
  };

  const allMembers = getAllMembers();

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            Step {safeStepIndex + 1} of {steps.length}
          </p>
          <p className="text-xs font-medium text-primary">
            {getStepLabel(currentStep)}
          </p>
        </div>
      </div>

      {/* Step 1: Household Info */}
      {currentStep === "household" && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Add a Family</h3>
            <p className="text-sm text-muted-foreground">
              Enter the household name, address, and dietary preferences
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              Family/Household Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g., The Sharma Family"
              className="min-h-[48px] text-base"
              data-testid="input-wizard-household-name"
            />
            <p className="text-xs text-muted-foreground">
              This is how they'll appear on the guest list
            </p>
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

          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              How many people in this family? <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setMemberCount(Math.max(1, memberCount - 1))}
                disabled={memberCount <= 1}
                className="h-12 w-12"
                data-testid="button-member-count-minus"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-semibold w-12 text-center" data-testid="text-member-count">
                {memberCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setMemberCount(Math.min(20, memberCount + 1))}
                disabled={memberCount >= 20}
                className="h-12 w-12"
                data-testid="button-member-count-plus"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total number of guests in this household
            </p>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
            <Checkbox
              id="add-individually"
              checked={addMembersIndividually}
              onCheckedChange={(checked) => setAddMembersIndividually(checked as boolean)}
              data-testid="checkbox-add-individually"
            />
            <div>
              <Label htmlFor="add-individually" className="text-base cursor-pointer font-medium">
                Add members individually
              </Label>
              <p className="text-xs text-muted-foreground">
                Enter names and details for each person (optional)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Household Dietary Restriction
            </Label>
            <Select value={dietaryRestriction} onValueChange={setDietaryRestriction}>
              <SelectTrigger className="min-h-[48px]" data-testid="select-wizard-dietary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIETARY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="py-2">
                    <span className="text-base">{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Does the whole household share a dietary restriction?
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Main Point of Contact */}
      {currentStep === "main_contact" && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Main Point of Contact</h3>
            <p className="text-sm text-muted-foreground">
              Who should receive invitations and updates for this household?
            </p>
          </div>

          <Card className="p-4 border-primary bg-primary/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary text-primary-foreground">Main Contact</Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={mainContactName}
                  onChange={(e) => setMainContactName(e.target.value)}
                  placeholder="Full name"
                  className="min-h-[48px] text-base"
                  data-testid="input-main-contact-name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={mainContactEmail}
                    onChange={(e) => setMainContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="min-h-[48px]"
                    data-testid="input-main-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Phone
                  </Label>
                  <Input
                    value={mainContactPhone}
                    onChange={(e) => setMainContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="min-h-[48px]"
                    data-testid="input-main-contact-phone"
                  />
                </div>
              </div>
            </div>
          </Card>

          <p className="text-sm text-muted-foreground text-center">
            This person will be the primary contact for all communications with this household.
          </p>
        </div>
      )}

      {/* Step 3: Additional Members (conditional) */}
      {currentStep === "members" && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Additional Family Members</h3>
            <p className="text-sm text-muted-foreground">
              Add other members of this household (optional)
            </p>
          </div>

          {additionalMembers.length === 0 ? (
            <Card className="p-6 border-dashed text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium mb-1">No additional members yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Click below to add more family members
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={addAdditionalMember}
                className="min-h-[48px]"
                data-testid="button-add-first-member"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Family Member
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {additionalMembers.map((member, index) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant="outline">Member #{index + 2}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAdditionalMember(index)}
                        data-testid={`button-remove-member-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-sm flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Name
                        </Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateAdditionalMember(index, "name", e.target.value)}
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
                            onChange={(e) => updateAdditionalMember(index, "email", e.target.value)}
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
                            onChange={(e) => updateAdditionalMember(index, "phone", e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="min-h-[44px]"
                            data-testid={`input-member-phone-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addAdditionalMember}
                className="w-full min-h-[48px]"
                data-testid="button-add-member"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Member
              </Button>
            </>
          )}
        </div>
      )}

      {/* Step 4: Review */}
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
              <div className="flex items-center justify-between gap-2 flex-wrap">
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

              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {RELATIONSHIP_TIERS.find(t => t.value === relationshipTier)?.label || relationshipTier}
                </Badge>
                {dietaryRestriction && dietaryRestriction !== "none" && (
                  <Badge variant="secondary">
                    {getDietaryLabel(dietaryRestriction)}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium">Family Members</span>
                <Badge>{allMembers.length} {allMembers.length === 1 ? 'person' : 'people'}</Badge>
              </div>

              <div className="space-y-2">
                {allMembers.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-b-0 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{member.name}</span>
                      {member.isMainContact && (
                        <Badge className="text-xs bg-primary text-primary-foreground">Main Contact</Badge>
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

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t gap-2">
        {safeStepIndex > 0 ? (
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
            disabled={allMembers.length === 0}
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
