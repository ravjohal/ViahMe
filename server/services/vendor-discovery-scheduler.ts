import type { IStorage } from '../storage';
import type { DiscoveryJob } from '@shared/schema';
import { discoverVendors } from '../ai/gemini';

const DAILY_GLOBAL_CAP = 50;
const RUN_HOUR = 2;

export class VendorDiscoveryScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timer | null = null;
  private isRunning = false;
  private todayDiscoveredCount = 0;
  private lastResetDate = '';

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async start(intervalMs: number = 60000 * 60) {
    console.log('Starting vendor discovery scheduler...');
    this.intervalId = setInterval(() => this.checkAndRun(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId as unknown as number);
      this.intervalId = null;
    }
  }

  private resetDailyCountIfNeeded() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.todayDiscoveredCount = 0;
      this.lastResetDate = today;
    }
  }

  private async checkAndRun() {
    if (this.isRunning) return;

    const now = new Date();
    const currentHour = now.getUTCHours();

    if (currentHour !== RUN_HOUR) return;

    this.resetDailyCountIfNeeded();

    if (this.todayDiscoveredCount >= DAILY_GLOBAL_CAP) {
      return;
    }

    this.isRunning = true;

    try {
      const activeJobs = await this.storage.getActiveDiscoveryJobs();
      console.log(`[VendorDiscovery] Found ${activeJobs.length} active discovery jobs`);

      for (const job of activeJobs) {
        if (this.todayDiscoveredCount >= DAILY_GLOBAL_CAP) {
          console.log('[VendorDiscovery] Daily global cap reached, stopping');
          break;
        }

        await this.processJob(job);
      }
    } catch (error) {
      console.error('[VendorDiscovery] Error in scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processJob(job: DiscoveryJob) {
    if (job.endDate && new Date() > new Date(job.endDate)) {
      console.log(`[VendorDiscovery] Job "${job.area} - ${job.specialty}" past end date, deactivating`);
      await this.storage.updateDiscoveryJob(job.id, { isActive: false });
      return;
    }

    if (job.maxTotal && job.totalDiscovered >= job.maxTotal) {
      console.log(`[VendorDiscovery] Job "${job.area} - ${job.specialty}" reached max total (${job.maxTotal}), deactivating`);
      await this.storage.updateDiscoveryJob(job.id, { isActive: false });
      return;
    }

    const remaining = job.maxTotal ? job.maxTotal - job.totalDiscovered : job.countPerRun;
    const countToFetch = Math.min(job.countPerRun, remaining, DAILY_GLOBAL_CAP - this.todayDiscoveredCount);

    if (countToFetch <= 0) return;

    console.log(`[VendorDiscovery] Running job: ${job.area} - ${job.specialty} (fetching ${countToFetch})`);

    try {
      const discovered = await discoverVendors(job.area, job.specialty, countToFetch);

      const existingVendors = await this.storage.getAllVendors();
      const allStagedVendors = await this.storage.getAllStagedVendors();
      let newCount = 0;

      for (const vendor of discovered) {
        const vendorName = vendor.name.toLowerCase().trim();

        const existingDuplicate = existingVendors.find(
          v => v.name.toLowerCase().trim() === vendorName
        );
        const stagedDuplicate = allStagedVendors.find(
          v => v.name.toLowerCase().trim() === vendorName
        );

        if (stagedDuplicate) continue;

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
          status: existingDuplicate ? 'duplicate' : 'staged',
          duplicateOfVendorId: existingDuplicate?.id || null,
        });

        newCount++;
      }

      await this.storage.updateDiscoveryJob(job.id, {
        lastRunAt: new Date(),
        totalDiscovered: job.totalDiscovered + newCount,
      });

      this.todayDiscoveredCount += newCount;

      console.log(`[VendorDiscovery] Job "${job.area} - ${job.specialty}": found ${discovered.length}, staged ${newCount} new vendors`);
    } catch (error) {
      console.error(`[VendorDiscovery] Error processing job "${job.area} - ${job.specialty}":`, error);
    }
  }

  async runJobNow(jobId: string): Promise<{ discovered: number; staged: number }> {
    const job = await this.storage.getDiscoveryJob(jobId);
    if (!job) throw new Error('Job not found');

    this.resetDailyCountIfNeeded();

    const beforeCount = job.totalDiscovered;
    await this.processJob(job);

    const updatedJob = await this.storage.getDiscoveryJob(jobId);
    const staged = (updatedJob?.totalDiscovered || 0) - beforeCount;

    return {
      discovered: staged,
      staged,
    };
  }
}
