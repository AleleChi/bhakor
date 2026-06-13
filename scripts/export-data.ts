import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const exportMap = [
  { modelKey: 'organization', fileName: 'organizations.json' },
  { modelKey: 'department', fileName: 'departments.json' },
  { modelKey: 'user', fileName: 'users.json' },
  { modelKey: 'userSession', fileName: 'user-sessions.json' },
  { modelKey: 'correspondence', fileName: 'correspondence.json' },
  { modelKey: 'subscription', fileName: 'subscriptions.json' },
  { modelKey: 'inventoryItem', fileName: 'inventory-items.json' },
  { modelKey: 'inventoryTransaction', fileName: 'inventory-transactions.json' },
  { modelKey: 'vehicle', fileName: 'vehicles.json' },
  { modelKey: 'fuelLog', fileName: 'fuel-logs.json' },
  { modelKey: 'printer', fileName: 'printers.json' },
  { modelKey: 'printerStatus', fileName: 'printer-statuses.json' },
  { modelKey: 'printerAlert', fileName: 'printer-alerts.json' },
  { modelKey: 'printerUsageMetric', fileName: 'printer-usage-metrics.json' },
  { modelKey: 'document', fileName: 'documents.json' },
  { modelKey: 'upcomingTask', fileName: 'upcoming-tasks.json' },
  { modelKey: 'actionAlert', fileName: 'action-alerts.json' },
  { modelKey: 'activityLog', fileName: 'activity-logs.json' },
  { modelKey: 'notification', fileName: 'notifications.json' },
  { modelKey: 'auditLog', fileName: 'auditlogs.json' }
];

async function main() {
  console.log('=== STARTING SQLITE EXPORT ===');
  const exportDir = path.join(process.cwd(), 'migration-exports');
  
  if (!fs.existsSync(exportDir)) {
    console.log(`Creating directory: ${exportDir}`);
    fs.mkdirSync(exportDir, { recursive: true });
  }

  try {
    for (const item of exportMap) {
      console.log(`Exporting model [${item.modelKey}] to file: ${item.fileName}...`);
      
      const clientModel = (prisma as any)[item.modelKey];
      if (!clientModel) {
        console.error(`Error: Model key ${item.modelKey} not found in Prisma client!`);
        continue;
      }

      const records = await clientModel.findMany();
      const filePath = path.join(exportDir, item.fileName);
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
      
      console.log(`✨ Successfully exported ${records.length} records to ${filePath}`);
    }
    console.log('=== SQLITE EXPORT COMPLETED SUCCESSFULY ===');
  } catch (error) {
    console.error('Migration export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
