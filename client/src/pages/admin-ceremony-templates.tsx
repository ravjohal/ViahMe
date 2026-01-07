import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, DollarSign, MapPin, Users, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import type { CeremonyTemplate, RegionalPricing } from "@shared/schema";

const TRADITIONS = [
  { value: "sikh", label: "Sikh" },
  { value: "hindu", label: "Hindu" },
  { value: "muslim", label: "Muslim" },
  { value: "gujarati", label: "Gujarati" },
  { value: "south_indian", label: "South Indian" },
  { value: "christian", label: "Christian" },
  { value: "jain", label: "Jain" },
  { value: "parsi", label: "Parsi" },
  { value: "mixed", label: "Mixed/Fusion" },
  { value: "general", label: "General" },
];

const UNIT_TYPES = [
  { value: "fixed", label: "Fixed Cost" },
  { value: "per_person", label: "Per Person" },
  { value: "per_hour", label: "Per Hour" },
];

export default function AdminCeremonyTemplatesPage() {
  const { toast } = useToast();
  const [selectedTradition, setSelectedTradition] = useState("sikh");
  const [editingTemplate, setEditingTemplate] = useState<CeremonyTemplate | null>(null);
  const [editingPricing, setEditingPricing] = useState<RegionalPricing | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);

  const { data: authData } = useQuery<{ user: { id: string; email: string; isSiteAdmin: boolean } | null }>({
    queryKey: ["/api/auth/me"],
  });
  const user = authData?.user;

  const { data: templates = [], isLoading: templatesLoading } = useQuery<CeremonyTemplate[]>({
    queryKey: ["/api/ceremony-templates"],
  });

  const { data: regionalPricing = [], isLoading: pricingLoading } = useQuery<RegionalPricing[]>({
    queryKey: ["/api/regional-pricing"],
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ ceremonyId, data }: { ceremonyId: string; data: Partial<CeremonyTemplate> }) => {
      return apiRequest("PATCH", `/api/ceremony-templates/${ceremonyId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-templates"] });
      toast({ title: "Template updated successfully" });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update template", description: error.message, variant: "destructive" });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ city, data }: { city: string; data: Partial<RegionalPricing> }) => {
      return apiRequest("PATCH", `/api/regional-pricing/${city}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regional-pricing"] });
      toast({ title: "Regional pricing updated successfully" });
      setIsPricingDialogOpen(false);
      setEditingPricing(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update pricing", description: error.message, variant: "destructive" });
    },
  });

  const filteredTemplates = templates.filter(t => t.tradition === selectedTradition);

  if (!user?.isSiteAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You must be a site administrator to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Ceremony Cost Templates</h1>
          <p className="text-muted-foreground">Manage cost estimates for wedding ceremonies across traditions</p>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">Ceremony Templates</TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-pricing">Regional Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Tradition:</Label>
              <Select value={selectedTradition} onValueChange={setSelectedTradition}>
                <SelectTrigger className="w-48" data-testid="select-tradition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADITIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredTemplates.length} ceremonies
            </Badge>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No ceremony templates found for this tradition.</p>
                <p className="text-sm text-muted-foreground mt-2">Run the seed script to populate templates.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} data-testid={`card-template-${template.ceremonyId}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsTemplateDialogOpen(true);
                        }}
                        data-testid={`button-edit-${template.ceremonyId}`}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{template.defaultGuests} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${template.costPerGuestLow} - ${template.costPerGuestHigh}/guest</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        Order: {template.displayOrder}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Cost Breakdown ({(template.costBreakdown as any[]).length} categories)</h4>
                      <div className="grid gap-1 text-xs">
                        {(template.costBreakdown as any[]).slice(0, 5).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-muted-foreground">
                            <span>{item.category}</span>
                            <span>
                              ${item.lowCost} - ${item.highCost}
                              {item.unit === "per_person" && "/person"}
                              {item.unit === "per_hour" && "/hour"}
                            </span>
                          </div>
                        ))}
                        {(template.costBreakdown as any[]).length > 5 && (
                          <span className="text-muted-foreground">+{(template.costBreakdown as any[]).length - 5} more...</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Regional Price Multipliers
              </CardTitle>
              <CardDescription>
                Cost multipliers applied to ceremony estimates based on wedding location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Effect on $10,000 base</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regionalPricing.map(pricing => (
                      <TableRow key={pricing.id} data-testid={`row-pricing-${pricing.city}`}>
                        <TableCell className="font-medium">{pricing.displayName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{parseFloat(pricing.multiplier).toFixed(2)}x</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          ${(10000 * parseFloat(pricing.multiplier)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pricing.isActive ? "default" : "secondary"}>
                            {pricing.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPricing(pricing);
                              setIsPricingDialogOpen(true);
                            }}
                            data-testid={`button-edit-pricing-${pricing.city}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ceremony Template</DialogTitle>
            <DialogDescription>Update cost estimates for {editingTemplate?.name}</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <TemplateEditForm
              template={editingTemplate}
              onSave={(data) => updateTemplateMutation.mutate({ ceremonyId: editingTemplate.ceremonyId, data })}
              isPending={updateTemplateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Regional Pricing</DialogTitle>
            <DialogDescription>Update price multiplier for {editingPricing?.displayName}</DialogDescription>
          </DialogHeader>
          {editingPricing && (
            <PricingEditForm
              pricing={editingPricing}
              onSave={(data) => updatePricingMutation.mutate({ city: editingPricing.city, data })}
              isPending={updatePricingMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateEditForm({
  template,
  onSave,
  isPending,
}: {
  template: CeremonyTemplate;
  onSave: (data: Partial<CeremonyTemplate>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [defaultGuests, setDefaultGuests] = useState(template.defaultGuests.toString());
  const [isActive, setIsActive] = useState(template.isActive);
  const [displayOrder, setDisplayOrder] = useState(template.displayOrder.toString());
  const [costBreakdown, setCostBreakdown] = useState(template.costBreakdown as any[]);

  const updateCategory = (idx: number, field: string, value: any) => {
    const updated = [...costBreakdown];
    updated[idx] = { ...updated[idx], [field]: value };
    setCostBreakdown(updated);
  };

  const calculateTotals = () => {
    const guests = parseInt(defaultGuests) || 100;
    let totalLow = 0;
    let totalHigh = 0;

    for (const item of costBreakdown) {
      if (item.unit === "per_person") {
        totalLow += item.lowCost * guests;
        totalHigh += item.highCost * guests;
      } else {
        totalLow += item.lowCost;
        totalHigh += item.highCost;
      }
    }

    return {
      totalLow: Math.round(totalLow),
      totalHigh: Math.round(totalHigh),
      perGuestLow: (totalLow / guests).toFixed(2),
      perGuestHigh: (totalHigh / guests).toFixed(2),
    };
  };

  const totals = calculateTotals();

  const handleSubmit = () => {
    onSave({
      name,
      description,
      defaultGuests: parseInt(defaultGuests),
      isActive,
      displayOrder: parseInt(displayOrder),
      costBreakdown,
      costPerGuestLow: totals.perGuestLow,
      costPerGuestHigh: totals.perGuestHigh,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name" />
          </div>
          <div>
            <Label>Default Guests</Label>
            <Input
              type="number"
              value={defaultGuests}
              onChange={(e) => setDefaultGuests(e.target.value)}
              data-testid="input-guests"
            />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Display Order</Label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              data-testid="input-order"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
              data-testid="checkbox-active"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Cost Breakdown</Label>
        <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
          {costBreakdown.map((item, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-2 items-center text-sm">
              <Input
                value={item.category}
                onChange={(e) => updateCategory(idx, "category", e.target.value)}
                placeholder="Category"
                className="text-xs"
                data-testid={`input-category-${idx}`}
              />
              <Input
                type="number"
                value={item.lowCost}
                onChange={(e) => updateCategory(idx, "lowCost", parseFloat(e.target.value) || 0)}
                placeholder="Min"
                className="text-xs"
                data-testid={`input-low-${idx}`}
              />
              <Input
                type="number"
                value={item.highCost}
                onChange={(e) => updateCategory(idx, "highCost", parseFloat(e.target.value) || 0)}
                placeholder="Max"
                className="text-xs"
                data-testid={`input-high-${idx}`}
              />
              <Select value={item.unit} onValueChange={(v) => updateCategory(idx, "unit", v)}>
                <SelectTrigger className="text-xs" data-testid={`select-unit-${idx}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCostBreakdown(costBreakdown.filter((_, i) => i !== idx))}
                data-testid={`button-remove-${idx}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setCostBreakdown([...costBreakdown, { category: "", lowCost: 0, highCost: 0, unit: "fixed" }])}
          data-testid="button-add-category"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Category
        </Button>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Estimate:</span>
              <span className="ml-2 font-semibold">${totals.totalLow.toLocaleString()} - ${totals.totalHigh.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Per Guest:</span>
              <span className="ml-2 font-semibold">${totals.perGuestLow} - ${totals.perGuestHigh}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-template">
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}

function PricingEditForm({
  pricing,
  onSave,
  isPending,
}: {
  pricing: RegionalPricing;
  onSave: (data: Partial<RegionalPricing>) => void;
  isPending: boolean;
}) {
  const [displayName, setDisplayName] = useState(pricing.displayName);
  const [multiplier, setMultiplier] = useState(pricing.multiplier);
  const [isActive, setIsActive] = useState(pricing.isActive);

  const handleSubmit = () => {
    onSave({
      displayName,
      multiplier,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Display Name</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="input-display-name" />
      </div>
      <div>
        <Label>Multiplier</Label>
        <Input
          type="number"
          step="0.01"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          data-testid="input-multiplier"
        />
        <p className="text-xs text-muted-foreground mt-1">
          1.0 = base price, 1.5 = 50% more expensive
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pricingActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
          data-testid="checkbox-pricing-active"
        />
        <Label htmlFor="pricingActive">Active</Label>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-pricing">
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}
