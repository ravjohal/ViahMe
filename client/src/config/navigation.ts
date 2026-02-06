import { 
  Home, Users, CheckSquare, Clock, DollarSign, FileText, 
  MessageSquare, Music, Image, UserCircle, ShoppingBag, 
  Package, BookOpen, Radio, UsersRound, Globe, Bot, 
  Calendar, Wallet, BarChart3, Briefcase, Star, Send, Gamepad2,
  Mic, Shield, Sparkles, Flower2, AlarmClock, Palmtree, Gift, Vote,
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
      { path: "/dashboard", label: "Home", icon: Home, priority: 1, description: "Your wedding overview" },
      { path: "/budget", label: "Budget", icon: DollarSign, permission: "budget", priority: 2, description: "Track spending" },
      { path: "/timeline", label: "Timeline", icon: Clock, permission: "timeline", priority: 3, description: "Your schedule" },
      { path: "/vendors", label: "Vendors", icon: UserCircle, permission: "vendors", priority: 4, description: "Find services" },
      { path: "/guests", label: "Guests", icon: Users, permission: "guests", priority: 5, description: "Manage guest list" },
      { path: "/tasks", label: "Tasks", icon: CheckSquare, permission: "tasks", priority: 6, description: "Things to do" },
      { path: "/website-builder", label: "Wedding Website", icon: Globe, permission: "website", priority: 7, description: "Your wedding site" },
      { path: "/expenses", label: "Expenses", icon: Wallet, permission: "budget", description: "Split costs" },
      { path: "/messages", label: "Messages", icon: MessageSquare, description: "Chat with vendors" },
    ],
  },
  {
    id: "planning",
    label: "Plan Your Wedding",
    items: [
      { path: "/ai-planner", label: "AI Planner", icon: Bot, permission: "ai_planner", description: "Smart planning assistant" },
      { path: "/speech-generator", label: "Speech Writer", icon: Mic, permission: "ai_planner", description: "AI-powered speeches" },
      { path: "/contracts", label: "Contracts", icon: FileText, permission: "contracts", description: "Vendor agreements" },
      { path: "/collaborators", label: "Team", icon: UsersRound, permission: "collaborators", description: "Family helpers" },
    ],
  },
  {
    id: "content",
    label: "Media & Documents",
    items: [
      { path: "/playlists", label: "Playlists", icon: Music, permission: "playlists", description: "Music picks" },
      { path: "/documents", label: "Documents", icon: FileText, permission: "documents", description: "Important files" },
    ],
  },
  {
    id: "communication",
    label: "Invitations",
    items: [
      { path: "/communication-hub", label: "Send Invites", icon: Send, permission: "guests", description: "Send invitations & track RSVPs" },
      { path: "/polls", label: "Guest Polls", icon: Vote, permission: "guests", description: "Collect guest preferences" },
    ],
  },
  {
    id: "extras",
    label: "More Tools",
    items: [
      { path: "/day-of-timeline", label: "Day-of Schedule", icon: AlarmClock, permission: "timeline", description: "Minute-by-minute wedding day plan" },
      { path: "/honeymoon", label: "Honeymoon Planner", icon: Palmtree, permission: "planning", description: "Plan your dream honeymoon" },
      { path: "/favours", label: "Favour Log", icon: Gift, permission: "planning", description: "Track gifts for guests" },
      { path: "/ritual-roles", label: "Ritual Roles", icon: Sparkles, permission: "guests", description: "Assign ceremony duties" },
      { path: "/milni", label: "Milni List", icon: Users, permission: "guests", description: "Milni pairings & gifts" },
      { path: "/engagement-games", label: "Guest Games", icon: Gamepad2, permission: "guests", description: "Scavenger hunts & trivia" },
      { path: "/decor", label: "Decor Tracker", icon: Flower2, permission: "shopping", description: "Track decor sourcing" },
      { path: "/shopping", label: "Shopping List", icon: Package, permission: "shopping", description: "Shopping list" },
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

export const ADMIN_NAV_SECTION: NavSection = {
  id: "admin",
  label: "Site Administration",
  items: [
    { path: "/admin/ceremony-templates", label: "Ceremony Templates", icon: BookOpen, description: "Manage ceremony cost templates" },
    { path: "/admin/vendor-claims", label: "Vendor Claims", icon: Shield, description: "Review vendor claim requests" },
  ],
};

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
