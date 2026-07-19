import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('meetings')
  async getMeetings() {
    return this.adminService.getMeetings();
  }

  @Get('system')
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('errors')
  async getErrors() {
    return this.adminService.getErrorLogs();
  }
}
