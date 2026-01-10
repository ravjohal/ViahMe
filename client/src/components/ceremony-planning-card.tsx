import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, ChevronRight, Plus, Calendar, DollarSign, 
  Loader2, TrendingDown, TrendingUp, Edit2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type CeremonyBudgetCategoryItem } from "@shared/schema";
import { getLineItemBucketLabel } from "@/hooks/use-ceremony-types";

interface CeremonyBreakdown {
  eventId: string;
  eventName: string;
  eventType: string;
  eventDate?: string;
  side: 'bride' | 'groom' | 'mutual';
  allocated: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  percentUsed: number;
  expenseCount: number;
}

interface CeremonyPlanningCardProps {
  ceremony: CeremonyBreakdown;
  lineItems: CeremonyBudgetCategoryItem[] | null;
  existingLineItemBudgets: Record<string, string>;
  onEditLineItem: (eventId: string, category: string, value: string) => void;
  onSaveLineItems: (eventId: string, eventName: string) => void;
  onSaveCeremonyTotal: (eventId: string, amount: string) => void;
  onAddExpense: (eventId: string) => void;
  onSetEstimates: (eventId: string, eventName: string, useHigh: boolean) => void;
  getLowEstimate: (eventId: string, eventName: string) => number;
  getHighEstimate: (eventId: string, eventName: string) => number;
  partner1Name?: string;
  partner2Name?: string;
  isSaving?: boolean;
  isSavingLineItems?: boolean;
}

export function CeremonyPlanningCard({
  ceremony,
  lineItems,
  existingLineItemBudgets,
  onEditLineItem,
  onSaveLineItems,
  onSaveCeremonyTotal,
  onAddExpense,
  onSetEstimates,
  getLowEstimate,
  getHighEstimate,
  partner1Name,
  partner2Name,
  isSaving,
  isSavingLineItems,
}: CeremonyPlanningCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTotal, setEditingTotal] = useState<string | null>(null);
  const [tempTotal, setTempTotal] = useState("");

  const percentSpent = ceremony.allocated > 0 ? ceremony.percentUsed : 0;
  
  const lineItemTotal = lineItems 
    ? lineItems.reduce((sum, item) => {
        const val = existingLineItemBudgets[item.category];
        return sum + (val ? parseFloat(val) || 0 : 0);
      }, 0)
    : 0;

  const hasUnsavedLineItems = Object.keys(existingLineItemBudgets).some(key => {
    const val = existingLineItemBudgets[key];
    return val && val !== "0" && val !== "";
  });

  const sideColors = {
    bride: 'border-l-pink-500',
    groom: 'border-l-blue-500',
    mutual: 'border-l-amber-500',
  };

  const sideBadgeColors = {
    bride: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    groom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    mutual: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  const sideLabels = {
    bride: partner1Name || "Bride",
    groom: partner2Name || "Groom",
    mutual: "Shared",
  };

  const handleTotalEdit = () => {
    setEditingTotal(ceremony.eventId);
    setTempTotal(ceremony.allocated > 0 ? ceremony.allocated.toString() : "");
  };

  const handleTotalSave = () => {
    onSaveCeremonyTotal(ceremony.eventId, tempTotal);
    setEditingTotal(null);
  };

  const handleTotalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTotalSave();
    if (e.key === "Escape") setEditingTotal(null);
  };

  return (
    <Card 
      className={`border-l-4 ${sideColors[ceremony.side]} overflow-hidden`}
      data-testid={`ceremony-card-${ceremony.eventId}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover-elevate" data-testid={`toggle-ceremony-${ceremony.eventId}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-base">{ceremony.eventName}</h3>
                  <Badge variant="outline" className={`text-xs ${sideBadgeColors[ceremony.side]}`}>
                    {sideLabels[ceremony.side]}
                  </Badge>
                  {ceremony.isOverBudget && (
                    <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                  )}
                </div>
                {ceremony.eventDate && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ceremony.eventDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold font-mono">
                    ${ceremony.allocated.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${ceremony.spent.toLocaleString()} spent
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {ceremony.allocated > 0 && (
              <div className="mt-3">
                <Progress 
                  value={Math.min(percentSpent, 100)} 
                  className={`h-2 ${ceremony.isOverBudget ? '[&>div]:bg-destructive' : ''}`} 
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{percentSpent.toFixed(0)}% spent</span>
                  <span className={ceremony.remaining < 0 ? "text-destructive" : "text-emerald-600"}>
                    ${Math.abs(ceremony.remaining).toLocaleString()} {ceremony.remaining < 0 ? 'over' : 'left'}
                  </span>
                </div>
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Ceremony Budget</span>
              </div>
              <div className="flex items-center gap-2">
                {editingTotal === ceremony.eventId ? (
                  <>
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={tempTotal}
                      onChange={(e) => setTempTotal(e.target.value)}
                      onKeyDown={handleTotalKeyDown}
                      onBlur={handleTotalSave}
                      className="w-28 h-9 text-right"
                      autoFocus
                      data-testid={`input-ceremony-total-${ceremony.eventId}`}
                    />
                  </>
                ) : (
                  <>
                    <span className="text-xl font-bold font-mono">
                      ${ceremony.allocated.toLocaleString()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleTotalEdit(); }}
                      data-testid={`button-edit-ceremony-total-${ceremony.eventId}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9" data-testid={`menu-estimate-${ceremony.eventId}`}>
                      Use Estimate
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setTempTotal(getLowEstimate(ceremony.eventId, ceremony.eventName).toString());
                      onSaveCeremonyTotal(ceremony.eventId, getLowEstimate(ceremony.eventId, ceremony.eventName).toString());
                    }}>
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Low: ${getLowEstimate(ceremony.eventId, ceremony.eventName).toLocaleString()}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setTempTotal(getHighEstimate(ceremony.eventId, ceremony.eventName).toString());
                      onSaveCeremonyTotal(ceremony.eventId, getHighEstimate(ceremony.eventId, ceremony.eventName).toString());
                    }}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      High: ${getHighEstimate(ceremony.eventId, ceremony.eventName).toLocaleString()}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {lineItems && lineItems.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Line Items</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetEstimates(ceremony.eventId, ceremony.eventName, false)}
                      className="h-7 text-xs"
                      data-testid={`button-low-estimate-${ceremony.eventId}`}
                    >
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Low
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetEstimates(ceremony.eventId, ceremony.eventName, true)}
                      className="h-7 text-xs"
                      data-testid={`button-high-estimate-${ceremony.eventId}`}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      High
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 bg-background rounded-lg p-3 border">
                  {lineItems.map((item, idx) => {
                    const savedAmount = existingLineItemBudgets[item.category] || "";
                    const bucketLabel = getLineItemBucketLabel(item);
                    
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                        data-testid={`line-item-${ceremony.eventId}-${idx}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{item.category}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">
                              {bucketLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Est: ${Math.round(item.lowCost / 100) * 100} - ${Math.round(item.highCost / 100) * 100}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm text-muted-foreground">$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="w-24 h-8 text-right"
                            value={savedAmount}
                            onChange={(e) => onEditLineItem(ceremony.eventId, item.category, e.target.value)}
                            data-testid={`input-line-item-${ceremony.eventId}-${idx}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {lineItemTotal > 0 && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="text-sm font-medium">Line Item Total</span>
                    <span className="text-lg font-bold font-mono">${lineItemTotal.toLocaleString()}</span>
                  </div>
                )}
                {hasUnsavedLineItems && (
                  <div className="mt-3">
                    <Button
                      onClick={() => onSaveLineItems(ceremony.eventId, ceremony.eventName)}
                      disabled={isSavingLineItems}
                      className="w-full"
                      data-testid={`button-save-line-items-${ceremony.eventId}`}
                    >
                      {isSavingLineItems ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Line Items
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                {ceremony.expenseCount} expense{ceremony.expenseCount !== 1 ? 's' : ''} recorded
              </div>
              <Button 
                size="sm" 
                onClick={() => onAddExpense(ceremony.eventId)}
                data-testid={`button-add-expense-${ceremony.eventId}`}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Expense
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
