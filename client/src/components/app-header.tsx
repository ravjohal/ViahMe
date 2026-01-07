import { Link, useLocation } from "wouter";
import { Bell, Calendar, Menu, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { getAllCoupleNavItems, getAllVendorNavItems, type NavItem } from "@/config/navigation";
import type { Wedding } from "@shared/schema";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageSquare, UsersRound } from "lucide-react";

interface Notification {
  id: string;
  type: 'unread_message' | 'team_join';
  title: string;
  description: string;
  link: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadMessageCount: number;
  teamJoinCount: number;
}

export function AppHeader() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { canView, isOwner } = usePermissions();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
    enabled: user?.role !== "vendor",
  });
  
  const { data: currentVendor } = useQuery<any>({
    queryKey: ["/api/vendors/me"],
    enabled: user?.role === "vendor",
  });
  
  const wedding = useMemo(() => 
    user?.role !== "vendor" ? weddings?.[0] : undefined,
    [user?.role, weddings]
  );
  
  const daysUntilWedding = wedding?.weddingDate
    ? differenceInDays(new Date(wedding.weddingDate), new Date())
    : null;

  const { data: notificationsData } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications/couple", wedding?.id],
    enabled: user?.role !== "vendor" && !!wedding?.id,
    refetchInterval: 30000,
  });
  
  const getUserInitials = () => {
    if (!user) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  const hasAccess = (item: NavItem): boolean => {
    if (!item.permission) return true;
    if (isOwner) return true;
    return canView(item.permission);
  };

  const navItems = user?.role === "vendor" ? getAllVendorNavItems() : getAllCoupleNavItems();
  const visibleNavItems = navItems.filter(hasAccess);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 sm:h-16 lg:h-20 items-center justify-between px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10"
            onClick={() => setMobileDrawerOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo and Brand */}
          <Link href={user?.role === "vendor" ? "/vendor-dashboard" : "/dashboard"} className="flex items-center gap-2 sm:gap-3 hover-elevate active-elevate-2 rounded-md px-2 sm:px-3 py-2 -ml-2 sm:-ml-3 flex-shrink-0">
            <img 
              src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
              alt="Viah.me"
              className="h-8 sm:h-10 lg:h-14 w-auto object-contain"
              data-testid="logo-viah"
            />
            {(user?.role === "vendor" ? currentVendor : wedding) && (
              <div className="hidden md:flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Welcome back</p>
                <p className="text-sm font-semibold" data-testid="text-couple-greeting">
                  {user?.role === "vendor" 
                    ? currentVendor?.name 
                    : (wedding?.partner1Name && wedding?.partner2Name 
                        ? `${wedding.partner1Name} & ${wedding.partner2Name}` 
                        : wedding?.partner1Name || wedding?.partner2Name || user?.email || "Guest")}
                </p>
                {user?.role !== "vendor" && wedding && (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs font-mono" data-testid="badge-tradition">
                      {wedding.tradition.charAt(0).toUpperCase() + wedding.tradition.slice(1)}
                    </Badge>
                    {(wedding as any).role && (wedding as any).role !== "planner" && (
                      <Badge 
                        className={`text-xs ${
                          (wedding as any).role === "bride" 
                            ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800" 
                            : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        }`}
                        data-testid="badge-partner-role"
                      >
                        {(wedding as any).role === "bride" ? "Bride" : "Groom"}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {visibleNavItems.slice(0, 7).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive && "bg-primary/10 text-primary"
                    )}
                    data-testid={`nav-${item.path.replace("/", "")}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            {visibleNavItems.length > 7 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="button-more-menu">
                    <Menu className="w-4 h-4" />
                    <span className="hidden xl:inline">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>More Pages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {visibleNavItems.slice(7).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid={`nav-dropdown-${item.path.replace("/", "")}`}>
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </DropdownMenuItem>
                      </Link>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Countdown Timer */}
            {daysUntilWedding !== null && daysUntilWedding >= 0 && (
              <div
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/10 border border-primary/20"
                data-testid="countdown-timer"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-mono text-base sm:text-xl font-bold text-primary">
                    {daysUntilWedding}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {daysUntilWedding === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            )}

            {/* Notifications */}
            {user?.role !== "vendor" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative h-9 w-9 sm:h-10 sm:w-10"
                    data-testid="button-notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationsData && notificationsData.totalCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1">
                        {notificationsData.totalCount > 9 ? '9+' : notificationsData.totalCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {notificationsData && notificationsData.totalCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {notificationsData.totalCount}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!notificationsData || notificationsData.notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notificationsData.notifications.slice(0, 10).map((notification) => (
                        <Link key={notification.id} href={notification.link}>
                          <DropdownMenuItem 
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                            data-testid={`notification-${notification.id}`}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {notification.type === 'unread_message' ? (
                                <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
                              ) : (
                                <UsersRound className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                              <span className="font-medium text-sm truncate flex-1">
                                {notification.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                              {notification.description}
                            </p>
                            <span className="text-xs text-muted-foreground pl-6">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </DropdownMenuItem>
                        </Link>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Avatar & Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user.role}
                        {!user.emailVerified && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Unverified
                          </Badge>
                        )}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "vendor" && (
                    <Link href="/vendor-profile">
                      <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="menu-item-view-profile">
                        <User className="w-4 h-4" />
                        View Profile
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/settings">
                    <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="menu-item-settings">
                      <Settings className="w-4 h-4" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive" 
                    onClick={logout}
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        open={mobileDrawerOpen} 
        onOpenChange={setMobileDrawerOpen} 
      />

      {/* Bottom Navigation Bar for Mobile - uses lg:hidden CSS to hide on desktop */}
      {user && (
        <BottomNavBar onMoreClick={() => setMobileDrawerOpen(true)} />
      )}
    </>
  );
}
