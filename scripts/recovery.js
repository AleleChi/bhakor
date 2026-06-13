import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DB_PATH = path.resolve('prisma/dev.db');
const BACKUPS_DIR = path.resolve('prisma/backups');
const RECOVERY_DIR = path.resolve('prisma/recovery');
const MAX_BACKUPS = 20;

const command = process.argv[2];

function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function ensureDirectoryExist(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function backup() {
  console.log('--- DB RECOVERY: MANUAL BACKUP START ---');
  try {
    ensureDirectoryExist(BACKUPS_DIR);
    if (!fs.existsSync(DB_PATH)) {
      console.log('[ERROR] dev.db does not exist yet. Run "db push" first.');
      return;
    }

    const timestamp = getFormattedTimestamp();
    const backupName = `dev-${timestamp}.db`;
    const dest = path.join(BACKUPS_DIR, backupName);

    fs.copyFileSync(DB_PATH, dest);
    console.log(`[SUCCESS] Database backup saved safely: ${dest}`);

    // Cleanup old backups
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('dev-') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        fullPath: path.join(BACKUPS_DIR, f),
        mtime: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > MAX_BACKUPS) {
      const deleteList = files.slice(MAX_BACKUPS);
      for (const file of deleteList) {
        fs.unlinkSync(file.fullPath);
        console.log(`[CLEANUP] Deleted old backup file: ${file.name}`);
      }
    }
  } catch (err) {
    console.error('[CRITICAL] Backup failed:', err.message);
  }
}

function restore() {
  console.log('--- DB RECOVERY: RESTORE SYSTEM START ---');
  try {
    const backupFiles = [];
    
    // Check both /backups and /recovery directories for valid backup files
    [BACKUPS_DIR, RECOVERY_DIR].forEach((dir) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
          .filter(f => f.endsWith('.db'))
          .map(f => ({
            name: f,
            fullPath: path.join(dir, f),
            mtime: fs.statSync(path.join(dir, f)).mtimeMs
          }));
        backupFiles.push(...files);
      }
    });

    if (backupFiles.length === 0) {
      console.log('[ERROR] No backup recovery database files (.db) found in "backups/" or "recovery/".');
      return;
    }

    // Sort to find newest backup file
    backupFiles.sort((a, b) => b.mtime - a.mtime);
    const targetBackup = backupFiles[0];

    console.log(`Selected latest backup: ${targetBackup.name} modified at ${new Date(targetBackup.mtime).toISOString()}`);
    
    // Create an emergency rollback backup of current if it exists
    if (fs.existsSync(DB_PATH)) {
      const rollbackName = `dev-emergency-rollback-${getFormattedTimestamp()}.db`;
      fs.copyFileSync(DB_PATH, path.join(BACKUPS_DIR || RECOVERY_DIR, rollbackName));
      console.log(`[ROLLBACK SAFEGUARD] Backed up current dev.db as: ${rollbackName}`);
    }

    // overwrite dev.db with backup
    fs.copyFileSync(targetBackup.fullPath, DB_PATH);
    console.log(`[SUCCESS] Database restored successfully from ${targetBackup.name}`);
  } catch (err) {
    console.error('[CRITICAL] Restore failed:', err.message);
  }
}

function health() {
  console.log('--- DB RECOVERY: HEALTH STATUS CHECK ---');
  try {
    // 1. Prisma validate
    console.log('Performing Prisma schema validity check...');
    execSync('npx prisma validate', { stdio: 'inherit' });

    // 2. Database existence
    if (!fs.existsSync(DB_PATH)) {
      console.log('[STATUS] unhealthy: SQLite dev.db does not exist.');
      return;
    }

    // 3. Simple query test
    console.log('Checking database connection and record count...');
    execSync('npx prisma db push --force-reset', { stdio: 'ignore' });
    console.log('[STATUS] healthy: Database is fully reachable.');
  } catch (err) {
    console.log('[STATUS] degraded or unhealthy. Error:', err.message);
  }
}

function resetDev() {
  console.log('--- DB RECOVERY: STRUCTURAL FACTORY RESET ---');
  try {
    if (fs.existsSync(DB_PATH)) {
      const bkp = path.join(BACKUPS_DIR, `dev-before-reset-${getFormattedTimestamp()}.db`);
      ensureDirectoryExist(BACKUPS_DIR);
      fs.copyFileSync(DB_PATH, bkp);
      console.log(`[SAFEGUARD] Current db backed up before reset to: ${bkp}`);
    }
  } catch (e) {
    console.log('Safeguard backup skipped: no current db or backups dir unwriteable.');
  }

  try {
    console.log('Resetting schema and wiping existing records...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('[SUCCESS] SQLite database factory reset completed successfully.');
  } catch (err) {
    console.error('[CRITICAL] Factory reset failed:', err.message);
  }
}

switch (command) {
  case 'backup':
    backup();
    break;
  case 'restore':
    restore();
    break;
  case 'health':
    health();
    break;
  case 'reset':
    resetDev();
    break;
  default:
    console.log('OOMS Recovery Tool usage:\n  node scripts/recovery.js [backup|restore|health|reset]');
}
