import type { IStorage } from '../storage';
import { generateBlogPost } from '../ai/gemini';

const PREFIX = '[BlogScheduler]';

function ts(): string {
  return new Date().toISOString();
}

function getPSTHour(): number {
  const now = new Date();
  const pstOffset = -8;
  const utcHour = now.getUTCHours();
  let pstHour = utcHour + pstOffset;
  if (pstHour < 0) pstHour += 24;
  return pstHour;
}

function getPSTDay(): number {
  const now = new Date();
  const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return pst.getDay();
}

export class BlogScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timer | null = null;
  private isRunning = false;
  private lastRunDate: string | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async start() {
    const config = await this.loadOrCreateConfig();
    console.log(
      `${PREFIX} ${ts()} Scheduler started. Checking every 60 minutes. ` +
      `Generates on day ${config.dayOfWeek} at ${config.hourPst}:00 PST. ` +
      `Auto-publish: ${config.autoPublish}. Enabled: ${config.enabled}`
    );

    this.intervalId = setInterval(() => this.tick(), 60 * 60 * 1000);
    setTimeout(() => this.tick(), 5000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log(`${PREFIX} ${ts()} Scheduler stopped.`);
  }

  private async loadOrCreateConfig() {
    let config = await this.storage.getBlogSchedulerConfig();
    if (!config) {
      config = await this.storage.upsertBlogSchedulerConfig({
        enabled: true,
        dayOfWeek: 1,
        hourPst: 8,
        autoPublish: false,
        topicQueue: [],
      });
    }
    return config;
  }

  private async tick() {
    try {
      const config = await this.loadOrCreateConfig();
      if (!config.enabled) return;

      const currentDay = getPSTDay();
      const currentHour = getPSTHour();
      const today = new Date().toISOString().split('T')[0];

      if (currentDay !== config.dayOfWeek || currentHour !== config.hourPst) return;
      if (this.lastRunDate === today) return;
      if (this.isRunning) return;

      this.lastRunDate = today;
      this.isRunning = true;

      console.log(`${PREFIX} ${ts()} Triggering weekly blog generation...`);
      await this.generatePost(config.autoPublish, config.topicQueue);
      this.isRunning = false;
    } catch (error) {
      this.isRunning = false;
      console.error(`${PREFIX} ${ts()} Error in tick:`, error);
    }
  }

  async generatePost(autoPublish: boolean = false, topicQueue: string[] = []): Promise<string | null> {
    try {
      const existingPosts = await this.storage.getBlogPosts();
      const existingTitles = existingPosts.map(p => p.title);

      let topic: string | undefined;
      if (topicQueue.length > 0) {
        topic = topicQueue[0];
        const remaining = topicQueue.slice(1);
        await this.storage.upsertBlogSchedulerConfig({ topicQueue: remaining });
        console.log(`${PREFIX} ${ts()} Using queued topic: "${topic}" (${remaining.length} remaining in queue)`);
      }

      console.log(`${PREFIX} ${ts()} Generating blog post${topic ? ` about "${topic}"` : ' (auto-topic)'}...`);
      const generated = await generateBlogPost(topic, existingTitles);

      const existingSlug = await this.storage.getBlogPostBySlug(generated.slug);
      if (existingSlug) {
        generated.slug = `${generated.slug}-${Date.now()}`;
      }

      const status = autoPublish ? 'published' : 'draft';
      const post = await this.storage.createBlogPost({
        slug: generated.slug,
        title: generated.title,
        excerpt: generated.excerpt,
        content: generated.content,
        category: generated.category,
        readTime: generated.readTime,
        author: 'Viah.me Team',
        status,
        generatedByAi: true,
        publishedAt: autoPublish ? new Date() : null,
      });

      console.log(`${PREFIX} ${ts()} Blog post created: "${post.title}" (${post.status}) [${post.id}]`);
      return post.id;
    } catch (error) {
      console.error(`${PREFIX} ${ts()} Failed to generate blog post:`, error);
      return null;
    }
  }
}
