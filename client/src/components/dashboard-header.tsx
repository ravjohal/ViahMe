import { Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Wedding } from "@shared/schema";
import { differenceInDays, format } from "date-fns";

interface DashboardHeaderProps {
  wedding: Wedding;
}

export function DashboardHeader({ wedding }: DashboardHeaderProps) {
  const daysUntilWedding = wedding.weddingDate
    ? differenceInDays(new Date(wedding.weddingDate), new Date())
    : null;

  const roleInitials = wedding.role.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 sm:h-20 lg:h-24 items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <img 
            src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
            alt="Viah.me"
            className="h-10 sm:h-14 lg:h-20 w-auto object-contain"
            data-testid="logo-viah"
          />
          <Badge variant="outline" className="text-xs font-mono hidden sm:inline-flex">
            {wedding.tradition.charAt(0).toUpperCase() + wedding.tradition.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {daysUntilWedding !== null && daysUntilWedding >= 0 && (
            <div
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary/10 border border-primary/20"
              data-testid="countdown-timer"
            >
              <Calendar className="w-4 h-4 text-primary hidden sm:block" />
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="font-mono text-lg sm:text-2xl font-bold text-primary">
                  {daysUntilWedding}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {daysUntilWedding === 1 ? "day" : "days"}<span className="hidden sm:inline"> until wedding</span>
                </span>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>

          <Avatar className="h-9 w-9" data-testid="avatar-user">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {roleInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
