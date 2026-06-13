# OOMS NIGERIA - ENTERPRISE POSTGRESQL MIGRATION GUIDE
### PLATFORM HARDENING & PRODUCTION READINESS SPRINT

This migration document outlines the procedural steps to transition the OOMS Nigeria backend database engine from localized **SQLite** to production-targeted **PostgreSQL**.

---

## 1. PRISMA SCHEMA COMPARISON & COMPATIBILITY LAYER

The active Prisma schema (`prisma/schema.prisma`) is built using standard SQLite directives. PostgreSQL introduces strict typing, UUIDs, full-featured datetime clocks, and indexing pipelines.

### Necessary Schema Adjustments
For high-volume operations, update `prisma/schema.prisma` before migration:

1. **Datasource Provider Update**:
   Change:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   To:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Primitive Mappings (SQLite vs PostgreSQL)**:
   * **IDs / Strings**: While SQLite represents `@id` with string/default auto-increments, you may optimize them for PostgreSQL using UUIDs:
     ```prisma
     id String @id @default(uuid()) @db.Uuid
     ```
   * **Int / BigInt**: Standard `@db.Integer` or `@db.BigInt` mappings can be used on numeric scales.
   * **JSON Representation**: SQLite stores stringified representations, whereas PostgreSQL supports actual binary json (`Json` type maps natively to `@db.JsonB` for indexed document metadata).

---

## 2. PRODUCTION TARGET CLOUDS (NEON, SUPABASE, RENDER, AWS)

### A. Neon (Serverless Postgres)
* **Description**: Perfect for autoscaling systems, scale-to-zero capability.
* **Connection format**: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require&pgbouncer=true` (Use direct connection strings for migrations, pooled strings for applet instances).
* **Environment Configuration**: Set `DATABASE_URL` in the secrets console.

### B. Supabase (In-place DBMS & API Suite)
* **Description**: Hosted PostgreSQL instances inside structured database container namespaces.
* **Direct Access port**: `5432` for running migrations.
* **Pgbouncer transaction pool port**: `6543` for active application connection layers.

### C. Render PostgreSQL (Managed Instance)
* **Description**: Standalone managed instances with instant SSL gating.
* **Configuration Requirement**: Appends `?ssl=true` to the standard URL connection schema in `.env`.

### D. AWS RDS / Aurora Serverless (Enterprise Relational Multi-AZ)
* **Description**: Custom VPC backed relational endpoints setup with high-availability read replicas.
* **Security Rule Requirement**: Configure VPC Security Groups to allow port `5432` TCP Inbound CIDR rules originating from the Cloud Run instances.

---

## 3. PROCEDURAL INTEGRATION CHECKLIST (STEP-BY-STEP)

- [ ] **Step 1: Backup Local SQLite Cluster**
  Ensure `/prisma/backups/dev-latest.db` is copied.

- [ ] **Step 2: Provision High-Availability Postgres Instance**
  Create cloud DB instance in `eu-west-2` (London) or nearest GCP region matching your server instance.

- [ ] **Step 3: Modify Schema Provider**
  Edit `prisma/schema.prisma` to set `provider = "postgresql"`.

- [ ] **Step 4: Execute Database Dry-Run Schema Sync**
  Run:
  ```bash
  npx prisma db push --dry-run
  ```

- [ ] **Step 5: Apply Migrations & Generate Assets**
  Run schema validation and apply structural tables to target PostgreSQL instance:
  ```bash
  npx prisma db push
  npx prisma generate
  ```

- [ ] **Step 6: Trigger Data Porting Execution**
  Utilize custom pg-loaders or native schema porting tools (e.g. `sqlite3-to-postgres` script) to map historic relations.

- [ ] **Step 7: Re-seed Critical System Users**
  Initiate applet bootstrap in Postgres-mode; the auto-seeding service will verify model count and generate standard security records if needed.

---

## 4. DEPLOYMENT & ROLLBACK PROTOCOLS

In the event of connection locks, deadlocks, or transactional crashes:

### ROLLBACK ACTIONS
1. **Immediate Environment Downgrade**:
   Point the active `DATABASE_URL` back to the SQLite local target folder:
   ```env
   DATABASE_URL="file:./prisma/recovery/dev.db"
   ```
2. **Re-compile Client Assets**:
   Change schema datasource provider to `sqlite` and execute:
   ```bash
   npx prisma generate
   ```
3. **Restart Virtual Nodes**:
   Restart development or production servers to release memory handles on the external PostgreSQL pools.
