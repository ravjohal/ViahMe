import { Link, useLocation } from "wouter";
import { Bell, Calendar, Home, Users, CheckSquare, Clock, DollarSign, FileText, MessageSquare, Music, Image, CalendarClock, UserCircle, Menu } from "lucide-react";
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
import type { Wedding } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/vendors", label: "Vendors", icon: UserCircle },
  { path: "/vendor-availability", label: "Availability", icon: CalendarClock },
  { path: "/guests", label: "Guests", icon: Users },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/budget", label: "Budget", icon: DollarSign },
  { path: "/contracts", label: "Contracts", icon: FileText },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/playlists", label: "Playlists", icon: Music },
  { path: "/photo-gallery", label: "Photos", icon: Image },
  { path: "/documents", label: "Documents", icon: FileText },
];

export function AppHeader() {
  const [location] = useLocation();
  
  const { data: weddings } = useQuery<Wedding[]>({
    queryKey: ["/api/weddings"],
  });
  
  const wedding = weddings?.[0];
  
  const daysUntilWedding = wedding?.weddingDate
    ? differenceInDays(new Date(wedding.weddingDate), new Date())
    : null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        {/* Logo and Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3">
          <h1 className="font-display text-2xl font-bold text-primary">
            The Digital Baraat
          </h1>
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
          <Button
            variant="outline"
            size="icon"
            className="relative hidden sm:inline-flex"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* User Avatar */}
          {wedding && (
            <Avatar className="h-9 w-9" data-testid="avatar-user">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {wedding.role.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
