import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import type { BudgetCategory } from "@shared/schema";

interface BudgetDashboardProps {
  categories: BudgetCategory[];
  totalBudget: string;
  onNavigate?: () => void;
}

export function BudgetDashboard({ categories, totalBudget, onNavigate }: BudgetDashboardProps) {
  const total = parseFloat(totalBudget || "0");
  const totalSpent = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.spentAmount?.toString() || "0"),
    0
  );
  const totalAllocated = categories.reduce(
    (sum, cat) => sum + parseFloat(cat.allocatedAmount.toString()),
    0
  );

  const remainingBudget = total - totalSpent;
  const budgetPercentage = total > 0 ? (totalSpent / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`p-6 ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
          onClick={onNavigate}
          data-testid="card-total-budget"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                ${total.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className={`p-6 ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
          onClick={onNavigate}
          data-testid="card-spent"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <TrendingUp className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                ${totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className={`p-6 ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
          onClick={onNavigate}
          data-testid="card-remaining"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <AlertCircle className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                ${remainingBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card 
        className={`p-6 ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
        onClick={onNavigate}
        data-testid="card-budget-progress"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Budget Usage</span>
          <span className="font-mono text-sm font-semibold">
            {budgetPercentage.toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={budgetPercentage} 
          className={`h-3 ${budgetPercentage > 100 ? "bg-destructive/20" : ""}`} 
        />
        {budgetPercentage > 90 && budgetPercentage <= 100 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Approaching budget limit</p>
        )}
        {budgetPercentage > 100 && (
          <p className="text-xs text-destructive mt-2">Over budget by ${(totalSpent - total).toLocaleString()}</p>
        )}
      </Card>
    </div>
  );
}
