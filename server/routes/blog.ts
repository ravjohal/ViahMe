import { Router, Request, Response } from "express";
import { storage, IStorage } from "../storage";
import { BlogScheduler } from "../services/blog-scheduler";

interface AuthRequest extends Request {
  session: Request["session"] & { userId?: string };
}

async function checkAdminAccess(req: Request): Promise<boolean> {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey && adminKey === process.env.ADMIN_API_KEY) {
    return true;
  }
  const authReq = req as AuthRequest;
  if (authReq.session?.userId) {
    const user = await storage.getUser(authReq.session.userId);
    if (user?.isSiteAdmin) return true;
  }
  return false;
}

let blogSchedulerInstance: BlogScheduler | null = null;

export function setBlogScheduler(scheduler: BlogScheduler) {
  blogSchedulerInstance = scheduler;
}

const SEED_BLOG_POSTS = [
  {
    slug: "budget-5-day-south-asian-wedding-by-ceremony",
    title: "How to Budget a 5-Day South Asian Wedding by Ceremony",
    excerpt: "Learn how to allocate your wedding budget across multiple ceremonies like Mehndi, Sangeet, and the main wedding day without relying on spreadsheets.",
    category: "Budget Planning",
    author: "Viah.me Team",
    readTime: "8 min read",
    status: "published" as const,
    generatedByAi: false,
    publishedAt: new Date("2026-01-15"),
    content: `## The Challenge of Multi-Day Wedding Budgeting

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

Your South Asian wedding deserves a budgeting approach that matches its complexity. By thinking ceremony-first and using tools built for multi-day celebrations, you'll have clarity on your spending and confidence that every event will be beautiful—without the stress of spreadsheet chaos.`,
  },
  {
    slug: "building-multi-event-timeline-mehndi-sangeet-wedding-reception",
    title: "Building a Multi-Event Timeline: From Mehndi to Reception",
    excerpt: "Master the art of scheduling multiple wedding events across several days while keeping families coordinated and vendors on track.",
    category: "Timeline Planning",
    author: "Viah.me Team",
    readTime: "7 min read",
    status: "published" as const,
    generatedByAi: false,
    publishedAt: new Date("2026-01-10"),
    content: `## The Art of Multi-Day Wedding Planning

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

Your multi-day celebration is a marathon, not a sprint. With careful timeline planning, you'll create seamless transitions that let everyone—including you—actually enjoy the festivities.`,
  },
  {
    slug: "finding-culturally-specialized-vendors-what-to-ask",
    title: "Finding Culturally-Specialized Vendors: What to Ask and How to Compare",
    excerpt: "Not all wedding vendors understand South Asian celebrations. Learn how to find and vet vendors who truly get your cultural traditions.",
    category: "Vendor Selection",
    author: "Viah.me Team",
    readTime: "6 min read",
    status: "published" as const,
    generatedByAi: false,
    publishedAt: new Date("2026-01-05"),
    content: `## Why Cultural Expertise Matters

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

Your wedding is a celebration of your culture and your love story. Surround yourself with vendors who understand and honor both.`,
  },
  {
    slug: "guest-list-management-multi-event-south-asian-wedding",
    title: "Guest List Management for Multi-Event South Asian Weddings",
    excerpt: "Managing different guest lists for Mehndi, Sangeet, Wedding, and Reception can be overwhelming. Learn how to organize your guests across multiple events without losing your mind.",
    category: "Guest Management",
    author: "Viah.me Team",
    readTime: "7 min read",
    status: "published" as const,
    generatedByAi: false,
    publishedAt: new Date("2026-01-20"),
    content: `## The Multi-Event Guest List Challenge

When your cousin asks "Am I invited to everything?"—you realize the complexity of South Asian wedding guest management. Unlike single-day Western weddings where everyone gets the same invitation, your celebration might span 5 events across 4 days, each with different guest expectations, venue capacities, and cultural protocols.

## Understanding Event-Specific Guest Lists

### The Intimate Events
**Haldi/Maiyan/Ubtan**: Typically family-only affairs. These ceremonies involve applying turmeric paste to the bride and groom, and the intimate setting means guest lists of 20-50 people—usually immediate family and the closest friends who are practically family.

**Mehndi**: A step larger, often 50-150 guests. Close friends join the family for this celebration. The bride's side often hosts their own, meaning you're managing two parallel guest lists.

### The Big Celebrations
**Sangeet**: This is where guest lists start expanding—150-400 guests typically. Friends, extended family, and sometimes colleagues are invited to dance the night away.

**Main Ceremony**: The religious ceremony might have different capacity constraints. A Gurdwara may hold 500 guests comfortably, while an intimate mandap setup might be designed for 200.

**Reception**: Often your largest event with 300-800+ guests. This is where you invite everyone—colleagues, neighbors, parents' friends, and extended community.

## The Three-Tier Guest Strategy

### Tier 1: Inner Circle (Every Event)
- Immediate family
- Wedding party members
- Best friends who've been with you since childhood

### Tier 2: Close Network (Major Events)
- Extended family (aunts, uncles, cousins)
- Close friends
- Invited to: Sangeet, Main Ceremony, Reception

### Tier 3: Extended Network (Select Events)
- Parents' friends and colleagues
- Your professional network
- Distant relatives
- Invited to: Reception only, or Reception + Main Ceremony

## The Bottom Line

Guest list management for multi-event weddings requires thinking in events, not just names. By categorizing guests into tiers, setting clear capacity limits, and tracking RSVPs per celebration, you'll avoid the chaos that comes from treating a 5-day wedding like a single-day event.`,
  },
];

export async function seedBlogPosts() {
  try {
    for (const post of SEED_BLOG_POSTS) {
      const existing = await storage.getBlogPostBySlug(post.slug);
      if (!existing) {
        await storage.createBlogPost(post);
        console.log(`[blog-seed] Seeded blog post: ${post.slug}`);
      }
    }
  } catch (error) {
    console.error("[blog-seed] Error seeding blog posts:", error);
  }
}

const router = Router();

router.get("/api/blog-posts", async (_req: Request, res: Response) => {
  try {
    const posts = await storage.getBlogPosts("published");
    res.json(posts);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

router.get("/api/blog-posts/:slug", async (req: Request, res: Response) => {
  try {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.status !== "published") {
      const isAdmin = await checkAdminAccess(req);
      if (!isAdmin) {
        return res.status(404).json({ error: "Post not found" });
      }
    }
    res.json(post);
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

router.get("/api/admin/blog-posts/preview/:slug", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error("Failed to fetch blog post for preview:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

router.get("/api/admin/blog-posts", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const status = req.query.status as string | undefined;
    const posts = await storage.getBlogPosts(status);
    res.json(posts);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

router.post("/api/admin/blog-posts", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const post = await storage.createBlogPost(req.body);
    res.status(201).json(post);
  } catch (error) {
    console.error("Failed to create blog post:", error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

router.put("/api/admin/blog-posts/:id", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const post = await storage.updateBlogPost(req.params.id, req.body);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Failed to update blog post:", error);
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

router.post("/api/admin/blog-posts/:id/publish", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const post = await storage.updateBlogPost(req.params.id, {
      status: "published",
      publishedAt: new Date(),
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Failed to publish blog post:", error);
    res.status(500).json({ error: "Failed to publish blog post" });
  }
});

router.post("/api/admin/blog-posts/:id/unpublish", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const post = await storage.updateBlogPost(req.params.id, {
      status: "draft",
      publishedAt: null,
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Failed to unpublish blog post:", error);
    res.status(500).json({ error: "Failed to unpublish blog post" });
  }
});

router.delete("/api/admin/blog-posts/:id", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const deleted = await storage.deleteBlogPost(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Post not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

router.post("/api/admin/blog-posts/generate", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const { topic } = req.body;
    if (!blogSchedulerInstance) {
      return res.status(500).json({ error: "Blog scheduler not initialized" });
    }
    const config = await storage.getBlogSchedulerConfig();
    const postId = await blogSchedulerInstance.generatePost(false, topic ? [topic] : []);
    if (!postId) {
      return res.status(500).json({ error: "Failed to generate blog post" });
    }
    const post = await storage.getBlogPostById(postId);
    res.status(201).json(post);
  } catch (error) {
    console.error("Failed to generate blog post:", error);
    res.status(500).json({ error: "Failed to generate blog post" });
  }
});

router.get("/api/admin/blog-scheduler-config", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    let config = await storage.getBlogSchedulerConfig();
    if (!config) {
      config = await storage.upsertBlogSchedulerConfig({
        enabled: true,
        dayOfWeek: 1,
        hourPst: 8,
        autoPublish: false,
        topicQueue: [],
      });
    }
    res.json(config);
  } catch (error) {
    console.error("Failed to get scheduler config:", error);
    res.status(500).json({ error: "Failed to get scheduler config" });
  }
});

router.put("/api/admin/blog-scheduler-config", async (req: Request, res: Response) => {
  if (!(await checkAdminAccess(req))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const config = await storage.upsertBlogSchedulerConfig(req.body);
    res.json(config);
  } catch (error) {
    console.error("Failed to update scheduler config:", error);
    res.status(500).json({ error: "Failed to update scheduler config" });
  }
});

export default router;
