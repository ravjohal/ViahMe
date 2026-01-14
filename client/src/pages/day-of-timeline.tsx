import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, Plus, Trash2, Edit2, Check, MapPin, 
  User, Users, Briefcase, Crown, Heart, Calendar,
  ChevronDown, ChevronUp, Import
} from "lucide-react";
import type { Wedding, DayOfTimelineItem } from "@shared/schema";
import { TIMELINE_ASSIGNEES, VENDOR_TASK_CATEGORIES } from "@shared/schema";

interface TimelineItemRowProps {
  item: DayOfTimelineItem;
  onToggleComplete: (id: string) => void;
  onEdit: (item: DayOfTimelineItem) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getAssigneeIcon(assignee: string) {
  switch (assignee) {
    case 'bride': return <Crown className="h-4 w-4" />;
    case 'groom': return <Crown className="h-4 w-4" />;
    case 'bridal_party': return <Users className="h-4 w-4" />;
    case 'vendor': return <Briefcase className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
}

function getAssigneeColor(assignee: string) {
  switch (assignee) {
    case 'bride': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
    case 'groom': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'bridal_party': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'vendor': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    default: return 'bg-muted text-muted-foreground';
  }
}

function TimelineItemRow({ item, onToggleComplete, onEdit, onDelete, isToggling }: TimelineItemRowProps) {
  const vendorLabel = item.vendorCategory 
    ? VENDOR_TASK_CATEGORIES.find(c => c.value === item.vendorCategory)?.label 
    : null;

  return (
    <div className={`flex items-start gap-3 p-3 border rounded-lg bg-card hover-elevate ${item.completed ? 'opacity-60' : ''}`}>
      <Checkbox 
        checked={item.completed}
        onCheckedChange={() => onToggleComplete(item.id)}
        disabled={isToggling}
        className="mt-1"
        data-testid={`checkbox-complete-${item.id}`}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs font-mono">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(item.scheduledTime)}
          </Badge>
          {item.endTime && (
            <>
              <span className="text-muted-foreground">-</span>
              <Badge variant="outline" className="text-xs font-mono">
                {formatTime(item.endTime)}
              </Badge>
            </>
          )}
          {vendorLabel && (
            <Badge variant="outline" className="text-xs">
              {vendorLabel}
            </Badge>
          )}
        </div>
        
        <p className={`font-medium mt-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
          {item.activity}
        </p>
        
        {item.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>{item.location}</span>
          </div>
        )}
        
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => onEdit(item)} data-testid={`button-edit-${item.id}`}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)} data-testid={`button-delete-${item.id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface AssigneeColumnProps {
  title: string;
  icon: React.ReactNode;
  items: DayOfTimelineItem[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: DayOfTimelineItem) => void;
  onDelete: (id: string) => void;
  togglingIds: Set<string>;
  colorClass: string;
}

function AssigneeColumn({ title, icon, items, onToggleComplete, onEdit, onDelete, togglingIds, colorClass }: AssigneeColumnProps) {
  const sortedItems = [...items].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const completedCount = items.filter(i => i.completed).length;

  return (
    <Card className="flex-1 min-w-[280px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              {icon}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="secondary">
            {completedCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
        {sortedItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">
            No items scheduled
          </p>
        ) : (
          sortedItems.map(item => (
            <TimelineItemRow
              key={item.id}
              item={item}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              isToggling={togglingIds.has(item.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DayOfTimelineContent({ weddingId }: { weddingId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DayOfTimelineItem | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  const [formData, setFormData] = useState({
    scheduledTime: "09:00",
    endTime: "",
    assignee: "bride" as string,
    activity: "",
    vendorCategory: "",
    location: "",
    notes: "",
  });

  const { data: timelineItems = [], isLoading } = useQuery<DayOfTimelineItem[]>({
    queryKey: ["/api/day-of-timeline/wedding", weddingId],
  });

  const brideItems = timelineItems.filter(item => item.assignee === 'bride');
  const groomItems = timelineItems.filter(item => item.assignee === 'groom');
  const bridalPartyItems = timelineItems.filter(item => item.assignee === 'bridal_party');
  const vendorItems = timelineItems.filter(item => item.assignee === 'vendor');

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/day-of-timeline/items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-of-timeline/wedding", weddingId] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Item added!", description: "Timeline item has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/day-of-timeline/items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-of-timeline/wedding", weddingId] });
      setEditingItem(null);
      resetForm();
      toast({ title: "Item updated!", description: "Timeline item has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/day-of-timeline/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-of-timeline/wedding", weddingId] });
      toast({ title: "Item deleted", description: "Timeline item has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const loadTemplateMutation = useMutation({
    mutationFn: async (template: string) => {
      const response = await apiRequest("POST", `/api/day-of-timeline/wedding/${weddingId}/import-template`, { template });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/day-of-timeline/wedding", weddingId] });
      const itemCount = Array.isArray(data) ? data.length : 0;
      toast({ title: "Template loaded!", description: `Added ${itemCount} timeline items from the template.` });
      setIsLoadingTemplate(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsLoadingTemplate(false);
    }
  });

  const resetForm = () => {
    setFormData({
      scheduledTime: "09:00",
      endTime: "",
      assignee: "bride",
      activity: "",
      vendorCategory: "",
      location: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    const payload = {
      weddingId,
      scheduledTime: formData.scheduledTime,
      endTime: formData.endTime || null,
      assignee: formData.assignee,
      activity: formData.activity,
      vendorCategory: formData.assignee === 'vendor' ? (formData.vendorCategory || null) : null,
      location: formData.location || null,
      notes: formData.notes || null,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createItemMutation.mutate(payload);
    }
  };

  const handleEdit = (item: DayOfTimelineItem) => {
    setEditingItem(item);
    setFormData({
      scheduledTime: item.scheduledTime,
      endTime: item.endTime || "",
      assignee: item.assignee,
      activity: item.activity,
      vendorCategory: item.vendorCategory || "",
      location: item.location || "",
      notes: item.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleToggleComplete = async (id: string) => {
    const item = timelineItems.find(i => i.id === id);
    if (!item) return;

    setTogglingIds(prev => new Set([...prev, id]));
    try {
      await apiRequest("PATCH", `/api/day-of-timeline/items/${id}`, {
        completed: !item.completed,
        weddingId
      });
      queryClient.invalidateQueries({ queryKey: ["/api/day-of-timeline/wedding", weddingId] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleLoadTemplate = () => {
    setIsLoadingTemplate(true);
    loadTemplateMutation.mutate("sikh");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Day-of Logistics Timeline</h2>
          <p className="text-muted-foreground">
            Plan every minute of your wedding day with detailed schedules for everyone involved
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timelineItems.length === 0 && (
            <Button
              variant="outline"
              onClick={handleLoadTemplate}
              disabled={isLoadingTemplate}
              data-testid="button-load-template"
            >
              <Import className="h-4 w-4 mr-2" />
              Load Sikh Template
            </Button>
          )}
          <Button onClick={() => { resetForm(); setEditingItem(null); setIsAddDialogOpen(true); }} data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="columns" className="w-full">
        <TabsList>
          <TabsTrigger value="columns" data-testid="tab-columns">Column View</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="columns" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <AssigneeColumn
              title="Bride"
              icon={<Crown className="h-4 w-4" />}
              items={brideItems}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={(id) => deleteItemMutation.mutate(id)}
              togglingIds={togglingIds}
              colorClass="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
            />
            <AssigneeColumn
              title="Groom"
              icon={<Crown className="h-4 w-4" />}
              items={groomItems}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={(id) => deleteItemMutation.mutate(id)}
              togglingIds={togglingIds}
              colorClass="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            />
            <AssigneeColumn
              title="Bridal Party"
              icon={<Users className="h-4 w-4" />}
              items={bridalPartyItems}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={(id) => deleteItemMutation.mutate(id)}
              togglingIds={togglingIds}
              colorClass="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
            />
            <AssigneeColumn
              title="Vendors"
              icon={<Briefcase className="h-4 w-4" />}
              items={vendorItems}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={(id) => deleteItemMutation.mutate(id)}
              togglingIds={togglingIds}
              colorClass="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
            />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Full Day Timeline
              </CardTitle>
              <CardDescription>
                All activities sorted by time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...timelineItems]
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                .map(item => {
                  const assigneeLabel = TIMELINE_ASSIGNEES.find(a => a.value === item.assignee)?.label || item.assignee;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg bg-card hover-elevate ${item.completed ? 'opacity-60' : ''}`}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleComplete(item.id)}
                        disabled={togglingIds.has(item.id)}
                        className="mt-1"
                        data-testid={`checkbox-timeline-complete-${item.id}`}
                      />
                      
                      <div className="w-24 shrink-0">
                        <Badge variant="secondary" className="font-mono">
                          {formatTime(item.scheduledTime)}
                        </Badge>
                        {item.endTime && (
                          <div className="text-xs text-muted-foreground mt-1">
                            to {formatTime(item.endTime)}
                          </div>
                        )}
                      </div>
                      
                      <Badge className={getAssigneeColor(item.assignee)}>
                        {getAssigneeIcon(item.assignee)}
                        <span className="ml-1">{assigneeLabel}</span>
                      </Badge>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.activity}
                        </p>
                        {item.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{item.location}</span>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} data-testid={`button-timeline-edit-${item.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteItemMutation.mutate(item.id)} data-testid={`button-timeline-delete-${item.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              
              {timelineItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No timeline items yet</p>
                  <p className="text-sm">Add items to plan your wedding day schedule</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Timeline Item' : 'Add Timeline Item'}</DialogTitle>
            <DialogDescription>
              Schedule an activity for your wedding day
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Start Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  data-testid="input-scheduled-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (optional)</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-end-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value, vendorCategory: "" }))}
              >
                <SelectTrigger data-testid="select-assignee">
                  <SelectValue placeholder="Select who this is for" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_ASSIGNEES.map(assignee => (
                    <SelectItem key={assignee.value} value={assignee.value}>
                      {assignee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.assignee === 'vendor' && (
              <div className="space-y-2">
                <Label htmlFor="vendorCategory">Vendor Category (optional)</Label>
                <Select
                  value={formData.vendorCategory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vendorCategory: value }))}
                >
                  <SelectTrigger data-testid="select-vendor-category">
                    <SelectValue placeholder="Select vendor type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_TASK_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                value={formData.activity}
                onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
                placeholder="e.g., Makeup artist arrives for bride"
                data-testid="input-activity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Bridal Suite, Main Hall"
                data-testid="input-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional details..."
                rows={2}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.activity || !formData.scheduledTime || createItemMutation.isPending || updateItemMutation.isPending}
              data-testid="button-submit-item"
            >
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DayOfTimelinePage() {
  const { data: weddings, isLoading: weddingLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  const wedding = weddings?.[0];

  if (weddingLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 text-center">
          <CardTitle>No Wedding Found</CardTitle>
          <CardDescription className="mt-2">
            Please create a wedding first to access the day-of timeline.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <DayOfTimelineContent weddingId={wedding.id} />
    </div>
  );
}
