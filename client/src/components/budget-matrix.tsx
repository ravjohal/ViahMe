import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BUDGET_BUCKETS, BUDGET_BUCKET_LABELS, type BudgetBucket, type Wedding } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, DollarSign, Grid3X3, Loader2, List, LayoutGrid } from "lucide-react";

interface MatrixCell {
  amount: string;
  spent: number;
  allocationId: string | null;
}

interface MatrixRow {
  ceremonyId: string;
  ceremonyName: string;
  ceremonyDate: string | null;
  ceremonyType: string;
  cells: Record<string, MatrixCell>;
  ceremonyBudget: number;
  ceremonySpent: number;
  totalPlanned: number;
}

interface MatrixColumn {
  categoryKey: string;
  categoryLabel: string;
  globalBudget: number;
  totalAllocated: number;
  remaining: number;
  isOverAllocated: boolean;
}

interface MatrixData {
  rows: MatrixRow[];
  columns: MatrixColumn[];
  summary: {
    totalGlobalBudget: number;
    totalAllocated: number;
    totalRemaining: number;
    isOverAllocated: boolean;
  };
}

interface BudgetMatrixProps {
  weddingId: string;
}

type ViewMode = "ceremony" | "matrix";

export function BudgetMatrix({ weddingId }: BudgetMatrixProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("ceremony");
  const [editingCell, setEditingCell] = useState<{ ceremonyId: string; categoryKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);

  const { data: matrixData, isLoading } = useQuery<MatrixData>({
    queryKey: ["/api/budget/matrix", weddingId],
    enabled: !!weddingId,
  });

  const allocateMutation = useMutation({
    mutationFn: async (data: { ceremonyId: string; categoryKey: string; amount: string }) => {
      const res = await apiRequest("POST", "/api/budget/allocate", {
        weddingId,
        ceremonyId: data.ceremonyId,
        categoryKey: data.categoryKey,
        amount: data.amount,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/matrix", weddingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget/allocations", weddingId] });
      setEditingCell(null);
      setEditValue("");
      setPendingUpdate(null);
    },
    onError: (error: Error) => {
      setPendingUpdate(null);
      const errorData = error.message;
      if (errorData.includes("exceeds global category budget")) {
        toast({
          title: "Budget Limit Exceeded",
          description: "This allocation would exceed the category budget. Adjust your category budget first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to update",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleCellClick = useCallback((ceremonyId: string, categoryKey: string, currentAmount: string) => {
    setEditingCell({ ceremonyId, categoryKey });
    setEditValue(currentAmount === "0" ? "" : currentAmount);
  }, []);

  const handleCellBlur = useCallback(() => {
    if (editingCell && editValue !== "") {
      const cleanValue = editValue.replace(/[^0-9.]/g, "");
      if (cleanValue && parseFloat(cleanValue) >= 0) {
        setPendingUpdate(`${editingCell.ceremonyId}-${editingCell.categoryKey}`);
        allocateMutation.mutate({
          ceremonyId: editingCell.ceremonyId,
          categoryKey: editingCell.categoryKey,
          amount: cleanValue,
        });
      } else {
        setEditingCell(null);
        setEditValue("");
      }
    } else {
      setEditingCell(null);
      setEditValue("");
    }
  }, [editingCell, editValue, allocateMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  }, [handleCellBlur]);

  const formatCurrency = (amount: number | string, showZeroAsEmpty = false) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num) || (num === 0 && showZeroAsEmpty)) return "";
    if (num === 0) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Budget Planner
          </CardTitle>
          <CardDescription>Loading budget matrix...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!matrixData || matrixData.rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Budget Planner
          </CardTitle>
          <CardDescription>Plan how to allocate your budget across ceremonies and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No ceremonies found. Add ceremonies to your wedding to start planning the budget matrix.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleCategories = BUDGET_BUCKETS.filter(bucket => {
    const col = matrixData.columns.find(c => c.categoryKey === bucket);
    return col && (col.globalBudget > 0 || col.totalAllocated > 0);
  });

  if (visibleCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Budget Planner
          </CardTitle>
          <CardDescription>Plan how to allocate your budget across ceremonies and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Set up your category budgets first to start using the Budget Planner.</p>
            <p className="text-sm mt-2">Go to the Budget Categories section above to allocate funds to Venue, Catering, etc.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Budget Planner
            </CardTitle>
            <CardDescription>Plan how to allocate your budget across ceremonies and categories</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "ceremony" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("ceremony")}
                className="h-8 px-3"
                data-testid="button-view-ceremony"
              >
                <List className="h-4 w-4 mr-2" />
                By Ceremony
              </Button>
              <Button
                variant={viewMode === "matrix" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("matrix")}
                className="h-8 px-3"
                data-testid="button-view-matrix"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Matrix
              </Button>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm text-muted-foreground">Total Allocated</div>
              <div className="text-lg font-semibold">
                {formatCurrency(matrixData.summary.totalAllocated)} / {formatCurrency(matrixData.summary.totalGlobalBudget)}
              </div>
            </div>
            {matrixData.summary.isOverAllocated ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Over Budget
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                {formatCurrency(matrixData.summary.totalRemaining)} remaining
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "ceremony" ? (
          <div className="space-y-4">
            {matrixData.rows.map((row) => (
              <div key={row.ceremonyId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{row.ceremonyName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Budget: {formatCurrency(row.ceremonyBudget)} • Spent: {formatCurrency(row.ceremonySpent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">{formatCurrency(row.totalPlanned)}</p>
                    <p className="text-xs text-muted-foreground">allocated</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleCategories.map((categoryKey) => {
                    const cell = row.cells[categoryKey] || { amount: "0", spent: 0, allocationId: null };
                    const allocated = parseFloat(cell.amount);
                    const spent = cell.spent || 0;
                    if (allocated === 0 && spent === 0) return null;
                    return (
                      <Badge 
                        key={categoryKey} 
                        variant="secondary" 
                        className="px-3 py-1"
                      >
                        {BUDGET_BUCKET_LABELS[categoryKey as BudgetBucket]}: {formatCurrency(allocated)}
                        {spent > 0 && <span className="ml-1 text-muted-foreground">({formatCurrency(spent)} spent)</span>}
                      </Badge>
                    );
                  })}
                  {row.totalPlanned === 0 && (
                    <span className="text-sm text-muted-foreground italic">No allocations yet - use Matrix view to set budgets</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse" data-testid="budget-matrix-table">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-sm sticky left-0 bg-card z-10 min-w-[160px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>Ceremony</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ceremony name and its total budget</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                  {visibleCategories.map(categoryKey => {
                    const col = matrixData.columns.find(c => c.categoryKey === categoryKey)!;
                    return (
                      <th key={categoryKey} className="text-center p-2 font-medium text-sm min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>{BUDGET_BUCKET_LABELS[categoryKey as BudgetBucket]}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`text-xs ${col.isOverAllocated ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {formatCurrency(col.remaining)} left
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Budget: {formatCurrency(col.globalBudget)}</p>
                              <p>Allocated: {formatCurrency(col.totalAllocated)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center p-2 font-medium text-sm min-w-[100px] bg-muted/50">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>Allocated</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sum of category allocations for this ceremony</p>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixData.rows.map((row, rowIdx) => (
                  <tr key={row.ceremonyId} className={rowIdx % 2 === 0 ? '' : 'bg-muted/30'}>
                    <td className="p-2 font-medium text-sm sticky left-0 bg-card z-10">
                      <div className="flex flex-col">
                        <span>{row.ceremonyName}</span>
                        {row.ceremonyBudget > 0 ? (
                          <div className="flex flex-col text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-600 dark:text-amber-400">
                                Budget: {formatCurrency(row.ceremonyBudget)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Spent: {formatCurrency(row.ceremonySpent)}
                              </span>
                              <span className={row.ceremonyBudget - row.ceremonySpent < 0 ? "text-destructive font-medium" : "text-green-600 dark:text-green-400"}>
                                ({formatCurrency(row.ceremonyBudget - row.ceremonySpent)} left)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No budget set</span>
                        )}
                      </div>
                    </td>
                    {visibleCategories.map(categoryKey => {
                      const cell = row.cells[categoryKey] || { amount: "0", spent: 0, allocationId: null };
                      const isEditing = editingCell?.ceremonyId === row.ceremonyId && editingCell?.categoryKey === categoryKey;
                      const isPending = pendingUpdate === `${row.ceremonyId}-${categoryKey}`;
                      const allocated = parseFloat(cell.amount);
                      const spent = cell.spent || 0;
                      const remaining = allocated - spent;
                      const isOverspent = allocated > 0 && remaining < 0;
                      const col = matrixData.columns.find(c => c.categoryKey === categoryKey);
                      
                      return (
                        <td
                          key={categoryKey}
                          className="p-2 text-center"
                          data-testid={`cell-${row.ceremonyId}-${categoryKey}`}
                        >
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              className="h-10 text-center text-sm w-full min-w-[80px]"
                              autoFocus
                              placeholder="$0"
                              data-testid={`input-${row.ceremonyId}-${categoryKey}`}
                            />
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleCellClick(row.ceremonyId, categoryKey, cell.amount)}
                                  className={`w-full min-h-[44px] min-w-[80px] px-3 py-2 rounded hover-elevate flex flex-col items-center justify-center text-sm ${isOverspent ? 'bg-destructive/10' : allocated > 0 ? 'bg-muted/50' : ''}`}
                                  disabled={isPending}
                                  data-testid={`button-${row.ceremonyId}-${categoryKey}`}
                                >
                                  {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : allocated > 0 || spent > 0 ? (
                                    <>
                                      <span className="font-medium">
                                        {formatCurrency(allocated)}
                                      </span>
                                      {spent > 0 && (
                                        <span className={`text-xs ${isOverspent ? 'text-destructive' : 'text-muted-foreground'}`}>
                                          {formatCurrency(spent)} spent
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground/50 text-xs">Click to set</span>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Allocated: {formatCurrency(allocated)}</p>
                                <p>Spent: {formatCurrency(spent)}</p>
                                <p className={isOverspent ? 'text-destructive' : ''}>
                                  Remaining: {formatCurrency(remaining)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-semibold text-sm bg-muted/50">
                      {formatCurrency(row.totalPlanned)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="p-2 text-sm sticky left-0 bg-card z-10">
                    <div className="flex flex-col">
                      <span>Total</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-normal">
                        Budget: {formatCurrency(matrixData.rows.reduce((sum, row) => sum + row.ceremonyBudget, 0))}
                      </span>
                    </div>
                  </td>
                  {visibleCategories.map(categoryKey => {
                    const col = matrixData.columns.find(c => c.categoryKey === categoryKey)!;
                    return (
                      <td
                        key={categoryKey}
                        className={`p-2 text-center text-sm ${col.isOverAllocated ? 'text-destructive' : ''}`}
                      >
                        {formatCurrency(col.totalAllocated)}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center text-sm bg-muted/50">
                    {formatCurrency(matrixData.summary.totalAllocated)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
