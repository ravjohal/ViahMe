import type { IStorage } from '../storage';
import type { DiscoveryJob } from '@shared/schema';
import { discoverVendors } from '../ai/gemini';

const PREFIX = '[VendorDiscovery]';

function ts(): string {
  return new Date().toISOString();
}

const LA_TZ = 'America/Los_Angeles';

function getPSTHour(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LA_TZ,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const hourPart = parts.find(p => p.type === 'hour');
  return Number(hourPart?.value ?? 0);
}

function getPSTDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts;
}

export interface SchedulerConfig {
  runHour: number;
  dailyCap: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  runHour: 2,
  dailyCap: 50,
};

export interface DiscoveryLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, any>;
}

export class VendorDiscoveryScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timer | null = null;
  private isRunning = false;
  private todayDiscoveredCount = 0;
  private lastResetDate = '';
  private config: SchedulerConfig;

  constructor(storage: IStorage, config?: Partial<SchedulerConfig>) {
    this.storage = storage;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SchedulerConfig>) {
    if (updates.runHour !== undefined) {
      this.config.runHour = Math.max(0, Math.min(23, Math.floor(updates.runHour)));
    }
    if (updates.dailyCap !== undefined) {
      this.config.dailyCap = Math.max(1, Math.floor(updates.dailyCap));
    }
    console.log(`${PREFIX} ${ts()} Config updated: runHour=${this.config.runHour} PST, dailyCap=${this.config.dailyCap}`);
  }

  async start(intervalMs: number = 60000 * 60) {
    console.log(`${PREFIX} ${ts()} Scheduler started. Checking every ${intervalMs / 60000} minutes. Cron fires at ${this.config.runHour}:00 PST. Daily cap: ${this.config.dailyCap}`);
    this.intervalId = setInterval(() => this.checkAndRun(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId as unknown as number);
      this.intervalId = null;
      console.log(`${PREFIX} ${ts()} Scheduler stopped.`);
    }
  }

  private resetDailyCountIfNeeded() {
    const todayPST = getPSTDate();
    if (todayPST !== this.lastResetDate) {
      console.log(`${PREFIX} ${ts()} Daily counter reset (PST). Previous date: ${this.lastResetDate || '(none)'}, new date: ${todayPST}, previous count: ${this.todayDiscoveredCount}`);
      this.todayDiscoveredCount = 0;
      this.lastResetDate = todayPST;
    }
  }

  private async checkAndRun() {
    if (this.isRunning) {
      console.log(`${PREFIX} ${ts()} Skipping tick — already running.`);
      return;
    }

    const currentHourPST = getPSTHour();

    if (currentHourPST !== this.config.runHour) {
      return;
    }

    this.resetDailyCountIfNeeded();

    if (this.todayDiscoveredCount >= this.config.dailyCap) {
      console.log(`${PREFIX} ${ts()} Daily global cap already reached (${this.todayDiscoveredCount}/${this.config.dailyCap}). Skipping.`);
      return;
    }

    this.isRunning = true;
    console.log(`${PREFIX} ${ts()} === Scheduled run starting ===`);

    try {
      const activeJobs = await this.storage.getActiveDiscoveryJobs();
      console.log(`${PREFIX} ${ts()} Found ${activeJobs.length} active discovery job(s)`);

      for (const job of activeJobs) {
        if (this.todayDiscoveredCount >= this.config.dailyCap) {
          console.log(`${PREFIX} ${ts()} Daily global cap reached mid-run (${this.todayDiscoveredCount}/${this.config.dailyCap}). Stopping.`);
          break;
        }

        await this.processJob(job);
      }

      console.log(`${PREFIX} ${ts()} === Scheduled run complete. Today's total: ${this.todayDiscoveredCount}/${this.config.dailyCap} ===`);
    } catch (error) {
      console.error(`${PREFIX} ${ts()} ERROR in scheduler:`, error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processJob(job: DiscoveryJob, logs?: DiscoveryLog[]) {
    const log = (level: DiscoveryLog['level'], message: string, data?: Record<string, any>) => {
      const entry: DiscoveryLog = { timestamp: ts(), level, message, data };
      if (logs) logs.push(entry);
      const prefix = `${PREFIX} [Job:${job.area}/${job.specialty}]`;
      const dataStr = data ? ' ' + JSON.stringify(data) : '';
      if (level === 'error') {
        console.error(`${prefix} ${entry.timestamp} ${message}${dataStr}`);
      } else if (level === 'warn') {
        console.warn(`${prefix} ${entry.timestamp} ${message}${dataStr}`);
      } else {
        console.log(`${prefix} ${entry.timestamp} ${message}${dataStr}`);
      }
    };

    log('info', 'Step 1/7: Checking job validity', {
      jobId: job.id,
      area: job.area,
      specialty: job.specialty,
      isActive: job.isActive,
      totalDiscovered: job.totalDiscovered,
      maxTotal: job.maxTotal,
      countPerRun: job.countPerRun,
      endDate: job.endDate ? new Date(job.endDate).toISOString() : null,
    });

    if (job.endDate && new Date() > new Date(job.endDate)) {
      log('warn', 'Step 1/7: STOPPED — Job past end date, deactivating.', { endDate: new Date(job.endDate).toISOString() });
      await this.storage.updateDiscoveryJob(job.id, { isActive: false });
      return;
    }

    if (job.maxTotal && job.totalDiscovered >= job.maxTotal) {
      log('warn', 'Step 1/7: STOPPED — Job reached maxTotal, deactivating.', { totalDiscovered: job.totalDiscovered, maxTotal: job.maxTotal });
      await this.storage.updateDiscoveryJob(job.id, { isActive: false });
      return;
    }

    log('info', 'Step 1/7: Job is valid, proceeding.');

    const remaining = job.maxTotal ? job.maxTotal - job.totalDiscovered : job.countPerRun;
    const globalBudget = this.config.dailyCap - this.todayDiscoveredCount;
    const countToFetch = Math.min(job.countPerRun, remaining, globalBudget);

    log('info', 'Step 2/7: Calculating fetch count', {
      countPerRun: job.countPerRun,
      remainingForJob: remaining,
      globalBudgetRemaining: globalBudget,
      countToFetch,
    });

    if (countToFetch <= 0) {
      log('warn', 'Step 2/7: STOPPED — countToFetch is 0. No capacity.');
      return;
    }

    log('info', 'Step 3/7: Loading known vendors to build exclusion list for Gemini...');
    const knownLoadStart = Date.now();
    const jobStagedVendors = await this.storage.getStagedVendorsByJob(job.id);
    const existingVendors = await this.storage.getAllVendors();
    const knownLoadMs = Date.now() - knownLoadStart;

    const MAX_EXCLUDE_NAMES = 200;
    const knownNames = new Set<string>();
    for (const v of jobStagedVendors) {
      knownNames.add(v.name.toLowerCase().trim());
    }
    for (const v of existingVendors) {
      if (knownNames.size >= MAX_EXCLUDE_NAMES) break;
      knownNames.add(v.name.toLowerCase().trim());
    }
    const knownNamesList = Array.from(knownNames);

    log('info', `Step 3/7: Built exclusion list: ${jobStagedVendors.length} from this job + ${existingVendors.length} existing = ${knownNamesList.length} unique names (cap: ${MAX_EXCLUDE_NAMES}) in ${knownLoadMs}ms`);

    log('info', `Step 4/7: Calling Gemini API to discover ${countToFetch} vendors (excluding ${knownNamesList.length} known)...`, { area: job.area, specialty: job.specialty });
    const geminiStart = Date.now();

    try {
      const discovered = await discoverVendors(job.area, job.specialty, countToFetch, knownNamesList);
      const geminiMs = Date.now() - geminiStart;

      log('info', `Step 4/7: Gemini returned ${discovered.length} vendor(s) in ${geminiMs}ms`, {
        geminiDurationMs: geminiMs,
        vendorNames: discovered.map(v => v.name),
      });

      if (discovered.length === 0) {
        log('warn', 'Step 4/7: Gemini returned 0 vendors. Nothing to process.');
        return;
      }

      let newCount = 0;
      let duplicateExistingCount = 0;
      let duplicateStagedCount = 0;

      log('info', `Step 5/7: Post-hoc duplicate safety check on ${discovered.length} vendors...`);

      for (let i = 0; i < discovered.length; i++) {
        const vendor = discovered[i];
        const vendorName = vendor.name.toLowerCase().trim();

        const existingDuplicate = existingVendors.find(
          v => v.name.toLowerCase().trim() === vendorName
        );
        const stagedDuplicate = jobStagedVendors.find(
          v => v.name.toLowerCase().trim() === vendorName
        );

        if (stagedDuplicate) {
          duplicateStagedCount++;
          log('debug', `  [${i + 1}/${discovered.length}] "${vendor.name}" — SKIP (already staged, staged ID: ${stagedDuplicate.id})`);
          continue;
        }

        const status = existingDuplicate ? 'duplicate' : 'staged';
        if (existingDuplicate) {
          duplicateExistingCount++;
          log('debug', `  [${i + 1}/${discovered.length}] "${vendor.name}" — DUPLICATE of existing vendor "${existingDuplicate.name}" (ID: ${existingDuplicate.id}), staging with status=duplicate`);
        } else {
          log('debug', `  [${i + 1}/${discovered.length}] "${vendor.name}" — NEW, staging with status=staged`);
        }

        await this.storage.createStagedVendor({
          discoveryJobId: job.id,
          name: vendor.name,
          location: vendor.location,
          phone: vendor.phone,
          email: vendor.email,
          website: vendor.website,
          specialty: vendor.specialty,
          categories: vendor.categories,
          culturalSpecialties: vendor.cultural_specialties,
          preferredWeddingTraditions: vendor.preferred_wedding_traditions,
          priceRange: vendor.price_range,
          notes: vendor.notes,
          status,
          duplicateOfVendorId: existingDuplicate?.id || null,
        });

        newCount++;
      }

      log('info', `Step 5/7: Safety check complete`, {
        totalFromGemini: discovered.length,
        stagedNew: newCount,
        skippedAlreadyStaged: duplicateStagedCount,
        markedAsDuplicateOfExisting: duplicateExistingCount,
      });

      log('info', 'Step 6/7: Updating job counters...');
      await this.storage.updateDiscoveryJob(job.id, {
        lastRunAt: new Date(),
        totalDiscovered: job.totalDiscovered + newCount,
      });

      this.todayDiscoveredCount += newCount;

      log('info', `Step 6/7: Job updated. totalDiscovered: ${job.totalDiscovered} → ${job.totalDiscovered + newCount}`);

      log('info', `Step 7/7: JOB COMPLETE`, {
        geminiReturned: discovered.length,
        stagedCount: newCount,
        duplicatesSkipped: duplicateStagedCount + duplicateExistingCount,
        todayGlobalTotal: this.todayDiscoveredCount,
        dailyCap: this.config.dailyCap,
      });
    } catch (error: any) {
      log('error', `FAILED during processing: ${error.message}`, { stack: error.stack?.substring(0, 500) });
    }
  }

  async runJobNow(jobId: string): Promise<{ discovered: number; staged: number; logs: DiscoveryLog[] }> {
    const logs: DiscoveryLog[] = [];

    const logEntry = (level: DiscoveryLog['level'], message: string, data?: Record<string, any>) => {
      const entry: DiscoveryLog = { timestamp: ts(), level, message, data };
      logs.push(entry);
      console.log(`${PREFIX} [ManualRun] ${entry.timestamp} ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
    };

    logEntry('info', '=== Manual Run Started ===', { jobId });

    const job = await this.storage.getDiscoveryJob(jobId);
    if (!job) {
      logEntry('error', 'Job not found', { jobId });
      throw new Error('Job not found');
    }

    logEntry('info', 'Job loaded', {
      area: job.area,
      specialty: job.specialty,
      totalDiscovered: job.totalDiscovered,
      maxTotal: job.maxTotal,
      countPerRun: job.countPerRun,
      isActive: job.isActive,
    });

    this.resetDailyCountIfNeeded();
    logEntry('info', 'Daily counter state', { todayDiscoveredCount: this.todayDiscoveredCount, dailyCap: this.config.dailyCap });

    const beforeCount = job.totalDiscovered;
    await this.processJob(job, logs);

    const updatedJob = await this.storage.getDiscoveryJob(jobId);
    const staged = (updatedJob?.totalDiscovered || 0) - beforeCount;

    logEntry('info', '=== Manual Run Complete ===', {
      beforeTotal: beforeCount,
      afterTotal: updatedJob?.totalDiscovered || 0,
      newlyStaged: staged,
    });

    return {
      discovered: staged,
      staged,
      logs,
    };
  }
}
