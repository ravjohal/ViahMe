import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Package, 
  Clock, 
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  Users,
  Settings,
  MessageSquare,
  Zap,
  Bell,
  Eye,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import viahLogo from "@assets/viah-logo_1763669612969.png";
import type { Vendor } from "@shared/schema";

const navItems = [
  { href: "/vendor-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor-bookings", label: "Bookings", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/vendor-templates", label: "Templates", icon: Zap },
  { href: "/vendor-reminders", label: "Reminders", icon: Bell },
  { href: "/vendor-contracts", label: "Contracts", icon: FileText },
  { href: "/vendor-packages", label: "Packages", icon: Package },
  { href: "/vendor-calendar", label: "Availability", icon: Clock },
  { href: "/vendor-team", label: "Team", icon: Users },
  { href: "/vendor-analytics", label: "Analytics", icon: BarChart3 },
  { href: "/vendor-profile", label: "Profile", icon: Settings },
];

export function VendorHeader() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch vendor profile for current user
  const { data: vendor } = useQuery<Vendor>({
    queryKey: ["/api/vendors/me"],
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4">
        {/* Logo and Vendor Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <Link href="/vendor-dashboard" className="flex items-center hover-elevate active-elevate-2 rounded-md p-1 -ml-1">
            <img 
              src={viahLogo} 
              alt="Viah.me" 
              className="h-8 sm:h-10 w-auto object-contain"
              data-testid="logo-viah"
            />
          </Link>
          {vendor?.name && (
            <>
              <Separator orientation="vertical" className="h-5 sm:h-6 hidden md:block" />
              <span className="font-display text-sm sm:text-base font-semibold text-foreground hidden md:block truncate max-w-[120px] lg:max-w-[200px]" data-testid="text-vendor-name">
                {vendor.name}
              </span>
            </>
          )}
        </div>

        {/* Navigation - takes remaining space on desktop */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={isActive ? "bg-primary/10 text-primary" : ""}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Spacer for mobile/tablet to push menu button to right */}
        <div className="flex-1 lg:hidden" />

        {/* User dropdown */}
        <div className="hidden lg:flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" data-testid="button-user-menu">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">Vendor Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {vendor && (
                <>
                  <Link href={`/vendors?preview=${vendor.id}`}>
                    <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="menu-item-view-profile">
                      <Eye className="w-4 h-4" />
                      Preview as Couple
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/vendor-profile">
                    <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="menu-item-edit-profile">
                      <Pencil className="w-4 h-4" />
                      Edit Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                </>
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
                onClick={() => logout()}
                data-testid="menu-item-logout"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden py-4 border-t px-6">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 pt-4 border-t flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
              <User className="w-4 h-4" />
              <span className="truncate">{user?.email}</span>
            </div>
            {vendor && (
              <>
                <Link href={`/vendors?preview=${vendor.id}`}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="button-mobile-view-profile"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview as Couple
                  </Button>
                </Link>
                <Link href="/vendor-profile">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="button-mobile-edit-profile"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </>
            )}
            <Link href="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="button-mobile-settings"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:text-destructive"
              onClick={() => logout()}
              data-testid="button-mobile-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
