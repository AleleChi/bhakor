import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @Query('department') department?: string,
    @Query('location') location?: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.dashboardService.getDashboardSummary(department, location, dateRange);
  }

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.dashboardService.getRealDashboardSummary();
  }

  @Get('dashboard/analytics')
  getDashboardAnalytics() {
    return this.dashboardService.getDashboardAnalytics();
  }

  @Get('analytics/spending-trend')
  getSpendingTrend() {
    return this.dashboardService.getSpendingTrend();
  }

  @Get('analytics/fuel-trend')
  getFuelTrend(@Query('vehicle') vehicle?: string) {
    return this.dashboardService.getFuelTrend(vehicle);
  }

  @Get('analytics/inventory-velocity')
  getInventoryVelocity() {
    return this.dashboardService.getInventoryVelocity();
  }

  @Get('analytics/printer-usage')
  getPrinterUsage(@Query('department') department?: string) {
    return this.dashboardService.getPrinterUsage(department);
  }

  @Post('insights/generate')
  @HttpCode(HttpStatus.OK)
  generateInsights() {
    return this.dashboardService.generateGeminiInsights();
  }

  @Post('resolve-alert')
  @HttpCode(HttpStatus.OK)
  resolveAlert(@Body('alertId') alertId: string) {
    return this.dashboardService.resolveAlert(alertId);
  }

  @Post('complete-task')
  @HttpCode(HttpStatus.OK)
  completeTask(@Body('taskId') taskId: string) {
    return this.dashboardService.completeTask(taskId);
  }
}
