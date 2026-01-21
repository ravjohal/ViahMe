import * as brevo from '@getbrevo/brevo';

export enum EmailTemplate {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  WELCOME_COUPLE = 'welcome_couple',
  WELCOME_VENDOR = 'welcome_vendor',
}

const DEFAULT_FROM_EMAIL = 'noreply@viah.me';
const DEFAULT_FROM_NAME = 'Viah.me';

interface BrevoEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is not set');
  }

  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  
  return {
    client: apiInstance,
    fromEmail: process.env.BREVO_FROM_EMAIL || DEFAULT_FROM_EMAIL,
    fromName: process.env.BREVO_FROM_NAME || DEFAULT_FROM_NAME,
  };
}

export async function sendBrevoEmail(params: BrevoEmailParams) {
  const { client, fromEmail, fromName } = await getBrevoClient();
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { email: fromEmail, name: fromName };
  sendSmtpEmail.to = [{ email: params.to }];
  sendSmtpEmail.subject = params.subject;
  sendSmtpEmail.htmlContent = params.html;
  if (params.text) {
    sendSmtpEmail.textContent = params.text;
  }

  try {
    const result = await client.sendTransacEmail(sendSmtpEmail);
    console.log('[Brevo] Email sent successfully:', result.body);
    return result;
  } catch (error: any) {
    console.error('[Brevo] Failed to send email:', error?.body || error);
    throw error;
  }
}

export async function getUncachableResendClient() {
  return getBrevoClient();
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  coupleName: string;
  vendorName: string;
  vendorCategory: string;
  eventName: string;
  eventDate: string;
  timeSlot: string;
  bookingId: string;
}) {
  const { to, coupleName, vendorName, vendorCategory, eventName, eventDate, timeSlot } = params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .label {
            font-weight: 600;
            color: #92400e;
          }
          .value {
            color: #78350f;
          }
          .button {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${coupleName},</p>
          
          <p>Great news! Your vendor booking has been confirmed for your upcoming celebration.</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Vendor:</span>
              <span class="value">${vendorName}</span>
            </div>
            <div class="details-row">
              <span class="label">Category:</span>
              <span class="value">${vendorCategory}</span>
            </div>
            <div class="details-row">
              <span class="label">Event:</span>
              <span class="value">${eventName}</span>
            </div>
            <div class="details-row">
              <span class="label">Date:</span>
              <span class="value">${eventDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Time Slot:</span>
              <span class="value">${timeSlot}</span>
            </div>
          </div>
          
          <p>The vendor has been notified and will reach out to you shortly to finalize the details.</p>
          
          <p>You can view and manage all your bookings anytime from your dashboard.</p>
          
          <center>
            <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://your-domain.replit.app'}/vendors" class="button">View My Bookings</a>
          </center>
          
          <p style="margin-top: 30px;">Best wishes for your celebration!</p>
          <p><strong>Viah.me Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email from Viah.me.</p>
          <p>Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `Booking Confirmed: ${vendorName} for ${eventName}`,
      html,
    });
    return result;
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
}

export async function sendVendorNotificationEmail(params: {
  to: string;
  vendorName: string;
  coupleName: string;
  eventName: string;
  eventDate: string;
  timeSlot: string;
  bookingId: string;
  coupleEmail?: string;
  couplePhone?: string;
}) {
  const { to, vendorName, coupleName, eventName, eventDate, timeSlot, coupleEmail, couplePhone } = params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .label {
            font-weight: 600;
            color: #065f46;
          }
          .value {
            color: #047857;
          }
          .button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 New Booking Request</h1>
        </div>
        <div class="content">
          <p>Dear ${vendorName},</p>
          
          <p>You have received a new booking request through Viah.me!</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Client:</span>
              <span class="value">${coupleName}</span>
            </div>
            <div class="details-row">
              <span class="label">Event:</span>
              <span class="value">${eventName}</span>
            </div>
            <div class="details-row">
              <span class="label">Date:</span>
              <span class="value">${eventDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Time Slot:</span>
              <span class="value">${timeSlot}</span>
            </div>
            ${coupleEmail ? `
            <div class="details-row">
              <span class="label">Email:</span>
              <span class="value">${coupleEmail}</span>
            </div>
            ` : ''}
            ${couplePhone ? `
            <div class="details-row">
              <span class="label">Phone:</span>
              <span class="value">${couplePhone}</span>
            </div>
            ` : ''}
          </div>
          
          <p>Please reach out to the couple promptly to confirm availability and discuss the details.</p>
          
          <p>This booking is now showing as "booked" on your calendar to prevent double bookings.</p>
          
          <center>
            <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://your-domain.replit.app'}/vendor-availability" class="button">View My Calendar</a>
          </center>
          
          <p style="margin-top: 30px;">Thank you for being part of Viah.me!</p>
          <p><strong>Viah.me Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Viah.me.</p>
          <p>Connecting South Asian couples with culturally-specialized vendors</p>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `New Booking: ${coupleName} for ${eventName} on ${eventDate}`,
      html,
    });
    return result;
  } catch (error) {
    console.error('Failed to send vendor notification email:', error);
    throw error;
  }
}

export async function sendRsvpConfirmationEmail(params: {
  to: string;
  guestName: string;
  eventName: string;
  eventDate: string;
  eventVenue?: string;
  rsvpStatus: 'attending' | 'not_attending' | 'maybe';
  coupleName: string;
}) {
  const { to, guestName, eventName, eventDate, eventVenue, rsvpStatus, coupleName } = params;
  
  const statusText = rsvpStatus === 'attending' ? 'will be attending' : 
                     rsvpStatus === 'not_attending' ? 'will not be attending' : 
                     'marked as maybe';
  
  const statusColor = rsvpStatus === 'attending' ? '#10b981' : 
                      rsvpStatus === 'not_attending' ? '#ef4444' : 
                      '#f59e0b';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #ede9fe;
            border-left: 4px solid ${statusColor};
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .label {
            font-weight: 600;
            color: #5b21b6;
          }
          .value {
            color: #6d28d9;
          }
          .status-badge {
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ RSVP Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${guestName},</p>
          
          <p>Thank you for responding to ${coupleName}'s wedding invitation!</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Event:</span>
              <span class="value">${eventName}</span>
            </div>
            <div class="details-row">
              <span class="label">Date:</span>
              <span class="value">${eventDate}</span>
            </div>
            ${eventVenue ? `
            <div class="details-row">
              <span class="label">Venue:</span>
              <span class="value">${eventVenue}</span>
            </div>
            ` : ''}
            <div class="details-row">
              <span class="label">Your Response:</span>
              <span class="value"><span class="status-badge">${statusText}</span></span>
            </div>
          </div>
          
          ${rsvpStatus === 'attending' ? `
            <p>We're thrilled you'll be joining the celebration! You'll receive event details and updates as the date approaches.</p>
          ` : rsvpStatus === 'not_attending' ? `
            <p>We're sorry you won't be able to make it, but we appreciate you letting us know.</p>
          ` : `
            <p>Thank you for your response. Please update your RSVP once you have confirmed your plans.</p>
          `}
          
          <p>If you need to change your RSVP, you can update it anytime from the wedding website.</p>
          
          <p style="margin-top: 30px;">Warm regards,</p>
          <p><strong>Viah.me Team</strong><br>on behalf of ${coupleName}</p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email from Viah.me.</p>
          <p>Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `RSVP Confirmed for ${eventName}`,
      html,
    });
    return result;
  } catch (error) {
    console.error('Failed to send RSVP confirmation email:', error);
    throw error;
  }
}

export async function sendInvitationEmail(params: {
  to: string;
  householdName: string;
  coupleName: string;
  magicLink: string;
  eventNames: string[];
  weddingDate?: string;
  personalMessage?: string;
}) {
  const { to, householdName, coupleName, magicLink, eventNames, weddingDate, personalMessage } = params;
  
  const eventsList = eventNames.map(name => `<li>${name}</li>`).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .events-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .events-box h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 16px;
          }
          .events-box ul {
            margin: 0;
            padding-left: 20px;
            color: #78350f;
          }
          .message-box {
            background: #ede9fe;
            border-left: 4px solid #8b5cf6;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
            font-style: italic;
            color: #5b21b6;
          }
          .button {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin-top: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
          .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Dear ${householdName},</p>
          
          <p>You are cordially invited to celebrate the wedding of <strong>${coupleName}</strong>!</p>
          
          ${weddingDate ? `<p>Wedding Date: <span class="highlight">${weddingDate}</span></p>` : ''}
          
          ${personalMessage ? `
          <div class="message-box">
            ${personalMessage}
          </div>
          ` : ''}
          
          <div class="events-box">
            <h3>You are invited to the following events:</h3>
            <ul>
              ${eventsList}
            </ul>
          </div>
          
          <p><strong>Please RSVP for each event by clicking the link below.</strong> You'll be able to let us know who from your household will be attending, any dietary restrictions, and more.</p>
          
          <center>
            <a href="${magicLink}" class="button">View Invitation & RSVP</a>
          </center>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <strong>Important:</strong> This invitation link is unique to your household and expires in 30 days from the date of this email. You can return to this link at any time to update your RSVP before it expires. If your link has expired, please contact the couple for a new invitation.
          </p>
          
          <p style="margin-top: 30px;">We can't wait to celebrate with you!</p>
          <p><strong>With love,</strong><br>${coupleName}</p>
        </div>
        <div class="footer">
          <p>This invitation was sent via Viah.me</p>
          <p>Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
You're Invited!

Dear ${householdName},

You are cordially invited to celebrate the wedding of ${coupleName}!

${weddingDate ? `Wedding Date: ${weddingDate}\n` : ''}
${personalMessage ? `\nPersonal Message:\n${personalMessage}\n` : ''}

You are invited to the following events:
${eventNames.map(name => `- ${name}`).join('\n')}

Please RSVP for each event by visiting the link below. You'll be able to let us know who from your household will be attending, any dietary restrictions, and more.

View Invitation & RSVP:
${magicLink}

IMPORTANT: This invitation link is unique to your household and expires in 30 days from the date of this email. You can return to this link at any time to update your RSVP before it expires. If your link has expired, please contact the couple for a new invitation.

We can't wait to celebrate with you!

With love,
${coupleName}

---
This invitation was sent via Viah.me
Your South Asian Wedding Planning Platform
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `Wedding Invitation from ${coupleName}`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}

export async function sendCollaboratorInviteEmail(params: {
  to: string;
  inviterName: string;
  weddingTitle: string;
  roleName: string;
  inviteUrl: string;
}) {
  const { to, inviterName, weddingTitle, roleName, inviteUrl } = params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .role-badge {
            display: inline-block;
            background: #fce7f3;
            color: #be185d;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin-top: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>You're Invited to Plan Together!</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to help plan their wedding on Viah.me!</p>
          <p>Wedding: <strong>${weddingTitle}</strong></p>
          <p>Your role: <span class="role-badge">${roleName}</span></p>
          <p>As a ${roleName}, you'll be able to collaborate on planning tasks, view timelines, and help make this celebration unforgettable.</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </div>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${inviteUrl}</span>
          </p>
          <p style="margin-top: 30px;">Warm regards,</p>
          <p><strong>The Viah.me Team</strong></p>
        </div>
        <div class="footer">
          <p>Your South Asian Wedding Planning Platform</p>
          <p>This invitation link expires in 7 days.</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
You're Invited to Plan Together!

Hi there,

${inviterName} has invited you to help plan their wedding on Viah.me!

Wedding: ${weddingTitle}
Your role: ${roleName}

As a ${roleName}, you'll be able to collaborate on planning tasks, view timelines, and help make this celebration unforgettable.

Accept your invitation by visiting:
${inviteUrl}

This invitation link expires in 7 days.

Warm regards,
The Viah.me Team

---
Viah.me - Your South Asian Wedding Planning Platform
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `${inviterName} invited you to plan their wedding on Viah.me`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send collaborator invite email:', error);
    throw error;
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}) {
  const { to, subject, template, data } = params;

  let html = '';

  if (template === EmailTemplate.VERIFICATION) {
    const { verificationUrl, userEmail } = data;
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #f97316;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Viah.me!</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Thank you for registering with Viah.me! Please verify your email address to complete your account setup.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>The Viah.me Team</strong></p>
          </div>
          <div class="footer">
            <p>Your South Asian Wedding Planning Platform</p>
          </div>
        </body>
      </html>
    `;
  } else if (template === EmailTemplate.PASSWORD_RESET) {
    const { resetUrl, userEmail } = data;
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #f97316;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>You requested to reset your password for your Viah.me account.</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>The Viah.me Team</strong></p>
          </div>
          <div class="footer">
            <p>Your South Asian Wedding Planning Platform</p>
          </div>
        </body>
      </html>
    `;
  } else if (template === EmailTemplate.WELCOME_COUPLE) {
    const { userName } = data;
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Viah.me!</h1>
          </div>
          <div class="content">
            <p>Congratulations on taking the first step toward planning your dream South Asian wedding!</p>
            <p>We're thrilled to have you join the Viah.me community. Your account is now active and ready to help you plan every detail of your special celebration.</p>
            <p>Start exploring culturally-specialized vendors, create your timeline, manage your budget, and so much more!</p>
            <p style="margin-top: 30px;">Best wishes,<br><strong>The Viah.me Team</strong></p>
          </div>
          <div class="footer">
            <p>Your South Asian Wedding Planning Platform</p>
          </div>
        </body>
      </html>
    `;
  } else if (template === EmailTemplate.WELCOME_VENDOR) {
    const { vendorName } = data;
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Viah.me!</h1>
          </div>
          <div class="content">
            <p>Welcome to the Viah.me Vendor Network!</p>
            <p>We're excited to have you join our platform of culturally-specialized wedding service providers. Your vendor account is now active.</p>
            <p>Next steps:</p>
            <ul>
              <li>Complete your vendor profile with photos and descriptions</li>
              <li>Set your availability and pricing</li>
              <li>Start connecting with couples planning their dream weddings</li>
            </ul>
            <p style="margin-top: 30px;">Best regards,<br><strong>The Viah.me Team</strong></p>
          </div>
          <div class="footer">
            <p>Your South Asian Wedding Vendor Platform</p>
          </div>
        </body>
      </html>
    `;
  }

  try {
    const result = await sendBrevoEmail({
      to,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendTimelineChangeEmail(params: {
  to: string;
  vendorName: string;
  eventName: string;
  eventDate?: string;
  oldTime: string;
  newTime: string;
  weddingTitle: string;
  coupleName: string;
  note?: string;
  acknowledgeUrl: string;
}) {
  const { to, vendorName, eventName, eventDate, oldTime, newTime, weddingTitle, coupleName, note, acknowledgeUrl } = params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .alert-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .change-details {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .time-change {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 18px;
            margin: 15px 0;
          }
          .old-time {
            text-decoration: line-through;
            color: #9ca3af;
          }
          .arrow {
            color: #f97316;
            font-weight: bold;
          }
          .new-time {
            color: #16a34a;
            font-weight: bold;
          }
          .button-container {
            text-align: center;
            margin: 25px 0;
          }
          .button {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
          }
          .button:hover {
            background: #15803d;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .note-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 12px 16px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Timeline Change Alert</h1>
        </div>
        <div class="content">
          <p>Hello ${vendorName},</p>
          
          <div class="alert-box">
            <strong>Important:</strong> The wedding timeline has been updated and requires your attention.
          </div>
          
          <div class="change-details">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Event Details:</p>
            <p style="margin: 5px 0;"><strong>Wedding:</strong> ${weddingTitle}</p>
            <p style="margin: 5px 0;"><strong>Couple:</strong> ${coupleName}</p>
            <p style="margin: 5px 0;"><strong>Event:</strong> ${eventName}</p>
            ${eventDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>` : ''}
            
            <div class="time-change">
              <span class="old-time">${oldTime || 'Not set'}</span>
              <span class="arrow">→</span>
              <span class="new-time">${newTime}</span>
            </div>
          </div>
          
          ${note ? `
            <div class="note-box">
              <strong>Note from the couple:</strong><br>
              ${note}
            </div>
          ` : ''}
          
          <p>Please acknowledge this change to confirm you've received and noted the updated schedule.</p>
          
          <div class="button-container">
            <a href="${acknowledgeUrl}" class="button">Acknowledge Change</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions or concerns about this change, please contact the couple directly through the Viah.me messaging system.
          </p>
        </div>
        <div class="footer">
          <p>This notification was sent via Viah.me</p>
          <p>Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
TIMELINE CHANGE ALERT

Hello ${vendorName},

The wedding timeline has been updated and requires your attention.

Wedding: ${weddingTitle}
Couple: ${coupleName}
Event: ${eventName}
${eventDate ? `Date: ${eventDate}` : ''}

TIME CHANGE: ${oldTime || 'Not set'} → ${newTime}

${note ? `Note from couple: ${note}` : ''}

Please acknowledge this change by visiting:
${acknowledgeUrl}

If you have any questions, please contact the couple through the Viah.me messaging system.

---
This notification was sent via Viah.me
Your South Asian Wedding Planning Platform
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `Timeline Change: ${eventName} - ${weddingTitle}`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send timeline change email:', error);
    throw error;
  }
}

export async function sendQuoteRequestEmail(params: {
  to: string;
  vendorName: string;
  senderName: string;
  senderEmail: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  guestCount?: number;
  budgetRange?: string;
  additionalNotes?: string;
  weddingTitle?: string;
}) {
  const {
    to,
    vendorName,
    senderName,
    senderEmail,
    eventName,
    eventDate,
    eventLocation,
    guestCount,
    budgetRange,
    additionalNotes,
    weddingTitle,
  } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details-card {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .detail-row {
            display: flex;
            margin: 10px 0;
          }
          .detail-label {
            font-weight: 600;
            color: #92400e;
            width: 140px;
            flex-shrink: 0;
          }
          .detail-value {
            color: #78350f;
          }
          .notes-box {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 20px 0;
          }
          .notes-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
          }
          .button:hover {
            background: #ea580c;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            background: white;
            border-radius: 0 0 8px 8px;
          }
          .contact-info {
            background: #eff6ff;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Quote Request</h1>
          <p>A couple is interested in your services!</p>
        </div>
        <div class="content">
          <p>Hello ${vendorName},</p>
          
          <p>You have received a new quote request through Viah.me. Here are the details:</p>
          
          <div class="details-card">
            ${weddingTitle ? `<div class="detail-row"><span class="detail-label">Wedding:</span><span class="detail-value">${weddingTitle}</span></div>` : ''}
            <div class="detail-row">
              <span class="detail-label">Event:</span>
              <span class="detail-value">${eventName}</span>
            </div>
            ${eventDate ? `<div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${eventDate}</span></div>` : ''}
            ${eventLocation ? `<div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">${eventLocation}</span></div>` : ''}
            ${guestCount ? `<div class="detail-row"><span class="detail-label">Guest Count:</span><span class="detail-value">${guestCount} guests</span></div>` : ''}
            ${budgetRange ? `<div class="detail-row"><span class="detail-label">Budget Range:</span><span class="detail-value">${budgetRange}</span></div>` : ''}
          </div>
          
          ${additionalNotes ? `
            <div class="notes-box">
              <div class="notes-label">Additional Notes from the Couple:</div>
              <p style="margin: 0; color: #4b5563;">${additionalNotes}</p>
            </div>
          ` : ''}
          
          <div class="contact-info">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">Contact Information</p>
            <p style="margin: 0; color: #3b82f6;">
              <strong>Name:</strong> ${senderName}<br>
              <strong>Email:</strong> <a href="mailto:${senderEmail}" style="color: #3b82f6;">${senderEmail}</a>
            </p>
          </div>
          
          <p>Please reply directly to the couple at <a href="mailto:${senderEmail}" style="color: #f97316;">${senderEmail}</a> to provide your quote and discuss their requirements.</p>
        </div>
        <div class="footer">
          <p>This quote request was sent via Viah.me</p>
          <p>Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
NEW QUOTE REQUEST

Hello ${vendorName},

You have received a new quote request through Viah.me.

DETAILS:
${weddingTitle ? `Wedding: ${weddingTitle}` : ''}
Event: ${eventName}
${eventDate ? `Date: ${eventDate}` : ''}
${eventLocation ? `Location: ${eventLocation}` : ''}
${guestCount ? `Guest Count: ${guestCount} guests` : ''}
${budgetRange ? `Budget Range: ${budgetRange}` : ''}

${additionalNotes ? `ADDITIONAL NOTES:\n${additionalNotes}` : ''}

CONTACT INFORMATION:
Name: ${senderName}
Email: ${senderEmail}

Please reply directly to the couple at ${senderEmail} to provide your quote and discuss their requirements.

---
This quote request was sent via Viah.me
Your South Asian Wedding Planning Platform
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `Quote Request: ${eventName}${weddingTitle ? ` - ${weddingTitle}` : ''}`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send quote request email:', error);
    throw error;
  }
}

export async function sendInquiryClosedEmail(params: {
  to: string;
  vendorName: string;
  coupleName: string;
  reason?: string;
}) {
  const { to, vendorName, coupleName, reason } = params;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #f3f4f6;
            border-left: 4px solid #6b7280;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inquiry Closed</h1>
        </div>
        <div class="content">
          <p>Dear ${vendorName},</p>
          
          <p>We wanted to let you know that <strong>${coupleName}</strong> has decided to close their inquiry with you.</p>
          
          ${reason ? `
          <div class="details">
            <strong>Reason provided:</strong>
            <p style="margin: 8px 0 0 0;">${reason}</p>
          </div>
          ` : ''}
          
          <p>This may mean they've decided to go in a different direction for their wedding planning. We appreciate your time and responsiveness.</p>
          
          <p>You'll continue to receive new inquiries from other couples looking for your services. Keep your profile updated to attract more leads!</p>
          
          <p style="margin-top: 30px;">Best regards,</p>
          <p><strong>Viah.me Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Viah.me.</p>
          <p>Connecting South Asian couples with culturally-specialized vendors</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
Inquiry Closed

Dear ${vendorName},

We wanted to let you know that ${coupleName} has decided to close their inquiry with you.

${reason ? `Reason provided:\n${reason}\n` : ''}

This may mean they've decided to go in a different direction for their wedding planning. We appreciate your time and responsiveness.

You'll continue to receive new inquiries from other couples looking for your services. Keep your profile updated to attract more leads!

Best regards,
Viah.me Team

---
This is an automated notification from Viah.me.
Connecting South Asian couples with culturally-specialized vendors
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `Inquiry Closed by ${coupleName}`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send inquiry closed email:', error);
    throw error;
  }
}

export async function sendUpdateEmail(params: {
  to: string;
  householdName: string;
  subject: string;
  message: string;
  weddingName: string;
}) {
  const { to, householdName, subject, message, weddingName } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Wedding Update</h1>
        </div>
        <div class="content">
          <p>Dear ${householdName},</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p style="margin-top: 30px;">With love,<br><strong>${weddingName}</strong></p>
        </div>
        <div class="footer">
          <p>Sent via Viah.me - Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
Wedding Update from ${weddingName}

Dear ${householdName},

${message}

With love,
${weddingName}

---
Sent via Viah.me
Your South Asian Wedding Planning Platform
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `Wedding Update: ${subject}`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send update email:', error);
    throw error;
  }
}

export async function sendRsvpReminderEmail(params: {
  to: string;
  householdName: string;
  coupleName: string;
  magicLink: string;
  weddingDate?: string;
}) {
  const { to, householdName, coupleName, magicLink, weddingDate } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            background: #f97316;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Friendly RSVP Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${householdName},</p>
          <p>We hope this message finds you well! We noticed we haven't received your RSVP yet for our wedding${weddingDate ? ` on ${weddingDate}` : ''}.</p>
          <p>We would love to know if you can join us for this special celebration. Please take a moment to let us know!</p>
          <div style="text-align: center;">
            <a href="${magicLink}" class="button">RSVP Now</a>
          </div>
          <p>If you have any questions or need to discuss anything, please don't hesitate to reach out.</p>
          <p style="margin-top: 30px;">With love,<br><strong>${coupleName}</strong></p>
        </div>
        <div class="footer">
          <p>Sent via Viah.me - Your South Asian Wedding Planning Platform</p>
        </div>
      </body>
    </html>
  `;

  const plaintext = `
Friendly RSVP Reminder

Dear ${householdName},

We hope this message finds you well! We noticed we haven't received your RSVP yet for our wedding${weddingDate ? ` on ${weddingDate}` : ''}.

We would love to know if you can join us for this special celebration. Please take a moment to let us know!

RSVP here: ${magicLink}

If you have any questions or need to discuss anything, please don't hesitate to reach out.

With love,
${coupleName}

---
Sent via Viah.me
Your South Asian Wedding Planning Platform
  `.trim();

  try {
    const result = await sendBrevoEmail({
      to,
      subject: `RSVP Reminder from ${coupleName}`,
      html,
      text: plaintext,
    });
    return result;
  } catch (error) {
    console.error('Failed to send RSVP reminder email:', error);
    throw error;
  }
}
