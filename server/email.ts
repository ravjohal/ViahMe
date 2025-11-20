import { Resend } from 'resend';

let connectionSettings: any;

export enum EmailTemplate {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  WELCOME_COUPLE = 'welcome_couple',
  WELCOME_VENDOR = 'welcome_vendor',
}

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
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
  const { client, fromEmail } = await getUncachableResendClient();
  
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
    const result = await client.emails.send({
      from: fromEmail,
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
  const { client, fromEmail } = await getUncachableResendClient();
  
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
    const result = await client.emails.send({
      from: fromEmail,
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
  const { client, fromEmail } = await getUncachableResendClient();
  
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
    const result = await client.emails.send({
      from: fromEmail,
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

export async function sendEmail(params: {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
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
    const result = await client.emails.send({
      from: fromEmail,
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
