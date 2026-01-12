import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Calendar, AlertTriangle } from "lucide-react";
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
  const unallocatedBudget = total - totalByCeremonies;

  return (
    <Card 
      className={`p-4 md:p-6 ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
      onClick={onNavigate}
      data-testid="card-budget-summary-dashboard"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Target Budget</p>
            <p className="text-xl md:text-2xl font-bold font-mono">
              ${total.toLocaleString()}
            </p>
          </div>
          
          {showCeremonyBudgets && totalByCeremonies > 0 && (
            <>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  By Ceremonies
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">
                  ${totalByCeremonies.toLocaleString()}
                </p>
              </div>
            </>
          )}
          
          {budgetTrackingMode !== "ceremony" && totalByCategories > 0 && (
            <>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  By Categories
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">
                  ${totalByCategories.toLocaleString()}
                </p>
              </div>
            </>
          )}
          
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Spent</p>
            <p className="text-lg md:text-xl font-bold font-mono">
              ${totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {showCeremonyBudgets && unallocatedBudget > 0 && totalByCeremonies > 0 && (
            <Badge variant="outline" className="px-2 py-1 text-xs font-mono bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-300">
              ${unallocatedBudget.toLocaleString()} left to plan
            </Badge>
          )}
          {showCeremonyBudgets && unallocatedBudget < 0 && totalByCeremonies > 0 && (
            <Badge variant="destructive" className="px-2 py-1 text-xs font-mono">
              ${Math.abs(unallocatedBudget).toLocaleString()} over target
            </Badge>
          )}
          {budgetTrackingMode !== "ceremony" && showCeremonyBudgets && totalByCategories > 0 && totalByCeremonies > 0 && Math.abs(totalByCategories - totalByCeremonies) > 100 && (
            <Badge variant="outline" className="px-2 py-1 text-xs font-mono bg-orange-50 dark:bg-orange-900/20 border-orange-300 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Mismatch
            </Badge>
          )}
          <div className="text-right">
            <p className="text-xs md:text-sm text-muted-foreground">Remaining</p>
            <p className={`text-lg md:text-xl font-bold font-mono ${remainingBudget < 0 ? "text-destructive" : "text-emerald-600"}`}>
              {remainingBudget < 0 ? "-" : ""}${Math.abs(remainingBudget).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      <Progress value={Math.min(spentPercentage, 100)} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">
        {spentPercentage.toFixed(0)}% of budget spent
      </p>
    </Card>
  );
}
