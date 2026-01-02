import { Router } from "express";
import type { IStorage } from "../storage";

export function createVendorCalendarAccountsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const accounts = await storage.getCalendarAccountsByVendor(req.params.vendorId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching calendar accounts:", error);
      res.status(500).json({ error: "Failed to fetch calendar accounts" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const account = await storage.getVendorCalendarAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Calendar account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching calendar account:", error);
      res.status(500).json({ error: "Failed to fetch calendar account" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { vendorId, provider, email, label } = req.body;
      if (!vendorId || !provider || !email) {
        return res.status(400).json({ error: "vendorId, provider, and email are required" });
      }
      
      const existing = await storage.getCalendarAccountByEmail(vendorId, email);
      if (existing) {
        return res.status(409).json({ error: "A calendar account with this email already exists" });
      }
      
      const account = await storage.createVendorCalendarAccount({
        vendorId,
        provider,
        email,
        label: label || null,
        status: 'pending',
      });
      res.json(account);
    } catch (error) {
      console.error("Error creating calendar account:", error);
      res.status(500).json({ error: "Failed to create calendar account" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const account = await storage.updateVendorCalendarAccount(req.params.id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Calendar account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating calendar account:", error);
      res.status(500).json({ error: "Failed to update calendar account" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await storage.deleteCalendarsByAccount(req.params.id);
      
      const success = await storage.deleteVendorCalendarAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Calendar account not found" });
      }
      res.json({ message: "Calendar account deleted successfully" });
    } catch (error) {
      console.error("Error deleting calendar account:", error);
      res.status(500).json({ error: "Failed to delete calendar account" });
    }
  });

  return router;
}

export function createVendorCalendarsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/vendor/:vendorId", async (req, res) => {
    try {
      const calendars = await storage.getCalendarsByVendor(req.params.vendorId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching vendor calendars:", error);
      res.status(500).json({ error: "Failed to fetch vendor calendars" });
    }
  });

  router.get("/account/:accountId", async (req, res) => {
    try {
      const calendars = await storage.getCalendarsByAccount(req.params.accountId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching account calendars:", error);
      res.status(500).json({ error: "Failed to fetch account calendars" });
    }
  });

  router.get("/vendor/:vendorId/selected", async (req, res) => {
    try {
      const calendars = await storage.getSelectedCalendarsByVendor(req.params.vendorId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching selected calendars:", error);
      res.status(500).json({ error: "Failed to fetch selected calendars" });
    }
  });

  router.get("/vendor/:vendorId/write-target", async (req, res) => {
    try {
      const calendar = await storage.getWriteTargetCalendar(req.params.vendorId);
      res.json(calendar || null);
    } catch (error) {
      console.error("Error fetching write target calendar:", error);
      res.status(500).json({ error: "Failed to fetch write target calendar" });
    }
  });

  router.get("/vendor/:vendorId/aggregated-availability", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate query parameters are required" });
      }

      const selectedCalendars = await storage.getSelectedCalendarsByVendor(vendorId);
      const writeTarget = await storage.getWriteTargetCalendar(vendorId);
      
      const accounts = await storage.getCalendarAccountsByVendor(vendorId);
      const accountsMap = new Map(accounts.map(acc => [acc.id, acc]));

      const allBusySlots: Array<{ start: Date; end: Date; calendarId: string; calendarName: string }> = [];
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      for (const cal of selectedCalendars) {
        const account = accountsMap.get(cal.accountId);
        if (!account) continue;

        try {
          if (account.provider === 'google') {
            const { getFreeBusy } = await import("../googleCalendar");
            const busySlots = await getFreeBusy(cal.providerCalendarId, start, end);
            busySlots.forEach(slot => {
              allBusySlots.push({
                ...slot,
                calendarId: cal.id,
                calendarName: cal.displayName,
              });
            });
          } else if (account.provider === 'outlook') {
            const { getAvailability } = await import("../outlookCalendar");
            const availability = await getAvailability(start, end);
            availability.forEach(window => {
              window.slots.forEach(slot => {
                if (!slot.available) {
                  allBusySlots.push({
                    start: new Date(slot.start),
                    end: new Date(slot.end),
                    calendarId: cal.id,
                    calendarName: cal.displayName,
                  });
                }
              });
            });
          }
        } catch (calendarError) {
          console.log(`Could not fetch from calendar ${cal.displayName}:`, calendarError);
        }
      }

      const sortedSlots = allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
      const mergedBusySlots: Array<{ start: string; end: string; sources: string[] }> = [];
      
      for (const slot of sortedSlots) {
        const lastMerged = mergedBusySlots[mergedBusySlots.length - 1];
        if (lastMerged && new Date(lastMerged.end) >= slot.start) {
          lastMerged.end = new Date(Math.max(new Date(lastMerged.end).getTime(), slot.end.getTime())).toISOString();
          if (!lastMerged.sources.includes(slot.calendarName)) {
            lastMerged.sources.push(slot.calendarName);
          }
        } else {
          mergedBusySlots.push({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            sources: [slot.calendarName],
          });
        }
      }

      const calendarsByAccount = selectedCalendars.reduce((acc, cal) => {
        const account = accountsMap.get(cal.accountId);
        if (!account) return acc;
        
        if (!acc[account.id]) {
          acc[account.id] = {
            account: {
              id: account.id,
              email: account.email,
              provider: account.provider,
              status: account.status,
              label: account.label,
            },
            calendars: [],
          };
        }
        
        acc[account.id].calendars.push({
          id: cal.id,
          providerCalendarId: cal.providerCalendarId,
          displayName: cal.displayName,
          color: cal.color,
          isPrimary: cal.isPrimary,
          isWriteTarget: cal.isWriteTarget,
        });
        
        return acc;
      }, {} as Record<string, any>);

      res.json({
        selectedCalendars: selectedCalendars.map(cal => ({
          id: cal.id,
          providerCalendarId: cal.providerCalendarId,
          displayName: cal.displayName,
          color: cal.color,
          accountId: cal.accountId,
          isWriteTarget: cal.isWriteTarget,
        })),
        writeTarget: writeTarget ? {
          id: writeTarget.id,
          providerCalendarId: writeTarget.providerCalendarId,
          displayName: writeTarget.displayName,
          accountId: writeTarget.accountId,
        } : null,
        accounts: Object.values(calendarsByAccount),
        aggregatedBusySlots: mergedBusySlots,
        totalSelectedCalendars: selectedCalendars.length,
        hasWriteTarget: !!writeTarget,
      });
    } catch (error) {
      console.error("Error fetching aggregated availability:", error);
      res.status(500).json({ error: "Failed to fetch aggregated availability" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { accountId, vendorId, providerCalendarId, displayName, color, isPrimary } = req.body;
      if (!accountId || !vendorId || !providerCalendarId || !displayName) {
        return res.status(400).json({ error: "accountId, vendorId, providerCalendarId, and displayName are required" });
      }
      
      const calendar = await storage.createVendorCalendar({
        accountId,
        vendorId,
        providerCalendarId,
        displayName,
        color: color || null,
        isPrimary: isPrimary || false,
        isSelected: true,
        isWriteTarget: false,
        syncDirection: 'read',
      });
      res.json(calendar);
    } catch (error) {
      console.error("Error creating vendor calendar:", error);
      res.status(500).json({ error: "Failed to create vendor calendar" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const { isSelected, isWriteTarget, syncDirection } = req.body;
      
      if (isWriteTarget === true) {
        const calendar = await storage.getVendorCalendar(req.params.id);
        if (calendar) {
          const currentWriteTarget = await storage.getWriteTargetCalendar(calendar.vendorId);
          if (currentWriteTarget && currentWriteTarget.id !== req.params.id) {
            await storage.updateVendorCalendar(currentWriteTarget.id, { isWriteTarget: false });
          }
        }
      }
      
      const calendar = await storage.updateVendorCalendar(req.params.id, req.body);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.json(calendar);
    } catch (error) {
      console.error("Error updating vendor calendar:", error);
      res.status(500).json({ error: "Failed to update vendor calendar" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deleteVendorCalendar(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.json({ message: "Calendar deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor calendar:", error);
      res.status(500).json({ error: "Failed to delete vendor calendar" });
    }
  });

  return router;
}
