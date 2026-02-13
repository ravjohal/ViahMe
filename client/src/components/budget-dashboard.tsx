import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import type { BudgetCategory } from "@shared/schema";

interface BudgetDashboardProps {
  categories: BudgetCategory[];
  totalBudget: string;
  totalByCeremonies?: number;
  totalByCategories?: number;
  showCeremonyBudgets?: boolean;
  budgetTrackingMode?: "category" | "ceremony";
  onNavigate?: () => void;
}

export function BudgetDashboard({ 
  categories, 
  totalBudget, 
  totalByCeremonies = 0,
  totalByCategories = 0,
  showCeremonyBudgets = true,
  budgetTrackingMode = "ceremony",
  onNavigate 
}: BudgetDashboardProps) {
  const total = parseFloat(totalBudget || "0");
  const totalSpent = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.spentAmount?.toString() || "0"),
    0
  );

  const remainingBudget = total - totalSpent;
  const spentPercentage = total > 0 ? (totalSpent / total) * 100 : 0;
  const allocated = showCeremonyBudgets ? totalByCeremonies : totalByCategories;
  const allocatedPercentage = total > 0 ? (allocated / total) * 100 : 0;
  const unallocated = total - allocated;

  const hasMismatch = budgetTrackingMode !== "ceremony" && showCeremonyBudgets && totalByCategories > 0 && totalByCeremonies > 0 && Math.abs(totalByCategories - totalByCeremonies) > 100;

  return (
    <Card 
      className={`p-4 md:p-6 ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
      onClick={onNavigate}
      data-testid="card-budget-summary-dashboard"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-2xl md:text-3xl font-bold font-mono">
              ${total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </div>
          {hasMismatch && (
            <Badge variant="outline" className="px-2 py-1 text-xs font-mono bg-orange-50 dark:bg-orange-900/20 border-orange-300 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Category / Ceremony mismatch
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div>
            <p className="text-lg md:text-xl font-bold font-mono">
              ${allocated.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Planned
            </p>
          </div>
          <div>
            <p className="text-lg md:text-xl font-bold font-mono">
              ${totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Spent</p>
          </div>
          <div>
            <p className={`text-lg md:text-xl font-bold font-mono ${remainingBudget < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
              {remainingBudget < 0 ? "-" : ""}${Math.abs(remainingBudget).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalSpent > 0 ? "Left to Spend" : "Unspent"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-xs font-mono text-muted-foreground">{spentPercentage.toFixed(0)}%</p>
            </div>
            <Progress value={Math.min(spentPercentage, 100)} className="h-2" />
          </div>
          {allocated > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Planned</p>
                <p className="text-xs font-mono text-muted-foreground">{allocatedPercentage.toFixed(0)}%</p>
              </div>
              <Progress value={Math.min(allocatedPercentage, 100)} className="h-1.5 opacity-50" />
            </div>
          )}
        </div>

        {unallocated > 0 && allocated > 0 && (
          <p className="text-xs text-muted-foreground">
            ${unallocated.toLocaleString()} not yet assigned to {showCeremonyBudgets ? "ceremonies" : "categories"}
          </p>
        )}
        {unallocated < 0 && allocated > 0 && (
          <p className="text-xs text-destructive font-medium">
            ${Math.abs(unallocated).toLocaleString()} over your total budget
          </p>
        )}
      </div>
    </Card>
  );
}
