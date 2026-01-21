import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Wallet,
  FileText,
  Settings,
  ChevronRight,
  LayoutDashboard,
  MessageSquareWarning,
  Users
} from "lucide-react";

interface AdminAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  category: "vendors" | "content" | "settings";
}

const adminActions: AdminAction[] = [
  {
    title: "Vendor Claims & Approvals",
    description: "Review and approve vendor claim requests, manage vendor invitations, and handle vendor account approvals",
    href: "/admin/vendor-claims",
    icon: ShieldCheck,
    category: "vendors",
  },
  {
    title: "Ceremony Templates",
    description: "Manage ceremony types, rituals, and cultural templates for different wedding traditions",
    href: "/admin/ceremony-templates",
    icon: Calendar,
    category: "content",
  },
  {
    title: "Budget Categories",
    description: "Configure budget bucket categories and manage expense categorization rules",
    href: "/admin/budget-bucket-categories",
    icon: Wallet,
    category: "settings",
  },
  {
    title: "User Feedback",
    description: "Review bug reports, feature requests, and user feedback submissions",
    href: "/admin/feedback",
    icon: MessageSquareWarning,
    category: "settings",
  },
  {
    title: "User Management",
    description: "View all registered users and their associated wedding details",
    href: "/admin/users",
    icon: Users,
    category: "vendors",
  },
];

const categoryLabels = {
  vendors: { label: "Vendor Management", icon: Building2 },
  content: { label: "Content & Templates", icon: FileText },
  settings: { label: "System Settings", icon: Settings },
};

export default function Admin() {
  const groupedActions = adminActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, AdminAction[]>);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Manage vendors, content, and system settings
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedActions).map(([category, actions]) => {
            const categoryInfo = categoryLabels[category as keyof typeof categoryLabels];
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-muted-foreground">
                    {categoryInfo.label}
                  </h2>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {actions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link key={action.href} href={action.href}>
                        <Card 
                          className="h-full hover-elevate cursor-pointer transition-all"
                          data-testid={`card-admin-${action.href.split('/').pop()}`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <ActionIcon className="w-5 h-5 text-primary" />
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-lg mt-3">{action.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-sm">
                              {action.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
