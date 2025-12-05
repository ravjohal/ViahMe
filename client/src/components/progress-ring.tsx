import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  labelClassName,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColorClass = (p: number) => {
    if (p >= 80) return "text-green-500";
    if (p >= 50) return "text-yellow-500";
    if (p >= 25) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        data-testid="progress-ring-svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-500 ease-out", getColorClass(progress))}
        />
      </svg>
      {showLabel && (
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center",
          labelClassName
        )}>
          <span 
            className={cn("text-2xl font-bold", getColorClass(progress))}
            data-testid="progress-ring-value"
          >
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-muted-foreground">Complete</span>
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  height?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  className,
  height = "h-2",
  showLabel = true,
}: ProgressBarProps) {
  const getColorClass = (p: number) => {
    if (p >= 80) return "bg-green-500";
    if (p >= 50) return "bg-yellow-500";
    if (p >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-muted-foreground">Progress</span>
          <span className="text-sm font-bold" data-testid="progress-bar-value">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className={cn("w-full bg-muted/30 rounded-full overflow-hidden", height)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getColorClass(progress)
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  );
}

interface TaskProgressStatsProps {
  total: number;
  completed: number;
  highPriority: number;
  overdue: number;
  className?: string;
}

export function TaskProgressStats({
  total,
  completed,
  highPriority,
  overdue,
  className,
}: TaskProgressStatsProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={cn("flex flex-col md:flex-row gap-6 items-center", className)}>
      <ProgressRing progress={progress} size={100} strokeWidth={8} />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        <div className="text-center p-3 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-foreground" data-testid="stat-total">
            {total}
          </div>
          <div className="text-xs text-muted-foreground">Total Tasks</div>
        </div>
        
        <div className="text-center p-3 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">
            {completed}
          </div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        
        <div className="text-center p-3 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-orange-600" data-testid="stat-high-priority">
            {highPriority}
          </div>
          <div className="text-xs text-muted-foreground">High Priority</div>
        </div>
        
        <div className="text-center p-3 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-red-600" data-testid="stat-overdue">
            {overdue}
          </div>
          <div className="text-xs text-muted-foreground">Overdue</div>
        </div>
      </div>
    </div>
  );
}
