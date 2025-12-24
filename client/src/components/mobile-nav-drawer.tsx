import { Link, useLocation } from "wouter";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery } from "@tanstack/react-query";
import { COUPLE_NAV_SECTIONS, VENDOR_NAV_SECTIONS, type NavSection, type NavItem } from "@/config/navigation";
import type { Wedding } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({ open, onOpenChange }: MobileNavDrawerProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { canView, isOwner } = usePermissions();
  
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: user?.role !== "vendor",
  });
  
  const { data: currentVendor } = useQuery<any>({
    queryKey: ["/api/vendors/me"],
    enabled: user?.role === "vendor",
  });
  
  const wedding = user?.role !== "vendor" ? weddings?.[0] : undefined;
  
  const daysUntilWedding = wedding?.weddingDate
    ? differenceInDays(new Date(wedding.weddingDate), new Date())
    : null;

  const hasAccess = (item: NavItem): boolean => {
    if (!item.permission) return true;
    if (isOwner) return true;
    return canView(item.permission);
  };

  const sections = user?.role === "vendor" ? VENDOR_NAV_SECTIONS : COUPLE_NAV_SECTIONS;
  
  const getUserInitials = () => {
    if (!user) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-[85vw] max-w-[320px] p-0 flex flex-col"
        data-testid="mobile-nav-drawer"
      >
        <SheetHeader className="p-4 pb-2 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <SheetTitle className="text-left text-base font-semibold">
                  {user?.role === "vendor" 
                    ? currentVendor?.name || "Vendor"
                    : (wedding?.partner1Name && wedding?.partner2Name 
                        ? `${wedding.partner1Name} & ${wedding.partner2Name}` 
                        : user?.email || "Guest")}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-close-drawer">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
          
          {daysUntilWedding !== null && daysUntilWedding >= 0 && (
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 justify-center">
                <span className="font-mono text-2xl font-bold text-primary">
                  {daysUntilWedding}
                </span>
                <span className="text-sm text-muted-foreground">
                  {daysUntilWedding === 1 ? "day until your wedding!" : "days until your wedding!"}
                </span>
              </div>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {sections.map((section, index) => {
              const visibleItems = section.items.filter(hasAccess);
              if (visibleItems.length === 0) return null;
              
              return (
                <div key={section.id} className="mb-4">
                  {index > 0 && <Separator className="mb-4" />}
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.path;
                      return (
                        <Link key={item.path} href={item.path} onClick={handleNavClick}>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start h-14 px-3 gap-4",
                              isActive && "bg-primary/10 text-primary border-l-4 border-primary rounded-l-none"
                            )}
                            data-testid={`mobile-nav-${item.path.replace("/", "")}`}
                          >
                            <Icon className="h-6 w-6 flex-shrink-0" />
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <span className="text-base font-medium truncate">
                                {item.label}
                              </span>
                              {item.description && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30">
          <Link href="/settings" onClick={handleNavClick}>
            <Button 
              variant="outline" 
              className="w-full h-12 mb-2"
              data-testid="mobile-nav-settings"
            >
              Settings
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            className="w-full h-12"
            onClick={() => {
              logout();
              onOpenChange(false);
            }}
            data-testid="mobile-nav-logout"
          >
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
