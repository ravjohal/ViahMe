import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Settings
} from "lucide-react";
import { useState } from "react";
import viahLogo from "@assets/viah-logo_1763669612969.png";
import type { Vendor } from "@shared/schema";

const navItems = [
  { href: "/vendor-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor-bookings", label: "Bookings", icon: Calendar },
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
      <div className="flex h-24 items-center justify-between px-6 gap-4">
        {/* Logo and Vendor Name */}
        <div className="flex items-center gap-4">
          <Link href="/vendor-dashboard" className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3">
            <img 
              src={viahLogo} 
              alt="Viah.me" 
              className="h-20 w-auto object-contain"
              data-testid="logo-viah"
            />
          </Link>
          {vendor?.name && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <span className="font-display text-lg font-semibold text-foreground" data-testid="text-vendor-name">
                {vendor.name}
              </span>
            </>
          )}
        </div>

        {/* Navigation - centered */}
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
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid="text-vendor-email">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              className="justify-start"
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
