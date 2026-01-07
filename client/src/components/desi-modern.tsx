import { Sparkles } from "lucide-react";

interface OrnamentalDividerProps {
  className?: string;
  variant?: "standard" | "major";
}

export function OrnamentalDivider({ className = "", variant = "standard" }: OrnamentalDividerProps) {
  if (variant === "major") {
    return (
      <div className={`divider-major ${className}`}>
        <MandalaIcon className="w-12 h-12 text-primary opacity-30" />
      </div>
    );
  }
  
  return (
    <div className={`divider-ornamental ${className}`}>
      <MandalaIcon className="divider-ornamental-icon" />
    </div>
  );
}

export function MandalaIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      <path d="M24 2 L25 24 L24 46 L23 24 Z" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <path d="M2 24 L24 25 L46 24 L24 23 Z" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <path d="M8 8 L24.5 23.5 L40 40 L23.5 24.5 Z" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <path d="M40 8 L24.5 23.5 L8 40 L23.5 24.5 Z" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <circle cx="24" cy="6" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="42" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="6" cy="24" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="42" cy="24" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="11" cy="11" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="37" cy="11" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="11" cy="37" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="37" cy="37" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function PhulkariIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8Z" 
        stroke="currentColor" 
        strokeWidth="1"
        opacity="0.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  showDivider?: boolean;
}

export function SectionHeader({ title, subtitle, className = "", showDivider = true }: SectionHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <h2 className="text-2xl md:text-3xl font-serif font-semibold text-gradient-warm">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      {showDivider && <OrnamentalDivider className="mt-4" />}
    </div>
  );
}

interface WeddingBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "warm" | "gold";
  className?: string;
}

export function WeddingBadge({ children, variant = "default", className = "" }: WeddingBadgeProps) {
  const variantClasses = {
    default: "bg-primary/10 text-primary border-primary/20",
    warm: "bg-gradient-warm-subtle text-primary border-primary/30",
    gold: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/30"
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${variantClasses[variant]} ${className}`}>
      <Sparkles className="w-3.5 h-3.5" />
      {children}
    </span>
  );
}

export function MandalaLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <MandalaIcon className="loading-mandala text-primary" />
    </div>
  );
}

interface WarmCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "accent" | "featured" | "flourish";
}

export function WarmCard({ children, className = "", variant = "accent" }: WarmCardProps) {
  const variantClasses = {
    accent: "card-warm-accent",
    featured: "card-featured",
    flourish: "flourish-corners"
  };
  
  return (
    <div className={`rounded-lg bg-card p-6 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
