import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import type { BlogPost as DbBlogPost } from "@shared/schema";

export interface BlogPostDisplay {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  isFromDb?: boolean;
}

function formatDbDate(date: string | Date | null): string {
  if (!date) return "Recently";
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function dbPostToDisplay(p: DbBlogPost): BlogPostDisplay {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    author: p.author,
    date: formatDbDate(p.publishedAt || p.createdAt),
    readTime: p.readTime,
    category: p.category,
    isFromDb: true,
  };
}

export default function Blog() {
  const { data: dbPosts = [], isLoading } = useQuery<DbBlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  const allPosts = dbPosts.map(dbPostToDisplay);

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

          {isLoading ? (
            <div className="grid gap-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-8">
              {allPosts.map((post) => (
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
                      <div className="flex items-center justify-between flex-wrap gap-2">
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
          )}

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
