import { Link, useLocation } from "wouter";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { getBottomNavItems, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface BottomNavBarProps {
  onMoreClick: () => void;
}

export function BottomNavBar({ onMoreClick }: BottomNavBarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { canView, isOwner } = usePermissions();

  const hasAccess = (item: NavItem): boolean => {
    if (!item.permission) return true;
    if (isOwner) return true;
    return canView(item.permission);
  };

  const isVendor = user?.role === "vendor";
  const bottomItems = getBottomNavItems(isVendor).filter(hasAccess);

  if (!user) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom lg:hidden"
      data-testid="bottom-nav-bar"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} className="flex-1">
              <Button
                variant="ghost"
                className={cn(
                  "flex flex-col items-center justify-center h-full w-full gap-0.5 rounded-none",
                  isActive && "text-primary"
                )}
                data-testid={`bottom-nav-${item.path.replace("/", "")}`}
              >
                <Icon className={cn(
                  "h-6 w-6",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Button>
            </Link>
          );
        })}
        
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-full flex-1 gap-0.5 rounded-none"
          onClick={onMoreClick}
          data-testid="bottom-nav-more"
        >
          <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">
            More
          </span>
        </Button>
      </div>
    </nav>
  );
}
