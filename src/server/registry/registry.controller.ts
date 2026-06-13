import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus, Inject, UseGuards, Request } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionGuard } from '../auth/permission.guard';

@Controller()
@UseGuards(JwtGuard, PermissionGuard)
export class RegistryController {
  constructor(@Inject(RegistryService) private readonly registryService: RegistryService) {}

  @Get('list')
  list(
    @Request() req: any,
    @Query('module') module: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('department') department?: string,
    @Query('location') location?: string,
    @Query('classification') classification?: string,
    @Query('status') status?: string,
  ) {
    return this.registryService.listRecords({
      module: module || 'Correspondence',
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '15', 10),
      search: search || '',
      sortBy: sortBy || '',
      sortOrder: sortOrder || 'asc',
      department,
      location,
      classification,
      status,
      operatorUserId: req.user.sub,
    });
  }

  @UseGuards(JwtGuard)
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  add(@Request() req: any, @Body() body: { moduleName: string; payload: any }) {
    return this.registryService.addRecord(body.moduleName, body.payload, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('registry/update')
  @HttpCode(HttpStatus.OK)
  update(@Request() req: any, @Body() body: { moduleName: string; id: string; payload: any }) {
    return this.registryService.updateRecord(body.moduleName, body.id, body.payload, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('registry/delete')
  @HttpCode(HttpStatus.OK)
  delete(@Request() req: any, @Body() body: { moduleName: string; id: string }) {
    return this.registryService.deleteRecord(body.moduleName, body.id, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('registry/transition')
  @HttpCode(HttpStatus.OK)
  transitionWorkflow(@Request() req: any, @Body() body: { moduleName: string; id: string; status: string; remarks?: string }) {
    return this.registryService.transitionWorkflow(body.moduleName, body.id, body.status, req.user.sub, body.remarks);
  }

  @UseGuards(JwtGuard)
  @Post('registry/assign')
  @HttpCode(HttpStatus.OK)
  assignDepartment(@Request() req: any, @Body() body: { moduleName: string; id: string; departmentName: string }) {
    return this.registryService.assignDepartment(body.moduleName, body.id, body.departmentName, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('registry/print')
  @HttpCode(HttpStatus.OK)
  printJob(@Request() req: any, @Body() body: { printerId: string; documentId?: string; documentName: string; pages: number }) {
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web App Portal';
    return this.registryService.logPrintJob(
      req.user.sub,
      body.printerId,
      body.documentId || null,
      body.documentName,
      body.pages,
      ip,
      userAgent
    );
  }

  @UseGuards(JwtGuard)
  @Post('registry/bulk-action')
  @HttpCode(HttpStatus.OK)
  bulkAction(
    @Request() req: any,
    @Body() body: { moduleName: string; action: 'archive' | 'restore' | 'export' | 'delete'; ids: string[] }
  ) {
    return this.registryService.bulkAction({
      moduleName: body.moduleName,
      action: body.action,
      ids: body.ids,
      userId: req.user.sub,
    });
  }

  @UseGuards(JwtGuard)
  @Get('governance/archived')
  getArchived(@Request() req: any) {
    return this.registryService.getArchivedRecords(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('governance/purge')
  @HttpCode(HttpStatus.OK)
  purge(
    @Request() req: any,
    @Body() body: { moduleName: string; ids: string[]; confirmation: string }
  ) {
    return this.registryService.purgeRecords(body.moduleName, body.ids, body.confirmation, req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('governance/purge-history')
  getPurgeHistory(@Request() req: any) {
    return this.registryService.getPurgeHistory(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('governance/production-cleanup')
  @HttpCode(HttpStatus.OK)
  productionCleanup(@Request() req: any) {
    return this.registryService.productionCleanup(req.user.sub);
  }
}
