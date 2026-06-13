import * as fs from 'fs';
import * as path from 'path';

export class DatabaseBackupService {
  private static readonly DB_PATH = path.resolve('prisma/dev.db');
  private static readonly BACKUPS_DIR = path.resolve('prisma/backups');
  private static readonly MAX_BACKUPS = 20;

  static backupSync(): void {
    try {
      console.log('[BackupService] Initializing auto-backup...');
      
      // Ensure backup directory exists
      if (!fs.existsSync(this.BACKUPS_DIR)) {
        fs.mkdirSync(this.BACKUPS_DIR, { recursive: true });
      }

      // If the database file doesn't exist, skip copy but log
      if (!fs.existsSync(this.DB_PATH)) {
        console.log('[BackupService] No existing dev.db database found to backup (first run). Skipping...');
        return;
      }

      const timestamp = this.getFormattedTimestamp();
      const backupFileName = `dev-${timestamp}.db`;
      const backupFilePath = path.join(this.BACKUPS_DIR, backupFileName);

      // Perform copy
      fs.copyFileSync(this.DB_PATH, backupFilePath);
      console.log(`[BackupService] Backup successfully created: ${backupFileName}`);

      // Perform cleanup
      this.cleanupOldBackupsSync();
    } catch (e: any) {
      console.error('[BackupService] Database backup generation failed safely:', e);
    }
  }

  private static getFormattedTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  }

  private static cleanupOldBackupsSync(): void {
    try {
      const files = fs.readdirSync(this.BACKUPS_DIR);
      // Filter files matching dev-YYYY-MM-DD-HHMM.db or similiar sqlite databases
      const backupFiles = files
        .filter(f => f.startsWith('dev-') && f.endsWith('.db'))
        .map(f => ({
          name: f,
          fullPath: path.join(this.BACKUPS_DIR, f),
          stat: fs.statSync(path.join(this.BACKUPS_DIR, f)),
        }));

      // Sort by last modification time desc (newest first)
      backupFiles.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

      if (backupFiles.length > this.MAX_BACKUPS) {
        const toDelete = backupFiles.slice(this.MAX_BACKUPS);
        for (const file of toDelete) {
          fs.unlinkSync(file.fullPath);
          console.log(`[BackupService] Cleaned up older backup file: ${file.name}`);
        }
      }
    } catch (e: any) {
      console.error('[BackupService] Cleanup of older backups failed safely:', e);
    }
  }
}
