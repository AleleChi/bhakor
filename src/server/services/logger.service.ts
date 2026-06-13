import * as fs from 'fs';
import * as path from 'path';

export class EnterpriseLogger {
  private static readonly LOG_DIR = path.resolve('logs');

  private static log(level: 'INFO' | 'WARN' | 'ERROR', category: string, message: string, trace?: string): void {
    try {
      if (!fs.existsSync(this.LOG_DIR)) {
        fs.mkdirSync(this.LOG_DIR, { recursive: true });
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(this.LOG_DIR, `app-${dateStr}.log`);

      const timestamp = now.toISOString();
      const traceString = trace ? ` | TRACE: ${trace}` : '';
      const entry = `[${timestamp}] [${level}] [${category}] ${message}${traceString}\n`;

      // Append to the active day file
      fs.appendFileSync(logFile, entry, 'utf8');

      // Also echo to standard standard output for docker console captures
      console.log(`[OOMS-${level}] [${category}] ${message}`);
    } catch (e) {
      // Fail silent, logger should never block application execution
      console.error('CRITICAL LOGGER ENGINE EXCEPTION:', e);
    }
  }

  static info(category: 'STARTUP' | 'AUTH' | 'DATABASE' | 'STORAGE' | 'EMAIL' | 'WORKFLOW' | 'SYSTEM' | 'IAM', message: string): void {
    this.log('INFO', category, message);
  }

  static warn(category: 'STARTUP' | 'AUTH' | 'DATABASE' | 'STORAGE' | 'EMAIL' | 'WORKFLOW' | 'SYSTEM' | 'IAM', message: string): void {
    this.log('WARN', category, message);
  }

  static error(category: 'STARTUP' | 'AUTH' | 'DATABASE' | 'STORAGE' | 'EMAIL' | 'WORKFLOW' | 'SYSTEM' | 'IAM', message: string, trace?: string): void {
    this.log('ERROR', category, message, trace);
  }
}
