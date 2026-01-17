import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "budget-5-day-south-asian-wedding-by-ceremony",
    title: "How to Budget a 5-Day South Asian Wedding by Ceremony",
    excerpt: "Learn how to allocate your wedding budget across multiple ceremonies like Mehndi, Sangeet, and the main wedding day without relying on spreadsheets.",
    category: "Budget Planning",
    author: "Viah.me Team",
    date: "January 15, 2026",
    readTime: "8 min read",
    content: `
## The Challenge of Multi-Day Wedding Budgeting

Planning a South Asian wedding is unlike any other wedding experience. With celebrations spanning 3-5 days and including multiple distinct ceremonies, traditional budgeting approaches simply don't work. Generic wedding planning tools treat everything as one big day, leaving couples struggling to track costs across Mehndi, Sangeet, Haldi, the main ceremony, and Reception separately.

## Why Ceremony-Based Budgeting Matters

Each ceremony has its own unique requirements:

**Mehndi Night**: Requires a mehndi artist, smaller venue, casual catering, and entertainment like a DJ or dhol players.

**Sangeet**: Often the most elaborate pre-wedding event, requiring a larger venue, choreographer fees, stage setup, and full catering.

**Haldi/Maiyan**: More intimate, typically held at home or a smaller venue, with specific ritual items needed.

**Main Ceremony (Anand Karaj/Hindu Wedding)**: The religious ceremony requiring a venue (Gurdwara or Mandap), pandit/granthi fees, ritual items, and traditional catering.

**Reception**: Often the most expensive event with the largest guest list, requiring premium catering, entertainment, and decor.

## The Ceremony-First Approach

Instead of lumping everything into categories like "Catering" or "Venue," smart couples budget by ceremony first, then by category within each ceremony:

1. **Set your total budget** - Know your overall number
2. **Allocate percentages to each ceremony** - Reception might be 40%, Sangeet 20%, etc.
3. **Break down categories within each ceremony** - Now your Sangeet venue budget is separate from your Reception venue budget
4. **Track spending by ceremony** - See exactly where you stand for each event

## Avoiding the Spreadsheet Trap

Many couples start with spreadsheets but quickly find them unwieldy. With dozens of vendors, multiple ceremonies, and costs that span across events (like a photographer covering everything), spreadsheets become a nightmare to maintain.

Modern wedding planning tools designed for South Asian weddings can automatically:
- Calculate ceremony-specific budgets based on your total
- Suggest allocations based on your tradition and metro area
- Track actual spending against planned budgets in real-time
- Handle vendors that span multiple ceremonies

## Smart Budget Recommendations

Based on data from hundreds of South Asian weddings, here are typical budget allocations:

- **Reception**: 35-45% of total budget
- **Main Ceremony**: 20-25%
- **Sangeet**: 15-20%
- **Mehndi**: 8-12%
- **Other Pre-Wedding Events**: 5-10%

These percentages vary by tradition—Gujarati weddings often have more elaborate Garbas, while Sikh weddings may allocate more to the Anand Karaj ceremony.

## The Bottom Line

Your South Asian wedding deserves a budgeting approach that matches its complexity. By thinking ceremony-first and using tools built for multi-day celebrations, you'll have clarity on your spending and confidence that every event will be beautiful—without the stress of spreadsheet chaos.
    `
  },
  {
    slug: "building-multi-event-timeline-mehndi-sangeet-wedding-reception",
    title: "Building a Multi-Event Timeline: From Mehndi to Reception",
    excerpt: "Master the art of scheduling multiple wedding events across several days while keeping families coordinated and vendors on track.",
    category: "Timeline Planning",
    author: "Viah.me Team",
    date: "January 10, 2026",
    readTime: "7 min read",
    content: `
## The Art of Multi-Day Wedding Planning

A typical American wedding has one timeline for one day. A South Asian wedding? You're coordinating 5+ events across multiple days, often with different venues, different guest lists, and overlapping vendor schedules. It's less wedding planning and more event production management.

## Understanding the Typical Timeline

While every wedding is unique, most South Asian celebrations follow a similar pattern:

**Week Before**
- Roka or formal blessing (if not done months earlier)
- Ganesh Puja or Akhand Paath begins

**3-4 Days Before**
- Haldi/Maiyan/Ubtan ceremonies (often separate for bride and groom sides)
- Mehndi celebration

**2-3 Days Before**
- Sangeet night
- Cocktail parties or Garba nights

**1 Day Before**
- Choora ceremony (Sikh weddings)
- Jaggo procession
- Final vendor walk-throughs

**Wedding Day**
- Main ceremony (morning for most traditions)
- Doli/Vidaai
- Reception (evening)

## Key Timeline Challenges

### Different Guest Lists Per Event
Not everyone attends everything. Close family might be at every event, while work colleagues only come to the Reception. Your timeline needs to account for who's where and when.

### Venue Transitions
Moving from a home ceremony to a banquet hall to a Gurdwara requires careful timing. Build in buffer time—traffic, outfit changes, and emotional moments always take longer than expected.

### Vendor Overlap
Your photographer might cover Mehndi, Sangeet, and the Wedding, but your DJ only does the Reception. Track who's where and when to avoid scheduling conflicts.

### Family Coordination
Bride's side and Groom's side often have parallel events. The Maiyan happens at both homes simultaneously. Coordinate timing so families can attend each other's events when expected.

## Building Your Master Timeline

### Step 1: Lock in the Big Events
Start with your main ceremony and reception times—these are often determined by venue availability or religious auspicious timings (muhurat).

### Step 2: Work Backwards
From your wedding day, plan backwards. If your Anand Karaj is at 9 AM, your Mehndi should ideally be 2-3 days before, giving the bride's henna time to darken.

### Step 3: Assign Realistic Durations
- Mehndi: 3-4 hours (bride's mehndi alone takes 2+ hours)
- Sangeet: 4-5 hours
- Main ceremony: 2-3 hours
- Reception: 4-6 hours

### Step 4: Add Buffer Time
Add 30-60 minutes between events for transitions. Add more for outfit changes—a bride changing from Sangeet attire to her wedding lehenga needs time!

### Step 5: Create Event-Specific Timelines
Each event needs its own detailed timeline. Your Sangeet might include:
- 6:00 PM - Guests arrive, cocktails
- 7:00 PM - Family performances begin
- 8:30 PM - Dinner service
- 9:30 PM - Professional entertainment
- 11:00 PM - Open dancing

## Communicating Your Timeline

Share timeline information appropriately:
- **Full timeline**: Day-of coordinator, immediate family, wedding party
- **Event-specific times**: Guests (they only need arrival times)
- **Vendor schedules**: Each vendor gets their call times and event durations

## Pro Tips

1. **Create a "Day of" contact list** - One person from each side who can answer questions
2. **Build in meal times** - Hangry families are stressed families
3. **Plan for prayer times** - Many guests will need breaks for prayers
4. **Consider elderly guests** - Don't schedule back-to-back events that exhaust older family members
5. **Have a weather backup** - For outdoor events, know your Plan B

Your multi-day celebration is a marathon, not a sprint. With careful timeline planning, you'll create seamless transitions that let everyone—including you—actually enjoy the festivities.
    `
  },
  {
    slug: "finding-culturally-specialized-vendors-what-to-ask",
    title: "Finding Culturally-Specialized Vendors: What to Ask and How to Compare",
    excerpt: "Not all wedding vendors understand South Asian celebrations. Learn how to find and vet vendors who truly get your cultural traditions.",
    category: "Vendor Selection",
    author: "Viah.me Team",
    date: "January 5, 2026",
    readTime: "6 min read",
    content: `
## Why Cultural Expertise Matters

You've found a highly-rated photographer. Their portfolio is stunning. But have they ever shot a Baraat? Do they know to capture the Milni? Will they understand the significance of the Pheras or know when to photograph the Laavan?

Cultural expertise isn't just nice-to-have—it's essential for vendors who will document and support your most meaningful moments.

## Vendor Categories That Need Cultural Knowledge

### Photography & Videography
This is where cultural expertise matters most. A photographer unfamiliar with your traditions might:
- Miss key ritual moments
- Not know where to position for important shots
- Interrupt ceremonies by moving at wrong times
- Fail to capture the emotion of culturally significant moments

**Questions to ask:**
- How many [Sikh/Hindu/Muslim] weddings have you photographed?
- Can you walk me through how you would cover an Anand Karaj/Hindu ceremony?
- Do you know the key moments I should have photographed?

### Catering
South Asian wedding catering isn't just about the food—it's about understanding service style, dietary restrictions, and cultural expectations.

**Questions to ask:**
- Do you offer separate vegetarian and non-vegetarian kitchens?
- Can you accommodate Jain dietary requirements?
- Are you familiar with serving style for formal Indian dinners?
- Do you provide chai/coffee service during ceremonies?

### Decorators & Florists
Mandap design, Gurdwara decor, and traditional floral arrangements require specific knowledge.

**Questions to ask:**
- Have you designed Mandaps before? Can I see examples?
- Are you familiar with flower restrictions at Gurdwaras?
- Do you understand the significance of specific colors in my tradition?

### DJs & Entertainment
Your DJ should know how to read a South Asian crowd and have the right music library.

**Questions to ask:**
- What percentage of your events are South Asian weddings?
- Do you have Bollywood, Bhangra, and current desi hits in your library?
- Are you comfortable with mixed playlists (desi + Western)?
- Have you worked with dhol players or live bands?

### Hair & Makeup
Bridal makeup for South Asian skin tones and wedding styles requires specific expertise.

**Questions to ask:**
- Do you specialize in South Asian bridal makeup?
- Are you familiar with jewelry styling for heavy sets?
- Can you work with dupatta/chunni styling?
- Do you offer trial sessions?

## Red Flags to Watch For

- **No South Asian weddings in portfolio** - Experience matters
- **Unfamiliarity with basic terminology** - If they don't know what a Sangeet is, move on
- **One-size-fits-all pricing** - Multi-day coverage should be quoted differently
- **Resistance to learning** - Good vendors will ask questions about your specific traditions
- **No references from South Asian couples** - Ask for them specifically

## Green Flags to Look For

- **Portfolio features your tradition** - Sikh photographers should show Anand Karaj shots
- **They ask smart questions** - About your specific customs, family expectations, timing
- **Flexible packages** - Understanding that you may need 3-5 days of coverage
- **Cultural sensitivity** - Awareness of modesty requirements, prayer times, dietary needs
- **Community reputation** - Recommended in desi wedding groups and communities

## Building Your Vendor Team

### Start Early
Top culturally-specialized vendors book 12-18 months in advance, especially in peak wedding season.

### Use Community Resources
- South Asian wedding Facebook groups
- Desi wedding planning forums
- Recommendations from recently married friends
- Cultural community center referrals

### Compare Apples to Apples
When comparing quotes, ensure you're comparing:
- Same number of events covered
- Similar hours of coverage
- Comparable deliverables
- Equivalent experience levels

### Trust Your Instincts
During consultations, you should feel:
- Understood, not educated
- Excited, not anxious
- Confident in their expertise

## The Value of Specialization

Culturally-specialized vendors may cost more than generalists, but they bring:
- Efficiency from experience (they know what's coming)
- Better results (they know what to capture/create)
- Less stress for you (you don't have to explain everything)
- Authentic representation of your traditions

Your wedding is a celebration of your culture and your love story. Surround yourself with vendors who understand and honor both.
    `
  }
];

export default function Blog() {
  useEffect(() => {
    document.title = "Wedding Planning Blog | Viah.me - South Asian Wedding Planning";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-background dark:via-background dark:to-background">
      <header className="border-b bg-white/80 dark:bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img 
              src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
              alt="Viah.me"
              className="h-12 w-auto cursor-pointer"
              data-testid="logo-blog-header"
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" data-testid="link-home">Home</Button>
            </Link>
            <Link href="/onboarding">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Wedding Planning Insights
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert advice for planning your South Asian wedding celebration. From budgeting multi-day events to finding the right vendors.
            </p>
          </div>

          <div className="grid gap-8">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-blog-${post.slug}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                    </div>
                    <CardTitle className="text-2xl font-display hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-primary font-medium text-sm">
                        Read more <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/onboarding">
              <Button size="lg" className="gap-2" data-testid="button-start-planning">
                Start Planning Your Wedding
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white/50 dark:bg-background/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Viah.me. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
