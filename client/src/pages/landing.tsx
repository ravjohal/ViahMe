import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Heart, 
  CheckCircle, 
  Sparkles,
  Globe,
  MessageSquare,
  Clock,
  Star,
  ArrowRight,
  Shield,
  Palette,
  Home,
  Link2,
  ShieldCheck,
  Send,
  UserCheck,
  CreditCard
} from "lucide-react";
import logoUrl from "@assets/viah-logo_1763669612969.png";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

const FEATURES = [
  {
    icon: Palette,
    title: "7 Wedding Traditions",
    description: "Pre-configured templates for Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion, and General ceremonies with culturally-authentic event timelines.",
  },
  {
    icon: Users,
    title: "Culturally-Specialized Vendors",
    description: "Connect with vendors who understand your traditions—from Dhol players to Mehndi artists, Pandits to Qazis, and Garba instructors.",
  },
  {
    icon: Calendar,
    title: "Multi-Event Management",
    description: "Seamlessly manage 3-5 day celebrations with distinct vendor requirements and guest lists for each ceremony.",
  },
  {
    icon: DollarSign,
    title: "Budget by Ceremony",
    description: "Track expenses for each ceremony separately—Sangeet, Mehndi, Anand Karaj, Reception—with intelligent cost breakdowns. No spreadsheets needed.",
  },
  {
    icon: MessageSquare,
    title: "Direct Vendor Communication",
    description: "Message vendors, share documents, review contracts, and manage bookings—all in one place.",
  },
  {
    icon: Clock,
    title: "Real-Time Availability",
    description: "Check vendor availability instantly and book with confidence, preventing double-bookings across all your events.",
  },
];

const BENEFITS = [
  {
    title: "Built for South Asian Weddings",
    description: "Unlike generic wedding apps, Viah.me understands the complexity of multi-day celebrations with unique cultural requirements.",
    icon: Heart,
  },
  {
    title: "Vendor Marketplace",
    description: "Access 36 specialized vendor categories including culturally-specific services rarely found on traditional platforms.",
    icon: Star,
  },
  {
    title: "Ditch the Spreadsheets",
    description: "Guest lists, budgets, expenses, vendor contracts, and RSVPs—all managed in one beautiful platform. No more juggling Google Sheets.",
    icon: CheckCircle,
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (!isAuthLoading && user) {
      if (user.role === "vendor") {
        setLocation("/vendor-dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, isAuthLoading, setLocation]);

  // Show minimal loading state while checking auth to prevent flash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={logoUrl} 
            alt="Viah.me" 
            className="h-16 object-contain animate-pulse" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <img 
            src={logoUrl} 
            alt="Viah.me" 
            className="h-12 sm:h-16 object-contain cursor-pointer hover-elevate shrink-0" 
            onClick={() => setLocation("/")}
            data-testid="img-logo"
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden md:flex"
              onClick={() => setLocation("/vendors")}
              data-testid="button-browse-vendors"
            >
              Browse Vendors
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/login")}
              data-testid="button-signin"
            >
              Sign In
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-xs sm:text-sm"
              onClick={() => setLocation("/onboarding")}
              data-testid="button-get-started-header"
            >
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Start Free</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/20 dark:via-pink-950/20 dark:to-purple-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <Badge variant="outline" className="text-xs sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 border-orange-200 dark:border-orange-800">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-orange-600" />
              <span className="break-words">Your Multi-Day Wedding Command Center</span>
            </Badge>
            
            <h1 
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
              data-testid="text-hero-heading"
            >
              Finally, a Wedding App That Understands 5-Day Celebrations
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              From Roka to Reception, manage every ceremony, vendor, and 400+ guests in one place.
              Built for couples navigating the beautiful chaos of South Asian weddings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 sm:pt-6 px-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 w-full sm:w-auto"
                onClick={() => setLocation("/onboarding")}
                data-testid="button-get-started-hero"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 border-2 w-full sm:w-auto"
                onClick={() => setLocation("/vendors")}
                data-testid="button-browse-vendors-hero"
              >
                Browse Vendors
              </Button>
            </div>

            <div className="pt-4">
              <Button 
                variant="ghost"
                onClick={() => setLocation("/vendor-register")}
                data-testid="button-vendor-signup"
                className="text-muted-foreground"
              >
                Are you a vendor? Join our marketplace →
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                <span className="whitespace-nowrap">Free to start</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                <span className="whitespace-nowrap">No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                <span className="whitespace-nowrap">7 wedding traditions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Viah.me Section */}
      <section className="py-12 sm:py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Why Choose Viah.me?
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-2">
              Generic wedding apps don't understand the unique complexity of South Asian celebrations. We do.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card 
                  key={index} 
                  className="p-5 sm:p-6 hover-elevate transition-all"
                  data-testid={`card-benefit-${index}`}
                >
                  <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-950/50 dark:to-pink-950/50 w-fit mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Household-First Guest Management */}
      <section className="py-12 sm:py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1 border-orange-200 dark:border-orange-800">
              <Home className="w-3 h-3 mr-1 text-orange-600" />
              Household-First Architecture
            </Badge>
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Invitations Go to Families, Not Individuals
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-2">
              Unlike generic wedding apps, we understand that in South Asian culture, you invite the Sharma Family—not four separate people.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            <Card className="p-6 sm:p-8">
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="text-red-500">✕</span> Generic Wedding Apps
              </div>
              <div className="space-y-3">
                {["Rahul Sharma", "Priya Sharma", "Vikram Sharma", "Anita Sharma"].map((name, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <span className="text-sm">{name}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                4 separate rows. 4 separate RSVPs. Confusion.
              </p>
            </Card>

            <Card className="p-6 sm:p-8 border-2 border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Viah.me
              </div>
              <div className="p-4 rounded-lg border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">S</div>
                  <div>
                    <div className="font-semibold">The Sharma Family</div>
                    <div className="text-sm text-muted-foreground">4 members • Head: Rahul Sharma</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">Sangeet</Badge>
                  <Badge variant="secondary" className="text-xs">Ceremony</Badge>
                  <Badge variant="secondary" className="text-xs">Reception</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                1 household. 1 invitation. Clear headcount.
              </p>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <Card className="inline-flex items-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-2">
              <CreditCard className="w-8 h-8 text-orange-600 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-lg">The Invitation Math</div>
                <div className="text-sm text-muted-foreground">
                  Know exactly how many cards to order (<span className="font-bold text-orange-600">120</span>) even when your guest count is <span className="font-bold">400</span>.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Magic Link & Review Room */}
      <section className="py-12 sm:py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto">
            <div>
              <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1 border-orange-200 dark:border-orange-800">
                <Link2 className="w-3 h-3 mr-1 text-orange-600" />
                The "Aunty-Proof" Solution
              </Badge>
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                End the Address Chase Forever
              </h2>
              <p className="text-muted-foreground mb-6">
                Share a simple link with your parents. They can add their friends and family directly—no login, no app download, no tech support calls.
              </p>
              <Card className="p-4 bg-muted/50">
                <div className="text-xs text-muted-foreground mb-2">Magic Collection Link</div>
                <div className="flex items-center gap-2 p-2 rounded bg-background border text-sm font-mono">
                  <Link2 className="w-4 h-4 text-orange-600 shrink-0" />
                  viah.me/collect/sharma-patel-wedding
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Parents add guests → You approve → Done.
                </p>
              </Card>
            </div>

            <div>
              <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1 border-orange-200 dark:border-orange-800">
                <ShieldCheck className="w-3 h-3 mr-1 text-orange-600" />
                The Review Room
              </Badge>
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Let Parents Contribute, Stay in Control
              </h2>
              <p className="text-muted-foreground mb-6">
                Every guest your parents add goes to a "Pending Approval" tab. Review before they hit your main list—no surprise +100 guests.
              </p>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Pending Approval</span>
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">12 new</Badge>
                </div>
                <div className="space-y-2">
                  {["Kapoor Family (4)", "Mehra Family (3)", "Singh Family (5)"].map((fam, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-background border">
                      <span className="text-sm">{fam}</span>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          data-testid={`button-approve-family-${i}`}
                        >
                          <UserCheck className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Guest-Friendly Access */}
      <section className="py-12 sm:py-20 lg:py-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1 border-blue-300 dark:border-blue-800 bg-white/50 dark:bg-blue-950/50">
              <Link2 className="w-3 h-3 mr-1 text-blue-600" />
              No Login Required
            </Badge>
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Guests Access Everything with One Link
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-2">
              No apps to download, no accounts to create. Share a simple link and guests see everything they need.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Link2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Magic Links</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Each guest gets a personalized link. One tap opens their complete wedding itinerary - no passwords needed.
                </p>
                <div className="bg-muted/50 rounded-lg p-3 text-sm font-mono text-muted-foreground">
                  viah.me/guest/sharma-family
                </div>
              </Card>

              <Card className="p-6 border-2 border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Downloadable Itineraries</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Guests can download complete event schedules, venue details, and directions - works offline too.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">PDF</Badge>
                  <Badge variant="secondary" className="text-xs">Calendar</Badge>
                  <Badge variant="secondary" className="text-xs">Maps</Badge>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Perfect for aunties and uncles who just need the <span className="font-semibold text-blue-600">where, when, and what to wear</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Everything You Need, All in One Place
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-2">
              From the first planning steps to your last ceremony, manage every detail effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-6 sm:p-8 hover-elevate transition-all"
                  data-testid={`card-feature-${index}`}
                >
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Getting Started is Easy
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground px-2">
              Three simple steps to transform your wedding planning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Choose Your Tradition",
                description: "Select from Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion, or General traditions. We'll auto-populate your ceremony timeline.",
              },
              {
                step: "2",
                title: "Connect with Vendors",
                description: "Browse culturally-specialized vendors in your city. Check availability, compare prices, and book with confidence.",
              },
              {
                step: "3",
                title: "Manage Everything",
                description: "Track budgets, manage guest lists, coordinate timelines, share playlists, and create your wedding website—all from your dashboard.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center space-y-3 sm:space-y-4 px-2" data-testid={`step-${index}`}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-600 to-pink-600 text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/20 dark:via-pink-950/20 dark:to-purple-950/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-center">
              <div className="px-2">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  7
                </div>
                <div className="text-base sm:text-lg font-semibold mb-1">Wedding Traditions</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Culturally authentic templates</div>
              </div>
              <div className="px-2">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  36
                </div>
                <div className="text-base sm:text-lg font-semibold mb-1">Vendor Categories</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Including culturally-specific services</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="max-w-4xl mx-auto p-6 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30 border-2">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 mx-auto mb-4 sm:mb-6" />
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent px-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Ready to Plan Your Dream Wedding?
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Join couples who are planning unforgettable South Asian weddings with Viah.me. 
              Start for free today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-base sm:text-lg px-8 sm:px-10 h-12 sm:h-14 w-full sm:w-auto"
                onClick={() => setLocation("/onboarding")}
                data-testid="button-get-started-final"
              >
                Start Planning Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-base sm:text-lg px-8 sm:px-10 h-12 sm:h-14 border-2 w-full sm:w-auto"
                onClick={() => setLocation("/vendor-register")}
                data-testid="button-vendor-signup-final"
              >
                Join as a Vendor
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <img 
                  src={logoUrl} 
                  alt="Viah.me" 
                  className="h-10 sm:h-12 object-contain" 
                />
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  © 2026 Viah.me is a brand operated by SSJ 8-11 LLC. All rights reserved.
                </p>
              </div>
              <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setLocation("/blog")}
                  data-testid="link-footer-blog"
                >
                  Blog
                </button>
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setLocation("/login")}
                  data-testid="link-footer-signin"
                >
                  Sign In
                </button>
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setLocation("/vendor-login")}
                  data-testid="link-footer-vendor-login"
                >
                  Vendor Login
                </button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setLocation("/terms-of-service")}
                  data-testid="link-footer-terms"
                >
                  Terms of Service
                </button>
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setLocation("/privacy-policy")}
                  data-testid="link-footer-privacy"
                >
                  Privacy Policy
                </button>
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setLocation("/acceptable-use")}
                  data-testid="link-footer-acceptable-use"
                >
                  Acceptable Use
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
