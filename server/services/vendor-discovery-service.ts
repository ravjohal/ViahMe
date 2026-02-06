import type { IStorage } from '../storage';
import type { DiscoveryJob, DiscoveryRun, StagedVendor } from '@shared/schema';
import { discoverVendors, type ChatHistoryEntry } from '../ai/gemini';
import { z } from 'zod';

async function verifyWebsiteUrl(url: string, timeoutMs: number = 8000): Promise<'valid' | 'invalid' | 'error'> {
  if (!url || url.trim() === '') return 'invalid';
  try {
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    new URL(normalizedUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(normalizedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Viah.me Vendor Verification Bot' },
      });
    } catch {
      clearTimeout(timer);
      const getController = new AbortController();
      const getTimer = setTimeout(() => getController.abort(), timeoutMs);
      response = await fetch(normalizedUrl, {
        method: 'GET',
        signal: getController.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Viah.me Vendor Verification Bot' },
      });
      clearTimeout(getTimer);
    }
    clearTimeout(timer);
    return response.ok || response.status === 403 || response.status === 405 || response.status === 301 || response.status === 302 ? 'valid' : 'invalid';
  } catch {
    return 'error';
  }
}

const VERIFY_CONCURRENCY = 5;
const VERIFY_MAX_PER_RUN = 50;

async function verifyVendorWebsites(
  vendors: { id: string; website: string | null }[],
  storage: IStorage,
  log: (level: string, message: string, data?: any) => void,
): Promise<{ verified: number; failed: number; skipped: number }> {
  let verified = 0, failed = 0, skipped = 0;

  const capped = vendors.slice(0, VERIFY_MAX_PER_RUN);
  if (vendors.length > VERIFY_MAX_PER_RUN) {
    log('info', `Website verification capped at ${VERIFY_MAX_PER_RUN} vendors (${vendors.length} total pending).`);
  }

  for (let i = 0; i < capped.length; i += VERIFY_CONCURRENCY) {
    const batch = capped.slice(i, i + VERIFY_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (vendor) => {
        if (!vendor.website || vendor.website.trim() === '') {
          await storage.updateStagedVendor(vendor.id, { websiteVerified: 'no_url' });
          return 'no_url' as const;
        }
        const result = await verifyWebsiteUrl(vendor.website);
        await storage.updateStagedVendor(vendor.id, { websiteVerified: result });
        return result;
      })
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled') {
        if (r.value === 'valid') verified++;
        else if (r.value === 'no_url') skipped++;
        else {
          failed++;
          log('warn', `Website verification FAILED for "${batch[j].website}" → ${r.value}`);
        }
      } else {
        failed++;
        log('warn', `Website verification ERROR for "${batch[j].website}": ${r.reason}`);
        try { await storage.updateStagedVendor(batch[j].id, { websiteVerified: 'error' }); } catch {}
      }
    }
  }

  return { verified, failed, skipped };
}

const chatHistoryEntrySchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

function validateChatHistory(raw: unknown): ChatHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const valid: ChatHistoryEntry[] = [];
  for (const item of raw) {
    const parsed = chatHistoryEntrySchema.safeParse(item);
    if (parsed.success) {
      valid.push(parsed.data as ChatHistoryEntry);
    }
  }
  return valid;
}

const PREFIX = '[VendorDiscovery]';

function ts(): string {
  return new Date().toISOString();
}

const LA_TZ = 'America/Los_Angeles';

export function getPSTDate(): string {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getPSTHour(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LA_TZ,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const hourPart = parts.find(p => p.type === 'hour');
  return Number(hourPart?.value ?? 0);
}

export interface DiscoveryLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, any>;
}

export interface DiscoveryResult {
  runId: string;
  discovered: number;
  staged: number;
  duplicatesFound: number;
  logs: DiscoveryLog[];
}

export class VendorDiscoveryService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async createPendingRun(jobId: string, triggeredBy: 'scheduler' | 'manual'): Promise<string> {
    const run = await this.storage.createDiscoveryRun({
      jobId,
      runDate: getPSTDate(),
      vendorsDiscovered: 0,
      vendorsStaged: 0,
      duplicatesFound: 0,
      status: 'queued',
      triggeredBy,
    });
    return run.id;
  }

  async executeJob(
    job: DiscoveryJob,
    dailyCap: number,
    triggeredBy: 'scheduler' | 'manual' = 'scheduler',
    existingRunId?: string,
    abortSignal?: AbortSignal,
  ): Promise<DiscoveryResult> {
    const logs: DiscoveryLog[] = [];
    const runDate = getPSTDate();

    const log = (level: DiscoveryLog['level'], message: string, data?: Record<string, any>) => {
      const entry: DiscoveryLog = { timestamp: ts(), level, message, data };
      logs.push(entry);
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

    const checkAborted = () => {
      if (abortSignal?.aborted) {
        throw new Error('CANCELLED');
      }
    };

    let runId: string;
    if (existingRunId) {
      runId = existingRunId;
      await this.storage.updateDiscoveryRun(runId, { status: 'running' });
    } else {
      const run = await this.storage.createDiscoveryRun({
        jobId: job.id,
        runDate,
        vendorsDiscovered: 0,
        vendorsStaged: 0,
        duplicatesFound: 0,
        status: 'running',
        triggeredBy,
      });
      runId = run.id;
    }

    try {
      checkAborted();

      log('info', 'Step 1/8: Checking job validity', {
        runId,
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
        log('warn', 'Step 1/8: STOPPED — Job past end date, deactivating.', { endDate: new Date(job.endDate).toISOString() });
        await this.storage.updateDiscoveryJob(job.id, { isActive: false });
        await this.finishRun(runId, 0, 0, 0, 'skipped');
        return { runId, discovered: 0, staged: 0, duplicatesFound: 0, logs };
      }

      if (job.maxTotal && job.totalDiscovered >= job.maxTotal) {
        log('warn', 'Step 1/8: STOPPED — Job reached maxTotal, deactivating.', { totalDiscovered: job.totalDiscovered, maxTotal: job.maxTotal });
        await this.storage.updateDiscoveryJob(job.id, { isActive: false });
        await this.finishRun(runId, 0, 0, 0, 'skipped');
        return { runId, discovered: 0, staged: 0, duplicatesFound: 0, logs };
      }

      log('info', 'Step 1/8: Job is valid, proceeding.');

      const todayCount = await this.storage.getTodayDiscoveredCount(runDate);
      const remaining = job.maxTotal ? job.maxTotal - job.totalDiscovered : job.countPerRun;
      const globalBudget = dailyCap - todayCount;
      const countToFetch = Math.min(job.countPerRun, remaining, globalBudget);

      log('info', 'Step 2/8: Calculating fetch count', {
        countPerRun: job.countPerRun,
        remainingForJob: remaining,
        todayDiscoveredSoFar: todayCount,
        dailyCap,
        globalBudgetRemaining: globalBudget,
        countToFetch,
      });

      if (countToFetch <= 0) {
        log('warn', 'Step 2/8: STOPPED — countToFetch is 0. No capacity.');
        await this.finishRun(runId, 0, 0, 0, 'skipped');
        return { runId, discovered: 0, staged: 0, duplicatesFound: 0, logs };
      }

      log('info', 'Step 3/8: Building exclusion list and duplicate lookup maps...');
      const knownLoadStart = Date.now();
      const [jobStagedVendors, existingVendorNameMap] = await Promise.all([
        this.storage.getStagedVendorsByJob(job.id),
        this.storage.getVendorNameIdMap(),
      ]);

      const stagedVendorMap = new Map<string, string>();
      for (const v of jobStagedVendors) {
        stagedVendorMap.set(v.name.toLowerCase().trim(), v.id);
      }

      const MAX_EXCLUDE_NAMES = 200;
      const knownNames = new Set<string>();
      for (const name of stagedVendorMap.keys()) {
        if (knownNames.size >= MAX_EXCLUDE_NAMES) break;
        knownNames.add(name);
      }
      for (const name of existingVendorNameMap.keys()) {
        if (knownNames.size >= MAX_EXCLUDE_NAMES) break;
        knownNames.add(name);
      }
      const knownNamesList = Array.from(knownNames);
      const knownLoadMs = Date.now() - knownLoadStart;

      log('info', `Step 3/8: Data prepared in ${knownLoadMs}ms. Staged vendors: ${stagedVendorMap.size}, Existing vendors: ${existingVendorNameMap.size}, Exclusion list: ${knownNamesList.length} (cap: ${MAX_EXCLUDE_NAMES})`);

      log('info', `Step 4/8: Loading chat history for ${job.area}/${job.specialty}...`);
      const chatRecord = await this.storage.getDiscoveryChatHistory(job.area, job.specialty);
      const rawHistory = chatRecord?.history;
      const priorHistory = validateChatHistory(rawHistory);
      if (rawHistory && Array.isArray(rawHistory) && priorHistory.length !== rawHistory.length) {
        log('warn', `Step 4/8: Chat history had ${rawHistory.length} entries but only ${priorHistory.length} passed validation. Invalid entries discarded.`);
      }
      log('info', `Step 4/8: ${priorHistory.length > 0 ? `Resuming conversation (${priorHistory.length} prior turns, ${chatRecord?.totalVendorsFound || 0} vendors staged previously)` : 'Starting fresh conversation'}`);

      checkAborted();

      log('info', `Step 5/8: Calling Gemini API to discover ${countToFetch} vendors (excluding ${knownNamesList.length} known)...`, { area: job.area, specialty: job.specialty });
      const geminiStart = Date.now();

      const result = await discoverVendors(job.area, job.specialty, countToFetch, knownNamesList, priorHistory);
      const discovered = result.vendors;
      const updatedChatHistory = result.chatHistory;
      const geminiMs = Date.now() - geminiStart;

      log('info', `Step 5/8: Gemini returned ${discovered.length} vendor(s) in ${geminiMs}ms`, {
        geminiDurationMs: geminiMs,
        vendorNames: discovered.map(v => v.name),
        chatHistoryTurns: updatedChatHistory.length,
      });

      checkAborted();

      if (discovered.length === 0) {
        log('warn', 'Step 5/8: Gemini returned 0 vendors. Saving chat history and finishing.');
        try {
          await this.storage.upsertDiscoveryChatHistory(job.area, job.specialty, updatedChatHistory, chatRecord?.totalVendorsFound || 0);
        } catch (histErr: any) {
          log('error', `Step 5/8: Failed to save chat history (non-fatal): ${histErr.message}`);
        }
        await this.finishRun(runId, 0, 0, 0, 'completed');
        return { runId, discovered: 0, staged: 0, duplicatesFound: 0, logs };
      }

      let newCount = 0;
      let duplicateExistingCount = 0;
      let duplicateStagedCount = 0;

      checkAborted();

      log('info', `Step 6/8: O(1) duplicate safety check on ${discovered.length} vendors...`);

      for (let i = 0; i < discovered.length; i++) {
        const vendor = discovered[i];
        const vendorName = vendor.name.toLowerCase().trim();

        const stagedDuplicateId = stagedVendorMap.get(vendorName);
        if (stagedDuplicateId) {
          duplicateStagedCount++;
          log('debug', `  [${i + 1}/${discovered.length}] "${vendor.name}" — SKIP (already staged, ID: ${stagedDuplicateId})`);
          continue;
        }

        const existingDuplicateId = existingVendorNameMap.get(vendorName);
        const status = existingDuplicateId ? 'duplicate' : 'staged';
        if (existingDuplicateId) {
          duplicateExistingCount++;
          log('debug', `  [${i + 1}/${discovered.length}] "${vendor.name}" — DUPLICATE of existing vendor (ID: ${existingDuplicateId}), staging with status=duplicate`);
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
          duplicateOfVendorId: existingDuplicateId || null,
        });

        newCount++;
      }

      log('info', `Step 6/8: Safety check complete`, {
        totalFromGemini: discovered.length,
        stagedNew: newCount,
        skippedAlreadyStaged: duplicateStagedCount,
        markedAsDuplicateOfExisting: duplicateExistingCount,
      });

      log('info', 'Step 7/8: Triggering background website verification...');
      this.verifyWebsitesInBackground(job.id, log).catch(err =>
        console.error(`${PREFIX} Background verification error for job ${job.id}:`, err)
      );

      log('info', 'Step 8/8: Updating job counters and saving chat history...');
      await this.storage.updateDiscoveryJob(job.id, {
        lastRunAt: new Date(),
        totalDiscovered: job.totalDiscovered + newCount,
      });

      const priorVendorsStaged = chatRecord?.totalVendorsFound || 0;
      const totalVendorsStaged = priorVendorsStaged + newCount;
      try {
        await this.storage.upsertDiscoveryChatHistory(
          job.area,
          job.specialty,
          updatedChatHistory,
          totalVendorsStaged,
        );
        log('info', `Step 8/8: Chat history saved (${updatedChatHistory.length} entries, ${totalVendorsStaged} total vendors staged for this area/specialty).`);
      } catch (histErr: any) {
        log('error', `Step 8/8: Failed to save chat history (non-fatal): ${histErr.message}. Run will still be marked completed.`);
      }

      log('info', `Step 8/8: Job updated. totalDiscovered: ${job.totalDiscovered} → ${job.totalDiscovered + newCount}.`);

      const totalDuplicates = duplicateStagedCount + duplicateExistingCount;

      log('info', `JOB COMPLETE`, {
        runId,
        geminiReturned: discovered.length,
        stagedCount: newCount,
        duplicatesSkipped: totalDuplicates,
        chatHistoryTurns: updatedChatHistory.length,
      });

      await this.finishRun(runId, discovered.length, newCount, totalDuplicates, 'completed');

      return { runId, discovered: discovered.length, staged: newCount, duplicatesFound: totalDuplicates, logs };
    } catch (error: any) {
      const errMsg = error.message || String(error);
      if (errMsg === 'CANCELLED') {
        log('warn', 'Run was cancelled by admin.');
        await this.finishRun(runId, 0, 0, 0, 'cancelled', 'Cancelled by admin');
        return { runId, discovered: 0, staged: 0, duplicatesFound: 0, logs };
      }
      log('error', `FAILED during processing: ${errMsg}`, { stack: error.stack?.substring(0, 500) });
      await this.finishRun(runId, 0, 0, 0, 'failed', errMsg);
      return { runId, discovered: 0, staged: 0, duplicatesFound: 0, logs };
    }
  }

  private async verifyWebsitesInBackground(jobId: string, log: (level: DiscoveryLog['level'], message: string, data?: Record<string, any>) => void) {
    try {
      const freshStagedVendors = await this.storage.getStagedVendorsByJob(jobId);
      const vendorsToVerify = freshStagedVendors.filter(v => v.websiteVerified === 'pending' || !v.websiteVerified);
      if (vendorsToVerify.length > 0) {
        const verifyResults = await verifyVendorWebsites(vendorsToVerify, this.storage, log);
        log('info', `Background website verification complete`, verifyResults);
      } else {
        log('info', `Background website verification: no vendors to verify.`);
      }
    } catch (verifyErr: any) {
      log('error', `Background website verification failed: ${verifyErr.message}`);
    }
  }

  private async finishRun(
    runId: string,
    vendorsDiscovered: number,
    vendorsStaged: number,
    duplicatesFound: number,
    status: string,
    error?: string,
  ) {
    await this.storage.updateDiscoveryRun(runId, {
      vendorsDiscovered,
      vendorsStaged,
      duplicatesFound,
      status,
      error: error || null,
      finishedAt: new Date(),
    });
  }
}
