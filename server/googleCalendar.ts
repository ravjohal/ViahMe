// Google Calendar Integration for Vendor Availability
// Uses Replit's Google Calendar connector for OAuth

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

export interface FreeBusySlot {
  start: Date;
  end: Date;
}

export interface AvailabilityWindow {
  date: string;
  slots: { start: string; end: string; available: boolean }[];
}

// Get list of calendars for the connected account
export async function listCalendars() {
  const calendar = await getUncachableGoogleCalendarClient();
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

// Get events from a specific calendar within a date range
export async function getCalendarEvents(
  calendarId: string = 'primary',
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  
  return events.map(event => ({
    id: event.id || '',
    summary: event.summary || 'Busy',
    description: event.description || undefined,
    start: new Date(event.start?.dateTime || event.start?.date || ''),
    end: new Date(event.end?.dateTime || event.end?.date || ''),
    isAllDay: !event.start?.dateTime,
  }));
}

// Get free/busy information for availability checking
export async function getFreeBusy(
  calendarId: string = 'primary',
  startDate: Date,
  endDate: Date
): Promise<FreeBusySlot[]> {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busySlots = response.data.calendars?.[calendarId]?.busy || [];
  
  return busySlots.map(slot => ({
    start: new Date(slot.start || ''),
    end: new Date(slot.end || ''),
  }));
}

// Generate availability windows for a given date range
export async function getAvailabilityWindows(
  calendarId: string = 'primary',
  startDate: Date,
  endDate: Date,
  workingHoursStart: number = 9, // 9 AM
  workingHoursEnd: number = 18,   // 6 PM
  slotDurationMinutes: number = 60
): Promise<AvailabilityWindow[]> {
  const busySlots = await getFreeBusy(calendarId, startDate, endDate);
  const windows: AvailabilityWindow[] = [];
  
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const finalDate = new Date(endDate);
  finalDate.setHours(23, 59, 59, 999);
  
  while (currentDate <= finalDate) {
    const dayStr = currentDate.toISOString().split('T')[0];
    const slots: { start: string; end: string; available: boolean }[] = [];
    
    // Generate time slots for working hours
    for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);
      
      // Check if this slot overlaps with any busy period
      const isAvailable = !busySlots.some(busy => 
        (slotStart < busy.end && slotEnd > busy.start)
      );
      
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
      });
    }
    
    windows.push({ date: dayStr, slots });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return windows;
}

// Check if a specific time slot is available
export async function isSlotAvailable(
  calendarId: string = 'primary',
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const busySlots = await getFreeBusy(calendarId, startTime, endTime);
  return busySlots.length === 0;
}

// Create a calendar event (for booking confirmations)
export async function createCalendarEvent(
  calendarId: string = 'primary',
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendees?: string[]
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    attendees: attendees?.map(email => ({ email })),
  };
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: attendees ? 'all' : 'none',
  });
  
  return response.data;
}
