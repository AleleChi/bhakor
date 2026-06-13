import { Controller, Get, Post, Param, HttpCode, HttpStatus, Inject, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  list(@Request() req: any) {
    return this.notificationsService.listNotifications(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  readAll(@Request() req: any) {
    return this.notificationsService.readAll(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  readOne(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.readOne(id, req.user.sub);
  }
}
