import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { blogPosts } from "./blog";
import ReactMarkdown from "react-markdown";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Viah.me Blog`;
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-background dark:via-background dark:to-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link href="/blog">
            <Button data-testid="button-back-to-blog">Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-background dark:via-background dark:to-background">
      <header className="border-b bg-white/80 dark:bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img 
              src={new URL("@assets/viah-logo_1763669612969.png", import.meta.url).href}
              alt="Viah.me"
              className="h-12 w-auto cursor-pointer"
              data-testid="logo-blog-post-header"
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog">
              <Button variant="ghost" data-testid="link-blog">Blog</Button>
            </Link>
            <Link href="/onboarding">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog">
            <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
              <ChevronLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>

          <article>
            <header className="mb-8">
              <Badge variant="secondary" className="mb-4">{post.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
                <span>By {post.author}</span>
              </div>
            </header>

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </article>

          <div className="mt-12 p-6 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-950/30 dark:to-pink-950/30 rounded-xl text-center">
            <h3 className="text-xl font-display font-bold mb-2">Ready to plan your wedding?</h3>
            <p className="text-muted-foreground mb-4">
              Viah.me helps you budget, plan, and coordinate your multi-day South Asian celebration.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="gap-2" data-testid="button-start-planning-cta">
                Start Planning Today
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-display font-bold mb-4">More Articles</h3>
            <div className="grid gap-4">
              {blogPosts
                .filter((p) => p.slug !== post.slug)
                .map((relatedPost) => (
                  <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                    <div className="p-4 border rounded-lg hover-elevate cursor-pointer bg-white dark:bg-card" data-testid={`link-related-${relatedPost.slug}`}>
                      <Badge variant="secondary" className="mb-2">{relatedPost.category}</Badge>
                      <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
                        {relatedPost.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{relatedPost.excerpt}</p>
                    </div>
                  </Link>
                ))}
            </div>
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
