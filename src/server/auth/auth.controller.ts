import { Controller, Post, Body, HttpCode, HttpStatus, Inject, UseGuards, Request, Get, Query, Param, Put, ForbiddenException, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() loginDto: { email: string; password?: string },
    @Request() req: any,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web App Portal';
    return this.authService.login(loginDto.email, loginDto.password, ip, userAgent);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: any) {
    return this.authService.logout(req.user.sub, req.token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: { token: string; password?: string; newPassword?: string }) {
    const password = body.newPassword || body.password || 'password123';
    return this.authService.resetPassword(body.token, password);
  }

  @Post('accept-invitation')
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@Body() body: { token: string; password?: string; name: string; photoPath?: string }) {
    return this.authService.acceptInvitation(body.token, body.password, body.name, body.photoPath);
  }

  // Unified alias to support client side fetch calls natively
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  acceptInvite(@Body() body: { token: string; password?: string; name: string; photoPath?: string }) {
    return this.authService.acceptInvitation(body.token, body.password, body.name, body.photoPath);
  }

  @Get('invitation-details/:token')
  getInvitationDetails(@Param('token') token: string) {
    return this.authService.getInvitationDetailsByToken(token);
  }

  @Post('upload-photo')
  @HttpCode(HttpStatus.OK)
  uploadPhoto(@Body() body: { fileBase64: string; fileName: string; fileType: string }) {
    return this.authService.uploadProfilePhoto(body.fileBase64, body.fileName, body.fileType);
  }

  // --- IAM ADMINISTRATIVE DIRECTORIES ---

  @UseGuards(JwtGuard)
  @Get('users')
  getUsers(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Audit authorization
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Directory viewing restricted to personnel management administrators.');
    }
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.authService.getUsers(search, role, status, pageNum, limitNum);
  }

  @UseGuards(JwtGuard)
  @Post('users/invite')
  inviteUser(
    @Request() req: any,
    @Body() body: { 
      email: string; 
      name: string; 
      role: string;
      department?: string;
      jobTitle?: string;
      phone?: string;
      branch?: string;
      manager?: string;
    },
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: User invitation dispatch restricted to administrators.');
    }
    return this.authService.inviteUser(
      body.email, 
      body.name, 
      body.role, 
      req.user.sub,
      body.department,
      body.jobTitle,
      body.phone,
      body.branch,
      body.manager
    );
  }

  @UseGuards(JwtGuard)
  @Post('users/:id/action')
  userAction(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { action: string; role?: string },
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Administrative governance restricted to administrators.');
    }
    return this.authService.userAction(id, body.action, req.user.sub, body);
  }

  @UseGuards(JwtGuard)
  @Get('roles')
  getRolesAndMatrix() {
    return this.authService.getRolesAndMatrix();
  }

  @UseGuards(JwtGuard)
  @Get('permissions')
  getPermissions(@Request() req: any) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Permission definitions restricted to security administrators.');
    }
    return this.authService.getPermissions();
  }

  @UseGuards(JwtGuard)
  @Put('roles/:id')
  async updateRolePermissions(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { description?: string; permissionActions: string[] },
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Only SUPER_ADMIN can modify system role capabilities.');
    }
    return this.authService.updateRolePermissions(id, body.description, body.permissionActions, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('roles')
  async createRole(
    @Request() req: any,
    @Body() body: { name: string; description?: string; permissionActions?: string[] },
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Only SUPER_ADMIN can register new authorization roles.');
    }
    return this.authService.createRole(body.name, body.description, body.permissionActions || [], req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('roles/:id/clone')
  async cloneRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { destinationRoleName: string; description?: string },
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Only SUPER_ADMIN can clone custom execution roles.');
    }
    return this.authService.cloneRole(id, body.destinationRoleName, body.description, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('roles/:id/status')
  async setRoleActiveStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Only SUPER_ADMIN can deactivate custom clearance roles.');
    }
    return this.authService.setRoleActiveStatus(id, body.isActive, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('users/:id/force-reset')
  async forcePasswordResetAdmin(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Critical credentials revocation restricted to SUPER_ADMIN.');
    }
    return this.authService.forcePasswordReset(id, req.user.sub);
  }

  // --- SELF SERVICE PROFILE CONSOLE ---

  @UseGuards(JwtGuard)
  @Get('profile/me')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('profile/update')
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; photoPath?: string },
  ) {
    return this.authService.updateProfile(req.user.sub, body);
  }

  @UseGuards(JwtGuard)
  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword?: string; newPassword?: string; password?: string; current?: string },
  ) {
    const current = body.currentPassword || body.current || '';
    const newPw = body.newPassword || body.password || '';
    return this.authService.changePasswordSelf(req.user.sub, current, newPw);
  }

  @UseGuards(JwtGuard)
  @Get('profile/sessions')
  getSessions(@Request() req: any) {
    return this.authService.getSessions(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('profile/sessions/logout-other')
  @HttpCode(HttpStatus.OK)
  logoutOtherSessions(@Request() req: any) {
    return this.authService.logoutOtherSessions(req.user.sub, req.token);
  }

  @UseGuards(JwtGuard)
  @Get('profile/logs')
  getActivityLogs(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.authService.getActivityLogs(req.user.sub, pageNum, limitNum);
  }

  @UseGuards(JwtGuard)
  @Get('login-history')
  getLoginHistory(@Request() req: any) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Login history restricted to personnel management administrators.');
    }
    return this.authService.getLoginHistoryAdmin();
  }

  @UseGuards(JwtGuard)
  @Get('users/:id/sessions')
  getUserSessionsAdmin(@Request() req: any, @Param('id') targetUserId: string) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Session viewing restricted to administrators.');
    }
    return this.authService.getUserSessions(targetUserId);
  }

  @UseGuards(JwtGuard)
  @Post('users/:id/sessions/terminate')
  @HttpCode(HttpStatus.OK)
  terminateUserSessionAdmin(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body() body: { sessionId: string }
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Session termination restricted to administrators.');
    }
    return this.authService.terminateUserSession(targetUserId, body.sessionId, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('users/:id/sessions/terminate-all')
  @HttpCode(HttpStatus.OK)
  terminateAllUserSessionsAdmin(
    @Request() req: any,
    @Param('id') targetUserId: string
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Session revocation restricted to administrators.');
    }
    return this.authService.terminateAllUserSessions(targetUserId, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('users/:id/audit')
  getUserAuditLogsAdmin(@Request() req: any, @Param('id') targetUserId: string) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Audit log viewing restricted to security administrators.');
    }
    return this.authService.getUserAuditLogs(targetUserId);
  }

  @UseGuards(JwtGuard)
  @Post('users/bulk-action')
  @HttpCode(HttpStatus.OK)
  executeBulkActionAdmin(
    @Request() req: any,
    @Body() body: { userIds: string[]; action: string; data?: any }
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Regulatory constraint: Bulk operations restricted to administrators.');
    }
    return this.authService.executeBulkAction(body.userIds, body.action, body.data, req.user.sub);
  }
}
