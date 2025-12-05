import { Resend } from 'resend';
import twilio from 'twilio';
import type { IStorage } from '../storage';
import type { Task, Wedding, User } from '@shared/schema';

let resendConnectionSettings: any;
let twilioConnectionSettings: any;

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    resendConnectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (!resendConnectionSettings || !resendConnectionSettings.settings?.api_key) {
      return null;
    }
    return {
      apiKey: resendConnectionSettings.settings.api_key,
      fromEmail: resendConnectionSettings.settings.from_email || 'noreply@viah.me'
    };
  } catch (error) {
    console.error('Failed to get Resend credentials:', error);
    return null;
  }
}

async function getTwilioCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    twilioConnectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (!twilioConnectionSettings || !twilioConnectionSettings.settings?.account_sid) {
      return null;
    }
    return {
      accountSid: twilioConnectionSettings.settings.account_sid,
      apiKey: twilioConnectionSettings.settings.api_key,
      apiKeySecret: twilioConnectionSettings.settings.api_key_secret,
      phoneNumber: twilioConnectionSettings.settings.phone_number
    };
  } catch (error) {
    console.error('Failed to get Twilio credentials:', error);
    return null;
  }
}

export class TaskReminderScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timer | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async start(intervalMs: number = 60000 * 60) {
    console.log('Starting task reminder scheduler...');
    await this.checkAndSendReminders();
    this.intervalId = setInterval(() => this.checkAndSendReminders(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async checkAndSendReminders() {
    try {
      const today = new Date();
      const tasksNeedingReminders = await this.storage.getTasksWithRemindersForDate(today);

      console.log(`Found ${tasksNeedingReminders.length} tasks needing reminders today`);

      for (const task of tasksNeedingReminders) {
        await this.processTaskReminder(task, today);
      }
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  }

  private async processTaskReminder(task: Task, today: Date) {
    try {
      const wedding = await this.storage.getWedding(task.weddingId);
      if (!wedding) {
        console.warn(`Wedding not found for task ${task.id}`);
        return;
      }

      const user = await this.storage.getUser(wedding.userId);
      if (!user || !user.email) {
        console.warn(`User or email not found for wedding ${wedding.id}`);
        return;
      }

      const reminderMethod = task.reminderMethod || 'email';

      if (reminderMethod === 'email' || reminderMethod === 'both') {
        const alreadySentEmail = await this.storage.hasReminderBeenSent(task.id, 'email', today);
        if (!alreadySentEmail) {
          await this.sendEmailReminder(task, wedding, user);
        }
      }

      if (reminderMethod === 'sms' || reminderMethod === 'both') {
        const alreadySentSms = await this.storage.hasReminderBeenSent(task.id, 'sms', today);
        if (!alreadySentSms && user.phone) {
          await this.sendSmsReminder(task, wedding, user);
        }
      }
    } catch (error) {
      console.error(`Error processing reminder for task ${task.id}:`, error);
    }
  }

  private async sendEmailReminder(task: Task, wedding: Wedding, user: User) {
    const credentials = await getResendCredentials();
    if (!credentials) {
      console.warn('Resend not configured - skipping email reminder');
      return;
    }

    try {
      const resend = new Resend(credentials.apiKey);
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon';

      await resend.emails.send({
        from: credentials.fromEmail,
        to: user.email,
        subject: `Reminder: ${task.title} - Due ${dueDate}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E07A5F;">Wedding Task Reminder</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>This is a friendly reminder about your upcoming wedding task:</p>
            <div style="background: #f8f8f8; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0;">${task.title}</h3>
              ${task.description ? `<p style="color: #666; margin: 0 0 8px 0;">${task.description}</p>` : ''}
              <p style="font-weight: bold; color: #E07A5F;">Due: ${dueDate}</p>
            </div>
            <p>Don't forget to complete this task for your ${wedding.tradition || ''} wedding celebration!</p>
            <p style="color: #888; font-size: 12px;">— The Viah.me Team</p>
          </div>
        `,
      });

      await this.storage.createTaskReminder({
        taskId: task.id,
        weddingId: task.weddingId,
        reminderType: 'email',
        sentTo: user.email,
        status: 'sent',
      });

      console.log(`Email reminder sent for task ${task.id} to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send email reminder for task ${task.id}:`, error);
      await this.storage.createTaskReminder({
        taskId: task.id,
        weddingId: task.weddingId,
        reminderType: 'email',
        sentTo: user.email,
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  private async sendSmsReminder(task: Task, wedding: Wedding, user: User) {
    if (!user.phone) return;

    const credentials = await getTwilioCredentials();
    if (!credentials) {
      console.warn('Twilio not configured - skipping SMS reminder');
      return;
    }

    try {
      const twilioClient = twilio(credentials.apiKey, credentials.apiKeySecret, {
        accountSid: credentials.accountSid
      });

      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon';

      await twilioClient.messages.create({
        body: `Viah.me Reminder: "${task.title}" is due ${dueDate}. Don't forget to complete this task for your wedding!`,
        from: credentials.phoneNumber,
        to: user.phone,
      });

      await this.storage.createTaskReminder({
        taskId: task.id,
        weddingId: task.weddingId,
        reminderType: 'sms',
        sentTo: user.phone,
        status: 'sent',
      });

      console.log(`SMS reminder sent for task ${task.id} to ${user.phone}`);
    } catch (error: any) {
      console.error(`Failed to send SMS reminder for task ${task.id}:`, error);
      await this.storage.createTaskReminder({
        taskId: task.id,
        weddingId: task.weddingId,
        reminderType: 'sms',
        sentTo: user.phone,
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  async sendTestReminder(userId: string): Promise<{ email: boolean; sms: boolean }> {
    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const results = { email: false, sms: false };

    const resendCreds = await getResendCredentials();
    if (resendCreds && user.email) {
      try {
        const resend = new Resend(resendCreds.apiKey);
        await resend.emails.send({
          from: resendCreds.fromEmail,
          to: user.email,
          subject: 'Viah.me - Test Reminder',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #E07A5F;">Test Reminder</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>This is a test reminder from Viah.me. Your reminder settings are working correctly!</p>
              <p style="color: #888; font-size: 12px;">— The Viah.me Team</p>
            </div>
          `,
        });
        results.email = true;
      } catch (error) {
        console.error('Test email failed:', error);
      }
    }

    const twilioCreds = await getTwilioCredentials();
    if (twilioCreds && user.phone) {
      try {
        const twilioClient = twilio(twilioCreds.apiKey, twilioCreds.apiKeySecret, {
          accountSid: twilioCreds.accountSid
        });
        await twilioClient.messages.create({
          body: 'Viah.me: This is a test reminder. Your SMS notifications are working correctly!',
          from: twilioCreds.phoneNumber,
          to: user.phone,
        });
        results.sms = true;
      } catch (error) {
        console.error('Test SMS failed:', error);
      }
    }

    return results;
  }
}
