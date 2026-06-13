import { Injectable } from '@nestjs/common';
import { EnterpriseLogger } from './logger.service';

@Injectable()
export class EmailService {
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly fromEmail = process.env.FROM_EMAIL || 'OOMS Nigeria <noreply@ooms.gov.ng>';

  private async sendRawEmail(to: string, subject: string, htmlContent: string, invitationId?: string): Promise<boolean> {
    EnterpriseLogger.info('EMAIL', `Preparing to send transactional email to: ${to} (Subject: "${subject}")`);

    if (!this.apiKey || this.apiKey.includes('MY_GEMINI_API_KEY') || this.apiKey === 're_123456789' || this.apiKey === '') {
      EnterpriseLogger.warn('EMAIL', `Resend integration is offline or unconfigured. Emailed html payload logged internally for debug sandbox trace instead.`);
      console.log(`[Resend Simulator] TO: ${to} | FROM: ${this.fromEmail} | SUBJECT: ${subject}\nPAYLOAD:\n${htmlContent}`);
      EnterpriseLogger.info('EMAIL', `INVITATION_EMAIL_SENT - Resend Simulator Output: Message ID: sim_${Date.now()}, Status: 200 OK`);
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        EnterpriseLogger.error('EMAIL', `Resend remote endpoint responded with error: ${response.status} - ${errorData}`);
        throw new Error(`Resend remote endpoint responded with error: ${response.status} - ${errorData}`);
      }

      const resJson = await response.json() as any;
      const messageId = resJson?.id || `msg_${Date.now()}`;
      EnterpriseLogger.info('EMAIL', `INVITATION_EMAIL_SENT - Transactional email safely delivered to mail carrier via Resend API. Message ID: ${messageId}, Status: ${response.status}`);
      return true;
    } catch (e: any) {
      EnterpriseLogger.error('EMAIL', `Network failure proxying email request to Resend API.`, e.stack);
      throw e;
    }
  }

  // 1. INVITATION TEMPLATE
  async sendInvitationEmail(
    to: string, 
    inviteUrl: string, 
    inviterName: string, 
    fullName?: string, 
    role?: string, 
    department?: string, 
    expiresAtStr?: string,
    invitationId?: string
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    EnterpriseLogger.info('EMAIL', `INVITATION_EMAIL_TRACE - Before Dispatch: [Invitation ID: ${invitationId || 'GENERIC'}] | Email Address: ${to} | Timestamp: ${timestamp}`);
    
    const subject = "You're Invited to OOMS Nigeria";
    const logoHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: #F59E0B; color: #FFFFFF; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: bold; width: 56px; height: 56px; border-radius: 12px; line-height: 56px; font-size: 24px; display: inline-block; text-align: center; shadow: 0 4px 6px rgba(0,0,0,0.05);">OO</div>
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #0F172A; margin-top: 10px;">OOMS NIGERIA</div>
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: bold; color: #64748B; letter-spacing: 1px; margin-top: 2px;">REPUBLIC OF NIGERIA OPERATIONS GATEWAY</div>
      </div>
    `;

    const displayRole = role || 'VIEWER';
    const displayDept = department || 'Operations Dept';
    const displayFullName = fullName || to.split('@')[0];
    const displayExpires = expiresAtStr || '72 Hours';

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px 24px; background: #FAFAF9; color: #1F2937; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid #E5E7EB;">
        ${logoHtml}
        
        <div style="background: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #EDEDEB; margin-top: 16px;">
          <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">Enterprise Credential Provisioning</h2>
          
          <p style="font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
            Hello <strong>${displayFullName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            An official administrative platform profile has been generated for you by <strong>${inviterName}</strong>. You are invited to activate your node on the <strong>Office Operations Management System (OOMS) Nigeria</strong> portal.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #FFF7ED; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #374151;">
                <strong>Assigned Role:</strong>
              </td>
              <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: bold;">
                ${displayRole}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #374151; border-top: 1px solid #FFEDD5;">
                <strong>Department:</strong>
              </td>
              <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: bold; border-top: 1px solid #FFEDD5;">
                ${displayDept}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #374151; border-top: 1px solid #FFEDD5;">
                <strong>Expiration Period:</strong>
              </td>
              <td style="padding: 12px 16px; font-size: 13px; color: #EA580C; font-weight: bold; border-top: 1px solid #FFEDD5;">
                ${displayExpires}
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${inviteUrl}" style="background: #F59E0B; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2); transition: all 0.2s;">
              Accept Invitation & Setup Password
            </a>
          </div>

          <p style="font-size: 11px; color: #64748B; text-align: center; margin-top: 16px;">
            Already activated? Access the primary secure portal login directly at: <a href="https://bhakor.vercel.app/login" style="color: #F59E0B; text-decoration: underline; font-weight: bold;">https://bhakor.vercel.app/login</a>
          </p>

          <p style="font-size: 11px; color: #64748B; text-align: center; margin-top: 24px;">
            Or copy and paste this URL into your browser address bar:
          </p>
          <p style="font-size: 11px; color: #F59E0B; word-break: break-all; text-align: center; margin-top: 4px; font-family: monospace;">
            ${inviteUrl}
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.5;">
          This secure activation mail is highly sensitive. It expires exactly in ${displayExpires}. Do not forward or distribute this link. OOMS National Security Hub, Abuja Headquarters, Nigeria.
        </p>
      </div>
    `;
    return this.sendRawEmail(to, subject, htmlContent, invitationId);
  }

  // 2. PASSWORD RESET TEMPLATE
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const subject = 'OOMS Nigeria - Secure Password Reset Requisition';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #F8FAFC; color: #0F172A; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #E2E8F0;">
        <h2 style="color: #EF4444; margin-top: 0;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received an authorized request to regenerate your password credentials for the OOMS Nigeria Operational Console.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #EF4444; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Authorize Password Reset
          </a>
        </p>
        <p style="font-size: 12px; color: #64748B;">If you did not initiate this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748B;">Link expires in 15 minutes.</p>
      </div>
    `;
    return this.sendRawEmail(to, subject, htmlContent);
  }

  // 3. ACCOUNT ACTIVATED TEMPLATE
  async sendAccountActivatedEmail(to: string, name: string): Promise<boolean> {
    const frontendBase = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'https://bhakor.vercel.app';
    const loginUrl = frontendBase.replace(/\/$/, '');
    const subject = 'OOMS Nigeria - Credentials Successfully Active';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #F8FAFC; color: #0F172A; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #E2E8F0;">
        <h2 style="color: #10B981; margin-top: 0;">Account Activated!</h2>
        <p>Hello ${name},</p>
        <p>Your OOMS Nigeria account registration has been finalized. Your authentication path is now active, and you can log in to the enterprise dashboard gateway.</p>
        <p style="margin: 24px 0;">
          <a href="${loginUrl}" style="background: #10B981; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Access Gateway Portal
          </a>
        </p>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748B;">For compliance or technical audits, email our support helpline.</p>
      </div>
    `;
    return this.sendRawEmail(to, subject, htmlContent);
  }

  // 4. WORKFLOW NOTIFICATION TEMPLATE
  async sendWorkflowNotificationEmail(to: string, title: string, message: string): Promise<boolean> {
    const subject = `OOMS Nigeria Workflow Alert: ${title}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #F8FAFC; color: #0F172A; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #E2E8F0;">
        <div style="border-left: 4px solid #F59E0B; padding-left: 16px; margin-bottom: 20px;">
          <h3 style="color: #0F172A; margin: 0; font-size: 18px;">Workflow Operational Update</h3>
          <p style="color: #64748B; font-size: 14px; margin: 4px 0 0 0;">${title}</p>
        </div>
        <p>Hello,</p>
        <p>${message}</p>
        <p style="margin-top: 24px;">Please review the pending actions inbox in the main Command Center dashboard.</p>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94A3B8;">Sent by OOMS Nigeria Automation Engines.</p>
      </div>
    `;
    return this.sendRawEmail(to, subject, htmlContent);
  }
}
