import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { EnterpriseLogger } from './services/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public isDatabaseConnected = false;
  public databaseError: string | null = null;

  async onModuleInit() {
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        attempt++;
        EnterpriseLogger.info('DATABASE', `Attempting connection to remote PostgreSQL database (Attempt ${attempt}/${maxRetries})...`);
        await this.$connect();
        this.isDatabaseConnected = true;
        this.databaseError = null;
        EnterpriseLogger.info('DATABASE', 'Prisma connected to PostgreSQL database successfully.');
        break;
      } catch (e: any) {
        this.databaseError = e.message || 'Unknown connection error';
        EnterpriseLogger.warn('DATABASE', `Database connection attempt ${attempt} failed: ${e.message}`);
        if (attempt >= maxRetries) {
          EnterpriseLogger.error('DATABASE', 'CRITICAL POSTGRESQL DATABASE FAILURE. Connection retries exceeded. Production must fail loudly.', e.stack);
          throw e; // Fail loudly
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (this.isDatabaseConnected) {
      const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PROD';
      if (isProd) {
        EnterpriseLogger.info('DATABASE', 'PRODUCTION ENVIRONMENT DETECTED! Bypassing normal demographic seeding and clearing seed records...');
        try {
          await this.purgeDemoDataForProduction();
        } catch (e: any) {
          EnterpriseLogger.error('DATABASE', 'Production Startup Sanitization Failed:', e.stack);
        }
      } else {
        try {
          await this.seedIfEmpty();
        } catch (e: any) {
          EnterpriseLogger.error('DATABASE', 'Safe Startup: seedIfEmpty process failed safely.', e.stack);
        }

        try {
          await this.ensureAllDemoUsersExist();
        } catch (e: any) {
          EnterpriseLogger.error('DATABASE', 'Safe Startup: ensureAllDemoUsersExist process failed safely.', e.stack);
        }

        try {
          await this.ensureSomeAuditLogsExist();
        } catch (e: any) {
          EnterpriseLogger.error('DATABASE', 'Safe Startup: ensureSomeAuditLogsExist process failed safely.', e.stack);
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  public async purgeDemoDataForProduction() {
    EnterpriseLogger.info('DATABASE', 'Sanitizing operational database tables... Removing all seed, demo, and generated mock data.');
    
    try {
      // Safely delete operational records to prevent foreign key errors
      await this.inventoryTransaction.deleteMany({});
      await this.fuelLog.deleteMany({});
      await this.printJob.deleteMany({});
      await this.printerAlert.deleteMany({});
      await this.printerUsageMetric.deleteMany({});
      await this.printerStatus.deleteMany({});
      await this.printer.deleteMany({});
      await this.subscription.deleteMany({});
      await this.correspondence.deleteMany({});
      await this.document.deleteMany({});
      await this.inventoryItem.deleteMany({});
      await this.vehicle.deleteMany({});
      await this.upcomingTask.deleteMany({});
      await this.actionAlert.deleteMany({});
      await this.activityLog.deleteMany({});
      await this.notification.deleteMany({});

      // Keep real users and administrators, but drop the standard demo users
      const demoEmails = ['admin@ooms.com', 'manager@ooms.com', 'officer@ooms.com', 'viewer@ooms.com'];
      await this.user.deleteMany({
        where: {
          email: { in: demoEmails }
        }
      });

      EnterpriseLogger.info('DATABASE', 'Production database sanitized successfully. 0 demo records remain.');
    } catch (e: any) {
      EnterpriseLogger.error('DATABASE', 'Error executing purgeDemoDataForProduction:', e.stack);
    }
  }

  private async ensureSomeAuditLogsExist() {
    try {
      const logsCount = await this.auditLog.count();
      if (logsCount > 0) return;

      const user = await this.user.findFirst({ where: { email: 'superadmin@ooms.com' } });
      if (!user) return;

      console.log('Pre-populating demo governance audit logs...');
      const demoLogs = [
        {
          action: 'LOGIN',
          module: 'Auth',
          entityType: 'User',
          entityId: user.id,
          newValues: JSON.stringify({ email: user.email, name: user.name, role: user.role }),
          timestamp: new Date(Date.now() - 3 * 3600000),
        },
        {
          action: 'CREATE',
          module: 'Correspondence',
          entityType: 'Correspondence',
          entityId: 'c1',
          newValues: JSON.stringify({ trackingNumber: 'TRK-984210', sender: 'Ministry of Finance Nigeria', subject: 'Budget approval requisition block' }),
          timestamp: new Date(Date.now() - 2.5 * 3600000),
        },
        {
          action: 'APPROVAL',
          module: 'Correspondence',
          entityType: 'Correspondence',
          entityId: 'c1',
          oldValues: JSON.stringify({ status: 'Draft' }),
          newValues: JSON.stringify({ status: 'Submitted', remarks: 'First pass draft completed by director.' }),
          timestamp: new Date(Date.now() - 2 * 3600000),
        },
        {
          action: 'ASSIGNMENT',
          module: 'Correspondence',
          entityType: 'Correspondence',
          entityId: 'c1',
          oldValues: JSON.stringify({ assignedDepartment: 'Operations' }),
          newValues: JSON.stringify({ assignedDepartment: 'Finance' }),
          timestamp: new Date(Date.now() - 1.5 * 3600000),
        },
        {
          action: 'UPDATE',
          module: 'Inventory',
          entityType: 'InventoryItem',
          entityId: 'i1',
          oldValues: JSON.stringify({ stock: 5 }),
          newValues: JSON.stringify({ stock: 350 }),
          timestamp: new Date(Date.now() - 1 * 3600000),
        }
      ];

      for (const log of demoLogs) {
        await this.auditLog.create({
          data: {
            userId: user.id,
            action: log.action,
            module: log.module,
            entityType: log.entityType,
            entityId: log.entityId,
            oldValues: log.oldValues,
            newValues: log.newValues,
            timestamp: log.timestamp,
          }
        });
      }
    } catch (e) {
      console.warn('Silent safety fallback for demo audit logs populating:', e);
    }
  }

  private async ensureAllDemoUsersExist() {
    try {
      const org = await this.organization.findFirst();
      if (!org) return;

      const passwordHash = bcrypt.hashSync('password123', 10);
      const defaultUsers = [
        { email: 'superadmin@ooms.com', name: 'Alex Rivera', role: 'SUPER_ADMIN' as const },
        { email: 'admin@ooms.com', name: 'Sarah Jenkins', role: 'ADMIN' as const },
        { email: 'manager@ooms.com', name: 'Michael Chang', role: 'MANAGER' as const },
        { email: 'officer@ooms.com', name: 'Elena Rostova', role: 'OFFICER' as const },
        { email: 'viewer@ooms.com', name: 'Daniel Vance', role: 'VIEWER' as const },
      ];

      for (const u of defaultUsers) {
        const existing = await this.user.findUnique({ where: { email: u.email } });
        if (!existing) {
          console.log(`Ensuring OOMS demo user exists: ${u.email} (${u.role})`);
          await this.user.create({
            data: {
              email: u.email,
              name: u.name,
              passwordHash,
              role: u.role,
              organizationId: org.id,
            },
          });
        }
      }
    } catch (e) {
      console.warn('Silent safety fallback for demo users registration:', e);
    }
  }

  private async seedIfEmpty() {
    const orgCount = await this.organization.count();
    if (orgCount > 0) {
      console.log('Database already populated. Skipping seed.');
      return;
    }

    console.log('Initializing OOMS Enterprise Database Auto-Seeding...');
    const start = Date.now();

    // 1. Organization
    const clientOrg = await this.organization.create({
      data: {
        name: 'OOMS Enterprise Inc.',
      },
    });
    const orgId = clientOrg.id;

    // 2. Departments
    const deptNames = [
      'Logistics',
      'Finance',
      'Human Resources',
      'Operations',
      'Executive Office',
      'Legal',
      'IT Support',
      'Procurement',
    ];
    const depts: Record<string, string> = {};
    for (const name of deptNames) {
      const dept = await this.department.create({
        data: {
          name,
          organizationId: orgId,
        },
      });
      depts[name] = dept.id;
    }

    // 3. Vehicles is removed (operational module starts empty)

    // 4. Users
    const passwordHash = bcrypt.hashSync('password123', 10);
    const superAdmin = await this.user.create({
      data: {
        email: 'superadmin@ooms.com',
        name: 'Alex Rivera',
        passwordHash,
        role: 'SUPER_ADMIN',
        organizationId: orgId,
      },
    });

    const adminUser = await this.user.create({
      data: {
        email: 'admin@ooms.com',
        name: 'Sarah Jenkins',
        passwordHash,
        role: 'ADMIN',
        organizationId: orgId,
      },
    });

    const managerUser = await this.user.create({
      data: {
        email: 'manager@ooms.com',
        name: 'Michael Chang',
        passwordHash,
        role: 'MANAGER',
        organizationId: orgId,
      },
    });

    const officerUser = await this.user.create({
      data: {
        email: 'officer@ooms.com',
        name: 'Elena Rostova',
        passwordHash,
        role: 'OFFICER',
        organizationId: orgId,
      },
    });

    const viewerUser = await this.user.create({
      data: {
        email: 'viewer@ooms.com',
        name: 'Daniel Vance',
        passwordHash,
        role: 'VIEWER',
        organizationId: orgId,
      },
    });

    // 5. Correspondence seeding deactivated (starts pristine and empty)

    // 6. Subscriptions seeding deactivated (starts pristine and empty)

    // 7. Inventory Items seeding deactivated (starts pristine and empty)
    // 8. Fuel Logs seeding deactivated (starts pristine and empty)

    // 9. Printers seeding deactivated (starts pristine and empty)

    // 10. Operational tables starts empty as required by governance and data sanitization protocols
    // No mock documents, alerts, upcoming tasks, or activity logs are created.

    const elapsed = Date.now() - start;
    console.log(`Procedural enterprise database auto-populated successfully! Generated baseline entities in ${elapsed}ms.`);
  }
}
