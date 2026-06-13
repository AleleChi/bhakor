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

  async onModuleDestroy() {
    await this.$disconnect();
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

    // 3. Vehicles
    const vehiclesData = [
      { name: 'Ford Ranger Double Cab', plate: 'KCA 401A', type: 'Utility' },
      { name: 'Toyota Hilux Pickup', plate: 'KCE 982B', type: 'Logistics' },
      { name: 'Isuzu D-Max', plate: 'KCH 102C', type: 'Field Services' },
      { name: 'Toyota Hiace Ambulance', plate: 'KCP 554D', type: 'Emergency' },
      { name: 'Heavy Carrier Truck', plate: 'KDB 012F', type: 'Heavy Cargo' },
    ];
    const vehicleMap: Record<string, string> = {};
    for (const v of vehiclesData) {
      const dbVehicle = await this.vehicle.create({
        data: {
          name: v.name,
          plate: v.plate,
          type: v.type,
          organizationId: orgId,
        },
      });
      vehicleMap[v.plate] = dbVehicle.id;
    }

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

    // 5. Correspondence (Incoming / Outgoing - 150 Seed Records)
    const senders = [
      'Ministry of Finance',
      'Apex Global',
      'OOMS Postmaster',
      'Customs Office',
      'DHL Express',
      'Global Logistics Corp',
    ];
    const subjects = [
      'Urgent Budget Report',
      'Contract Agreement Renewal',
      'Equipment Delivery Note',
      'Quarterly Inventory Audit',
      'Fuel Disbursement Invoice',
    ];
    const statuses = ['In Transit', 'Delivered', 'Processing', 'Returned'];

    for (let i = 0; i < 150; i++) {
      const isIncoming = i % 2 === 0;
      const deptName = deptNames[i % deptNames.length];
      const deptId = depts[deptName];

      await this.correspondence.create({
        data: {
          trackingNumber: `TRK-${200000 + i}`,
          sender: isIncoming ? senders[i % senders.length] : 'OOMS Executive HQ',
          recipient: isIncoming ? 'OOMS Executive HQ' : senders[(i + 3) % senders.length],
          subject: `${subjects[i % subjects.length]} - Ref #${i}`,
          status: statuses[i % statuses.length],
          type: isIncoming ? 'Incoming' : 'Outgoing',
          date: new Date(Date.now() - (i * 4 * 3600000)), // dynamic historic times
          departmentId: deptId,
          location: ['North Wing', 'South Wing', 'HQ Seventh Floor', 'Annex Building'][i % 4],
          organizationId: orgId,
        },
      });
    }

    // 6. Subscriptions (65 Seed Records)
    const services = [
      { name: 'Adobe Creative Cloud', provider: 'Adobe Systems LLC', cat: 'SOFTWARE' },
      { name: 'Microsoft 365 Enterprise', provider: 'Microsoft Corp', cat: 'SOFTWARE' },
      { name: 'Slack Pro Workspace', provider: 'Salesforce Inc', cat: 'SOFTWARE' },
      { name: 'AWS Cloud Infrastructure', provider: 'Amazon Web Services', cat: 'CLOUD' },
      { name: 'GoDaddy Domain Names', provider: 'GoDaddy Inc', cat: 'DOMAIN' },
      { name: 'HostGator Corporate Portal', provider: 'HostGator Inc', cat: 'HOSTING' },
      { name: 'Cloudflare Zero Trust', provider: 'Cloudflare Inc', cat: 'SECURITY' },
    ] as const;

    for (let i = 0; i < 65; i++) {
      const svc = services[i % services.length];
      const deptName = deptNames[i % deptNames.length];
      const deptId = depts[deptName];
      const cost = Math.floor((150 + (i % 10) * 125) * 100) / 100;
      const daysOffset = (i % 30) - 10;
      const dueDate = new Date(Date.now() + daysOffset * 24 * 3600000).toISOString().split('T')[0];

      let status = 'Active';
      if (daysOffset < 0) {
        status = i % 10 === 0 ? 'Suspended' : 'Expired';
      } else if (daysOffset <= 7) {
        status = 'Expiring';
      }

      await this.subscription.create({
        data: {
          serviceName: `${svc.name} - Tier ${i % 3 + 1}`,
          provider: svc.provider,
          cost,
          status,
          dueDate,
          billingCycle: i % 4 === 0 ? 'Annual' : 'Monthly',
          departmentId: deptId,
          ownerId: managerUser.id,
          autoRenew: i % 3 !== 0,
          category: svc.cat,
          organizationId: orgId,
        },
      });
    }

    // 7. Inventory Items (120 Seed Records)
    const items = [
      { name: 'A4 Printing Paper (Ream)', cat: 'Office Supplies', unit: 'Reams' },
      { name: 'Ergonomic Desk Chair', cat: 'Hardware', unit: 'Units' },
      { name: 'Wireless Optical Mouse', cat: 'Hardware', unit: 'Units' },
      { name: 'Toner Cartridge HP-05A', cat: 'Hardware', unit: 'Cartridges' },
      { name: 'Clorox Disinfecting Wipes', cat: 'Cleaning', unit: 'Packs' },
    ];

    for (let i = 0; i < 120; i++) {
      const it = items[i % items.length];
      const maxThreshold = 50 + (i % 5) * 20;
      const stock = i % 7 === 0 ? Math.floor(maxThreshold * 0.1) : Math.floor(maxThreshold * 0.6);
      const minThreshold = Math.floor(maxThreshold * 0.25);
      let status = 'In Stock';
      if (stock === 0) status = 'Out of Stock';
      else if (stock <= minThreshold) status = 'Low Stock';

      await this.inventoryItem.create({
        data: {
          itemName: `${it.name} - Batch ${i + 1}`,
          sku: `SKU-${100000 + i}`,
          category: it.cat,
          stock,
          minThreshold,
          unit: it.unit,
          location: ['Warehouse A', 'Warehouse B', 'Annex Building', 'Central Depot'][i % 4],
          status,
          organizationId: orgId,
        },
      });
    }

    // 8. Fuel Logs (80 Seed Records)
    const vendors = ['Shell Petroleum', 'TotalEnergies Station', 'Rubis Energy', 'Astrol Gas'];
    const plates = ['KCA 401A', 'KCE 982B', 'KCH 102C', 'KCP 554D', 'KDB 012F'];

    for (let i = 0; i < 80; i++) {
      const plate = plates[i % plates.length];
      const vId = vehicleMap[plate];
      const liters = 30 + (i % 10) * 5;
      const rate = i % 25 === 0 ? 2.5 : 1.45; // simulated spike
      const totalCost = liters * rate;

      await this.fuelLog.create({
        data: {
          vehicleId: vId,
          driver: ['Alex Rivera', 'Sarah Jenkins', 'Michael Chang', 'Elena Rostova'][i % 4],
          liters,
          totalCost,
          date: new Date(Date.now() - (i * 2 * 24 * 3600000)),
          location: ['North Depot', 'South Depot', 'Warehouse Annex', 'Central Hub'][i % 4],
          vendor: vendors[i % vendors.length],
        },
      });
    }

    // 9. Printers (20 Seed Records)
    const printerBrands = [
      { name: 'HP LaserJet Pro Enterprise M506', vendor: 'HP' },
      { name: 'Canon imageRUNNER Advance', vendor: 'Canon' },
      { name: 'Xerox VersaLink C400', vendor: 'Xerox' },
      { name: 'Brother MFC-L8900CDW', vendor: 'Brother' },
      { name: 'Kyocera ECOSYS P3145dn', vendor: 'Kyocera' },
      { name: 'Ricoh IM C300', vendor: 'Ricoh' }
    ];
    const printerLocations = [
      'Abuja Headquarters - Floor 1',
      'Abuja Headquarters - Floor 2',
      'Abuja Headquarters - Main Lobby',
      'Abuja Annex - Room 4',
      'Port Harcourt Office - Dept A',
      'Lagos Gatehouse - Entrance 1'
    ];

    for (let i = 0; i < 20; i++) {
      const brand = printerBrands[i % printerBrands.length];
      const tonerLevel = Math.floor(10 + (i % 9) * 11);
      const paperLevel = Math.floor(20 + (i % 7) * 13);
      const drumLife = Math.floor(40 + (i % 5) * 15);
      const maintenanceKitLife = Math.floor(30 + (i % 6) * 14);
      
      let status = 'Online';
      if (tonerLevel <= 15) status = 'Low Toner';
      else if (i % 8 === 0) status = 'Offline';
      else if (i % 12 === 0) status = 'Paper Jam';
      
      const printerName = `Office Printer - Floor ${Math.floor(i / 4) + 1}`;
      const location = printerLocations[i % printerLocations.length];

      const printer = await this.printer.create({
        data: {
          printerName,
          name: printerName,
          vendor: brand.vendor,
          model: brand.name,
          ipAddress: `192.168.10.${10 + i}`,
          location,
          departmentId: depts[deptNames[i % deptNames.length]],
          serialNumber: `SN-PRN-${10000 + i}`,
          status,
          pagesPrintedMonth: 3000 + i * 500,
          organizationId: orgId,
          printerStatus: {
            create: {
              paperLevel,
              tonerLevel,
              drumLife,
              maintenanceKitLife,
              pagesPrinted: 30000 + i * 5000,
              dailyPages: 100 + i * 20,
              monthlyPages: 3000 + i * 500,
            }
          }
        },
      });

      // Let's create an alert if status is not Online
      if (status !== 'Online') {
        let alertType = 'Offline Device';
        let alertMsg = `Printer ${printerName} IP ${printer.ipAddress} is offline.`;
        let severity = 'high';

        if (status === 'Low Toner') {
          alertType = 'Low Toner';
          alertMsg = `${printerName} toner level is critical (${tonerLevel}%).`;
          severity = 'medium';
        } else if (status === 'Paper Jam') {
          alertType = 'Paper Jam';
          alertMsg = `${printerName} has a mechanical paper obstruction in slot 2.`;
          severity = 'high';
        }

        await this.printerAlert.create({
          data: {
            printerId: printer.id,
            type: alertType,
            message: alertMsg,
            severity,
            resolved: false
          }
        });
      }

      // Paper low / Maintenance kit life low alerts
      if (paperLevel < 35) {
        await this.printerAlert.create({
          data: {
            printerId: printer.id,
            type: paperLevel === 0 ? 'Paper Empty' : 'Paper Low',
            message: `${printerName} paper stock level is very low (${paperLevel}%).`,
            severity: paperLevel === 0 ? 'critical' : 'medium',
            resolved: false
          }
        });
      }

      if (maintenanceKitLife < 40) {
        await this.printerAlert.create({
          data: {
            printerId: printer.id,
            type: 'Maintenance Required',
            message: `${printerName} requires immediate maintenance kit replenishment.`,
            severity: 'medium',
            resolved: false
          }
        });
      }

      // Add a couple usage metrics
      await this.printerUsageMetric.create({
        data: {
          printerId: printer.id,
          pagesPrinted: 50 + i * 5,
          pagesColor: 20 + i,
          pagesMono: 30 + i * 4,
          timestamp: new Date()
        }
      });
    }

    // 10. Documents (80 Seed Records)
    const filePrefixes = ['Contract_Agreement', 'Invoice_Statement', 'Policy_Manual', 'Audit_Report'];
    const extensions = ['.pdf', '.xlsx', '.docx'];
    const docCats = ['Contract', 'Invoice', 'Policy', 'Manual', 'Confidential'];
    const docClass = ['Public', 'Restricted', 'Internal'];

    for (let i = 0; i < 80; i++) {
      const isRestricted = i % 12 === 0;
      await this.document.create({
        data: {
          fileName: `${filePrefixes[i % filePrefixes.length]}_Q${i % 4 + 1}${extensions[i % extensions.length]}`,
          sizeKb: 120 + i * 15,
          category: docCats[i % docCats.length],
          classification: isRestricted ? 'Restricted' : docClass[i % docClass.length],
          uploadedById: superAdmin.id,
          uploadedAt: new Date(Date.now() - i * 24 * 3600000),
          status: isRestricted ? 'PENDING' : 'APPROVED',
          organizationId: orgId,
        },
      });
    }

    // 11. Alerts (Shown in command center dashboard)
    const alertsData = [
      { severity: 'critical', module: 'Subscriptions', message: 'Corporate Microsoft 365 Agreement is expiring in 5 days (Critical Licensing Risk)', date: '12m ago', actionLabel: 'Renew Now', actionType: 'RENEW' },
      { severity: 'critical', module: 'Documents', message: 'Restricted document "Confidential_Financial_Forecast_Q3_2026.zip" uploaded by unauthorized staff from Main Reception IP', date: '34m ago', actionLabel: 'Quarantine', actionType: 'QUARANTINE' },
      { severity: 'high', module: 'Inventory', message: 'Stock levels of HP LaserJet Toner Cartridge below threshold (12 Cartridges left, average consumption 8/week)', date: '2h ago', actionLabel: 'Procure', actionType: 'PROCURE' },
      { severity: 'high', module: 'Printer', message: 'Abnormal toner exhaustion rate: Unit (HQ Annex Floor 2 Kyocera) dropped 60% in 48 hours', date: '4h ago', actionLabel: 'Diagnostics', actionType: 'DIAGNOSTICS' },
      { severity: 'medium', module: 'Fuel', message: 'Fuel volume anomaly registered representing a cost spike for driver David K. on Vehicle KCE 982B', date: '1d ago', actionLabel: 'Audit Logs', actionType: 'AUDIT_FUEL' },
      { severity: 'low', module: 'Correspondence', message: 'Outgoing Mail COR-11503 to Customs Office returned: Address unverified by carrier', date: '2d ago', actionLabel: 'Resubscribe', actionType: 'RESOLVE_MAIL' }
    ];

    for (const a of alertsData) {
      await this.actionAlert.create({
        data: a
      });
    }

    // 12. Upcoming Operational Tasks
    const tasksData = [
      { task: 'Review subscription licenses for Slack Pro Workspace tier change', dueDate: new Date(Date.now() + 2 * 24 * 3600000).toISOString().split('T')[0], owner: 'Michael Chang', module: 'Subscriptions', priority: 'critical', status: 'pending' },
      { task: 'Replenish dry erase marker inventory in Annex Building', dueDate: new Date(Date.now() + 4 * 24 * 3600000).toISOString().split('T')[0], owner: 'Michael Chang', module: 'Inventory', priority: 'medium', status: 'pending' },
      { task: 'Dispatch physical correspondence files to Ministry of Transport', dueDate: new Date(Date.now() + 1 * 24 * 3600000).toISOString().split('T')[0], owner: 'Sarah Jenkins', module: 'Correspondence', priority: 'high', status: 'pending' },
      { task: 'Verify fuel logs for Vehicle KX-OOMS-01 previous travel log', dueDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split('T')[0], owner: 'Alex Rivera', module: 'Fuel', priority: 'low', status: 'in-progress' },
    ];

    for (const t of tasksData) {
      await this.upcomingTask.create({
        data: t
      });
    }

    // 13. Activity logs for feed
    const activitiesData = [
      { user: 'Sarah Jenkins', action: 'Uploaded Document: Procurement_Policy_Update_2026.pdf', module: 'Documents', timestamp: '5 min ago' },
      { user: 'Alex Rivera', action: 'Approved Correspondence COR-10255 incoming from Ministry of Finance', module: 'Correspondence', timestamp: '14 min ago' },
      { user: 'Michael Chang', action: 'Logged Fleet Fuel Dispatch for vehicle KCA 401A (45 Liters @ Rubis)', module: 'Fuel', timestamp: '48 min ago' },
    ];

    for (const act of activitiesData) {
      await this.activityLog.create({
        data: act
      });
    }

    const elapsed = Date.now() - start;
    console.log(`Procedural enterprise database auto-populated successfully! Generated records in ${elapsed}ms.`);
  }
}
