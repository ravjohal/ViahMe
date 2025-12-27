import { 
  Home, Users, CheckSquare, Clock, DollarSign, FileText, 
  MessageSquare, Music, Image, UserCircle, ShoppingBag, 
  Package, BookOpen, Radio, UsersRound, Globe, Bot, 
  Calendar, Wallet, BarChart3, Briefcase, Star,
  type LucideIcon
} from "lucide-react";
import type { PermissionCategory } from "@shared/schema";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionCategory;
  description?: string;
  priority?: number;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const COUPLE_NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "Main Navigation",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: Home, priority: 1, description: "Your wedding overview" },
      { path: "/budget", label: "Budget", icon: DollarSign, permission: "budget", priority: 2, description: "Track spending" },
      { path: "/timeline", label: "Timeline", icon: Clock, permission: "timeline", priority: 3, description: "Your schedule" },
      { path: "/vendors", label: "Vendors", icon: UserCircle, permission: "vendors", priority: 4, description: "Find services" },
      { path: "/guests", label: "Guests", icon: Users, permission: "guests", priority: 5, description: "Manage guest list" },
      { path: "/tasks", label: "Tasks", icon: CheckSquare, permission: "tasks", priority: 6, description: "Things to do" },
      { path: "/ritual-control", label: "Live Control", icon: Radio, permission: "concierge", priority: 7, description: "Day-of coordination" },
    ],
  },
  {
    id: "planning",
    label: "Plan Your Wedding",
    items: [
      { path: "/ai-planner", label: "AI Planner", icon: Bot, permission: "ai_planner", description: "Smart planning assistant" },
      { path: "/expenses", label: "Expenses", icon: Wallet, permission: "budget", description: "Split costs" },
      { path: "/contracts", label: "Contracts", icon: FileText, permission: "contracts", description: "Vendor agreements" },
      { path: "/collaborators", label: "Team", icon: UsersRound, permission: "collaborators", description: "Family helpers" },
    ],
  },
  {
    id: "content",
    label: "Website & Media",
    items: [
      { path: "/website-builder", label: "Website", icon: Globe, permission: "website", description: "Your wedding site" },
      { path: "/photo-gallery", label: "Photos", icon: Image, permission: "photos", description: "Photo gallery" },
      { path: "/playlists", label: "Playlists", icon: Music, permission: "playlists", description: "Music picks" },
      { path: "/documents", label: "Documents", icon: FileText, permission: "documents", description: "Important files" },
    ],
  },
  {
    id: "communication",
    label: "Messages & Invites",
    items: [
      { path: "/messages", label: "Messages", icon: MessageSquare, description: "Chat with vendors" },
      { path: "/invitations", label: "Invitations", icon: ShoppingBag, permission: "invitations", description: "Order cards" },
    ],
  },
  {
    id: "extras",
    label: "More Tools",
    items: [
      { path: "/shopping", label: "Shopping", icon: Package, permission: "shopping", description: "Shopping list" },
      { path: "/cultural-info", label: "Cultural Info", icon: BookOpen, description: "Learn traditions" },
    ],
  },
];

export const VENDOR_NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "Dashboard",
    items: [
      { path: "/vendor-dashboard", label: "Dashboard", icon: Home, priority: 1, description: "Business overview" },
      { path: "/vendor-leads", label: "Leads", icon: Star, priority: 2, description: "New inquiries" },
      { path: "/vendor-bookings", label: "Bookings", icon: Calendar, priority: 3, description: "Confirmed events" },
      { path: "/messages", label: "Messages", icon: MessageSquare, priority: 4, description: "Client messages" },
    ],
  },
  {
    id: "business",
    label: "Business Tools",
    items: [
      { path: "/vendor-calendar", label: "Calendar", icon: Calendar, description: "Availability" },
      { path: "/vendor-packages", label: "Packages", icon: Package, description: "Your services" },
      { path: "/vendor-contracts", label: "Contracts", icon: FileText, description: "Agreements" },
      { path: "/vendor-analytics", label: "Analytics", icon: BarChart3, description: "Performance" },
    ],
  },
  {
    id: "profile",
    label: "Your Profile",
    items: [
      { path: "/vendor-profile", label: "Profile", icon: UserCircle, description: "Edit info" },
      { path: "/vendor-portfolio", label: "Portfolio", icon: Image, description: "Showcase work" },
      { path: "/vendor-team", label: "Team", icon: UsersRound, description: "Staff members" },
    ],
  },
];

export function getAllCoupleNavItems(): NavItem[] {
  return COUPLE_NAV_SECTIONS.flatMap(section => section.items);
}

export function getAllVendorNavItems(): NavItem[] {
  return VENDOR_NAV_SECTIONS.flatMap(section => section.items);
}

export function getBottomNavItems(isVendor: boolean): NavItem[] {
  const sections = isVendor ? VENDOR_NAV_SECTIONS : COUPLE_NAV_SECTIONS;
  const allItems = sections.flatMap(section => section.items);
  return allItems
    .filter(item => item.priority !== undefined)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .slice(0, 4);
}
