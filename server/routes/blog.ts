import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { BlogScheduler } from "../services/blog-scheduler";

let blogSchedulerInstance: BlogScheduler | null = null;

export function setBlogScheduler(scheduler: BlogScheduler) {
  blogSchedulerInstance = scheduler;
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
    if (!post || post.status !== "published") {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

router.get("/api/admin/blog-posts", async (req: Request, res: Response) => {
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
  if (!(req as any).user?.isSiteAdmin) {
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
