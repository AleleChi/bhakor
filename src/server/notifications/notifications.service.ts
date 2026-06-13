import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async scanAndCreateAlerts(userId: string) {
    try {
      // 1. Scan Inventory items under threshold
      const lowStockItems = await this.prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          stock: { lt: this.prisma.inventoryItem.fields.minThreshold }
        }
      });

      for (const item of lowStockItems) {
        const msg = `Inventory alert: "${item.itemName}" (${item.sku}) is running low - Stock: ${item.stock} ${item.unit} (Min Threshold: ${item.minThreshold}).`;
        const exists = await this.prisma.notification.findFirst({
          where: { userId, message: msg }
        });
        if (!exists) {
          await this.prisma.notification.create({
            data: { userId, message: msg, read: false }
          });
        }
      }

      // 2. Scan Printer alerts or low consumables (tonerLevel < 15%, paperLevel < 10%)
      const printers = await this.prisma.printer.findMany({
        where: { deletedAt: null },
        include: { printerStatus: true }
      });

      for (const printer of printers) {
        const status = printer.printerStatus;
        if (status) {
          if (status.tonerLevel < 15) {
            const msg = `Printer alert: Abuja Dev Center "${printer.printerName || printer.name}" (IP: ${printer.ipAddress}) toner is critically low at ${status.tonerLevel}%.`;
            const exists = await this.prisma.notification.findFirst({
              where: { userId, message: msg }
            });
            if (!exists) {
              await this.prisma.notification.create({
                data: { userId, message: msg, read: false }
              });
            }
          }
          if (status.paperLevel < 10) {
            const msg = `Printer alert: Abuja Dev Center "${printer.printerName || printer.name}" (IP: ${printer.ipAddress}) paper tray is low at ${status.paperLevel}%.`;
            const exists = await this.prisma.notification.findFirst({
              where: { userId, message: msg }
            });
            if (!exists) {
              await this.prisma.notification.create({
                data: { userId, message: msg, read: false }
              });
            }
          }
        }
      }

      // 3. Scan Expiring Subscriptions (expires in <= 5 days)
      const now = new Date();
      const fiveDaysLater = new Date(Date.now() + 5 * 24 * 3600 * 1000);
      const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];

      const expiringSubs = await this.prisma.subscription.findMany({
        where: {
          deletedAt: null,
          status: 'Active',
          dueDate: { lte: fiveDaysLaterStr }
        }
      });

      for (const sub of expiringSubs) {
        const msg = `Subscription expiry warning: SaaS license "${sub.serviceName}" via ${sub.provider} is due for auto-billing or expiry on ${sub.dueDate}.`;
        const exists = await this.prisma.notification.findFirst({
          where: { userId, message: msg }
        });
        if (!exists) {
          await this.prisma.notification.create({
            data: { userId, message: msg, read: false }
          });
        }
      }
    } catch (err) {
      console.warn('Silent safety fallback for scanAndCreateAlerts:', err);
    }
  }

  async listNotifications(userId: string) {
    // Run live scanning first
    await this.scanAndCreateAlerts(userId);

    // Retrieve full notifications log
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async readAll(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    return { success: true };
  }

  async readOne(id: string, userId: string) {
    const original = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!original) {
      throw new BadRequestException('Target notification does not exist or user scope is denied.');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    return { success: true };
  }
}
