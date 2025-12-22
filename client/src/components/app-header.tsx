import { Link, useLocation } from "wouter";
import { Bell, Calendar, Home, Users, CheckSquare, Clock, DollarSign, FileText, MessageSquare, Music, Image, CalendarClock, UserCircle, Menu, LogOut, Settings, ShoppingBag, Package, BookOpen, Radio, UsersRound, Globe, Bot, User } from "lucide-react";
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
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import type { Wedding } from "@shared/schema";
import type { PermissionCategory } from "@shared/schema";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

interface NavItem {
  path: string;
  label: string;
  icon: any;
  permission?: PermissionCategory;
}

const COUPLE_NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/ai-planner", label: "AI Planner", icon: Bot, permission: "ai_planner" },
  { path: "/budget", label: "Budget", icon: DollarSign, permission: "budget" },
  { path: "/timeline", label: "Timeline", icon: Clock, permission: "timeline" },
  { path: "/vendors", label: "Vendors", icon: UserCircle, permission: "vendors" },
  { path: "/guests", label: "Guests", icon: Users, permission: "guests" },
  { path: "/collaborators", label: "Team", icon: UsersRound, permission: "collaborators" },
  { path: "/tasks", label: "Tasks", icon: CheckSquare, permission: "tasks" },
  { path: "/ritual-control", label: "Live Control", icon: Radio, permission: "concierge" },
  { path: "/website-builder", label: "Website", icon: Globe, permission: "website" },
  { path: "/shopping", label: "Shopping List", icon: Package, permission: "shopping" },
  { path: "/cultural-info", label: "Cultural Info", icon: BookOpen },
  { path: "/invitations", label: "Invitations", icon: ShoppingBag, permission: "invitations" },
  { path: "/contracts", label: "Contracts", icon: FileText, permission: "contracts" },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/playlists", label: "Playlists", icon: Music, permission: "playlists" },
  { path: "/photo-gallery", label: "Photos", icon: Image, permission: "photos" },
  { path: "/documents", label: "Documents", icon: FileText, permission: "documents" },
];

const VENDOR_NAV_ITEMS: NavItem[] = [
  { path: "/vendor-dashboard", label: "Dashboard", icon: Home },
  { path: "/messages", label: "Messages", icon: MessageSquare },
];

export function AppHeader() {
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

  const navItems = user?.role === "vendor" ? VENDOR_NAV_ITEMS : COUPLE_NAV_ITEMS;
  const visibleNavItems = navItems.filter(hasAccess);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 sm:h-20 lg:h-24 items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
        {/* Logo and Brand */}
        <Link href={user?.role === "vendor" ? "/vendor-dashboard" : "/dashboard"} className="flex items-center gap-2 sm:gap-3 hover-elevate active-elevate-2 rounded-md px-2 sm:px-3 py-2 -ml-2 sm:-ml-3 flex-shrink-0">
          <img 
            src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
            alt="Viah.me"
            className="h-10 sm:h-14 lg:h-20 w-auto object-contain"
            data-testid="logo-viah"
          />
          {/* Show greeting for both couples and vendors */}
          {(user?.role === "vendor" ? currentVendor : wedding) && (
            <div className="hidden sm:flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-medium">Welcome back</p>
              <p className="text-sm font-semibold" data-testid="text-couple-greeting">
                {user?.role === "vendor" 
                  ? currentVendor?.name 
                  : (wedding?.partner1Name && wedding?.partner2Name 
                      ? `${wedding.partner1Name} & ${wedding.partner2Name}` 
                      : wedding?.partner1Name || wedding?.partner2Name || user?.email || "Guest")}
              </p>
              {user?.role !== "vendor" && wedding && (
                <Badge variant="outline" className="text-xs font-mono w-fit" data-testid="badge-tradition">
                  {wedding.tradition.charAt(0).toUpperCase() + wedding.tradition.slice(1)}
                </Badge>
              )}
            </div>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {visibleNavItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                  data-testid={`nav-${item.path.replace("/", "")}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
          
          {/* More Menu - only show if there are more items */}
          {visibleNavItems.length > 6 && (
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
                {visibleNavItems.slice(6).map((item) => {
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

        {/* Mobile Navigation Menu */}
        <div className="flex lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <DropdownMenuItem className="gap-2 cursor-pointer" data-testid={`nav-mobile-${item.path.replace("/", "")}`}>
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Countdown Timer */}
          {daysUntilWedding !== null && daysUntilWedding >= 0 && (
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
              data-testid="countdown-timer"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xl font-bold text-primary">
                  {daysUntilWedding}
                </span>
                <span className="text-xs text-muted-foreground">
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
                  className="relative hidden sm:inline-flex"
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
  );
}
