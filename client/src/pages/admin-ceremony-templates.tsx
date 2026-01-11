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
import { Loader2, Plus, Pencil, Trash2, DollarSign, MapPin, Users, Clock, ShieldCheck, AlertCircle, List } from "lucide-react";
import type { CeremonyType, RegionalPricing, CeremonyBudgetCategory, BudgetBucketCategory } from "@shared/schema";

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

const BUDGET_BUCKETS_FALLBACK = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "photography", label: "Photography" },
  { value: "decor", label: "Decor" },
  { value: "attire", label: "Attire" },
  { value: "entertainment", label: "Entertainment" },
  { value: "transportation", label: "Transportation" },
  { value: "beauty", label: "Beauty" },
  { value: "invitations", label: "Invitations" },
  { value: "gifts", label: "Gifts" },
  { value: "religious", label: "Religious" },
  { value: "other", label: "Other" },
];

export default function AdminCeremonyTemplatesPage() {
  const { toast } = useToast();
  const [selectedTradition, setSelectedTradition] = useState("sikh");
  const [editingTemplate, setEditingTemplate] = useState<CeremonyType | null>(null);
  const [editingPricing, setEditingPricing] = useState<RegionalPricing | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  
  // Budget line items state
  const [selectedCeremonyForLineItems, setSelectedCeremonyForLineItems] = useState<string | null>(null);
  const [isAddLineItemDialogOpen, setIsAddLineItemDialogOpen] = useState(false);
  const [isEditLineItemDialogOpen, setIsEditLineItemDialogOpen] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState<{
    id: string;
    itemName: string;
    budgetBucketId: string;
    lowCost: string;
    highCost: string;
    unit: string;
    notes: string;
  } | null>(null);
  const [newLineItem, setNewLineItem] = useState({
    itemName: "",
    budgetBucketId: "other",
    lowCost: "",
    highCost: "",
    unit: "fixed",
    notes: "",
  });

  const { data: authData } = useQuery<{ user: { id: string; email: string; isSiteAdmin: boolean } | null }>({
    queryKey: ["/api/auth/me"],
  });
  const user = authData?.user;

  const { data: templates = [], isLoading: templatesLoading } = useQuery<CeremonyType[]>({
    queryKey: ["/api/ceremony-types"],
  });

  const { data: regionalPricing = [], isLoading: pricingLoading } = useQuery<RegionalPricing[]>({
    queryKey: ["/api/regional-pricing"],
  });
  
  // Fetch budget bucket categories for dropdown and label lookup
  const { data: budgetBucketCategories = [] } = useQuery<BudgetBucketCategory[]>({
    queryKey: ["/api/budget/categories"],
  });
  
  // Create lookup maps for budget bucket categories (by UUID and by slug)
  const budgetBucketLookup = budgetBucketCategories.reduce((acc, cat) => {
    acc[cat.id] = cat.displayName || cat.slug;
    acc[cat.slug] = cat.displayName || cat.slug;
    return acc;
  }, {} as Record<string, string>);
  
  // Budget buckets for Select dropdown - use API data or fallback
  const BUDGET_BUCKETS = budgetBucketCategories.length > 0
    ? budgetBucketCategories.map(cat => ({ value: cat.id, label: cat.displayName || cat.slug }))
    : BUDGET_BUCKETS_FALLBACK;
  
  // Fetch all ceremony line items (grouped by ceremony ID) for displaying in templates tab
  type AllLineItemsMap = Record<string, Array<{
    id: string;
    name: string;
    budgetBucketId: string;
    lowCost: number;
    highCost: number;
    unit: string;
    isCustom: boolean;
  }>>;
  
  const { data: allLineItemsMap = {} } = useQuery<AllLineItemsMap>({
    queryKey: ["/api/ceremony-types/all/line-items"],
  });
  
  // Fetch ceremony budget categories for the selected ceremony
  interface CeremonyLineItemsResponse {
    ceremonyId: string;
    ceremonyName: string;
    tradition: string;
    lineItems: Array<{
      id: string;
      name: string;
      budgetBucketId: string;
      lowCost: number;
      highCost: number;
      unit: string;
      notes?: string;
      weddingId?: string;
      isCustom: boolean;
    }>;
  }
  
  const { data: ceremonyLineItems, isLoading: lineItemsLoading } = useQuery<CeremonyLineItemsResponse>({
    queryKey: ["/api/ceremony-types", selectedCeremonyForLineItems, "line-items"],
    enabled: !!selectedCeremonyForLineItems,
  });
  
  // System-only line items (weddingId is null)
  const systemLineItems = ceremonyLineItems?.lineItems?.filter(item => !item.isCustom) || [];

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ ceremonyId, data }: { ceremonyId: string; data: Partial<CeremonyType> }) => {
      return apiRequest("PATCH", `/api/ceremony-types/${ceremonyId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-types"] });
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
  
  // Mutation to create a new system budget line item
  const createLineItemMutation = useMutation({
    mutationFn: async ({ ceremonyId, data }: { 
      ceremonyId: string; 
      data: { 
        itemName: string; 
        budgetBucketId: string; 
        lowCost: number; 
        highCost: number; 
        unit: string; 
        notes: string; 
      }
    }) => {
      return apiRequest("POST", `/api/ceremony-types/${ceremonyId}/budget-categories`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-types", selectedCeremonyForLineItems, "line-items"] });
      toast({ title: "Budget line item added successfully" });
      setIsAddLineItemDialogOpen(false);
      setNewLineItem({ itemName: "", budgetBucketId: "other", lowCost: "", highCost: "", unit: "fixed", notes: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add line item", description: error.message, variant: "destructive" });
    },
  });
  
  // Mutation to delete a system budget line item
  const deleteLineItemMutation = useMutation({
    mutationFn: async ({ ceremonyId, categoryId }: { ceremonyId: string; categoryId: string }) => {
      return apiRequest("DELETE", `/api/ceremony-types/${ceremonyId}/budget-categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-types", selectedCeremonyForLineItems, "line-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-types/all/line-items"] });
      toast({ title: "Budget line item deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete line item", description: error.message, variant: "destructive" });
    },
  });
  
  // Mutation to update a system budget line item
  const updateLineItemMutation = useMutation({
    mutationFn: async ({ ceremonyId, categoryId, data }: { 
      ceremonyId: string;
      categoryId: string;
      data: { 
        itemName?: string; 
        budgetBucketId?: string; 
        lowCost?: number; 
        highCost?: number; 
        unit?: string; 
        notes?: string; 
      }
    }) => {
      return apiRequest("PATCH", `/api/ceremony-types/${ceremonyId}/budget-categories/${categoryId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-types", selectedCeremonyForLineItems, "line-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ceremony-types/all/line-items"] });
      toast({ title: "Budget line item updated successfully" });
      setIsEditLineItemDialogOpen(false);
      setEditingLineItem(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update line item", description: error.message, variant: "destructive" });
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
          <TabsTrigger value="line-items" data-testid="tab-line-items">Budget Line Items</TabsTrigger>
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
                      {(() => {
                        const lineItems = allLineItemsMap[template.id] || [];
                        const systemItems = lineItems.filter(item => !item.isCustom);
                        return (
                          <>
                            <h4 className="text-sm font-medium mb-2">Budget Line Items ({systemItems.length} categories)</h4>
                            <div className="grid gap-1 text-xs">
                              {systemItems.slice(0, 5).map((item) => {
                                const bucketLabel = budgetBucketLookup[item.budgetBucketId] || item.budgetBucketId;
                                return (
                                  <div key={item.id} className="flex justify-between text-muted-foreground">
                                    <span>{item.name} <Badge variant="outline" className="ml-1 text-[10px] py-0">{bucketLabel}</Badge></span>
                                    <span>
                                      ${item.lowCost.toLocaleString()} - ${item.highCost.toLocaleString()}
                                      {item.unit === "per_person" && "/person"}
                                      {item.unit === "per_hour" && "/hour"}
                                    </span>
                                  </div>
                                );
                              })}
                              {systemItems.length > 5 && (
                                <span className="text-muted-foreground">+{systemItems.length - 5} more...</span>
                              )}
                              {systemItems.length === 0 && (
                                <span className="text-muted-foreground italic">No line items defined. Use the Budget Line Items tab to add them.</span>
                              )}
                            </div>
                          </>
                        );
                      })()}
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

        <TabsContent value="line-items" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Select Ceremony:</Label>
              <Select value={selectedCeremonyForLineItems || ""} onValueChange={setSelectedCeremonyForLineItems}>
                <SelectTrigger className="w-64" data-testid="select-ceremony-for-items">
                  <SelectValue placeholder="Choose a ceremony..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.tradition})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCeremonyForLineItems && (
              <Button onClick={() => setIsAddLineItemDialogOpen(true)} data-testid="button-add-line-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            )}
          </div>

          {!selectedCeremonyForLineItems ? (
            <Card>
              <CardContent className="py-12 text-center">
                <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a ceremony above to manage its budget line items.</p>
              </CardContent>
            </Card>
          ) : lineItemsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : systemLineItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No system budget line items for this ceremony yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Click "Add Line Item" to create budget categories.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {ceremonyLineItems?.ceremonyName} - Budget Line Items
                </CardTitle>
                <CardDescription>
                  These are the default budget categories couples will see for this ceremony type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Low Cost</TableHead>
                      <TableHead>High Cost</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemLineItems.map((item) => {
                      const bucketLabel = budgetBucketLookup[item.budgetBucketId] || item.budgetBucketId;
                      return (
                        <TableRow key={item.id} data-testid={`row-line-item-${item.id}`}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{bucketLabel}</Badge>
                          </TableCell>
                          <TableCell>${parseFloat(String(item.lowCost)).toLocaleString()}</TableCell>
                          <TableCell>${parseFloat(String(item.highCost)).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.unit === "per_person" ? "Per Person" : item.unit === "per_hour" ? "Per Hour" : "Fixed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingLineItem({
                                    id: item.id,
                                    itemName: item.name,
                                    budgetBucketId: item.budgetBucketId,
                                    lowCost: String(item.lowCost),
                                    highCost: String(item.highCost),
                                    unit: item.unit,
                                    notes: item.notes || "",
                                  });
                                  setIsEditLineItemDialogOpen(true);
                                }}
                                data-testid={`button-edit-item-${item.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (selectedCeremonyForLineItems && confirm("Delete this line item?")) {
                                    deleteLineItemMutation.mutate({
                                      ceremonyId: selectedCeremonyForLineItems,
                                      categoryId: item.id,
                                    });
                                  }
                                }}
                                data-testid={`button-delete-item-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddLineItemDialogOpen} onOpenChange={setIsAddLineItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Line Item</DialogTitle>
            <DialogDescription>Add a new budget category for {ceremonyLineItems?.ceremonyName || "this ceremony"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Input
                value={newLineItem.itemName}
                onChange={(e) => setNewLineItem({ ...newLineItem, itemName: e.target.value })}
                placeholder="e.g., Gurdwara Donation"
                data-testid="input-new-item-name"
              />
            </div>
            <div>
              <Label>Budget Category</Label>
              <Select value={newLineItem.budgetBucketId} onValueChange={(v) => setNewLineItem({ ...newLineItem, budgetBucketId: v })}>
                <SelectTrigger data-testid="select-new-item-bucket">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_BUCKETS.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Low Cost ($)</Label>
                <Input
                  type="number"
                  value={newLineItem.lowCost}
                  onChange={(e) => setNewLineItem({ ...newLineItem, lowCost: e.target.value })}
                  placeholder="500"
                  data-testid="input-new-item-low"
                />
              </div>
              <div>
                <Label>High Cost ($)</Label>
                <Input
                  type="number"
                  value={newLineItem.highCost}
                  onChange={(e) => setNewLineItem({ ...newLineItem, highCost: e.target.value })}
                  placeholder="2000"
                  data-testid="input-new-item-high"
                />
              </div>
            </div>
            <div>
              <Label>Unit Type</Label>
              <Select value={newLineItem.unit} onValueChange={(v) => setNewLineItem({ ...newLineItem, unit: v })}>
                <SelectTrigger data-testid="select-new-item-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={newLineItem.notes}
                onChange={(e) => setNewLineItem({ ...newLineItem, notes: e.target.value })}
                placeholder="Any additional notes..."
                data-testid="input-new-item-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedCeremonyForLineItems && newLineItem.itemName && newLineItem.lowCost && newLineItem.highCost) {
                  createLineItemMutation.mutate({
                    ceremonyId: selectedCeremonyForLineItems,
                    data: {
                      ...newLineItem,
                      lowCost: parseFloat(newLineItem.lowCost),
                      highCost: parseFloat(newLineItem.highCost),
                    },
                  });
                }
              }}
              disabled={createLineItemMutation.isPending || !newLineItem.itemName || !newLineItem.lowCost || !newLineItem.highCost}
              data-testid="button-save-line-item"
            >
              {createLineItemMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Line Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLineItemDialogOpen} onOpenChange={setIsEditLineItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Line Item</DialogTitle>
            <DialogDescription>Update the budget category for {ceremonyLineItems?.ceremonyName || "this ceremony"}</DialogDescription>
          </DialogHeader>
          {editingLineItem && (
            <div className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input
                  value={editingLineItem.itemName}
                  onChange={(e) => setEditingLineItem({ ...editingLineItem, itemName: e.target.value })}
                  placeholder="e.g., Gurdwara Donation"
                  data-testid="input-edit-item-name"
                />
              </div>
              <div>
                <Label>Budget Category</Label>
                <Select value={editingLineItem.budgetBucketId} onValueChange={(v) => setEditingLineItem({ ...editingLineItem, budgetBucketId: v })}>
                  <SelectTrigger data-testid="select-edit-item-bucket">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_BUCKETS.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Low Cost ($)</Label>
                  <Input
                    type="number"
                    value={editingLineItem.lowCost}
                    onChange={(e) => setEditingLineItem({ ...editingLineItem, lowCost: e.target.value })}
                    placeholder="500"
                    data-testid="input-edit-item-low"
                  />
                </div>
                <div>
                  <Label>High Cost ($)</Label>
                  <Input
                    type="number"
                    value={editingLineItem.highCost}
                    onChange={(e) => setEditingLineItem({ ...editingLineItem, highCost: e.target.value })}
                    placeholder="2000"
                    data-testid="input-edit-item-high"
                  />
                </div>
              </div>
              <div>
                <Label>Unit Type</Label>
                <Select value={editingLineItem.unit} onValueChange={(v) => setEditingLineItem({ ...editingLineItem, unit: v })}>
                  <SelectTrigger data-testid="select-edit-item-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={editingLineItem.notes}
                  onChange={(e) => setEditingLineItem({ ...editingLineItem, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  data-testid="input-edit-item-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditLineItemDialogOpen(false);
                setEditingLineItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCeremonyForLineItems && editingLineItem && editingLineItem.itemName && editingLineItem.lowCost && editingLineItem.highCost) {
                  updateLineItemMutation.mutate({
                    ceremonyId: selectedCeremonyForLineItems,
                    categoryId: editingLineItem.id,
                    data: {
                      itemName: editingLineItem.itemName,
                      budgetBucketId: editingLineItem.budgetBucketId,
                      lowCost: parseFloat(editingLineItem.lowCost),
                      highCost: parseFloat(editingLineItem.highCost),
                      unit: editingLineItem.unit,
                      notes: editingLineItem.notes,
                    },
                  });
                }
              }}
              disabled={updateLineItemMutation.isPending || !editingLineItem?.itemName || !editingLineItem?.lowCost || !editingLineItem?.highCost}
              data-testid="button-update-line-item"
            >
              {updateLineItemMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
  template: CeremonyType;
  onSave: (data: Partial<CeremonyType>) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [defaultGuests, setDefaultGuests] = useState(template.defaultGuests.toString());
  const [isActive, setIsActive] = useState(template.isActive);
  const [displayOrder, setDisplayOrder] = useState(template.displayOrder.toString());

  const handleSubmit = () => {
    onSave({
      name,
      description,
      defaultGuests: parseInt(defaultGuests),
      isActive,
      displayOrder: parseInt(displayOrder),
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

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>To edit budget line items for this ceremony, use the <strong>Budget Line Items</strong> tab.</span>
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
