import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { DashboardWidget } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  Settings,
  Plus,
  Calendar,
  PieChart,
  Receipt,
  Clock,
  ChevronRight,
  ArrowLeft,
  GripVertical,
  Eye,
  EyeOff,
  X,
  LineChart,
  Target,
  PiggyBank,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";
import type { Wedding, BudgetCategory, Expense, Contract, Event } from "@shared/schema";

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

const PIE_COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#84cc16", // lime
];

interface WidgetConfig {
  id: string;
  type: "budget_overview" | "spending_by_category" | "recent_expenses" | "upcoming_payments" | "alerts" | "spending_trend";
  title: string;
  isVisible: boolean;
  position: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "1", type: "budget_overview", title: "Budget Overview", isVisible: true, position: 0 },
  { id: "2", type: "alerts", title: "Budget Alerts", isVisible: true, position: 1 },
  { id: "3", type: "spending_by_category", title: "Spending by Category", isVisible: true, position: 2 },
  { id: "4", type: "spending_trend", title: "Spending Trend", isVisible: true, position: 3 },
  { id: "5", type: "recent_expenses", title: "Recent Expenses", isVisible: true, position: 4 },
  { id: "6", type: "upcoming_payments", title: "Upcoming Payments", isVisible: true, position: 5 },
];

interface BudgetAlert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  categoryId?: string;
}

function SortableWidget({ widget, children, onToggle }: { widget: WidgetConfig; children: React.ReactNode; onToggle: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card className={`p-4 ${!widget.isVisible ? "opacity-50" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
              data-testid={`drag-handle-${widget.id}`}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <h3 className="font-semibold">{widget.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
            data-testid={`toggle-widget-${widget.id}`}
          >
            {widget.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>
        {widget.isVisible && children}
      </Card>
    </div>
  );
}

function BudgetOverviewWidget({ wedding, totalSpent, totalBudget }: { wedding: Wedding | undefined; totalSpent: number; totalBudget: number }) {
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Budget</p>
          <p className="text-xl font-bold mt-1">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Spent</p>
          <p className="text-xl font-bold mt-1 text-orange-600">${totalSpent.toLocaleString()}</p>
        </div>
        <div className={`text-center p-3 rounded-lg ${isOverBudget ? "bg-red-50 dark:bg-red-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
          <p className={`text-xl font-bold mt-1 ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
            ${Math.abs(remaining).toLocaleString()}
            {isOverBudget && " over"}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget Used</span>
          <span className={percentUsed > 100 ? "text-red-600 font-medium" : ""}>{percentUsed.toFixed(1)}%</span>
        </div>
        <Progress value={Math.min(percentUsed, 100)} className={percentUsed > 100 ? "[&>div]:bg-red-500" : ""} />
      </div>
    </div>
  );
}

function AlertsWidget({ alerts }: { alerts: BudgetAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No alerts at this time</p>
        <p className="text-xs">You're on track with your budget!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg flex items-start gap-3 ${
            alert.type === "danger"
              ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              : alert.type === "warning"
              ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400"
              : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
          }`}
          data-testid={`alert-${alert.id}`}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{alert.title}</p>
            <p className="text-xs opacity-80">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpendingByCategoryWidget({ categories, expenses }: { categories: BudgetCategory[]; expenses: Expense[] }) {
  const categoryData = useMemo(() => {
    const data = categories.map((cat, index) => {
      const catExpenses = expenses.filter((e) => 
        e.bucketCategoryId === cat.id || 
        e.parentCategory === cat.slug || 
        e.categoryId === cat.id
      );
      const spent = catExpenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      const allocated = parseFloat(cat.allocatedAmount?.toString() || "0");
      return {
        name: cat.displayName || CATEGORY_LABELS[cat.slug] || cat.slug,
        spent,
        allocated,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    }).filter((d) => d.spent > 0);
    return data;
  }, [categories, expenses]);

  if (categoryData.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <PieChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No spending data yet</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={50}
              dataKey="spent"
              strokeWidth={0}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </RechartsPie>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {categoryData.slice(0, 5).map((cat, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="truncate">{cat.name}</span>
            </div>
            <span className="font-mono">${cat.spent.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpendingTrendWidget({ expenses }: { expenses: Expense[] }) {
  const trendData = useMemo(() => {
    const monthlySpending: Record<string, number> = {};
    
    expenses.forEach((expense) => {
      const date = new Date(expense.expenseDate || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + parseFloat(expense.amount?.toString() || "0");
    });

    const sortedMonths = Object.keys(monthlySpending).sort();
    let cumulative = 0;
    
    return sortedMonths.map((month) => {
      cumulative += monthlySpending[month];
      const [year, m] = month.split("-");
      const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString("en-US", { month: "short" });
      return {
        month: monthName,
        spending: monthlySpending[month],
        cumulative,
      };
    });
  }, [expenses]);

  if (trendData.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No spending data to show trends</p>
      </div>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Spending"]}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#colorSpending)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RecentExpensesWidget({ expenses }: { expenses: Expense[] }) {
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.expenseDate ? new Date(a.expenseDate).getTime() : 0);
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.expenseDate ? new Date(b.expenseDate).getTime() : 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [expenses]);

  if (recentExpenses.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No expenses recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentExpenses.map((expense) => (
        <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
          <div>
            <p className="font-medium text-sm">{expense.expenseName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(expense.expenseDate || expense.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono font-medium">${parseFloat(expense.amount?.toString() || "0").toLocaleString()}</p>
            <Badge variant={expense.status === "paid" ? "default" : "secondary"} className="text-xs">
              {expense.status === "paid" ? "Paid" : expense.status === "booked" ? "Booked" : "Estimated"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingPaymentsWidget({ contracts, vendors }: { contracts: Contract[]; vendors: any[] }) {
  const upcomingPayments = useMemo(() => {
    const payments: Array<{ vendorName: string; amount: number; dueDate: Date; status: string }> = [];
    
    contracts.forEach((contract) => {
      let milestones: any[] = [];
      if (contract.paymentMilestones) {
        if (typeof contract.paymentMilestones === "string") {
          try {
            milestones = JSON.parse(contract.paymentMilestones);
          } catch {
            milestones = [];
          }
        } else if (Array.isArray(contract.paymentMilestones)) {
          milestones = contract.paymentMilestones;
        }
      }

      milestones.forEach((milestone: any) => {
        if (milestone.dueDate && milestone.status !== "paid") {
          const vendor = vendors.find((v) => v.id === contract.vendorId);
          payments.push({
            vendorName: vendor?.name || "Vendor",
            amount: parseFloat(milestone.amount?.toString() || "0"),
            dueDate: new Date(milestone.dueDate),
            status: milestone.status || "pending",
          });
        }
      });
    });

    return payments
      .filter((p) => p.dueDate >= new Date())
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);
  }, [contracts, vendors]);

  if (upcomingPayments.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcomingPayments.map((payment, index) => {
        const daysUntil = Math.ceil((payment.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntil <= 7;
        
        return (
          <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <p className="font-medium text-sm">{payment.vendorName}</p>
              <p className={`text-xs ${isUrgent ? "text-orange-600" : "text-muted-foreground"}`}>
                Due {payment.dueDate.toLocaleDateString()}
                {isUrgent && ` (${daysUntil} days)`}
              </p>
            </div>
            <p className="font-mono font-medium">${payment.amount.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}

const WIDGET_TITLES: Record<string, string> = {
  budget_overview: "Budget Overview",
  alerts: "Budget Alerts",
  spending_by_category: "Spending by Category",
  spending_trend: "Spending Trend",
  recent_expenses: "Recent Expenses",
  upcoming_payments: "Upcoming Payments",
};

interface ForecastTabProps {
  wedding: Wedding | undefined;
  expenses: Expense[];
  contracts: Contract[];
  totalBudget: number;
  totalSpent: number;
}

function ForecastTab({ wedding, expenses, contracts, totalBudget, totalSpent }: ForecastTabProps) {
  const forecastData = useMemo(() => {
    const totalCommitted = expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
    const totalPaid = expenses.reduce((sum, e) => sum + parseFloat(e.amountPaid?.toString() || "0"), 0);
    const outstanding = totalCommitted - totalPaid;
    
    const weddingDate = wedding?.weddingDate ? new Date(wedding.weddingDate) : null;
    const now = new Date();
    const monthsUntilWedding = weddingDate 
      ? Math.max(1, Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 6;
    
    const firstExpenseDate = expenses.length > 0 
      ? new Date(Math.min(...expenses.map(e => new Date(e.createdAt || now).getTime())))
      : now;
    const monthsElapsed = Math.max(1, Math.ceil((now.getTime() - firstExpenseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const avgMonthlySpend = totalPaid / monthsElapsed;
    const projectedTotal = totalPaid + (avgMonthlySpend * monthsUntilWedding);
    
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return {
      totalCommitted,
      totalPaid,
      outstanding,
      projectedTotal,
      avgMonthlySpend,
      monthsUntilWedding,
      remaining,
      percentUsed,
    };
  }, [wedding, expenses, totalBudget, totalSpent]);

  const projectionData = useMemo(() => {
    const now = new Date();
    const data = [];
    let runningTotal = forecastData.totalPaid;
    
    for (let i = 0; i <= forecastData.monthsUntilWedding; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      data.push({
        month: month.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        projected: Math.round(runningTotal),
        budget: totalBudget,
      });
      runningTotal += forecastData.avgMonthlySpend;
    }
    return data;
  }, [forecastData, totalBudget]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Total Committed</span>
          </div>
          <p className="text-2xl font-bold">${forecastData.totalCommitted.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {forecastData.percentUsed.toFixed(1)}% of budget
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">${forecastData.totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${forecastData.outstanding.toLocaleString()} outstanding
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Projected Total</span>
          </div>
          <p className={`text-2xl font-bold ${forecastData.projectedTotal > totalBudget ? "text-red-600" : "text-blue-600"}`}>
            ${Math.round(forecastData.projectedTotal).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on ${Math.round(forecastData.avgMonthlySpend).toLocaleString()}/month avg
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <LineChart className="w-4 h-4" />
          Spending Projection
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="budget" 
                stroke="#94a3b8" 
                fill="#e2e8f0" 
                strokeDasharray="5 5"
                name="Budget"
              />
              <Area 
                type="monotone" 
                dataKey="projected" 
                stroke="#f97316" 
                fill="#fed7aa" 
                name="Projected"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>Projected Spending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-300 border border-dashed border-slate-400" />
            <span>Budget Limit</span>
          </div>
        </div>
      </Card>

      {forecastData.projectedTotal > totalBudget && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Budget Warning</p>
              <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
                At your current spending rate, you're projected to exceed your budget by ${Math.round(forecastData.projectedTotal - totalBudget).toLocaleString()} by your wedding date.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface CashFlowTabProps {
  wedding: Wedding | undefined;
  expenses: Expense[];
  contracts: Contract[];
}

function CashFlowTab({ wedding, expenses, contracts }: CashFlowTabProps) {
  const cashFlowData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    
    const monthlyData: { [key: string]: { inflow: number; outflow: number; label: string; isFuture: boolean } } = {};
    
    for (let d = new Date(sixMonthsAgo); d <= threeMonthsAhead; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const isFuture = d > now;
      monthlyData[key] = { inflow: 0, outflow: 0, label, isFuture };
    }
    
    expenses.forEach((expense) => {
      if (!expense.createdAt) return;
      const date = new Date(expense.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key]) {
        monthlyData[key].outflow += parseFloat(expense.amountPaid?.toString() || "0");
      }
    });
    
    contracts.forEach((contract) => {
      if (!contract.nextPaymentDate) return;
      const date = new Date(contract.nextPaymentDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[key] && date > now) {
        const remaining = parseFloat(contract.totalAmount?.toString() || "0") - parseFloat(contract.depositAmount?.toString() || "0");
        monthlyData[key].outflow += remaining;
      }
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, data]) => data);
  }, [expenses, contracts]);

  const totalOutflow = cashFlowData.reduce((sum, d) => sum + d.outflow, 0);
  const pastOutflow = cashFlowData.filter(d => !d.isFuture).reduce((sum, d) => sum + d.outflow, 0);
  const futureOutflow = cashFlowData.filter(d => d.isFuture).reduce((sum, d) => sum + d.outflow, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Total Cash Out</span>
          </div>
          <p className="text-2xl font-bold">${totalOutflow.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Past 6 months + Next 3 months</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Already Paid</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">${pastOutflow.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Past 6 months</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">${futureOutflow.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Next 3 months</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <PiggyBank className="w-4 h-4" />
          Monthly Cash Flow
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Payments"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="outflow" 
                stroke="#f97316" 
                fill="#fed7aa" 
                name="Cash Out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Shows past payments and upcoming scheduled payments from contracts
        </p>
      </Card>

      {futureOutflow > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-400">Upcoming Payments</p>
              <p className="text-sm text-blue-600 dark:text-blue-400/80 mt-1">
                You have ${futureOutflow.toLocaleString()} in scheduled payments over the next 3 months.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function FinancialDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [newAlertThreshold, setNewAlertThreshold] = useState("80");
  const [activeTab, setActiveTab] = useState("widgets");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: weddings, isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });

  const wedding = weddings?.[0];

  const { data: apiWidgets = [], isLoading: widgetsLoading } = useQuery<DashboardWidget[]>({
    queryKey: ["/api/dashboard/widgets", wedding?.id],
    enabled: !!wedding?.id,
  });

  useEffect(() => {
    if (apiWidgets.length > 0) {
      const mappedWidgets: WidgetConfig[] = apiWidgets.map((w) => ({
        id: w.id,
        type: w.widgetType as WidgetConfig["type"],
        title: WIDGET_TITLES[w.widgetType] || w.widgetType,
        isVisible: w.isVisible,
        position: w.position,
      }));
      setLocalWidgets(mappedWidgets.sort((a, b) => a.position - b.position));
    }
  }, [apiWidgets]);

  const widgets = localWidgets;

  const { data: categories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-bucket-categories", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", wedding?.id],
    enabled: !!wedding?.id,
  });

  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  const updateWidgetMutation = useMutation({
    mutationFn: async ({ widgetId, updates }: { widgetId: string; updates: Partial<DashboardWidget> }) => {
      return apiRequest(`/api/dashboard/widgets/${widgetId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets", wedding?.id] });
    },
  });

  const reorderWidgetsMutation = useMutation({
    mutationFn: async ({ weddingId, widgetIds }: { weddingId: string; widgetIds: string[] }) => {
      return apiRequest("/api/dashboard/widgets/reorder", {
        method: "POST",
        body: JSON.stringify({ weddingId, widgetIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets", wedding?.id] });
    },
  });

  const totalBudget = parseFloat(wedding?.totalBudget?.toString() || "0");
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
  }, [expenses]);

  const alerts = useMemo<BudgetAlert[]>(() => {
    const result: BudgetAlert[] = [];
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    if (percentUsed >= 100) {
      result.push({
        id: "over-budget",
        type: "danger",
        title: "Over Budget",
        message: `You've exceeded your total budget by $${(totalSpent - totalBudget).toLocaleString()}`,
      });
    } else if (percentUsed >= 90) {
      result.push({
        id: "near-budget",
        type: "warning",
        title: "Approaching Budget Limit",
        message: `You've used ${percentUsed.toFixed(0)}% of your total budget`,
      });
    }

    categories.forEach((cat) => {
      const catExpenses = expenses.filter((e) => 
        e.bucketCategoryId === cat.id || 
        e.parentCategory === cat.slug || 
        e.categoryId === cat.id
      );
      const spent = catExpenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || "0"), 0);
      const allocated = parseFloat(cat.allocatedAmount?.toString() || "0");
      const catPercent = allocated > 0 ? (spent / allocated) * 100 : 0;

      if (catPercent >= 100) {
        result.push({
          id: `cat-over-${cat.id}`,
          type: "danger",
          title: `${cat.displayName || CATEGORY_LABELS[cat.slug] || cat.slug} Over Budget`,
          message: `Spent $${spent.toLocaleString()} of $${allocated.toLocaleString()} allocated`,
          categoryId: cat.id,
        });
      } else if (catPercent >= 80) {
        result.push({
          id: `cat-warn-${cat.id}`,
          type: "warning",
          title: `${cat.displayName || CATEGORY_LABELS[cat.slug] || cat.slug} at ${catPercent.toFixed(0)}%`,
          message: `$${(allocated - spent).toLocaleString()} remaining in this category`,
          categoryId: cat.id,
        });
      }
    });

    const partialPayments = expenses.filter((e) => e.paymentStatus === "partial");
    if (partialPayments.length > 0) {
      const totalOwed = partialPayments.reduce((sum, e) => {
        const amount = parseFloat(e.amount?.toString() || "0");
        const paid = parseFloat(e.amountPaid?.toString() || "0");
        return sum + (amount - paid);
      }, 0);
      
      result.push({
        id: "partial-payments",
        type: "info",
        title: `${partialPayments.length} Partial Payments`,
        message: `$${totalOwed.toLocaleString()} still owed across pending expenses`,
      });
    }

    return result;
  }, [totalBudget, totalSpent, categories, expenses]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && wedding?.id) {
      setLocalWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        reorderWidgetsMutation.mutate({
          weddingId: wedding.id,
          widgetIds: reordered.map((w) => w.id),
        });
        
        return reordered;
      });
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const widget = localWidgets.find((w) => w.id === widgetId);
    if (widget) {
      setLocalWidgets((items) =>
        items.map((item) =>
          item.id === widgetId ? { ...item, isVisible: !item.isVisible } : item
        )
      );
      
      updateWidgetMutation.mutate({
        widgetId,
        updates: { isVisible: !widget.isVisible },
      });
    }
  };

  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case "budget_overview":
        return <BudgetOverviewWidget wedding={wedding} totalSpent={totalSpent} totalBudget={totalBudget} />;
      case "alerts":
        return <AlertsWidget alerts={alerts} />;
      case "spending_by_category":
        return <SpendingByCategoryWidget categories={categories} expenses={expenses} />;
      case "spending_trend":
        return <SpendingTrendWidget expenses={expenses} />;
      case "recent_expenses":
        return <RecentExpensesWidget expenses={expenses} />;
      case "upcoming_payments":
        return <UpcomingPaymentsWidget contracts={contracts} vendors={vendors} />;
      default:
        return null;
    }
  };

  if (weddingsLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/budget")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Financial Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Real-time budget monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlertDialogOpen(true)}
              data-testid="button-manage-alerts"
            >
              <Bell className="w-4 h-4 mr-2" />
              Alerts
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {alerts.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widgets" data-testid="tab-widgets">
              <PieChart className="w-4 h-4 mr-2" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="forecast" data-testid="tab-forecast">
              <LineChart className="w-4 h-4 mr-2" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="cashflow" data-testid="tab-cashflow">
              <PiggyBank className="w-4 h-4 mr-2" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="widgets">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
                <div className="grid gap-4 md:grid-cols-2">
                  {widgets.map((widget) => (
                    <SortableWidget
                      key={widget.id}
                      widget={widget}
                      onToggle={() => toggleWidgetVisibility(widget.id)}
                    >
                      {renderWidgetContent(widget)}
                    </SortableWidget>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastTab 
              wedding={wedding} 
              expenses={expenses} 
              contracts={contracts}
              totalBudget={totalBudget}
              totalSpent={totalSpent}
            />
          </TabsContent>

          <TabsContent value="cashflow">
            <CashFlowTab 
              wedding={wedding} 
              expenses={expenses} 
              contracts={contracts}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Toggle widget visibility and drag to reorder them on the dashboard.
            </p>
            <div className="space-y-2">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">{widget.title}</span>
                  <Switch
                    checked={widget.isVisible}
                    onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                    data-testid={`switch-widget-${widget.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Budget Alerts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${
                      alert.type === "danger"
                        ? "bg-red-50 dark:bg-red-950/30"
                        : alert.type === "warning"
                        ? "bg-orange-50 dark:bg-orange-950/30"
                        : "bg-blue-50 dark:bg-blue-950/30"
                    }`}
                  >
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No active alerts. You're on track!
              </p>
            )}
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Alert Settings</p>
              <p className="text-xs text-muted-foreground mb-3">
                Alerts are automatically generated when spending reaches thresholds.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">80%</Badge>
                  <span className="text-sm">Warning threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">100%</Badge>
                  <span className="text-sm">Danger threshold</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
