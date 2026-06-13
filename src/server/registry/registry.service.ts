import { Injectable, BadRequestException, ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RegistryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async checkPermission(userId: string, action: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw new ForbiddenException('User session invalid.');

    if (user.role === 'SUPER_ADMIN') {
      return true; // Sovereign bypass
    }

    const roleRecord = await this.prisma.role.findUnique({
      where: { name: user.role },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!roleRecord || !roleRecord.isActive) {
      throw new ForbiddenException('Personnel role is deactivated or missing.');
    }

    const userActions = new Set(roleRecord.rolePermissions.map(rp => rp.permission.action.toUpperCase()));
    const targetPerm = action.toUpperCase();

    const allowed = userActions.has(targetPerm) || userActions.has(targetPerm.replace('_', '.'));
    if (!allowed) {
      throw new ForbiddenException(`Operational authority audit: Insufficient clearance for action "${action}".`);
    }
  }

  async listRecords(p: {
    module: string;
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: string;
    department?: string;
    location?: string;
    classification?: string;
    status?: string;
    operatorUserId?: string;
  }) {
    const { module, page, limit, search, sortBy, sortOrder, department, location, classification, status, operatorUserId } = p;
    const skip = (page - 1) * limit;

    let permissionAction = '';
    if (module === 'Correspondence') permissionAction = 'CORRESPONDENCE_VIEW';
    else if (module === 'Subscriptions') permissionAction = 'subscriptions.manage';
    else if (module === 'Inventory') permissionAction = 'inventory.view';
    else if (module === 'Fuel') permissionAction = 'fleet.view';
    else if (module === 'Printer') permissionAction = 'PRINTER_VIEW';
    else if (module === 'Documents') permissionAction = 'documents.view';
    else if (module === 'AuditLogs' || module === 'AuditLog') permissionAction = 'audit.view';
    else if (module === 'PrintJob' || module === 'PrintJobs') permissionAction = 'PRINTER_MONITOR';

    if (permissionAction && operatorUserId) {
      await this.checkPermission(operatorUserId, permissionAction);
    }

    // Resolve general search terms
    const searchString = search ? `%${search}%` : undefined;

    let data: any[] = [];
    let total = 0;

    // We can fetch list filtered and paginate
    if (module === 'Correspondence') {
      const where: any = { deletedAt: null };
      if (department) {
        const dept = await this.prisma.department.findFirst({ where: { name: department } });
        if (dept) where.departmentId = dept.id;
      }
      if (location) where.location = location;
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { sender: { contains: search } },
          { recipient: { contains: search } },
          { subject: { contains: search } },
          { trackingNumber: { contains: search } },
        ];
      }

      total = await this.prisma.correspondence.count({ where });
      const records = await this.prisma.correspondence.findMany({
        where,
        include: { department: true },
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { date: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        trackingNumber: r.trackingNumber,
        sender: r.sender,
        recipient: r.recipient,
        subject: r.subject,
        status: r.status,
        type: r.type,
        date: r.date.toISOString(),
        department: r.department.name,
        location: r.location,
      }));

    } else if (module === 'Subscriptions') {
      const where: any = { deletedAt: null };
      if (department) {
        const dept = await this.prisma.department.findFirst({ where: { name: department } });
        if (dept) where.departmentId = dept.id;
      }
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { serviceName: { contains: search } },
          { provider: { contains: search } },
        ];
      }

      total = await this.prisma.subscription.count({ where });
      const records = await this.prisma.subscription.findMany({
        where,
        include: { department: true },
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { id: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        serviceName: r.serviceName,
        provider: r.provider,
        cost: r.cost,
        status: r.status,
        dueDate: r.dueDate,
        billingCycle: r.billingCycle,
        department: r.department.name,
        owner: 'Michael Chang', // Mapping owner logically
        autoRenew: r.autoRenew,
      }));

    } else if (module === 'Inventory') {
      const where: any = { deletedAt: null };
      if (location) where.location = location;
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { itemName: { contains: search } },
          { sku: { contains: search } },
        ];
      }

      total = await this.prisma.inventoryItem.count({ where });
      const records = await this.prisma.inventoryItem.findMany({
        where,
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { id: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        itemName: r.itemName,
        sku: r.sku,
        category: r.category,
        stock: r.stock,
        minThreshold: r.minThreshold,
        unit: r.unit,
        location: r.location,
        status: r.status,
      }));

    } else if (module === 'Fuel') {
      const where: any = { deletedAt: null };
      if (location) where.location = location;

      if (search) {
        where.OR = [
          { driver: { contains: search } },
          { vendor: { contains: search } },
        ];
      }

      total = await this.prisma.fuelLog.count({ where });
      const records = await this.prisma.fuelLog.findMany({
        where,
        include: { vehicle: true },
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { date: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        vehiclePlate: r.vehicle.plate,
        vehicleType: r.vehicle.type,
        driver: r.driver,
        liters: r.liters,
        totalCost: r.totalCost,
        date: r.date.toISOString(),
        location: r.location,
        vendor: r.vendor,
      }));

    } else if (module === 'Printer') {
      const where: any = { deletedAt: null };
      if (department) {
        const dept = await this.prisma.department.findFirst({ where: { name: department } });
        if (dept) where.departmentId = dept.id;
      }
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { printerName: { contains: search } },
          { name: { contains: search } },
          { model: { contains: search } },
          { ipAddress: { contains: search } },
          { vendor: { contains: search } },
          { location: { contains: search } },
        ];
      }

      total = await this.prisma.printer.count({ where });
      const records = await this.prisma.printer.findMany({
        where,
        include: { 
          department: true,
          printerStatus: true,
          alerts: true,
          usageMetrics: true
        },
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { id: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        printerName: r.printerName || r.name,
        name: r.name,
        vendor: r.vendor,
        model: r.model,
        department: r.department.name,
        departmentId: r.departmentId,
        ipAddress: r.ipAddress,
        location: r.location,
        serialNumber: r.serialNumber,
        status: r.status,
        pagesPrintedMonth: r.pagesPrintedMonth,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        // Consumables and metrics mapping
        paperLevel: r.printerStatus?.paperLevel ?? 100,
        tonerLevel: r.printerStatus?.tonerLevel ?? 100,
        drumLife: r.printerStatus?.drumLife ?? 100,
        maintenanceKitLife: r.printerStatus?.maintenanceKitLife ?? 100,
        pagesPrinted: r.printerStatus?.pagesPrinted ?? r.pagesPrintedMonth,
        dailyPages: r.printerStatus?.dailyPages ?? 0,
        monthlyPages: r.printerStatus?.monthlyPages ?? r.pagesPrintedMonth,
        alerts: r.alerts || [],
        usageMetrics: r.usageMetrics || []
      }));

    } else if (module === 'Documents') {
      const where: any = { deletedAt: null };
      if (classification) where.classification = classification;

      if (search) {
        where.OR = [
          { fileName: { contains: search } },
        ];
      }

      total = await this.prisma.document.count({ where });
      const records = await this.prisma.document.findMany({
        where,
        include: { uploadedBy: true },
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { uploadedAt: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        fileName: r.fileName,
        sizeKb: r.sizeKb,
        category: r.category,
        classification: r.classification,
        uploadedBy: r.uploadedBy.name,
        uploadedAt: r.uploadedAt.toISOString(),
        status: r.status === 'APPROVED' ? 'Approved' : r.status === 'PENDING' ? 'Pending Review' : 'Flagged',
      }));

    } else if (module === 'AuditLogs' || module === 'AuditLog') {
      const where: any = {};
      if (status) {
        where.action = status;
      }
      if (search) {
        where.OR = [
          { action: { contains: search } },
          { module: { contains: search } },
          { entityType: { contains: search } },
          { user: { name: { contains: search } } },
        ];
      }

      total = await this.prisma.auditLog.count({ where });
      const records = await this.prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: sortBy ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } : { timestamp: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        userName: r.user.name,
        userEmail: r.user.email,
        action: r.action,
        module: r.module,
        timestamp: r.timestamp.toISOString(),
        entityId: r.entityId,
        entityType: r.entityType,
        oldValues: r.oldValues,
        newValues: r.newValues,
      }));

    } else if (module === 'PrintJob' || module === 'PrintJobs') {
      const where: any = {};
      if (search) {
        where.OR = [
          { documentName: { contains: search } },
          { status: { contains: search } },
          { user: { name: { contains: search } } },
          { printer: { name: { contains: search } } }
        ];
      }

      total = await this.prisma.printJob.count({ where });
      const records = await this.prisma.printJob.findMany({
        where,
        include: { user: true, printer: true },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      });

      data = records.map(r => ({
        id: r.id,
        userName: r.user.name,
        userEmail: r.user.email,
        printerName: r.printer.printerName || r.printer.name,
        documentName: r.documentName || 'No Document Name',
        pages: r.pages,
        status: r.status,
        ip: r.ip || '127.0.0.1',
        device: r.device || 'Web Console Client',
        timestamp: r.timestamp.toISOString(),
      }));

    } else {
      throw new BadRequestException('Invalid dynamic module catalog query');
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async addRecord(moduleName: string, payload: any, operatorUserId?: string) {
    const org = await this.prisma.organization.findFirst();
    const orgId = org ? org.id : '';

    const defaultUser = await this.prisma.user.findFirst();
    const defaultUserId = defaultUser ? defaultUser.id : '';
    const userId = operatorUserId || defaultUserId;

    // Permissions gating
    if (moduleName === 'Correspondence') {
      await this.checkPermission(userId, 'CORRESPONDENCE_CREATE');
    } else if (moduleName === 'Subscriptions') {
      await this.checkPermission(userId, 'subscriptions.manage');
    } else if (moduleName === 'Inventory') {
      await this.checkPermission(userId, 'inventory.create');
    } else if (moduleName === 'Fuel') {
      await this.checkPermission(userId, 'fleet.manage');
    } else if (moduleName === 'Documents') {
      await this.checkPermission(userId, 'documents.create');
    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      await this.checkPermission(userId, 'PRINTER_CREATE');
    }

    const dept = await this.prisma.department.findFirst({
      where: { name: payload.department || 'Operations' },
    });
    const deptId = dept ? dept.id : (await this.prisma.department.findFirst())?.id || '';

    let createdItem: any = null;

    if (moduleName === 'Correspondence') {
      const dbRow = await this.prisma.correspondence.create({
        data: {
          trackingNumber: payload.trackingNumber || `TRK-${Math.floor(Math.random() * 900000 + 10000)}`,
          sender: payload.sender || 'External Correspondent',
          recipient: payload.recipient || 'Internal Recipient',
          subject: payload.subject || 'Incoming General Correspondence File',
          status: 'Draft', // Enforced starting state as per specs
          type: payload.type || 'Incoming',
          departmentId: deptId,
          location: payload.location || 'North Wing',
          organizationId: orgId,
          createdBy: userId, // Track personnel ownership
        },
        include: { department: true },
      });

      createdItem = {
        id: dbRow.id,
        trackingNumber: dbRow.trackingNumber,
        sender: dbRow.sender,
        recipient: dbRow.recipient,
        subject: dbRow.subject,
        status: dbRow.status,
        type: dbRow.type,
        date: dbRow.date.toISOString(),
        department: dbRow.department.name,
        location: dbRow.location,
      };

    } else if (moduleName === 'Subscriptions') {
      const dbRow = await this.prisma.subscription.create({
        data: {
          serviceName: payload.serviceName || 'New SaaS Subscription License',
          provider: payload.provider || 'SaaS Provider Corp',
          cost: parseFloat(payload.cost) || 75.00,
          status: 'Active',
          dueDate: payload.dueDate || new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0],
          billingCycle: payload.billingCycle || 'Monthly',
          departmentId: deptId,
          ownerId: userId,
          autoRenew: payload.autoRenew === true,
          category: 'SOFTWARE',
          organizationId: orgId,
        },
        include: { department: true },
      });

      createdItem = {
        id: dbRow.id,
        serviceName: dbRow.serviceName,
        provider: dbRow.provider,
        cost: dbRow.cost,
        status: dbRow.status,
        dueDate: dbRow.dueDate,
        billingCycle: dbRow.billingCycle,
        department: dbRow.department.name,
        owner: 'Sarah Jenkins',
        autoRenew: dbRow.autoRenew,
      };

    } else if (moduleName === 'Inventory') {
      const dbRow = await this.prisma.inventoryItem.create({
        data: {
          itemName: payload.itemName || 'New Supply Line Hardware',
          sku: payload.sku || `SKU-${Math.floor(Math.random() * 90000 + 10000)}`,
          category: payload.category || 'Office Supplies',
          stock: parseInt(payload.stock) || 50,
          minThreshold: parseInt(payload.minThreshold) || 10,
          unit: payload.unit || 'Units',
          location: payload.location || 'Warehouse A',
          status: 'In Stock',
          organizationId: orgId,
        },
      });

      createdItem = {
        id: dbRow.id,
        itemName: dbRow.itemName,
        sku: dbRow.sku,
        category: dbRow.category,
        stock: dbRow.stock,
        minThreshold: dbRow.minThreshold,
        unit: dbRow.unit,
        location: dbRow.location,
        status: dbRow.status,
      };

    } else if (moduleName === 'Fuel') {
      let vehicle = await this.prisma.vehicle.findFirst({
        where: { plate: payload.vehiclePlate },
      });
      if (!vehicle) {
        vehicle = await this.prisma.vehicle.findFirst();
      }
      const vehicleId = vehicle ? vehicle.id : '';

      const dbRow = await this.prisma.fuelLog.create({
        data: {
          vehicleId: vehicleId,
          driver: payload.driver || 'Alex Rivera',
          liters: parseFloat(payload.liters) || 40,
          totalCost: parseFloat(payload.totalCost) || 58.00,
          location: payload.location || 'Fleet Depot',
          vendor: payload.vendor || 'Rubis Energy',
        },
        include: { vehicle: true },
      });

      createdItem = {
        id: dbRow.id,
        vehiclePlate: dbRow.vehicle.plate,
        vehicleType: dbRow.vehicle.type,
        driver: dbRow.driver,
        liters: dbRow.liters,
        totalCost: dbRow.totalCost,
        date: dbRow.date.toISOString(),
        location: dbRow.location,
        vendor: dbRow.vendor,
      };

    } else if (moduleName === 'Documents') {
      const dbRow = await this.prisma.document.create({
        data: {
          fileName: payload.fileName || 'Uploaded_Executive_Receipt.pdf',
          sizeKb: parseInt(payload.sizeKb) || Math.floor(Math.random() * 5000 + 100),
          category: payload.category || 'Invoice',
          classification: payload.classification || 'Internal',
          uploadedById: userId,
          status: 'APPROVED',
          organizationId: orgId,
        },
        include: { uploadedBy: true },
      });

      createdItem = {
        id: dbRow.id,
        fileName: dbRow.fileName,
        sizeKb: dbRow.sizeKb,
        category: dbRow.category,
        classification: dbRow.classification,
        uploadedBy: dbRow.uploadedBy.name,
        uploadedAt: dbRow.uploadedAt.toISOString(),
        status: 'Approved',
      };
    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      const dbRow = await this.prisma.printer.create({
        data: {
          printerName: payload.name || payload.printerName || 'New Office Printer',
          name: payload.name || payload.printerName || 'New Office Printer',
          vendor: payload.vendor || 'HP',
          model: payload.model || 'LaserJet Pro M506',
          ipAddress: payload.ipAddress || '192.168.1.100',
          location: payload.location || 'Abuja Headquarters',
          departmentId: deptId,
          serialNumber: payload.serialNumber || `SN-PRN-${Math.floor(Math.random() * 90000 + 10000)}`,
          status: payload.status || 'Online',
          pagesPrintedMonth: parseInt(payload.pagesPrintedMonth) || 0,
          organizationId: orgId,
          printerStatus: {
            create: {
              paperLevel: parseInt(payload.paperLevel) || 100,
              tonerLevel: parseInt(payload.tonerLevel) || 100,
              drumLife: parseInt(payload.drumLife) || 100,
              maintenanceKitLife: parseInt(payload.maintenanceKitLife) || 100,
              pagesPrinted: parseInt(payload.pagesPrinted) || 0,
              dailyPages: parseInt(payload.dailyPages) || 0,
              monthlyPages: parseInt(payload.pagesPrintedMonth) || 0,
            }
          }
        },
        include: { department: true, printerStatus: true }
      });

      createdItem = {
        id: dbRow.id,
        printerName: dbRow.printerName,
        name: dbRow.name,
        vendor: dbRow.vendor,
        model: dbRow.model,
        department: dbRow.department.name,
        departmentId: dbRow.departmentId,
        ipAddress: dbRow.ipAddress,
        location: dbRow.location,
        serialNumber: dbRow.serialNumber,
        status: dbRow.status,
        pagesPrintedMonth: dbRow.pagesPrintedMonth,
        createdAt: dbRow.createdAt.toISOString(),
        updatedAt: dbRow.updatedAt.toISOString(),
        paperLevel: dbRow.printerStatus?.paperLevel ?? 100,
        tonerLevel: dbRow.printerStatus?.tonerLevel ?? 100,
      };
    } else {
      throw new BadRequestException(`Selected module catalog "${moduleName}" is invalid for additions.`);
    }

    const actionText = `Registered new ${moduleName} block: ${createdItem.itemName || createdItem.serviceName || createdItem.subject || createdItem.fileName || createdItem.vehiclePlate}`;
    await this.prisma.activityLog.create({
      data: {
        user: payload.operatorName || 'Alex Rivera',
        action: actionText,
        module: moduleName,
        timestamp: 'Just now',
      },
    });

    // Write CREATE Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'CREATE',
          module: moduleName,
          entityId: createdItem.id,
          entityType: moduleName,
          newValues: JSON.stringify(createdItem),
        }
      });
    } catch (auditErr) {
      console.warn('Unable to write create audit log:', auditErr);
    }

    return { success: true, item: createdItem };
  }

  async updateRecord(moduleName: string, id: string, payload: any, operatorUserId: string) {
    const defaultUser = await this.prisma.user.findFirst();
    const userId = operatorUserId || (defaultUser ? defaultUser.id : '');

    // Permissions check
    if (moduleName === 'Correspondence') {
      await this.checkPermission(userId, 'CORRESPONDENCE_EDIT');
    } else if (moduleName === 'Subscriptions') {
      await this.checkPermission(userId, 'subscriptions.manage');
    } else if (moduleName === 'Inventory') {
      await this.checkPermission(userId, 'inventory.edit');
    } else if (moduleName === 'Fuel') {
      await this.checkPermission(userId, 'fleet.manage');
    } else if (moduleName === 'Documents') {
      await this.checkPermission(userId, 'documents.edit');
    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      await this.checkPermission(userId, 'PRINTER_EDIT');
    }

    let oldRecord: any = null;
    let newRecord: any = null;

    if (moduleName === 'Correspondence') {
      oldRecord = await this.prisma.correspondence.findUnique({ where: { id } });
      if (!oldRecord) throw new BadRequestException('Record not found.');

      // State-based & Role-based governance constraints
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new ForbiddenException('User context invalid.');

      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      if (user.role === 'OFFICER' && !isSuperAdmin) {
        if (oldRecord.createdBy !== userId) {
          throw new ForbiddenException('Governance restriction: Officers can only edit correspondences registered by themselves.');
        }
        if (oldRecord.status !== 'Draft') {
          throw new ForbiddenException('Governance restriction: Only correspondences currently in "Draft" state are mutable by Officers.');
        }
      }

      const dept = payload.department ? await this.prisma.department.findFirst({ where: { name: payload.department } }) : null;

      const updated = await this.prisma.correspondence.update({
        where: { id },
        data: {
          sender: payload.sender !== undefined ? payload.sender : oldRecord.sender,
          recipient: payload.recipient !== undefined ? payload.recipient : oldRecord.recipient,
          subject: payload.subject !== undefined ? payload.subject : oldRecord.subject,
          status: payload.status !== undefined ? payload.status : oldRecord.status,
          location: payload.location !== undefined ? payload.location : oldRecord.location,
          departmentId: dept ? dept.id : oldRecord.departmentId,
        },
        include: { department: true }
      });
      newRecord = {
        id: updated.id,
        trackingNumber: updated.trackingNumber,
        sender: updated.sender,
        recipient: updated.recipient,
        subject: updated.subject,
        status: updated.status,
        type: updated.type,
        department: updated.department.name,
        location: updated.location,
      };

    } else if (moduleName === 'Subscriptions') {
      oldRecord = await this.prisma.subscription.findUnique({ where: { id } });
      if (!oldRecord) throw new BadRequestException('Record not found.');

      const dept = payload.department ? await this.prisma.department.findFirst({ where: { name: payload.department } }) : null;

      const updated = await this.prisma.subscription.update({
        where: { id },
        data: {
          serviceName: payload.serviceName !== undefined ? payload.serviceName : oldRecord.serviceName,
          provider: payload.provider !== undefined ? payload.provider : oldRecord.provider,
          cost: payload.cost !== undefined ? parseFloat(payload.cost) : oldRecord.cost,
          status: payload.status !== undefined ? payload.status : oldRecord.status,
          dueDate: payload.dueDate !== undefined ? payload.dueDate : oldRecord.dueDate,
          billingCycle: payload.billingCycle !== undefined ? payload.billingCycle : oldRecord.billingCycle,
          autoRenew: payload.autoRenew !== undefined ? payload.autoRenew === true : oldRecord.autoRenew,
          departmentId: dept ? dept.id : oldRecord.departmentId,
        },
        include: { department: true }
      });
      newRecord = {
        id: updated.id,
        serviceName: updated.serviceName,
        provider: updated.provider,
        cost: updated.cost,
        status: updated.status,
        dueDate: updated.dueDate,
        billingCycle: updated.billingCycle,
        department: updated.department.name,
        autoRenew: updated.autoRenew,
      };

    } else if (moduleName === 'Inventory') {
      oldRecord = await this.prisma.inventoryItem.findUnique({ where: { id } });
      if (!oldRecord) throw new BadRequestException('Record not found.');

      const updated = await this.prisma.inventoryItem.update({
        where: { id },
        data: {
          itemName: payload.itemName !== undefined ? payload.itemName : oldRecord.itemName,
          sku: payload.sku !== undefined ? payload.sku : oldRecord.sku,
          category: payload.category !== undefined ? payload.category : oldRecord.category,
          stock: payload.stock !== undefined ? parseInt(payload.stock) : oldRecord.stock,
          minThreshold: payload.minThreshold !== undefined ? parseInt(payload.minThreshold) : oldRecord.minThreshold,
          unit: payload.unit !== undefined ? payload.unit : oldRecord.unit,
          location: payload.location !== undefined ? payload.location : oldRecord.location,
          status: payload.status !== undefined ? payload.status : oldRecord.status,
        }
      });
      newRecord = updated;

    } else if (moduleName === 'Fuel') {
      oldRecord = await this.prisma.fuelLog.findUnique({ where: { id }, include: { vehicle: true } });
      if (!oldRecord) throw new BadRequestException('Record not found.');

      const updated = await this.prisma.fuelLog.update({
        where: { id },
        data: {
          driver: payload.driver !== undefined ? payload.driver : oldRecord.driver,
          liters: payload.liters !== undefined ? parseFloat(payload.liters) : oldRecord.liters,
          totalCost: payload.totalCost !== undefined ? parseFloat(payload.totalCost) : oldRecord.totalCost,
          location: payload.location !== undefined ? payload.location : oldRecord.location,
          vendor: payload.vendor !== undefined ? payload.vendor : oldRecord.vendor,
        },
        include: { vehicle: true }
      });
      newRecord = {
        id: updated.id,
        vehiclePlate: updated.vehicle.plate,
        vehicleType: updated.vehicle.type,
        driver: updated.driver,
        liters: updated.liters,
        totalCost: updated.totalCost,
        location: updated.location,
        vendor: updated.vendor,
      };

    } else if (moduleName === 'Documents') {
      oldRecord = await this.prisma.document.findUnique({ where: { id } });
      if (!oldRecord) throw new BadRequestException('Record not found.');

      const updated = await this.prisma.document.update({
        where: { id },
        data: {
          fileName: payload.fileName !== undefined ? payload.fileName : oldRecord.fileName,
          sizeKb: payload.sizeKb !== undefined ? parseInt(payload.sizeKb) : oldRecord.sizeKb,
          category: payload.category !== undefined ? payload.category : oldRecord.category,
          classification: payload.classification !== undefined ? payload.classification : oldRecord.classification,
          status: payload.status !== undefined ? payload.status : oldRecord.status,
        },
        include: { uploadedBy: true }
      });
      newRecord = {
        id: updated.id,
        fileName: updated.fileName,
        sizeKb: updated.sizeKb,
        category: updated.category,
        classification: updated.classification,
        uploadedBy: updated.uploadedBy.name,
        status: updated.status,
      };

    } else if (moduleName === 'Printer') {
      oldRecord = await this.prisma.printer.findUnique({ where: { id } });
      if (!oldRecord) throw new BadRequestException('Record not found.');

      if (payload.paperLevel !== undefined || payload.tonerLevel !== undefined || payload.drumLife !== undefined || payload.maintenanceKitLife !== undefined || payload.pagesPrinted !== undefined || payload.dailyPages !== undefined || payload.monthlyPages !== undefined) {
        await this.prisma.printerStatus.upsert({
          where: { printerId: id },
          create: {
            printerId: id,
            paperLevel: payload.paperLevel !== undefined ? parseInt(payload.paperLevel, 10) : 100,
            tonerLevel: payload.tonerLevel !== undefined ? parseInt(payload.tonerLevel, 10) : 100,
            drumLife: payload.drumLife !== undefined ? parseInt(payload.drumLife, 10) : 100,
            maintenanceKitLife: payload.maintenanceKitLife !== undefined ? parseInt(payload.maintenanceKitLife, 10) : 100,
            pagesPrinted: payload.pagesPrinted !== undefined ? parseInt(payload.pagesPrinted, 10) : 0,
            dailyPages: payload.dailyPages !== undefined ? parseInt(payload.dailyPages, 10) : 0,
            monthlyPages: payload.monthlyPages !== undefined ? parseInt(payload.monthlyPages, 10) : 0,
          },
          update: {
            paperLevel: payload.paperLevel !== undefined ? parseInt(payload.paperLevel, 10) : undefined,
            tonerLevel: payload.tonerLevel !== undefined ? parseInt(payload.tonerLevel, 10) : undefined,
            drumLife: payload.drumLife !== undefined ? parseInt(payload.drumLife, 10) : undefined,
            maintenanceKitLife: payload.maintenanceKitLife !== undefined ? parseInt(payload.maintenanceKitLife, 10) : undefined,
            pagesPrinted: payload.pagesPrinted !== undefined ? parseInt(payload.pagesPrinted, 10) : undefined,
            dailyPages: payload.dailyPages !== undefined ? parseInt(payload.dailyPages, 10) : undefined,
            monthlyPages: payload.monthlyPages !== undefined ? parseInt(payload.monthlyPages, 10) : undefined,
          }
        });
      }

      const updated = await this.prisma.printer.update({
        where: { id },
        data: {
          printerName: payload.name !== undefined ? payload.name : oldRecord.printerName,
          model: payload.model !== undefined ? payload.model : oldRecord.model,
          vendor: payload.vendor !== undefined ? payload.vendor : oldRecord.vendor,
          ipAddress: payload.ipAddress !== undefined ? payload.ipAddress : oldRecord.ipAddress,
          location: payload.location !== undefined ? payload.location : oldRecord.location,
          status: payload.status !== undefined ? payload.status : oldRecord.status,
        },
        include: { department: true }
      });
      newRecord = {
        id: updated.id,
        printerName: updated.printerName,
        model: updated.model,
        vendor: updated.vendor,
        ipAddress: updated.ipAddress,
        location: updated.location,
        status: updated.status,
        department: updated.department.name,
      };
    } else {
      throw new BadRequestException('Invalid dynamic module catalog update query');
    }

    // Write UPDATE Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          module: moduleName,
          entityId: id,
          entityType: moduleName,
          oldValues: JSON.stringify(oldRecord),
          newValues: JSON.stringify(newRecord),
        }
      });
    } catch (auditErr) {
      console.warn('Unable to write update audit log:', auditErr);
    }

    return { success: true, item: newRecord };
  }

  async logPrintJob(userId: string, printerId: string, documentId: string | null, documentName: string, pages: number, ip: string, device: string) {
    await this.checkPermission(userId, 'PRINTER_MONITOR');

    const printer = await this.prisma.printer.findUnique({
      where: { id: printerId },
      include: { printerStatus: true }
    });
    if (!printer) throw new NotFoundException('Hardware printer device not found.');

    // Simple safety guard to verify printer holds sufficient paper capacity
    let paperLevel = printer.printerStatus?.paperLevel ?? 100;
    let tonerLevel = printer.printerStatus?.tonerLevel ?? 100;
    let status = 'COMPLETED';

    if (paperLevel < pages) {
      status = 'FAILED';
    } else {
      paperLevel = Math.max(0, paperLevel - pages);
      tonerLevel = Math.max(0, tonerLevel - Math.floor(pages * 0.15));
    }

    const job = await this.prisma.printJob.create({
      data: {
        userId,
        printerId,
        documentId,
        documentName,
        pages,
        status,
        ip,
        device,
      },
      include: { user: true, printer: true }
    });

    if (status === 'COMPLETED') {
      // Update pagecounts and levels
      await this.prisma.printer.update({
        where: { id: printerId },
        data: {
          pagesPrintedMonth: { increment: pages }
        }
      });
      if (printer.printerStatus) {
        await this.prisma.printerStatus.update({
          where: { printerId },
          data: {
            paperLevel,
            tonerLevel,
            pagesPrinted: { increment: pages },
            monthlyPages: { increment: pages }
          }
        });
      }
    }

    // Write print job status to Security Operations Logs
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: status === 'COMPLETED' ? 'PRINT_JOB_COMPLETED' : 'PRINT_JOB_FAILED',
        module: 'Printer',
        entityId: job.id,
        entityType: 'PrintJob',
        oldValues: JSON.stringify({ printerName: printer.name }),
        newValues: JSON.stringify({ documentName, pages, status, ip }),
      }
    });

    if (status === 'FAILED') {
      // Log a dynamic warning alert
      await this.prisma.printerAlert.create({
        data: {
          printerId,
          type: 'PAPER_CRITICAL',
          severity: 'CRITICAL',
          message: `Print operation failed. Paper level critical for document: ${documentName}. Required pages: ${pages}, current paper capacity: ${printer.printerStatus?.paperLevel ?? 0}%`,
        }
      });
      throw new BadRequestException('Print job failed: Insufficient paper level capacity.');
    }

    return { success: true, job };
  }

  async deleteRecord(moduleName: string, id: string, operatorUserId: string) {
    const defaultUser = await this.prisma.user.findFirst();
    const userId = operatorUserId || (defaultUser ? defaultUser.id : '');

    const userObj = await this.prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = userObj?.role === 'SUPER_ADMIN';

    let deletedRecord: any = null;

    if (moduleName === 'Correspondence') {
      await this.checkPermission(userId, 'CORRESPONDENCE_DELETE');
      if (isSuperAdmin) {
        deletedRecord = await this.prisma.correspondence.delete({ where: { id } });
      } else {
        // Replace destructive delete with archiving
        deletedRecord = await this.prisma.correspondence.update({
          where: { id },
          data: {
            status: 'Archived',
            archivedAt: new Date(),
            archivedBy: userId,
            deletedAt: new Date(),
            deletedBy: userId,
          }
        });
      }
    } else if (moduleName === 'Subscriptions') {
      await this.checkPermission(userId, 'subscriptions.manage');
      if (isSuperAdmin) {
        deletedRecord = await this.prisma.subscription.delete({ where: { id } });
      } else {
        deletedRecord = await this.prisma.subscription.update({
          where: { id },
          data: { deletedAt: new Date(), deletedBy: userId }
        });
      }
    } else if (moduleName === 'Inventory') {
      await this.checkPermission(userId, 'inventory.delete');
      if (isSuperAdmin) {
        deletedRecord = await this.prisma.inventoryItem.delete({ where: { id } });
      } else {
        deletedRecord = await this.prisma.inventoryItem.update({
          where: { id },
          data: { deletedAt: new Date(), deletedBy: userId }
        });
      }
    } else if (moduleName === 'Fuel') {
      await this.checkPermission(userId, 'fleet.manage');
      if (isSuperAdmin) {
        deletedRecord = await this.prisma.fuelLog.delete({ where: { id } });
      } else {
        deletedRecord = await this.prisma.fuelLog.update({
          where: { id },
          data: { deletedAt: new Date(), deletedBy: userId }
        });
      }
    } else if (moduleName === 'Documents') {
      await this.checkPermission(userId, 'documents.delete');
      if (isSuperAdmin) {
        deletedRecord = await this.prisma.document.delete({ where: { id } });
      } else {
        deletedRecord = await this.prisma.document.update({
          where: { id },
          data: { deletedAt: new Date(), deletedBy: userId }
        });
      }
    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      await this.checkPermission(userId, 'PRINTER_DELETE');
      if (isSuperAdmin) {
        deletedRecord = await this.prisma.printer.delete({ where: { id } });
      } else {
        deletedRecord = await this.prisma.printer.update({
          where: { id },
          data: { deletedAt: new Date(), deletedBy: userId }
        });
      }
    } else {
      throw new BadRequestException('Invalid module name for delete');
    }

    // Write DELETE Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          module: moduleName,
          entityId: id,
          entityType: moduleName,
          oldValues: JSON.stringify(deletedRecord),
        }
      });
    } catch (auditErr) {
      console.warn('Unable to write delete audit log:', auditErr);
    }

    return { success: true };
  }

  async transitionWorkflow(moduleName: string, id: string, status: string, operatorUserId: string, remarks?: string) {
    const defaultUser = await this.prisma.user.findFirst();
    const userId = operatorUserId || (defaultUser ? defaultUser.id : '');

    let oldStatus = '';
    let updatedRecord: any = null;
    let finalStatus = status;

    if (moduleName === 'Correspondence') {
      const correspondence = await this.prisma.correspondence.findUnique({ where: { id } });
      if (!correspondence) throw new BadRequestException('Correspondence details not found.');
      oldStatus = correspondence.status;

      const target = status.toLowerCase();
      if (target === 'submitted') {
        await this.checkPermission(userId, 'CORRESPONDENCE_CREATE');
      } else if (target === 'reviewed' || target === 'draft') {
        await this.checkPermission(userId, 'CORRESPONDENCE_REVIEW');
      } else if (target === 'approved') {
        await this.checkPermission(userId, 'CORRESPONDENCE_APPROVE');
      } else if (target === 'archived') {
        await this.checkPermission(userId, 'CORRESPONDENCE_ARCHIVE');
        await this.prisma.correspondence.update({
          where: { id },
          data: {
            archivedAt: new Date(),
            archivedBy: userId,
          }
        });
      } else if (target === 'restored' || target === 'restore' || target === 'active') {
        await this.checkPermission(userId, 'CORRESPONDENCE_RESTORE');
        finalStatus = 'Draft'; // restore returns back to active editable draft
        await this.prisma.correspondence.update({
          where: { id },
          data: {
            archivedAt: null,
            archivedBy: null,
          }
        });
      }

      updatedRecord = await this.prisma.correspondence.update({
        where: { id },
        data: { status: finalStatus }
      });
    } else if (moduleName === 'Documents') {
      await this.checkPermission(userId, 'documents.approve');
      const doc = await this.prisma.document.findUnique({ where: { id } });
      if (!doc) throw new BadRequestException('Document parameters not found.');
      oldStatus = doc.status;

      let dbStatus: any = 'DRAFT';
      if (status.toUpperCase() === 'REVIEW' || status.toUpperCase() === 'IN REVIEW' || status.toUpperCase() === 'PENDING REVIEW' || status.toUpperCase() === 'PENDING') {
        dbStatus = 'PENDING';
      } else if (status.toUpperCase() === 'APPROVED' || status.toUpperCase() === 'PUBLISHED') {
        dbStatus = 'APPROVED';
      } else if (status.toUpperCase() === 'REJECTED' || status.toUpperCase() === 'FLAGGED') {
        dbStatus = 'REJECTED';
      } else if (status.toUpperCase() === 'DRAFT') {
        dbStatus = 'DRAFT';
      }

      updatedRecord = await this.prisma.document.update({
        where: { id },
        data: { status: dbStatus }
      });
    } else {
      throw new BadRequestException('This module is not governed by the main state Workflow Engine.');
    }

    // Write APPROVAL Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'APPROVAL',
          module: moduleName,
          entityId: id,
          entityType: moduleName,
          oldValues: JSON.stringify({ status: oldStatus }),
          newValues: JSON.stringify({ status: status, remarks: remarks || 'No remarks provided.' }),
        }
      });
    } catch (auditErr) {
      console.warn('Unable to write approval audit log:', auditErr);
    }

    // Trigger persistent database notification
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          message: `${moduleName} #${id.slice(0, 8)} transitioned from ${oldStatus} to ${status}.${remarks ? ' Remark: ' + remarks : ''}`,
          read: false
        }
      });
    } catch (notifErr) {
      console.warn('Unable to write flow notification:', notifErr);
    }

    return { success: true, oldStatus, newStatus: status, updatedRecord };
  }

  async assignDepartment(moduleName: string, id: string, departmentName: string, operatorUserId: string) {
    const defaultUser = await this.prisma.user.findFirst();
    const userId = operatorUserId || (defaultUser ? defaultUser.id : '');

    // Permissions check
    if (moduleName === 'Correspondence') {
      await this.checkPermission(userId, 'CORRESPONDENCE_ASSIGN');
    } else if (moduleName === 'Subscriptions') {
      await this.checkPermission(userId, 'subscriptions.manage');
    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      await this.checkPermission(userId, 'PRINTER_EDIT');
    }

    const dept = await this.prisma.department.findFirst({ where: { name: departmentName } });
    if (!dept) throw new BadRequestException(`Target Department "${departmentName}" does not exist in national organization registry.`);

    let oldDeptName = '';
    let updatedRecord: any = null;

    if (moduleName === 'Correspondence') {
      const record = await this.prisma.correspondence.findUnique({
        where: { id },
        include: { department: true }
      });
      if (!record) throw new BadRequestException('Correspondence record not located.');
      oldDeptName = record.department.name;

      updatedRecord = await this.prisma.correspondence.update({
        where: { id },
        data: { departmentId: dept.id },
        include: { department: true }
      });

    } else if (moduleName === 'Subscriptions') {
      const record = await this.prisma.subscription.findUnique({
        where: { id },
        include: { department: true }
      });
      if (!record) throw new BadRequestException('Subscription software license not located.');
      oldDeptName = record.department.name;

      updatedRecord = await this.prisma.subscription.update({
        where: { id },
        data: { departmentId: dept.id },
        include: { department: true }
      });

    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      const record = await this.prisma.printer.findUnique({
        where: { id },
        include: { department: true }
      });
      if (!record) throw new BadRequestException('Network printer device link not located.');
      oldDeptName = record.department.name;

      updatedRecord = await this.prisma.printer.update({
        where: { id },
        data: { departmentId: dept.id },
        include: { department: true }
      });

    } else {
      throw new BadRequestException('Module does not support administrative assignments.');
    }

    // Write ASSIGNMENT Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ASSIGNMENT',
          module: moduleName,
          entityId: id,
          entityType: moduleName,
          oldValues: JSON.stringify({ assignedDepartment: oldDeptName }),
          newValues: JSON.stringify({ assignedDepartment: departmentName }),
        }
      });
    } catch (auditErr) {
      console.warn('Unable to write assignment audit log:', auditErr);
    }

    // Trigger persistent database notification
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          message: `${moduleName} #${id.slice(0, 8)} reassigned from ${oldDeptName} to ${departmentName} Department.`,
          read: false
        }
      });
    } catch (notifErr) {
      console.warn('Unable to write assign notification:', notifErr);
    }

    return { success: true, oldDeptName, newDeptName: departmentName, updatedRecord };
  }

  async checkSuperAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Operational authority audit: Super Admin clearance required.');
    }
    return user;
  }

  async getArchivedRecords(userId: string) {
    await this.checkSuperAdmin(userId);

    // Fetch soft-deleted records from each module
    const correspondences = await this.prisma.correspondence.findMany({
      where: {
        OR: [
          { status: 'Archived' },
          { NOT: { deletedAt: null } }
        ]
      },
      include: { department: true }
    });

    const documents = await this.prisma.document.findMany({
      where: { NOT: { deletedAt: null } },
      include: { uploadedBy: true }
    });

    const printers = await this.prisma.printer.findMany({
      where: { NOT: { deletedAt: null } },
      include: { department: true }
    });

    const inventory = await this.prisma.inventoryItem.findMany({
      where: { NOT: { deletedAt: null } }
    });

    const subscriptions = await this.prisma.subscription.findMany({
      where: { NOT: { deletedAt: null } },
      include: { department: true }
    });

    const fuel = await this.prisma.fuelLog.findMany({
      where: { NOT: { deletedAt: null } },
      include: { vehicle: true }
    });

    const invitations = await this.prisma.invitation.findMany({
      where: { status: 'ARCHIVED' }
    });

    return {
      Correspondence: correspondences.map(r => ({
        id: r.id,
        trackingNumber: r.trackingNumber,
        sender: r.sender,
        recipient: r.recipient,
        subject: r.subject,
        status: r.status,
        archivedAt: r.archivedAt?.toISOString() || r.deletedAt?.toISOString() || r.updatedAt.toISOString(),
        archivedBy: r.archivedBy || r.deletedBy || 'System',
      })),
      Documents: documents.map(r => ({
        id: r.id,
        fileName: r.fileName,
        sizeKb: r.sizeKb,
        category: r.category,
        archivedAt: r.deletedAt?.toISOString() || r.updatedAt.toISOString(),
        archivedBy: r.deletedBy || 'System',
      })),
      Printer: printers.map(r => ({
        id: r.id,
        name: r.name,
        model: r.model,
        ipAddress: r.ipAddress,
        archivedAt: r.deletedAt?.toISOString() || r.updatedAt.toISOString(),
        archivedBy: r.deletedBy || 'System',
      })),
      Inventory: inventory.map(r => ({
        id: r.id,
        itemName: r.itemName,
        sku: r.sku,
        stock: r.stock,
        archivedAt: r.deletedAt?.toISOString() || r.updatedAt.toISOString(),
        archivedBy: r.deletedBy || 'System',
      })),
      Subscriptions: subscriptions.map(r => ({
        id: r.id,
        serviceName: r.serviceName,
        cost: r.cost,
        dueDate: r.dueDate,
        archivedAt: r.deletedAt?.toISOString() || r.updatedAt.toISOString(),
        archivedBy: r.deletedBy || 'System',
      })),
      Fuel: fuel.map(r => ({
        id: r.id,
        vehiclePlate: r.vehicle?.plate || 'Unknown',
        driver: r.driver,
        liters: r.liters,
        totalCost: r.totalCost,
        archivedAt: r.deletedAt?.toISOString() || r.updatedAt.toISOString(),
        archivedBy: r.deletedBy || 'System',
      }))
    };
  }

  async purgeRecords(moduleName: string, ids: string[], confirmation: string, userId: string) {
    await this.checkSuperAdmin(userId);

    if (!confirmation) {
      throw new BadRequestException('Security confirmation command string required.');
    }

    const cleanModule = moduleName.trim().toUpperCase();
    const count = ids.length;

    // Check confirmation matches: DELETE <count> <MODULE> RECORDS
    const expected = `DELETE ${count} ${cleanModule} RECORDS`;
    const cleanConfirm = confirmation.trim().toUpperCase();
    if (cleanConfirm !== expected) {
      throw new BadRequestException(`Security validation failed. Expected: "${expected}", but got: "${confirmation}"`);
    }

    let purgedCount = 0;

    if (moduleName === 'Correspondence') {
      const res = await this.prisma.correspondence.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Documents') {
      const res = await this.prisma.document.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Printer' || moduleName === 'Printers') {
      const res = await this.prisma.printer.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Inventory' || moduleName === 'InventoryItem') {
      const res = await this.prisma.inventoryItem.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Subscriptions') {
      const res = await this.prisma.subscription.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Fuel' || moduleName === 'FuelLog') {
      const res = await this.prisma.fuelLog.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Invitations') {
      const res = await this.prisma.invitation.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'UserSession' || moduleName === 'Sessions') {
      const res = await this.prisma.userSession.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'Notifications') {
      const res = await this.prisma.notification.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else if (moduleName === 'AuditLog' || moduleName === 'AuditLogs') {
      const res = await this.prisma.auditLog.deleteMany({
        where: { id: { in: ids } }
      });
      purgedCount = res.count;
    } else {
      throw new BadRequestException(`Module "${moduleName}" does not support permanent purge operations.`);
    }

    // Write BULK_PURGE audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_PURGE',
        module: moduleName,
        entityType: moduleName,
        oldValues: JSON.stringify({ ids, count }),
        newValues: JSON.stringify({ purgedAt: new Date(), purgedBy: userId, confirmationMessage: confirmation })
      }
    });

    return { success: true, count: purgedCount };
  }

  async getPurgeHistory(userId: string) {
    await this.checkSuperAdmin(userId);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'BULK_PURGE'
      },
      orderBy: { timestamp: 'desc' },
      include: { user: true }
    });
    return logs.map(l => {
      let parsedOld: any = {};
      try {
        parsedOld = JSON.parse(l.oldValues || '{}');
      } catch {}
      return {
        id: l.id,
        userName: l.user?.name || 'System Admin',
        userEmail: l.user?.email || 'admin@ooms.com',
        module: l.module,
        timestamp: l.timestamp.toISOString(),
        recordCount: parsedOld.count || 0,
        recordIds: parsedOld.ids || []
      };
    });
  }

  async bulkAction(p: {
    moduleName: string;
    action: 'archive' | 'restore' | 'export' | 'delete';
    ids: string[];
    userId: string;
  }) {
    const { moduleName, action, ids, userId } = p;
    const count = ids.length;

    // Permissions check
    if (action === 'archive') {
      if (moduleName === 'Correspondence') await this.checkPermission(userId, 'CORRESPONDENCE_DELETE');
      else if (moduleName === 'Subscriptions') await this.checkPermission(userId, 'subscriptions.manage');
      else if (moduleName === 'Inventory') await this.checkPermission(userId, 'inventory.delete');
      else if (moduleName === 'Fuel') await this.checkPermission(userId, 'fleet.manage');
      else if (moduleName === 'Documents') await this.checkPermission(userId, 'documents.delete');
      else if (moduleName === 'Printer' || moduleName === 'Printers') await this.checkPermission(userId, 'PRINTER_DELETE');
    } else if (action === 'restore') {
      if (moduleName === 'Correspondence') await this.checkPermission(userId, 'CORRESPONDENCE_RESTORE');
      else if (moduleName === 'Subscriptions') await this.checkPermission(userId, 'subscriptions.manage');
      else if (moduleName === 'Inventory') await this.checkPermission(userId, 'inventory.edit');
      else if (moduleName === 'Fuel') await this.checkPermission(userId, 'fleet.manage');
      else if (moduleName === 'Documents') await this.checkPermission(userId, 'documents.edit');
      else if (moduleName === 'Printer' || moduleName === 'Printers') await this.checkPermission(userId, 'PRINTER_EDIT');
    } else if (action === 'delete') {
      if (moduleName === 'Correspondence') await this.checkPermission(userId, 'CORRESPONDENCE_DELETE');
      else if (moduleName === 'Subscriptions') await this.checkPermission(userId, 'subscriptions.manage');
      else if (moduleName === 'Inventory') await this.checkPermission(userId, 'inventory.delete');
      else if (moduleName === 'Fuel') await this.checkPermission(userId, 'fleet.manage');
      else if (moduleName === 'Documents') await this.checkPermission(userId, 'documents.delete');
      else if (moduleName === 'Printer' || moduleName === 'Printers') await this.checkPermission(userId, 'PRINTER_DELETE');
    }

    if (action === 'archive') {
      if (moduleName === 'Correspondence') {
        await this.prisma.correspondence.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'Archived',
            deletedAt: new Date(),
            deletedBy: userId,
            archivedAt: new Date(),
            archivedBy: userId,
          }
        });
      } else if (moduleName === 'Documents') {
        await this.prisma.document.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          }
        });
      } else if (moduleName === 'Printer' || moduleName === 'Printers') {
        await this.prisma.printer.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          }
        });
      } else if (moduleName === 'Inventory' || moduleName === 'InventoryItem') {
        await this.prisma.inventoryItem.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          }
        });
      } else if (moduleName === 'Subscriptions') {
        await this.prisma.subscription.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          }
        });
      } else if (moduleName === 'Fuel' || moduleName === 'FuelLog') {
        await this.prisma.fuelLog.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          }
        });
      } else {
        throw new BadRequestException(`Module "${moduleName}" does not support bulk archiving.`);
      }

      // Audit Log as requested by Rule 6
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'BULK_ARCHIVE',
          module: moduleName,
          entityType: moduleName,
          oldValues: JSON.stringify({ ids, count }),
          newValues: JSON.stringify({ status: 'Archived', archivedAt: new Date(), archivedBy: userId })
        }
      });

    } else if (action === 'restore') {
      if (moduleName === 'Correspondence') {
        await this.prisma.correspondence.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'Draft',
            deletedAt: null,
            deletedBy: null,
            archivedAt: null,
            archivedBy: null,
          }
        });
      } else if (moduleName === 'Documents') {
        await this.prisma.document.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: null,
            deletedBy: null,
          }
        });
      } else if (moduleName === 'Printer' || moduleName === 'Printers') {
        await this.prisma.printer.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: null,
            deletedBy: null,
          }
        });
      } else if (moduleName === 'Inventory' || moduleName === 'InventoryItem') {
        await this.prisma.inventoryItem.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: null,
            deletedBy: null,
          }
        });
      } else if (moduleName === 'Subscriptions') {
        await this.prisma.subscription.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: null,
            deletedBy: null,
          }
        });
      } else if (moduleName === 'Fuel' || moduleName === 'FuelLog') {
        await this.prisma.fuelLog.updateMany({
          where: { id: { in: ids } },
          data: {
            deletedAt: null,
            deletedBy: null,
          }
        });
      } else {
        throw new BadRequestException(`Module "${moduleName}" does not support bulk restoration.`);
      }

      // Audit Log as requested by Rule 6
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'BULK_RESTORE',
          module: moduleName,
          entityType: moduleName,
          oldValues: JSON.stringify({ ids, count }),
          newValues: JSON.stringify({ restoredAt: new Date() })
        }
      });

    } else if (action === 'export') {
      // Audit Log as requested by Rule 6
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'BULK_EXPORT',
          module: moduleName,
          entityType: moduleName,
          oldValues: JSON.stringify({ ids, count }),
          newValues: JSON.stringify({ exportedAt: new Date() })
        }
      });
    } else if (action === 'delete') {
      if (moduleName === 'Correspondence') {
        await this.prisma.correspondence.deleteMany({
          where: { id: { in: ids } }
        });
      } else if (moduleName === 'Documents') {
        await this.prisma.document.deleteMany({
          where: { id: { in: ids } }
        });
      } else if (moduleName === 'Printer' || moduleName === 'Printers') {
        await this.prisma.printer.deleteMany({
          where: { id: { in: ids } }
        });
      } else if (moduleName === 'Inventory' || moduleName === 'InventoryItem') {
        await this.prisma.inventoryItem.deleteMany({
          where: { id: { in: ids } }
        });
      } else if (moduleName === 'Subscriptions') {
        await this.prisma.subscription.deleteMany({
          where: { id: { in: ids } }
        });
      } else if (moduleName === 'Fuel' || moduleName === 'FuelLog') {
        await this.prisma.fuelLog.deleteMany({
          where: { id: { in: ids } }
        });
      } else {
        throw new BadRequestException(`Module "${moduleName}" does not support bulk deletion.`);
      }

      // Audit Log as requested by Rule 6
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'BULK_DELETE',
          module: moduleName,
          entityType: moduleName,
          oldValues: JSON.stringify({ ids, count }),
          newValues: JSON.stringify({ deletedAt: new Date() })
        }
      });
    }

    return { success: true, count };
  }

  async productionCleanup(userId: string) {
    await this.checkSuperAdmin(userId);

    const demoEmails = ['admin@ooms.com', 'manager@ooms.com', 'officer@ooms.com', 'viewer@ooms.com'];
    const demoUsers = await this.prisma.user.findMany({
      where: { email: { in: demoEmails } }
    });
    const demoUserIds = demoUsers.map(u => u.id);

    // Clean tables and collect removed counts
    const removedInventoryTransactions = await this.prisma.inventoryTransaction.deleteMany({});
    const removedFuelLogs = await this.prisma.fuelLog.deleteMany({});
    const removedPrintJobs = await this.prisma.printJob.deleteMany({});
    const removedPrinterAlerts = await this.prisma.printerAlert.deleteMany({});
    const removedPrinterMetrics = await this.prisma.printerUsageMetric.deleteMany({});
    const removedPrinterStatuses = await this.prisma.printerStatus.deleteMany({});
    const removedPrinters = await this.prisma.printer.deleteMany({});
    const removedSubscriptions = await this.prisma.subscription.deleteMany({});
    const removedCorrespondences = await this.prisma.correspondence.deleteMany({});
    const removedDocuments = await this.prisma.document.deleteMany({});
    const removedInventoryItems = await this.prisma.inventoryItem.deleteMany({});
    const removedVehicles = await this.prisma.vehicle.deleteMany({});
    const removedUpcomingTasks = await this.prisma.upcomingTask.deleteMany({});
    const removedActionAlerts = await this.prisma.actionAlert.deleteMany({});
    const removedNotifications = await this.prisma.notification.deleteMany({});

    // Also remove any test sessions (NOT current user session) and demo invitations
    const removedUserSessions = await this.prisma.userSession.deleteMany({
      where: { NOT: { userId } }
    });

    const removedInvitations = await this.prisma.invitation.deleteMany({
      where: { email: { in: demoEmails } }
    });

    // Remove audit logs of demo users (but keep real audit logs active)
    const removedAuditLogsList = await this.prisma.auditLog.deleteMany({
      where: { userId: { in: demoUserIds } }
    });

    // Remove the demo users themselves
    const removedUsers = await this.prisma.user.deleteMany({
      where: { id: { in: demoUserIds } }
    });

    // Compute remaining items
    const [
      remainingUsers,
      remainingInvitations,
      remainingSuperAdmins,
      finalCorrespondences,
      finalSubscriptions,
      finalInventoryItems,
      finalVehicles,
      finalFuelLogs,
      finalDocuments
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.invitation.count(),
      this.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      this.prisma.correspondence.count(),
      this.prisma.subscription.count(),
      this.prisma.inventoryItem.count(),
      this.prisma.vehicle.count(),
      this.prisma.fuelLog.count(),
      this.prisma.document.count()
    ]);

    const tablesCleared = [
      'Correspondence',
      'Document',
      'InventoryItem',
      'InventoryTransaction',
      'Vehicle',
      'FuelLog',
      'Subscription',
      'Printer',
      'PrinterStatus',
      'PrinterAlert',
      'PrinterUsageMetric',
      'Notification',
      'UpcomingTask',
      'ActionAlert',
      'PrintJob'
    ];

    const recordsRemoved = {
      Correspondence: removedCorrespondences.count,
      Document: removedDocuments.count,
      InventoryItem: removedInventoryItems.count,
      InventoryTransaction: removedInventoryTransactions.count,
      Vehicle: removedVehicles.count,
      FuelLog: removedFuelLogs.count,
      Subscription: removedSubscriptions.count,
      Printer: removedPrinters.count,
      PrinterStatus: removedPrinterStatuses.count,
      PrinterAlert: removedPrinterAlerts.count,
      PrinterUsageMetric: removedPrinterMetrics.count,
      Notification: removedNotifications.count,
      UpcomingTask: removedUpcomingTasks.count,
      ActionAlert: removedActionAlerts.count,
      PrintJob: removedPrintJobs.count,
      UserSession: removedUserSessions.count,
      Invitation: removedInvitations.count,
      AuditLog: removedAuditLogsList.count,
      User: removedUsers.count
    };

    const totalRemoved = Object.values(recordsRemoved).reduce((a, b) => a + b, 0);

    const report = {
      tablesCleared,
      recordsRemoved,
      totalRemoved,
      remainingUsers,
      remainingInvitations,
      remainingSuperAdmins,
      removedCorrespondenceCount: removedCorrespondences.count,
      removedDocumentCount: removedDocuments.count,
      removedPrintJobCount: removedPrintJobs.count,
      removedInvitationCount: removedInvitations.count,
      removedSessionCount: removedUserSessions.count,
      removedInventoryTransactionCount: removedInventoryTransactions.count,
      removedAuditLogCount: removedAuditLogsList.count,
      removedUserCount: removedUsers.count,
      demoUsersRemoved: demoUsers.map(u => ({ id: u.id, email: u.email, name: u.name })),
      finalDashboardCounts: {
        correspondence: finalCorrespondences,
        subscriptions: finalSubscriptions,
        inventory: finalInventoryItems,
        vehicles: finalVehicles,
        fuelLogs: finalFuelLogs,
        documents: finalDocuments
      }
    };

    // Log the successful production-wide cleanup to security audit logs
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PRODUCTION_CLEANUP',
        module: 'Governance',
        entityType: 'System',
        newValues: JSON.stringify(report)
      }
    });

    return {
      success: true,
      report
    };
  }
}
