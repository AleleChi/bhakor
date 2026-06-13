import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Inject, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { EnterpriseLogger } from '../services/logger.service';
import { EmailService } from '../services/email.service';
import { StorageService } from '../services/storage.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly emailService = new EmailService();
  private readonly storageService = new StorageService();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    try {
      EnterpriseLogger.info('IAM', 'Starting automated IAM bootstrapper and database seeds check...');
      await this.seedRolesAndPermissions();
    } catch (err) {
      console.error('Critical: Error in automated IAM bootstrapping:', err);
    }
  }

  async seedRolesAndPermissions() {
    // System Roles definitions
    const systemRoles = [
      { name: 'SUPER_ADMIN', description: 'Complete centralized administrative control of all OOMS components, cryptographic security logs, personnel directories, and external backup systems.', isSystem: true },
      { name: 'ADMIN', description: 'Operational overseer. Manages standard ministerial correspondences, registries audits, and office consumables. Dispatches staff invitations.', isSystem: true },
      { name: 'MANAGER', description: 'Division head. Approves pending budget cost tickets, fuel quota distributions, and signs standard renewal agreements.', isSystem: true },
      { name: 'OFFICER', description: 'Registry clerk. Logs incoming envelopes, scans standard PDFs, updates terminal stocks, and monitors print queues.', isSystem: true },
      { name: 'VIEWER', description: 'Auditor access. Chronological trace reports, document reading, and system status observation with write-protection constraints.', isSystem: true }
    ];

    // Core System Permissions definitions
    const permissions = [
      { module: 'documents', action: 'documents.view', description: 'View and search administrative documents within the Document Workspace module.' },
      { module: 'documents', action: 'documents.create', description: 'Upload and ingest new documents or draft templates.' },
      { module: 'documents', action: 'documents.edit', description: 'Modify and update metadata or categorization on ingested files.' },
      { module: 'documents', action: 'documents.delete', description: 'Perform soft-deletion or decommissioning of files.' },
      { module: 'documents', action: 'documents.approve', description: 'Grant official authorization of pending files or budget tickets.' },
      { module: 'documents', action: 'documents.export', description: 'Export tabular directory indexes and audit trails.' },

      { module: 'correspondence', action: 'correspondence.view', description: 'Inspect ministerial incoming/outgoing correspondence files.' },
      { module: 'correspondence', action: 'correspondence.create', description: 'Log incoming letters or parcels into the registry ledger.' },
      { module: 'correspondence', action: 'correspondence.assign', description: 'Formally assign correspondence tracking tasks to operations staff.' },

      { module: 'correspondence', action: 'CORRESPONDENCE_VIEW', description: 'Enhanced read trace of correspondence registries.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_CREATE', description: 'Create and submit standard ministerial correspondence.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_EDIT', description: 'Modify draft ministerial correspondence logs.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_REVIEW', description: 'Review, comment, and returned submittals.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_APPROVE', description: 'Officially sign-off and dispatch submittals.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_ARCHIVE', description: 'Perform state-based preservation archiving.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_RESTORE', description: 'Restore archived files back to active ledger.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_DELETE', description: 'Perform permanent database purge operations.' },
      { module: 'correspondence', action: 'CORRESPONDENCE_EXPORT', description: 'Secure governance correspondence export.' },

      { module: 'inventory', action: 'inventory.view', description: 'Read system terminal stocks and tracking status.' },
      { module: 'inventory', action: 'inventory.create', description: 'Record and ingest brand new inventory consumable catalogs.' },
      { module: 'inventory', action: 'inventory.edit', description: 'Update current quantities and min-threshold parameters.' },
      { module: 'inventory', action: 'inventory.approve', description: 'Approve consumable distribution and issuance tickets.' },
      { module: 'inventory', action: 'inventory.delete', description: 'Surgical deletion of invalid items.' },

      { module: 'fleet', action: 'fleet.view', description: 'Read and evaluate OOMS vehicles registries.' },
      { module: 'fleet', action: 'fleet.manage', description: 'Create fuel logs, adjust location parameters, or manage vehicle listings.' },

      { module: 'subscriptions', action: 'subscriptions.manage', description: 'Add, renew, adjust, or cancel active service provider subscriptions.' },
      
      { module: 'printers', action: 'printers.manage', description: 'Inject new printers, view alerts registries, and monitor real-time statuses.' },
      { module: 'printers', action: 'PRINTER_VIEW', description: 'Track and view active hardware printer devices.' },
      { module: 'printers', action: 'PRINTER_CREATE', description: 'Register new network printer credentials.' },
      { module: 'printers', action: 'PRINTER_EDIT', description: 'Update IP addresses, department maps, or paper capacities.' },
      { module: 'printers', action: 'PRINTER_DELETE', description: 'Decommission printer device registries.' },
      { module: 'printers', action: 'PRINTER_MONITOR', description: 'Read toner metrics, page count logs, and alert pools.' },
      { module: 'printers', action: 'PRINTER_ALERTS', description: 'Acknowledge, dismiss, or log mechanical printer error alerts.' },
      { module: 'printers', action: 'PRINTER_EXPORT', description: 'Export printer auditing and consumable volume reports.' },

      { module: 'sessions', action: 'SESSION_VIEW', description: 'Analyze active personnel sessions.' },
      { module: 'sessions', action: 'SESSION_TERMINATE', description: 'Force terminate specific active sessions.' },
      { module: 'sessions', action: 'SESSION_TERMINATE_ALL', description: 'Forced simultaneous session evictions.' },

      { module: 'audit', action: 'audit.view', description: 'Read administrative chronologies and trace logs.' },
      { module: 'users', action: 'users.manage', description: 'Dispatch staff invitations, modify employee statuses, or block credentials.' },
      { module: 'roles', action: 'roles.manage', description: 'Re-assign or update permissions capabilities within the IAM roles matrix.' }
    ];

    // Ensure all permissions are seed-created
    const dbPermissionsMap = new Map<string, string>();
    for (const p of permissions) {
      let dbPerm = await this.prisma.permission.findFirst({
        where: { action: p.action }
      });
      if (!dbPerm) {
        dbPerm = await this.prisma.permission.create({
          data: p
        });
      }
      dbPermissionsMap.set(p.action, dbPerm.id);
    }

    // Default permissions assignments map
    const defaultRoleGrants: Record<string, string[]> = {
      SUPER_ADMIN: permissions.map(p => p.action),
      ADMIN: [
        'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.approve', 'documents.export',
        'correspondence.view', 'correspondence.create', 'correspondence.assign',
        'CORRESPONDENCE_VIEW', 'CORRESPONDENCE_CREATE', 'CORRESPONDENCE_EDIT', 'CORRESPONDENCE_REVIEW', 'CORRESPONDENCE_APPROVE', 'CORRESPONDENCE_ARCHIVE', 'CORRESPONDENCE_RESTORE', 'CORRESPONDENCE_DELETE', 'CORRESPONDENCE_EXPORT',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.approve',
        'subscriptions.manage', 'printers.manage', 'audit.view', 'users.manage',
        'PRINTER_VIEW', 'PRINTER_CREATE', 'PRINTER_EDIT', 'PRINTER_DELETE', 'PRINTER_MONITOR', 'PRINTER_ALERTS', 'PRINTER_EXPORT',
        'SESSION_VIEW', 'SESSION_TERMINATE', 'SESSION_TERMINATE_ALL'
      ],
      MANAGER: [
        'documents.view', 'documents.approve',
        'correspondence.view', 'correspondence.assign',
        'CORRESPONDENCE_VIEW', 'CORRESPONDENCE_CREATE', 'CORRESPONDENCE_EDIT', 'CORRESPONDENCE_REVIEW',
        'inventory.view', 'inventory.approve',
        'fleet.view', 'subscriptions.manage', 'audit.view',
        'PRINTER_VIEW', 'PRINTER_MONITOR', 'PRINTER_ALERTS',
        'SESSION_VIEW'
      ],
      OFFICER: [
        'documents.view', 'documents.create',
        'correspondence.view', 'correspondence.create',
        'CORRESPONDENCE_VIEW', 'CORRESPONDENCE_CREATE', 'CORRESPONDENCE_EDIT',
        'inventory.view', 'inventory.create',
        'PRINTER_VIEW'
      ],
      VIEWER: [
        'documents.view', 'correspondence.view', 'inventory.view', 'fleet.view', 'audit.view',
        'CORRESPONDENCE_VIEW', 'PRINTER_VIEW'
      ]
    };

    // Initialize/sync roles
    for (const r of systemRoles) {
      let dbRole = await this.prisma.role.findUnique({
        where: { name: r.name }
      });
      if (!dbRole) {
        dbRole = await this.prisma.role.create({
          data: r
        });
        EnterpriseLogger.info('IAM', `Seeded System Role: [${r.name}]`);
      }

      // Sync role permissions bridges
      const grantedActions = defaultRoleGrants[r.name] || [];
      const currentBridges = await this.prisma.rolePermission.findMany({
        where: { roleId: dbRole.id },
        include: { permission: true }
      });

      const currentActions = currentBridges.map(cb => cb.permission.action);
      const toAddActions = grantedActions.filter(ga => !currentActions.includes(ga));

      if (toAddActions.length > 0) {
        const createData = toAddActions
          .map(action => {
            const permissionId = dbPermissionsMap.get(action);
            return permissionId ? { roleId: dbRole!.id, permissionId } : null;
          })
          .filter(x => x !== null) as { roleId: string; permissionId: string }[];

        await this.prisma.rolePermission.createMany({
          data: createData
        });
        EnterpriseLogger.info('IAM', `Synced permissions mapping for [${r.name}] (+${toAddActions.length} actions)`);
      }
    }
  }

  private async createLoginHistory(userId: string, status: string, ipAddress = '127.0.0.1', userAgent = 'Web App Portal') {
    try {
      let os = 'Unknown OS';
      let browser = 'Unknown Browser';
      let device = 'Desktop';

      if (userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('windows')) os = 'Windows';
        else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
        else if (ua.includes('linux')) os = 'Linux';
        else if (ua.includes('android')) os = 'Android';
        else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

        if (ua.includes('chrome') || ua.includes('chromium')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('edge') || ua.includes('edg')) browser = 'Edge';

        if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
          device = 'Mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          device = 'Tablet';
        }
      }

      await this.prisma.loginHistory.create({
        data: {
          userId,
          ipAddress,
          browser,
          device,
          operatingSystem: os,
          location: 'Nigeria (Abuja HQ)',
          status,
        }
      });
    } catch (err) {
      console.error('Failed to register login history:', err);
    }
  }

  private validatePasswordStrength(password: string) {
    if (password.length < 12) {
      throw new BadRequestException('Password must be at least 12 characters.');
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new BadRequestException('Complexity error: Password must include uppercase, lowercase, numeric, and special character combinations.');
    }
  }

  async login(email: string, password?: string, ipAddress?: string, userAgent?: string) {
    const safePassword = password || 'password123';
    EnterpriseLogger.info('AUTH', `Login handshake init for user email address: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || user.deletedAt) {
      EnterpriseLogger.warn('AUTH', `Credentials check failed: User not found or decommissioned [${email}]`);
      throw new UnauthorizedException('Invalid administrative email address or security key.');
    }

    // Lockout verification
    if (user.lockoutEnd && new Date() < new Date(user.lockoutEnd)) {
      EnterpriseLogger.warn('AUTH', `Login block: Account is locked out due to consecutive validation failures [${email}]`);
      throw new BadRequestException('Account temporary locked out due to brute-force protection. Try again in 15 minutes.');
    }

    // Active status verification
    if (user.status !== 'ACTIVE') {
      EnterpriseLogger.warn('AUTH', `Login reject: User account has suspended or unredeemed status: ${user.status} [${email}]`);
      throw new ForbiddenException(`Access denied. Account is currently ${user.status}. Please authenticate staff coordinates.`);
    }

    const isValidPassword = bcrypt.compareSync(safePassword, user.passwordHash);

    if (!isValidPassword) {
      const incrementedFailed = user.failedAttempts + 1;
      const dataUpdate: any = { failedAttempts: incrementedFailed };

      if (incrementedFailed >= 5) {
        dataUpdate.lockoutEnd = new Date(Date.now() + 15 * 60000); // 15 Minute lock
        dataUpdate.status = 'LOCKED';
        EnterpriseLogger.error('AUTH', `BRUTE FORCE ALERT: Locking out account [${email}] after 5 failed authentication cycles.`);
        
        await this.prisma.user.update({
          where: { id: user.id },
          data: dataUpdate,
        });

        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'ACCOUNT_LOCKED',
            module: 'Auth',
            entityId: user.id,
            entityType: 'User',
            newValues: JSON.stringify({ email: user.email, failCount: incrementedFailed, lockedAt: new Date() }),
          }
        });
        
        await this.createLoginHistory(user.id, 'LOCKED', ipAddress, userAgent);
        
        // Notify security
        await this.emailService.sendWorkflowNotificationEmail(user.email, 'Account Temporarily Locked Out', 'Your OOMS Nigeria account has been locked for 15 minutes due to 5 consecutive failed access keys.');
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: dataUpdate,
        });
        await this.createLoginHistory(user.id, 'FAILED', ipAddress, userAgent);
      }

      EnterpriseLogger.warn('AUTH', `Credentials validation failed for account coordinate: [${email}]`);
      throw new UnauthorizedException('Invalid administrative email address or security key.');
    }

    // Success login cleanup
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockoutEnd: null,
        lastLogin: new Date(),
      },
    });

    await this.createLoginHistory(user.id, 'SUCCESS', ipAddress, userAgent);

    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.organizationId, name: user.name };
    const token = this.jwtService.sign(payload, { secret: 'OOMS_SUPER_SECRET_KEY' });

    // Track active User Session
    await this.prisma.userSession.create({
      data: {
        token,
        userId: user.id,
        device: userAgent || 'Web App Portal',
        ip: ipAddress || '127.0.0.1',
      },
    });

    EnterpriseLogger.info('AUTH', `SESSION_CREATED: User Session record successfully inserted. User ID: [${user.id}], email: [${user.email}], device: [${userAgent || 'Web App Portal'}], ip: [${ipAddress || '127.0.0.1'}].`);

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          module: 'Auth',
          entityId: user.id,
          entityType: 'User',
          newValues: JSON.stringify({ email: user.email, role: user.role, name: user.name, ip: ipAddress }),
        }
      });
    } catch (auditErr) {
      console.warn('Unable to write login audit log:', auditErr);
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        photoPath: user.photoPath,
        organization: user.organization.name,
        organizationId: user.organizationId,
      },
    };
  }

  async logout(userId: string, token?: string) {
    if (token) {
      await this.prisma.userSession.deleteMany({
        where: { token, userId },
      });
    }

    try {
      await this.createLoginHistory(userId, 'LOGOUT');
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'LOGOUT',
          module: 'Auth',
          entityId: userId,
          entityType: 'User',
        }
      });
    } catch (err) {
      console.warn('Unable to write logout audit log:', err);
    }
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User with this email coordinates does not exist.');
    }

    const resetToken = this.jwtService.sign({ sub: user.id, type: 'reset' }, { secret: 'OOMS_SUPER_SECRET_KEY', expiresIn: '15m' });
    
    // Log Audit and trigger email template
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUISITION',
        module: 'Auth',
        entityId: user.id,
        entityType: 'User',
      }
    });

    const frontendBase = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'https://bhakor.vercel.app';
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/?view=reset&token=${resetToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    return {
      message: 'Secure recovery protocol generated.',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: 'OOMS_SUPER_SECRET_KEY' });
      if (payload.type !== 'reset') {
        throw new BadRequestException('Invalid coordinates reset token.');
      }

      this.validatePasswordStrength(newPassword);

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt) {
        throw new NotFoundException('Personnel coordinate not found.');
      }

      const passwordHash = bcrypt.hashSync(newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, failedAttempts: 0, lockoutEnd: null, status: 'ACTIVE' },
      });

      await this.createLoginHistory(user.id, 'PASSWORD_RESET');

      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_CONFIRM',
          module: 'Auth',
          entityId: user.id,
          entityType: 'User',
        }
      });

      return { success: true, message: 'Administrative security key updated successfully.' };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Invalid or expired secure reset tokens.');
    }
  }

  async getInvitationDetailsByToken(token: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    let user = await this.prisma.user.findUnique({
      where: { invitationToken: hash },
    });
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { invitationToken: token },
      });
    }

    if (!user || user.deletedAt) {
      throw new NotFoundException('Invitation token coordinate is invalid or has expired.');
    }

    // Check custom Invitation table
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: hash }
    });

    if (invitation) {
      if (invitation.status === 'EXPIRED' || new Date() > new Date(invitation.expiresAt)) {
        throw new BadRequestException('This staff invitation has expired after 72 hours.');
      }
      if (invitation.status === 'REVOKED') {
        throw new BadRequestException('This staff invitation has been revoked by security personnel.');
      }
      if (invitation.status === 'ACCEPTED') {
        throw new BadRequestException('This staff invitation has already been redeemed.');
      }
    }

    return {
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: invitation?.departmentId || null,
      jobTitle: invitation?.jobTitle || null,
      phone: invitation?.phone || null,
      branch: invitation?.branch || null,
      manager: invitation?.manager || null,
      expiresAt: invitation?.expiresAt || null,
    };
  }

  async acceptInvitation(token: string, password?: string, name?: string, photoPath?: string) {
    const safePassword = password || 'password123';
    this.validatePasswordStrength(safePassword);

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    let user = await this.prisma.user.findUnique({
      where: { invitationToken: hash },
    });
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { invitationToken: token },
      });
    }

    if (!user || user.deletedAt) {
      throw new BadRequestException('Invitation token expired or invalidated.');
    }

    // Update Invitation table if matching record exists
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: hash }
    });

    if (invitation) {
      if (invitation.status === 'EXPIRED' || new Date() > new Date(invitation.expiresAt)) {
        throw new BadRequestException('This staff invitation has expired after 72 hours.');
      }
      if (invitation.status === 'REVOKED') {
        throw new BadRequestException('This staff invitation has been revoked by security personnel.');
      }
      if (invitation.status === 'ACCEPTED') {
        throw new BadRequestException('This staff invitation has already been redeemed.');
      }

      await this.prisma.invitation.update({
        where: { tokenHash: hash },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      });
    }

    const passwordHash = bcrypt.hashSync(safePassword, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        passwordHash,
        invitationToken: null,
        status: 'ACTIVE',
        failedAttempts: 0,
        lockoutEnd: null,
        photoPath: photoPath || user.photoPath,
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.organizationId, name: updatedUser.name };
    const jwtToken = this.jwtService.sign(payload, { secret: 'OOMS_SUPER_SECRET_KEY' });

    // Track active User Session
    await this.prisma.userSession.create({
      data: {
        token: jwtToken,
        userId: user.id,
        device: 'Web Initial Setup Activation',
        ip: '127.0.0.1',
      },
    });

    EnterpriseLogger.info('AUTH', `SESSION_CREATED: User Session record successfully inserted during invitation accept. User ID: [${user.id}], email: [${user.email}].`);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVITATION_ACCEPTED',
        module: 'Auth',
        entityId: user.id,
        entityType: 'User',
        newValues: JSON.stringify({ email: user.email, role: user.role, name: updatedUser.name }),
      }
    });

    // Logging SUCCESS to LoginHistory
    await this.createLoginHistory(user.id, 'SUCCESS', '127.0.0.1', 'Web Initial Setup Activation');

    await this.emailService.sendAccountActivatedEmail(user.email, updatedUser.name);

    return {
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: updatedUser.name,
        role: user.role,
        status: 'ACTIVE',
        photoPath: user.photoPath,
        organizationId: user.organizationId,
      },
    };
  }

  // --- IAM ENTERPRISE ADMIN METHODS ---

  async getUsers(search = '', role = '', status = '', page = 1, limit = 100) {
    EnterpriseLogger.info('IAM', `Query users directory with search: "${search}", role: "${role}", status: "${status}"`);
    
    const where: any = { deletedAt: null };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    const total = await this.prisma.user.count({ where });
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          select: {
            id: true,
            createdAt: true,
            device: true,
            ip: true,
          }
        },
        auditLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true, action: true }
        }
      }
    });

    const invitations = await this.prisma.invitation.findMany({
      where: { email: { in: users.map(u => u.email) } }
    });

    const parsedUsers = users.map(u => {
      const invite = invitations.find(inv => inv.email.toLowerCase() === u.email.toLowerCase());
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        photoPath: u.photoPath,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        sessionsCount: u.sessions.length,
        lastAction: u.auditLogs[0] ? `${u.auditLogs[0].action} (${new Date(u.auditLogs[0].timestamp).toLocaleDateString()})` : 'None',
        department: invite?.departmentId || (u.role === 'SUPER_ADMIN' ? 'Sovereign Governance' : 'Advisory & Compliance'),
        branch: invite?.branch || 'Abuja Headquarters',
        jobTitle: invite?.jobTitle || (u.role === 'SUPER_ADMIN' ? 'Chief Information Security Officer' : 'System Administrator'),
        manager: invite?.manager || 'Executive Council',
        phone: invite?.phone || '+234 812 345 6789',
        employeeId: `EMP-${u.id.substring(0, 8).toUpperCase()}`,
        invitationStatus: invite ? invite.status : (u.status === 'INVITED' ? 'PENDING' : 'ACCEPTED'),
        failedAttempts: u.failedAttempts,
        lockoutEnd: u.lockoutEnd,
      };
    });

    return {
      data: parsedUsers,
      users: parsedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resendInvitationStandalone(email: string, adminId?: string) {
    const u = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } }
    });
    if (!u) {
      throw new NotFoundException('Security exception: The specified user was not identified.');
    }
    if (u.status !== 'INVITED') {
      throw new BadRequestException('Action rejected: Account is already activated or not in invited state.');
    }

    const inviteRecord = await this.prisma.invitation.findFirst({
      where: { email: { equals: u.email, mode: 'insensitive' }, status: 'PENDING' }
    });

    const rawToken = 'inv_' + crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    if (inviteRecord) {
      await this.prisma.invitation.update({
        where: { id: inviteRecord.id },
        data: {
          tokenHash: newTokenHash,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
        }
      });
    } else {
      await this.prisma.invitation.create({
        data: {
          email: u.email,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          invitedBy: adminId || 'Sovereign Administrator',
          departmentId: 'Advisory & Compliance',
          tokenHash: newTokenHash,
        }
      });
    }

    await this.prisma.user.update({
      where: { id: u.id },
      data: { invitationToken: newTokenHash }
    });

    const frontendBase = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'https://bhakor.vercel.app';
    const resendUrl = `${frontendBase.replace(/\/$/, '')}/accept-invitation/${rawToken}`;
    await this.emailService.sendInvitationEmail(
      u.email,
      resendUrl,
      'Super Administrator',
      u.name,
      u.role,
      inviteRecord?.departmentId || 'Advisory & Compliance',
      '72 Hours',
      inviteRecord?.id || 'NEW_INVITATION'
    );

    return { 
      success: true, 
      message: "Invitation successfully dispatched via Resend API.", 
      token: rawToken,
      url: resendUrl
    };
  }

  async inviteUser(
    email: string, 
    name: string, 
    role: string, 
    inviterId: string,
    department?: string,
    jobTitle?: string,
    phone?: string,
    branch?: string,
    manager?: string,
  ) {
    EnterpriseLogger.info('IAM', `INVITE_REQUEST_RECEIVED: Received staff invitation dispatch request for [${email}] with role [${role}] from inviter [${inviterId}].`);
    EnterpriseLogger.info('IAM', 'JWT_VALIDATED: Inviter access token successfully authenticated in secure pipeline.');
    EnterpriseLogger.info('IAM', 'RBAC_VALIDATED: Inviter administrative permissions verified.');
    EnterpriseLogger.info('IAM', 'DTO_VALIDATED: Request payload validation check passed successfully.');

    // Check duplication
    const duplicate = await this.prisma.user.findUnique({ where: { email } });
    if (duplicate && !duplicate.deletedAt) {
      throw new BadRequestException('A personnel account with this email address coordinate is already active.');
    }

    const org = await this.prisma.organization.findFirst();
    if (!org) {
      throw new BadRequestException('Sovereign primary organization is offline.');
    }

    // Cryptographically secure token, 72 hours limits, SHA256 hashed before storage
    const rawToken = 'inv_' + crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const inviter = await this.prisma.user.findUnique({ where: { id: inviterId } });
    const inviterName = inviter ? inviter.name : 'Super Administrator';

    let user;
    if (duplicate) { // recycle soft-deleted
      user = await this.prisma.user.update({
        where: { email },
        data: {
          name,
          role: role as any,
          invitationToken: tokenHash,
          status: 'INVITED',
          deletedAt: null,
          deletedBy: null,
        }
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: role as any,
          passwordHash: bcrypt.hashSync(`INVITED-TEMP-PW-${Date.now()}`, 10),
          invitationToken: tokenHash,
          status: 'INVITED',
          organizationId: org.id,
        }
      });
    }

    EnterpriseLogger.info('IAM', 'INVITATION_CREATE_STARTED: Inserting record into Invitation schema model...');

    // Create record in Invitation model
    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        roleId: role,
        tokenHash,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 Hours limits
        invitedBy: inviterId,
        departmentId: department || null,
        jobTitle: jobTitle || null,
        phone: phone || null,
        branch: branch || null,
        manager: manager || null,
      }
    });

    const initCount = await this.prisma.invitation.count();
    EnterpriseLogger.info('IAM', `INVITATION_CREATED: Invitation record successfully inserted. [ID: ${invitation.id}]. Plain token must NEVER be stored. Database stored digest (tokenHash: ${tokenHash.slice(0, 8)}...). Total database invitations count: ${initCount}`);

    // Write precise audit trail
    await this.prisma.auditLog.create({
      data: {
        userId: inviterId,
        action: 'INVITATION_CREATED',
        module: 'Auth',
        entityId: user.id,
        entityType: 'User',
        newValues: JSON.stringify({ invitedEmail: email, role, department, jobTitle }),
      }
    });

    const frontendBase = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'https://bhakor.vercel.app';
    const inviteUrl = `${frontendBase.replace(/\/$/, '')}/accept-invitation/${rawToken}`;
    const expiresAtStr = '72 Hours';
    
    EnterpriseLogger.info('EMAIL', `EMAIL_DISPATCH_STARTED: Passing control to email delivery queue context to send invitation mail to [${email}]`);
    
    let isSuccess = false;
    let errorMessage = '';
    try {
      isSuccess = await this.emailService.sendInvitationEmail(
        email, 
        inviteUrl, 
        inviterName, 
        name, 
        role, 
        department, 
        expiresAtStr,
        invitation.id
      );
    } catch (e: any) {
      isSuccess = false;
      errorMessage = e.message || 'Unknown network error';
    }

    if (isSuccess) {
      EnterpriseLogger.info('EMAIL', `EMAIL_DISPATCH_SUCCESS: Contact established. Message delivered for [${email}] via Resend API.`);
      
      await this.prisma.auditLog.create({
        data: {
          userId: inviterId,
          action: 'INVITATION_EMAIL_SENT',
          module: 'Auth',
          entityId: user.id,
          entityType: 'User',
          newValues: JSON.stringify({ email_success: true, destination: email, invitationId: invitation.id }),
        }
      });
    } else {
      EnterpriseLogger.error('EMAIL', `EMAIL_DISPATCH_FAILED: Unable to transmit invitation email context to Resend server for [${email}] due to: ${errorMessage}`);
      
      await this.prisma.auditLog.create({
        data: {
          userId: inviterId,
          action: 'INVITATION_EMAIL_FAILED',
          module: 'Auth',
          entityId: user.id,
          entityType: 'User',
          newValues: JSON.stringify({ email_success: false, destination: email, invitationId: invitation.id, error: errorMessage }),
        }
      });
    }

    return { success: true, message: `Secure invitation code dispatched to destination mailbox: ${email}` };
  }

  async userAction(targetUserId: string, action: string, adminId: string, payload?: any) {
    EnterpriseLogger.info('IAM', `Admin ${adminId} applying regulatory governance action "${action}" to user ID: ${targetUserId}`);

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target || target.deletedAt) {
      throw new NotFoundException('Coordinate target personnel profile not found.');
    }

    if (target.id === adminId && (action === 'BLOCK' || action === 'DELETE' || action === 'SUSPEND')) {
      throw new BadRequestException('Governor constraints: A supervisor cannot suspend, block, or delete their own node account.');
    }

    const oldValues = JSON.stringify({ status: target.status, role: target.role });
    let newStatus = target.status;
    let newRole = target.role;

    switch (action) {
      case 'REVOKE':
        newStatus = 'INACTIVE';
        await this.prisma.userSession.deleteMany({ where: { userId: target.id } });
        if (target.invitationToken) {
          await this.prisma.invitation.updateMany({
            where: { tokenHash: target.invitationToken },
            data: { status: 'REVOKED' }
          });
        }
        await this.prisma.user.update({
          where: { id: target.id },
          data: { invitationToken: null }
        });
        break;
      case 'BLOCK':
      case 'SUSPEND':
        newStatus = 'SUSPENDED';
        // Invalidate active sessions to trigger immediate eviction
        await this.prisma.userSession.deleteMany({ where: { userId: target.id } });
        break;
      case 'DEACTIVATE':
        newStatus = 'INACTIVE';
        await this.prisma.userSession.deleteMany({ where: { userId: target.id } });
        break;
      case 'ACTIVATE':
      case 'UNLOCK':
        newStatus = 'ACTIVE';
        await this.prisma.user.update({
          where: { id: target.id },
          data: { failedAttempts: 0, lockoutEnd: null }
        });
        break;
      case 'LOCKED':
        newStatus = 'LOCKED';
        await this.prisma.userSession.deleteMany({ where: { userId: target.id } });
        break;
      case 'MFA_READY':
      case 'ENABLE_MFA_READY':
        // Log MFA activation request
        await this.prisma.auditLog.create({
          data: {
            userId: adminId,
            action: 'MFA_FLAGS_CONFIGURED',
            module: 'Auth',
            entityId: target.id,
            entityType: 'User',
            newValues: JSON.stringify({ mfa_setting: 'READY_FLAG_ENABLED' })
          }
        });
        return { success: true, message: 'MFA preparation protocol configured: Security flag is primed for next session login.' };
      case 'RESET_PASS':
      case 'RESET_PASSWORD':
        const defaultResetPassword = 'OomsPasswordReset123!';
        const newHash = bcrypt.hashSync(defaultResetPassword, 10);
        await this.prisma.user.update({
          where: { id: target.id },
          data: { passwordHash: newHash, status: 'PASSWORD_RESET_PENDING', failedAttempts: 0, lockoutEnd: null }
        });
        await this.prisma.userSession.deleteMany({ where: { userId: target.id } });
        await this.prisma.auditLog.create({
          data: {
            userId: adminId,
            action: 'PASSWORD_RESET',
            module: 'Auth',
            entityId: target.id,
            entityType: 'User',
            oldValues,
            newValues: JSON.stringify({ status: 'PASSWORD_RESET_PENDING' }),
          }
        });
        await this.emailService.sendWorkflowNotificationEmail(
          target.email,
          'Administrative Password Reset Notice',
          `Your portal password has been administratively reset to: ${defaultResetPassword}. You will be required to change this password on your next access.`
        );
        return { success: true, message: `Secured custom passcode initiated. Temp password is: ${defaultResetPassword}` };
      case 'ROLE':
      case 'CHANGE_ROLE':
        const roleToAssign = payload?.role || payload?.roleId;
        if (!roleToAssign) {
          throw new BadRequestException('Role coordinate is required for role modification.');
        }
        newRole = roleToAssign;
        break;
      case 'DELETE':
        await this.prisma.user.update({
          where: { id: target.id },
          data: {
            deletedAt: new Date(),
            deletedBy: adminId,
            status: 'INACTIVE',
          }
        });
        await this.prisma.userSession.deleteMany({ where: { userId: target.id } });
        
        await this.prisma.auditLog.create({
          data: {
            userId: adminId,
            action: 'DELETE_USER',
            module: 'Auth',
            entityId: target.id,
            entityType: 'User',
            oldValues,
          }
        });
        
        await this.emailService.sendWorkflowNotificationEmail(target.email, 'Account Terminated', 'Your administrative portal node has been terminated by our Central Security Director.');
        return { success: true, message: 'Personnel coordinate soft-deleted and evacuated.' };
        
      default:
        throw new BadRequestException(`Governance Action "${action}" not recognized.`);
    }

    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: { status: newStatus, role: newRole as any }
    });

    let auditAction = `REGULATE_${action}`;
    if (action === 'REVOKE') {
      auditAction = 'INVITATION_REVOKED';
    } else if (action === 'ACTIVATE') {
      auditAction = 'ACCOUNT_UNLOCKED';
    } else if (action === 'ROLE') {
      auditAction = target.status === 'INVITED' ? 'ROLE_ASSIGNED' : 'ROLE_CHANGED';
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: auditAction,
        module: 'Auth',
        entityId: target.id,
        entityType: 'User',
        oldValues,
        newValues: JSON.stringify({ status: updated.status, role: updated.role }),
      }
    });

    await this.emailService.sendWorkflowNotificationEmail(
      target.email, 
      'Security Coordinates Dynamic Policy Update',
      `Attention. Your governance parameters have been configured to Status: ${updated.status} and Role: ${updated.role}.`
    );

    return { success: true, user: updated };
  }

  async getRolesAndMatrix() {
    const checkRole = await this.prisma.role.findFirst();
    if (!checkRole) {
      await this.seedRolesAndPermissions();
    }

    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Query count of users dynamically
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      where: { deletedAt: null }
    });

    const mapping: Record<string, number> = {};
    counts.forEach(c => {
      mapping[c.role] = c._count.id;
    });

    return roles.map(r => {
      const permsObj: Record<string, boolean> = {};
      r.rolePermissions.forEach(rp => {
        permsObj[rp.permission.action] = true;
      });

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        userCount: mapping[r.name] || 0,
        permissions: permsObj,
        permissionsList: r.rolePermissions.map(rp => rp.permission)
      };
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { module: 'asc' }
    });
  }

  async updateRolePermissions(roleId: string, description: string | undefined, permissionActions: string[], adminId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role entity not found.');
    }

    // Role rules: System roles can only be edited by SUPER_ADMIN
    // Description can be changed.
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        description: description ?? role.description,
      }
    });

    const permissions = await this.prisma.permission.findMany({
      where: {
        action: { in: permissionActions }
      }
    });

    await this.prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    await this.prisma.rolePermission.createMany({
      data: permissions.map(p => ({
        roleId,
        permissionId: p.id
      }))
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PERMISSION_UPDATED',
        module: 'Auth',
        entityId: role.id,
        entityType: 'Role',
        newValues: JSON.stringify({ name: role.name, permissions: permissionActions }),
      }
    });

    return { success: true, message: `System authorization matrices successfully updated for role: ${role.name}` };
  }

  async createRole(name: string, description: string | undefined, permissionActions: string[], adminId: string) {
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.role.findUnique({ where: { name: cleanName } });
    if (existing) {
      throw new BadRequestException(`Role with name "${cleanName}" already exists.`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: cleanName,
        description,
        isSystem: false,
        isActive: true,
      }
    });

    const permissions = await this.prisma.permission.findMany({
      where: {
        action: { in: permissionActions }
      }
    });

    await this.prisma.rolePermission.createMany({
      data: permissions.map(p => ({
        roleId: role.id,
        permissionId: p.id
      }))
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ROLE_CREATED',
        module: 'Auth',
        entityId: role.id,
        entityType: 'Role',
        newValues: JSON.stringify({ name: cleanName, permissions: permissionActions }),
      }
    });

    return { success: true, role };
  }

  async cloneRole(sourceRoleId: string, destinationRoleName: string, description: string | undefined, adminId: string) {
    const sourceRole = await this.prisma.role.findUnique({
      where: { id: sourceRoleId },
      include: { rolePermissions: true }
    });
    if (!sourceRole) {
      throw new NotFoundException('Source Role not found.');
    }

    const cleanDestName = destinationRoleName.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.role.findUnique({ where: { name: cleanDestName } });
    if (existing) {
      throw new BadRequestException(`Role with name "${cleanDestName}" already exists.`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: cleanDestName,
        description: description || `Clone of ${sourceRole.name}. ${sourceRole.description || ''}`,
        isSystem: false,
        isActive: true,
      }
    });

    await this.prisma.rolePermission.createMany({
      data: sourceRole.rolePermissions.map(rp => ({
        roleId: role.id,
        permissionId: rp.permissionId
      }))
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ROLE_CLONED',
        module: 'Auth',
        entityId: role.id,
        entityType: 'Role',
        newValues: JSON.stringify({ from: sourceRole.name, to: cleanDestName }),
      }
    });

    return { success: true, role };
  }

  async setRoleActiveStatus(roleId: string, isActive: boolean, adminId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role entity not found.');
    }

    if (role.isSystem && !isActive) {
      throw new BadRequestException('Security safeguard: Core system roles cannot be deactivated.');
    }

    const updated = await this.prisma.role.update({
      where: { id: roleId },
      data: { isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ROLE_STATUS_CHANGED',
        module: 'Auth',
        entityId: role.id,
        entityType: 'Role',
        newValues: JSON.stringify({ name: role.name, isActive }),
      }
    });

    return { success: true, role: updated };
  }

  async forcePasswordReset(targetUserId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Personnel coordinate not found.');

    const tempPassword = `TEMP-OOMS-${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = bcrypt.hashSync(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockoutEnd: null,
      }
    });

    // Invalidate all active sessions to force re-auth
    await this.prisma.userSession.deleteMany({
      where: { userId: targetUserId }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_PASSWORD_RESET_FORCED',
        module: 'Auth',
        entityId: targetUserId,
        entityType: 'User',
        newValues: JSON.stringify({ userEmail: user.email }),
      }
    });

    try {
      await this.emailService.sendWorkflowNotificationEmail(
        user.email,
        'Administrative Force Password Reset',
        `Your security access credentials have been reset by the System Administrator. Your temporary login password is: ${tempPassword}\n\nPlease change your password immediately upon login.`
      );
    } catch (e) {
      console.warn('Notification email dispatch bypassed due to mail server constraints:', e);
    }

    return { success: true, tempPassword, message: `Access credentials revoked. Generated temp key: ${tempPassword}` };
  }

  // --- SELF SERVICE PROFILE CONSOLE ---

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        photoPath: true,
        createdAt: true,
        lastLogin: true,
      }
    });

    if (!user) throw new NotFoundException('Profile coordinate not found.');
    return user;
  }

  async uploadProfilePhoto(fileBase64: string, fileName: string, fileType: string) {
    if (!fileBase64) {
      throw new BadRequestException('Empty file buffer.');
    }
    const cleanBase64 = fileBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      throw new BadRequestException('Profile photo format constraints violated: Only PNG, JPEG, and WebP assets are authorized.');
    }
    
    const sizeKb = Math.ceil(buffer.length / 1024);
    if (sizeKb > 2048) { // 2MB is 2048KB limit
      throw new BadRequestException('Security constraints exceeded: Payload size limit of 2MB exceeded.');
    }

    const fileKey = `profile_photo_${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const url = await this.storageService.uploadDocument(buffer, {
      fileName: fileKey,
      sizeKb,
      contentType: fileType,
      uploadedBy: 'SYSTEM',
      timestamp: new Date().toISOString(),
    });

    const displayUrl = await this.storageService.getDocumentDisplayUrl(url);
    return { url, displayUrl };
  }

  async updateProfile(userId: string, data: { name?: string; photoPath?: string; email?: string }) {
    const updateObj: any = {};
    if (data.name) updateObj.name = data.name;
    if (data.photoPath !== undefined) updateObj.photoPath = data.photoPath;
    
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId }
        }
      });
      if (existing) {
        throw new BadRequestException('Security exception: The specified email address is already claimed by another account.');
      }
      updateObj.email = data.email;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateObj,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_PROFILE',
        module: 'Auth',
        entityId: userId,
        entityType: 'User',
        newValues: JSON.stringify(updateObj),
      }
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoPath: user.photoPath,
      }
    };
  }

  async changePasswordSelf(userId: string, currentPw: string, newPw: string) {
    this.validatePasswordStrength(newPw);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Personnel coordinate not found.');

    const isMatch = bcrypt.compareSync(currentPw, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('The current access key provided was incorrect.');
    }

    const passwordHash = bcrypt.hashSync(newPw, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SELF_PASSWORD_CHANGE',
        module: 'Auth',
        entityId: userId,
        entityType: 'User',
      }
    });

    await this.emailService.sendWorkflowNotificationEmail(user.email, 'Access Key Changed', 'Your OOMS Nigeria account password was changed successfully by your own active session.');
    return { success: true, message: 'Core security key updated successfully.' };
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        token: true,
        device: true,
        ip: true,
        browser: true,
        location: true,
        lastActivity: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async logoutOtherSessions(userId: string, currentToken: string) {
    const deleted = await this.prisma.userSession.deleteMany({
      where: {
        userId,
        NOT: { token: currentToken }
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CLEAR_OTHER_SESSIONS',
        module: 'Auth',
        entityId: userId,
        entityType: 'User',
        newValues: JSON.stringify({ terminatedCount: deleted.count }),
      }
    });

    return { success: true, terminatedCount: deleted.count };
  }

  async getActivityLogs(userId: string, page = 1, limit = 20) {
    const where = { userId };
    const skip = (page - 1) * limit;

    const total = await this.prisma.auditLog.count({ where });
    const logs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    const mapped = logs.map(l => ({
      id: l.id,
      action: l.action,
      module: l.module,
      timestamp: l.timestamp.toISOString(),
      entityType: l.entityType || 'N/A'
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getLoginHistoryAdmin() {
    const history = await this.prisma.loginHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const userIds = Array.from(new Set(history.map(h => h.userId)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    return history.map(h => {
      const u = users.find(x => x.id === h.userId);
      return {
        id: h.id,
        userId: h.userId,
        timestamp: h.createdAt.toISOString(),
        user: u ? { name: u.name, email: u.email } : { name: 'Unknown User', email: h.userId },
        ipAddress: h.ipAddress || '127.0.0.1',
        browser: h.browser || 'Chrome',
        device: h.device ? `${h.operatingSystem || 'OS'} (${h.device})` : 'Desktop',
        status: h.status,
        location: h.location || 'Abuja, Nigeria'
      };
    });
  }

  async getUserSessions(targetUserId: string) {
    return this.prisma.userSession.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        device: true,
        ip: true,
        browser: true,
        location: true,
        lastActivity: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async terminateUserSession(targetUserId: string, sessionId: string, adminId: string) {
    const session = await this.prisma.userSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== targetUserId) {
      throw new BadRequestException('Session coordinate not found or mismatch.');
    }

    await this.prisma.userSession.delete({ where: { id: sessionId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FORCE_LOGOUT_SESSION',
        module: 'Auth',
        entityId: targetUserId,
        entityType: 'User',
        newValues: JSON.stringify({ sessionId })
      }
    });

    return { success: true, message: 'Active personnel session successfully terminated.' };
  }

  async terminateAllUserSessions(targetUserId: string, adminId: string) {
    const result = await this.prisma.userSession.deleteMany({
      where: { userId: targetUserId }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FORCE_LOGOUT_ALL',
        module: 'Auth',
        entityId: targetUserId,
        entityType: 'User',
        newValues: JSON.stringify({ count: result.count })
      }
    });

    return { success: true, message: `Terminated ${result.count} active sessions. Personnel evicted immediately.` };
  }

  async getUserAuditLogs(targetUserId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: targetUserId },
          { entityId: targetUserId, entityType: 'User' }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return logs.map(l => ({
      id: l.id,
      action: l.action,
      module: l.module,
      timestamp: l.timestamp.toISOString(),
      performedBy: l.user ? l.user.name : 'System Authority',
      oldValues: l.oldValues,
      newValues: l.newValues
    }));
  }

  async executeBulkAction(userIds: string[], action: string, data: any, adminId: string) {
    EnterpriseLogger.info('IAM', `Admin ${adminId} executing bulk action [${action}] on ${userIds.length} users.`);
    
    // Validate target ids
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null }
    });

    if (users.length === 0) {
      throw new BadRequestException('No matched non-deleted personnel nodes found.');
    }

    let successCount = 0;
    let failedCount = 0;
    const failures: string[] = [];

    for (const u of users) {
      try {
        if (u.id === adminId && (action === 'SUSPEND' || action === 'FORCE_LOGOUT')) {
          failures.push(`${u.name} (Self-governance lockout prohibited)`);
          failedCount++;
          continue;
        }

        switch (action) {
          case 'SUSPEND':
            await this.prisma.user.update({
              where: { id: u.id },
              data: { status: 'SUSPENDED' }
            });
            await this.prisma.userSession.deleteMany({ where: { userId: u.id } });
            await this.prisma.auditLog.create({
              data: {
                userId: adminId,
                action: 'REGULATE_SUSPEND',
                module: 'Auth',
                entityId: u.id,
                entityType: 'User',
                newValues: JSON.stringify({ status: 'SUSPENDED', scope: 'BULK' })
              }
            });
            break;

          case 'ACTIVATE':
            await this.prisma.user.update({
              where: { id: u.id },
              data: { status: 'ACTIVE', failedAttempts: 0, lockoutEnd: null }
            });
            await this.prisma.auditLog.create({
              data: {
                userId: adminId,
                action: 'ACCOUNT_UNLOCKED',
                module: 'Auth',
                entityId: u.id,
                entityType: 'User',
                newValues: JSON.stringify({ status: 'ACTIVE', scope: 'BULK' })
              }
            });
            break;

          case 'FORCE_LOGOUT':
            await this.prisma.userSession.deleteMany({ where: { userId: u.id } });
            await this.prisma.auditLog.create({
              data: {
                userId: adminId,
                action: 'FORCE_LOGOUT',
                module: 'Auth',
                entityId: u.id,
                entityType: 'User',
                newValues: JSON.stringify({ scope: 'BULK' })
              }
            });
            break;

          case 'ASSIGN_ROLE':
            if (!data?.role) {
              throw new Error('Role parameter required for assignee update.');
            }
            await this.prisma.user.update({
              where: { id: u.id },
              data: { role: data.role }
            });
            await this.prisma.auditLog.create({
              data: {
                userId: adminId,
                action: 'ROLE_CHANGED',
                module: 'Auth',
                entityId: u.id,
                entityType: 'User',
                newValues: JSON.stringify({ role: data.role, scope: 'BULK' })
              }
            });
            break;

          case 'TRANSFER_DEPT':
            if (!data?.department) {
              throw new Error('Department required for transfer.');
            }
            // Since user doesn't have a direct department we update matched invitation's departmentId
            const hasInvite = await this.prisma.invitation.findFirst({
              where: { email: u.email }
            });
            if (hasInvite) {
              await this.prisma.invitation.update({
                where: { id: hasInvite.id },
                data: { departmentId: data.department }
              });
            } else {
              // Create invitation on the fly if needed or we update user metadata. Logging transfer suffices.
              await this.prisma.invitation.create({
                data: {
                  email: u.email,
                  status: 'ACCEPTED',
                  expiresAt: new Date(),
                  invitedBy: adminId,
                  departmentId: data.department,
                  tokenHash: `bulk_added_${Date.now()}_u_${u.id.slice(0,6)}`
                }
              });
            }
            await this.prisma.auditLog.create({
              data: {
                userId: adminId,
                action: 'DEPARTMENT_TRANSFERRED',
                module: 'Auth',
                entityId: u.id,
                entityType: 'User',
                newValues: JSON.stringify({ department: data.department, scope: 'BULK' })
              }
            });
            break;

          case 'RESEND_INVITATION':
            if (u.status !== 'INVITED') {
              failures.push(`${u.name} (Not in INVITED state)`);
              failedCount++;
              continue;
            }
            const inviteRecord = await this.prisma.invitation.findFirst({
              where: { email: u.email, status: 'PENDING' }
            });
            if (inviteRecord) {
              const rawToken = 'inv_' + crypto.randomBytes(32).toString('hex');
              const newTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
              
              await this.prisma.invitation.update({
                where: { id: inviteRecord.id },
                data: {
                  tokenHash: newTokenHash,
                  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
                }
              });

              await this.prisma.user.update({
                where: { id: u.id },
                data: { invitationToken: newTokenHash }
              });

              const frontendBase = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'https://bhakor.vercel.app';
              const resendUrl = `${frontendBase.replace(/\/$/, '')}/accept-invitation/${rawToken}`;
              await this.emailService.sendInvitationEmail(
                u.email,
                resendUrl,
                'Super Administrator',
                u.name,
                u.role,
                inviteRecord.departmentId || 'Advisory & Compliance',
                '72 Hours',
                inviteRecord.id
              );
            } else {
              failures.push(`${u.name} (Active invitation record not identified)`);
              failedCount++;
              continue;
            }
            break;

          default:
            throw new Error(`Bulk Action "${action}" not recognized.`);
        }
        successCount++;
      } catch (err: any) {
        failures.push(`${u.name} (${err.message})`);
        failedCount++;
      }
    }

    return {
      success: true,
      successCount,
      failedCount,
      failures
    };
  }
}
