# OOMS Nigeria – Operations & Office Management System (OOMS)

## Executive Overview

OOMS Nigeria is an enterprise-grade Operations & Office Management Platform designed to centralize administrative governance, correspondence management, personnel identity management, printer governance, inventory oversight, audit logging, and organizational workflow automation.

The platform is built using a modern cloud-native architecture and supports:

* Identity & Access Management (IAM)
* Personnel Directory
* Role-Based Access Control (RBAC)
* Dynamic Permission Management
* Correspondence Registry
* Printer Governance
* Audit Logging
* Session Management
* Document Management
* Inventory Tracking
* Fleet Management
* Subscription Management
* Email-Based User Invitations

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide Icons

## Backend

* NestJS
* TypeScript
* Prisma ORM
* JWT Authentication

## Database

* Neon PostgreSQL

## Email Infrastructure

* Resend

## Hosting

Frontend:

* Cloudflare Pages (Recommended)
* Vercel (Alternative)

Backend:

* Render

Database:

* Neon PostgreSQL

---

# System Architecture

Frontend (Cloudflare Pages)
|
|
V
Backend API (Render)
|
|
V
Prisma ORM
|
|
V
Neon PostgreSQL

Email Notifications
|
V
Resend

---

# Core Modules

## Identity & Access Management (IAM)

Features:

* Personnel Directory
* User Invitations
* Session Management
* Security Logs
* Clearance Roles
* Permission Matrix
* Device Tracking
* Audit Trails

Roles:

* SUPER_ADMIN
* ADMIN
* MANAGER
* OFFICER
* VIEWER

---

## Correspondence Module

Lifecycle:

Draft
→ Submitted
→ Reviewed
→ Approved
→ Archived

Permissions:

Officer

* Create
* Edit Own Drafts

Manager

* Review
* Return To Draft

Admin

* Approve
* Archive

Super Admin

* Restore
* Permanent Delete

---

## Printer Governance

Features:

* Printer Registry
* Toner Monitoring
* Paper Monitoring
* Print Job Tracking
* Alerts
* Usage Metrics

---

## Inventory Management

Features:

* Item Registration
* Stock Tracking
* Inventory Auditing
* Transaction Logs

---

## Fleet Management

Features:

* Vehicle Registry
* Fuel Tracking
* Maintenance Monitoring

---

## Audit Logging

Every critical action is logged.

Examples:

* LOGIN
* LOGOUT
* USER_CREATED
* INVITATION_CREATED
* INVITATION_EMAIL_SENT
* PASSWORD_RESET
* DOCUMENT_APPROVED
* SESSION_CREATED

---

# Security Architecture

## Authentication

JWT Authentication

Stored:

* User ID
* Role
* Organization ID

All protected routes require:

Authorization: Bearer <token>

---

## Session Registry

Stateful Session Validation

Table:

UserSession

Tracks:

* Token
* Device
* IP Address
* Last Activity

Benefits:

* Session Revocation
* Forced Logout
* Device Monitoring

---

## RBAC

Role-Based Access Control

Implemented Through:

PermissionGuard

Decorator:

@RequirePermission()

Example:

@RequirePermission('documents.create')

---

## Password Security

Passwords are:

* Salted
* Hashed
* Never stored in plaintext

Recommended:

bcrypt
Rounds: 12+

---

# Environment Variables

Required Backend Variables

DATABASE_URL=

JWT_SECRET=

RESEND_API_KEY=

FROM_EMAIL=

FRONTEND_URL=

APP_URL=

Optional Storage Variables

STORAGE_PROVIDER=

AWS_ACCESS_KEY_ID=

AWS_SECRET_ACCESS_KEY=

AWS_BUCKET=

---

# Local Development

## Install Dependencies

npm install

---

## Prisma

Generate Client

npx prisma generate

Push Schema

npx prisma db push

Seed Database

npm run seed

---

## Start Backend

npm run start:dev

---

## Start Frontend

npm run dev

---

# Production Deployment

## Database

Provider:

Neon PostgreSQL

Steps:

1. Create Neon Project
2. Create Production Database
3. Copy Connection String
4. Add DATABASE_URL to Render

---

## Backend Deployment (Render)

### Create Web Service

Connect GitHub Repository

Build Command

npm install && npm run build

Start Command

npm run start:prod

---

### Environment Variables

DATABASE_URL

JWT_SECRET

RESEND_API_KEY

FROM_EMAIL

FRONTEND_URL

APP_URL

---

## Frontend Deployment (Cloudflare Pages)

### Connect Repository

Cloudflare Dashboard

Workers & Pages

Create Project

Connect GitHub Repository

---

### Build Settings

Framework Preset:

Vite

Build Command:

npm run build

Output Directory:

dist

---

### Frontend Variables

VITE_API_URL=https://api.yourdomain.com

---

# Domain Architecture

Production

https://ooms.gov.ng

API

https://api.ooms.gov.ng

Admin

https://admin.ooms.gov.ng

---

# Email Infrastructure

Provider:

Resend

Required DNS Records

SPF

DKIM

DMARC

Verified Domain Required

Example:

[correspondence@ooms.gov.ng](mailto:correspondence@ooms.gov.ng)

---

# Recommended File Storage

Current Phase

Use:

Cloudflare R2

Benefits:

* Near-zero cost
* S3 Compatible
* Fast
* Global CDN

Store:

* Documents
* Correspondence Attachments
* Printer Files
* Exports

Never Store Large Files In PostgreSQL

---

# Production Security Checklist

Before Go-Live

✓ HTTPS Enabled

✓ JWT Secret Rotated

✓ Neon Backups Enabled

✓ Resend Domain Verified

✓ Cloudflare WAF Enabled

✓ Rate Limiting Enabled

✓ Audit Logs Enabled

✓ RBAC Verified

✓ Session Registry Active

✓ Prisma Migrations Applied

✓ Secrets Removed From Repository

✓ Admin Accounts Reviewed

✓ Database Backups Tested

✓ Disaster Recovery Plan Documented

---

# Monitoring

Recommended

* Cloudflare Analytics
* Render Logs
* Neon Monitoring
* Resend Activity Logs

Critical Alerts

* Failed Login Spikes
* Excessive Invitation Requests
* Permission Escalation Attempts
* Database Connection Failures
* Email Delivery Failures

---

# Disaster Recovery

Database

Nightly Backup

Retention:

30 Days

Recovery Objective:

< 1 Hour

Recovery Point Objective:

< 15 Minutes

---

# Support Contacts

Platform Owner:
OOMS Nigeria

Infrastructure:
Cloudflare
Render
Neon
Resend

---

Version:
Production v1.0

Status:
Enterprise Ready
