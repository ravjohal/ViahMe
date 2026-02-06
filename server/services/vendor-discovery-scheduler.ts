import type { IStorage } from '../storage';
import { VendorDiscoveryService, getPSTHour, getPSTDate, type DiscoveryLog, type DiscoveryResult } from './vendor-discovery-service';

const PREFIX = '[VendorDiscovery]';

function ts(): string {
  return new Date().toISOString();
}

export interface SchedulerConfig {
  runHour: number;
  dailyCap: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  runHour: 2,
  dailyCap: 50,
};

export class VendorDiscoveryScheduler {
  private storage: IStorage;
  private service: VendorDiscoveryService;
  private intervalId: NodeJS.Timer | null = null;
  private isRunning = false;
  private cachedConfig: SchedulerConfig | null = null;
  private activeRuns: Map<string, { controller: AbortController; jobId: string }> = new Map();

  constructor(storage: IStorage) {
    this.storage = storage;
    this.service = new VendorDiscoveryService(storage);
  }

  async loadConfig(): Promise<SchedulerConfig> {
    try {
      const row = await this.storage.getSchedulerConfig();
      if (row) {
        this.cachedConfig = { runHour: row.runHour, dailyCap: row.dailyCap };
      } else {
        await this.storage.upsertSchedulerConfig({ runHour: DEFAULT_CONFIG.runHour, dailyCap: DEFAULT_CONFIG.dailyCap });
        this.cachedConfig = { ...DEFAULT_CONFIG };
      }
    } catch {
      this.cachedConfig = { ...DEFAULT_CONFIG };
    }
    return this.cachedConfig!;
  }

  getConfig(): SchedulerConfig {
    return this.cachedConfig ? { ...this.cachedConfig } : { ...DEFAULT_CONFIG };
  }

  async updateConfig(updates: Partial<SchedulerConfig>) {
    const current = this.getConfig();
    if (updates.runHour !== undefined) {
      current.runHour = Math.max(0, Math.min(23, Math.floor(updates.runHour)));
    }
    if (updates.dailyCap !== undefined) {
      current.dailyCap = Math.max(1, Math.floor(updates.dailyCap));
    }
    await this.storage.upsertSchedulerConfig({ runHour: current.runHour, dailyCap: current.dailyCap });
    this.cachedConfig = current;
    console.log(`${PREFIX} ${ts()} Config persisted: runHour=${current.runHour} PST, dailyCap=${current.dailyCap}`);
  }

  async start(intervalMs: number = 60000 * 60) {
    const config = await this.loadConfig();
    console.log(`${PREFIX} ${ts()} Scheduler started. Checking every ${intervalMs / 60000} minutes. Cron fires at ${config.runHour}:00 PST. Daily cap: ${config.dailyCap}`);
    this.intervalId = setInterval(() => this.checkAndRun(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId as unknown as number);
      this.intervalId = null;
      console.log(`${PREFIX} ${ts()} Scheduler stopped.`);
    }
  }

  private async checkAndRun() {
    if (this.isRunning) {
      console.log(`${PREFIX} ${ts()} Skipping tick — already running.`);
      return;
    }

    const config = await this.loadConfig();
    const currentHourPST = getPSTHour();

    if (currentHourPST !== config.runHour) {
      return;
    }

    const todayPST = getPSTDate();
    const todayCount = await this.storage.getTodayDiscoveredCount(todayPST);

    if (todayCount >= config.dailyCap) {
      console.log(`${PREFIX} ${ts()} Daily global cap already reached (${todayCount}/${config.dailyCap}). Skipping.`);
      return;
    }

    this.isRunning = true;
    console.log(`${PREFIX} ${ts()} === Scheduled run starting ===`);

    try {
      const activeJobs = await this.storage.getActiveDiscoveryJobs();
      console.log(`${PREFIX} ${ts()} Found ${activeJobs.length} active discovery job(s)`);

      for (const job of activeJobs) {
        const currentCount = await this.storage.getTodayDiscoveredCount(todayPST);
        if (currentCount >= config.dailyCap) {
          console.log(`${PREFIX} ${ts()} Daily global cap reached mid-run (${currentCount}/${config.dailyCap}). Stopping.`);
          break;
        }

        const jobRunsToday = await this.storage.getDiscoveryRunsByJob(job.id, todayPST);
        const hasCompletedRunToday = jobRunsToday.some(r => r.status === 'completed' && r.vendorsStaged > 0);
        if (hasCompletedRunToday) {
          console.log(`${PREFIX} ${ts()} Job ${job.id} (${job.area}/${job.specialty}) already ran successfully today. Skipping.`);
          continue;
        }

        await this.service.executeJob(job, config.dailyCap, 'scheduler');
      }

      const finalCount = await this.storage.getTodayDiscoveredCount(todayPST);
      console.log(`${PREFIX} ${ts()} === Scheduled run complete. Today's total: ${finalCount}/${config.dailyCap} ===`);
    } catch (error) {
      console.error(`${PREFIX} ${ts()} ERROR in scheduler:`, error);
    } finally {
      this.isRunning = false;
    }
  }

  async runJobNow(jobId: string): Promise<{ runId: string }> {
    const job = await this.storage.getDiscoveryJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const config = await this.loadConfig();

    console.log(`${PREFIX} [ManualRun] ${ts()} Firing background discovery for job ${jobId} (${job.area}/${job.specialty})`);

    const runId = await this.service.createPendingRun(job.id, 'manual');
    const controller = new AbortController();
    this.activeRuns.set(runId, { controller, jobId });

    setImmediate(async () => {
      try {
        await this.service.executeJob(job, config.dailyCap, 'manual', runId, controller.signal);
      } catch (error: any) {
        console.error(`${PREFIX} [ManualRun] ${ts()} Background discovery failed:`, error);
      } finally {
        this.activeRuns.delete(runId);
      }
    });

    return { runId };
  }

  async cancelRun(runId: string): Promise<boolean> {
    const entry = this.activeRuns.get(runId);
    if (entry) {
      console.log(`${PREFIX} ${ts()} Cancelling active run ${runId} (job: ${entry.jobId})`);
      entry.controller.abort();
      this.activeRuns.delete(runId);
      return true;
    }

    const run = await this.storage.getDiscoveryRun(runId);
    if (run && (run.status === 'queued' || run.status === 'running')) {
      console.log(`${PREFIX} ${ts()} Marking stale run ${runId} as cancelled`);
      await this.storage.updateDiscoveryRun(runId, {
        status: 'cancelled',
        error: 'Cancelled by admin',
        finishedAt: new Date(),
      });
      return true;
    }

    return false;
  }

  getActiveRunIds(): string[] {
    return Array.from(this.activeRuns.keys());
  }
}

export type { DiscoveryLog, DiscoveryResult };
