// Twilio SMS Integration for Viah.me
// Uses Replit's Twilio connector for secure credential management

import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

// Send SMS notification for timeline changes
export async function sendTimelineChangeSMS(params: {
  vendorPhone: string;
  vendorName: string;
  eventName: string;
  oldTime: string;
  newTime: string;
  coupleName: string;
  weddingTitle: string;
  note?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    if (!fromNumber) {
      return { success: false, error: 'No Twilio phone number configured' };
    }

    const message = `Viah.me Timeline Update\n\n${params.coupleName}'s wedding "${params.weddingTitle}"\n\n"${params.eventName}" has been rescheduled:\n\nOld time: ${params.oldTime}\nNew time: ${params.newTime}${params.note ? `\n\nNote: ${params.note}` : ''}\n\nPlease log in to your vendor dashboard to acknowledge this change.`;

    const result = await client.messages.create({
      body: message,
      to: params.vendorPhone,
      from: fromNumber
    });

    console.log(`SMS sent to ${params.vendorName} (${params.vendorPhone}): ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Failed to send timeline change SMS:', error);
    return { success: false, error: error.message };
  }
}

// Send general SMS notification
export async function sendSMS(params: {
  to: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    if (!fromNumber) {
      return { success: false, error: 'No Twilio phone number configured' };
    }

    const result = await client.messages.create({
      body: params.message,
      to: params.to,
      from: fromNumber
    });

    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    return { success: false, error: error.message };
  }
}
