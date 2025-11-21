import { Link, useLocation } from "wouter";
import { Bell, Calendar, Home, Users, CheckSquare, Clock, DollarSign, FileText, MessageSquare, Music, Image, CalendarClock, UserCircle, Menu, LogOut, Settings, ShoppingBag } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { Wedding } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/vendors", label: "Vendors", icon: UserCircle },
  { path: "/guests", label: "Guests", icon: Users },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/budget", label: "Budget", icon: DollarSign },
  { path: "/invitations", label: "Invitations", icon: ShoppingBag },
  { path: "/contracts", label: "Contracts", icon: FileText },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/playlists", label: "Playlists", icon: Music },
  { path: "/photo-gallery", label: "Photos", icon: Image },
  { path: "/documents", label: "Documents", icon: FileText },
];

export function AppHeader() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  
  const wedding = weddings?.[0];
  
  const daysUntilWedding = wedding?.weddingDate
    ? differenceInDays(new Date(wedding.weddingDate), new Date())
    : null;
  
  const getUserInitials = () => {
    if (!user) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-24 items-center justify-between px-6 gap-4">
        {/* Logo and Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3">
          <img 
            src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
            alt="Viah.me"
            className="h-20 w-auto object-contain"
            data-testid="logo-viah"
          />
          {wedding && (
            <Badge variant="outline" className="text-xs font-mono hidden sm:inline-flex" data-testid="badge-tradition">
              {wedding.tradition.charAt(0).toUpperCase() + wedding.tradition.slice(1)}
            </Badge>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.slice(0, 6).map((item) => {
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
          
          {/* More Menu */}
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
              {NAV_ITEMS.slice(6).map((item) => {
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
              {NAV_ITEMS.map((item) => {
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative hidden sm:inline-flex"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
