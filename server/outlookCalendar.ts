// Outlook Calendar Integration for Vendor Availability
// Uses Replit's Outlook connector for OAuth with Microsoft Graph API

import { Client } from '@microsoft/microsoft-graph-client';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  body?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

export interface OutlookCalendar {
  id: string;
  name: string;
  color?: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
}

export interface FreeBusySlot {
  start: Date;
  end: Date;
}

export interface AvailabilityWindow {
  date: string;
  slots: { start: string; end: string; available: boolean }[];
}

// Get list of calendars for the connected Outlook account
export async function listOutlookCalendars(): Promise<OutlookCalendar[]> {
  const client = await getUncachableOutlookClient();
  
  const response = await client
    .api('/me/calendars')
    .get();
  
  return (response.value || []).map((cal: any) => ({
    id: cal.id,
    name: cal.name,
    color: cal.hexColor || cal.color,
    isDefaultCalendar: cal.isDefaultCalendar,
    canEdit: cal.canEdit,
  }));
}

// Get events from a specific Outlook calendar within a date range
// Uses Prefer: outlook.timezone="UTC" header to ensure consistent timezone handling
export async function getOutlookCalendarEvents(
  calendarId: string = 'primary',
  startDate: Date,
  endDate: Date
): Promise<OutlookCalendarEvent[]> {
  const client = await getUncachableOutlookClient();
  
  const apiPath = calendarId === 'primary' 
    ? '/me/calendar/events'
    : `/me/calendars/${calendarId}/events`;
  
  const response = await client
    .api(apiPath)
    .header('Prefer', 'outlook.timezone="UTC"')
    .filter(`start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`)
    .select('id,subject,body,start,end,isAllDay')
    .orderby('start/dateTime')
    .get();

  return (response.value || []).map((event: any) => ({
    id: event.id,
    subject: event.subject || 'Busy',
    body: event.body?.content,
    // With Prefer: outlook.timezone="UTC", all dateTime values are in UTC
    start: new Date(event.start.dateTime + 'Z'),
    end: new Date(event.end.dateTime + 'Z'),
    isAllDay: event.isAllDay || false,
  }));
}

// Get free/busy schedule for Outlook calendar
// Note: This is mailbox-level, not per-calendar. Uses UTC for consistent timezone handling.
export async function getOutlookFreeBusy(
  startDate: Date,
  endDate: Date,
  userEmail?: string
): Promise<FreeBusySlot[]> {
  const client = await getUncachableOutlookClient();
  
  // Get the current user's email if not provided
  let email = userEmail;
  if (!email) {
    const user = await client.api('/me').select('mail,userPrincipalName').get();
    email = user.mail || user.userPrincipalName;
  }
  
  const response = await client
    .api('/me/calendar/getSchedule')
    .post({
      schedules: [email],
      startTime: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC'
      },
      endTime: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC'
      },
      availabilityViewInterval: 60
    });

  const schedule = response.value?.[0];
  if (!schedule || !schedule.scheduleItems) {
    return [];
  }

  // Response times are in UTC since we requested UTC timezone
  return schedule.scheduleItems.map((item: any) => ({
    start: new Date(item.start.dateTime + 'Z'),
    end: new Date(item.end.dateTime + 'Z'),
  }));
}

// Generate availability windows for a given date range
export async function getOutlookAvailabilityWindows(
  startDate: Date,
  endDate: Date,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 18,
  slotDurationMinutes: number = 60
): Promise<AvailabilityWindow[]> {
  const busySlots = await getOutlookFreeBusy(startDate, endDate);
  const windows: AvailabilityWindow[] = [];
  
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const finalDate = new Date(endDate);
  finalDate.setHours(23, 59, 59, 999);
  
  while (currentDate <= finalDate) {
    const dayStr = currentDate.toISOString().split('T')[0];
    const slots: { start: string; end: string; available: boolean }[] = [];
    
    for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);
      
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
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return windows;
}

// Check if a specific time slot is available
export async function isOutlookSlotAvailable(
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const busySlots = await getOutlookFreeBusy(startTime, endTime);
  return busySlots.length === 0;
}

// Create a calendar event in Outlook (for booking confirmations)
export async function createOutlookCalendarEvent(
  calendarId: string = 'primary',
  subject: string,
  body: string,
  startTime: Date,
  endTime: Date,
  attendees?: string[]
) {
  const client = await getUncachableOutlookClient();
  
  const apiPath = calendarId === 'primary' 
    ? '/me/calendar/events'
    : `/me/calendars/${calendarId}/events`;
  
  const event = {
    subject,
    body: {
      contentType: 'HTML',
      content: body,
    },
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: attendees?.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    })),
  };
  
  const response = await client
    .api(apiPath)
    .post(event);
  
  return response;
}

// Delete a calendar event from Outlook
export async function deleteOutlookCalendarEvent(
  calendarId: string = 'primary',
  eventId: string
) {
  const client = await getUncachableOutlookClient();
  
  const apiPath = calendarId === 'primary' 
    ? `/me/calendar/events/${eventId}`
    : `/me/calendars/${calendarId}/events/${eventId}`;
  
  await client
    .api(apiPath)
    .delete();
}
