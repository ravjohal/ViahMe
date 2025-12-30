import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import type { BudgetCategory } from "@shared/schema";

interface BudgetDashboardProps {
  categories: BudgetCategory[];
  totalBudget: string;
  onNavigate?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  catering: "Catering & Food",
  venue: "Venue & Rentals",
  entertainment: "Entertainment",
  photography: "Photography & Video",
  decoration: "Decoration & Flowers",
  attire: "Attire & Beauty",
  transportation: "Transportation",
  other: "Other Expenses",
};

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

      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Budget Usage</span>
            <span className="font-mono text-sm font-semibold">
              {budgetPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={budgetPercentage} className="h-3" />
        </div>

        <div className="space-y-4">
          {categories.map((category) => {
            const allocated = parseFloat(category.allocatedAmount.toString());
            const spent = parseFloat(category.spentAmount?.toString() || "0");
            const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
            const isOverBudget = spent > allocated;

            return (
              <button
                key={category.id}
                onClick={onNavigate}
                className={`w-full text-left space-y-2 p-2 -mx-2 rounded-lg ${onNavigate ? 'cursor-pointer hover-elevate' : ''}`}
                data-testid={`row-category-${category.category}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {CATEGORY_LABELS[category.category] || category.category}
                    </span>
                    {isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        Over Budget
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground">
                      ${spent.toLocaleString()} / ${allocated.toLocaleString()}
                    </span>
                    <span className="font-mono text-sm font-semibold min-w-[50px] text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={`h-2 ${isOverBudget ? "bg-destructive/20" : ""}`}
                />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
