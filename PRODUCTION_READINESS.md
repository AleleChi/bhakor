# OOMS Nigeria - Enterprise Production Readiness Guide

This workbook outlines the steps required to transition the **OOMS Nigeria Command & Control Ledger** from SQLite local persistent sandbox into a highly resilient, cloud-native hybrid architecture.

---

## 1. PostgreSQL Database Migration Blueprint

To execute high-scale, production-ready ledger transactions, migrate from SQLite to Postgres.

### Step A: Update Prisma Schema Configuration
Edit `/prisma/schema.prisma` datasource block to point to PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then specify the connection string secrets inside the `.env` configuration file:
```env
DATABASE_URL="postgresql://db_user:db_password@db_host:5432/ooms_prod_db?schema=public"
```

### Step B: Database Introspection & Migration Generation
Execute the following commands in sequence to compile the new Postgres database structure:

```bash
# 1. Generate client schemas
npx prisma generate

# 2. Push schema to the cloud PostgreSQL database or run migrations
npx prisma db push

# 3. Seed initial admin users and organizations
npm run seed
```

---

## 2. Resend - Production Email Notification Agent

To transition the simple in-memory log notifications to multi-department email alerts, use the **Resend API SDK**.

### Step A: Install SDK Dependencies
```bash
npm install resend
```

### Step B: Setup Email Dispatcher Class
Create `/src/server/notifications/email.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EnterpriseEmailService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn('[OOMS - WARNING] RESEND_API_KEY is not defined. Email dispatch falling back to stdout.');
    }
  }

  async sendSecurityAlert(toEmail: string, subject: string, message: string) {
    if (!this.resend) {
      console.log(`[Email Mock Dispatch] To: ${toEmail} | Subject: ${subject} | Body: ${message}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: 'security@ooms-nigeria.gov.ng',
        to: [toEmail],
        subject: `[OOMS SECURITY ALERT] ${subject}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <h2 style="color: #EA580C; margin-top: 0;">Federal Republic of Nigeria</h2>
            <p style="font-size: 14px; font-weight: bold; color: #0F172A;">OOMS Command Ledger Alert</p>
            <hr style="border: none; border-top: 1px solid #F3F4F6;" />
            <p style="font-size: 13px; color: #374151; line-height: 1.6;">${message}</p>
            <small style="color: #6B7280;">This is an automated operational alert generated on behalf of the OOMS Federal Registry Node.</small>
          </div>
        `,
      });
    } catch (error) {
      console.error('[OOMS - Resend Error] Failed to send production alert email:', error);
    }
  }
}
```

---

## 3. Google Cloud Storage Integration for Registry Documents

To scale up from standard local disk uploads, mount a **Google Cloud Storage (GCS)** Bucket utilizing secure pre-signed URLs to ingest restricted clearance PDF/DOC file buffers.

### Step A: Install Cloud Storage SDK
```bash
npm install @google-cloud/storage
```

### Step B: Secure Signed URL Upload Client
Create `/src/server/documents/storage.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class CloudStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
    });
    this.bucketName = process.env.GCS_BUCKET_NAME || 'ooms-nigeria-documents';
  }

  /**
   * Generates a pre-signed, secure, time-limited upload handshake link.
   * This ensures the client posts high-payload file objects directly to Google Buckets,
   * without choking the main NestJS API Gateway threads.
   */
  async generateSecureUploadUrl(fileName: string, contentType: string): Promise<string> {
    const options = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 15 * 60 * 1000, // Link expires in 15 minutes
      contentType: contentType,
    };

    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(`classified/${Date.now()}-${fileName}`)
      .getSignedUrl(options);

    return url;
  }
}
```
