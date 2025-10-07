import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../tenants/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HospitalService } from './hospital.service';

@ApiTags('Hospital')
@Controller('hospital')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  // Dashboard
  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'staff')
  @ApiOperation({ summary: 'Get hospital dashboard overview' })
  getDashboard(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.hospitalService.getDashboardOverview(req.user.tenant_id, clinicId);
  }

  // Departments
  @Get('departments')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff')
  @ApiOperation({ summary: 'Get all departments' })
  getDepartments(@Request() req) {
    return this.hospitalService.getDepartments(req.user.tenant_id);
  }

  @Post('departments')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin')
  @ApiOperation({ summary: 'Create department' })
  createDepartment(@Body() createDto: any, @Request() req) {
    return this.hospitalService.createDepartment(createDto, req.user.tenant_id);
  }

  // Beds
  @Get('beds/available')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'staff')
  @ApiOperation({ summary: 'Get available beds' })
  getAvailableBeds(
    @Request() req,
    @Query('clinicId') clinicId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.hospitalService.getAvailableBeds(req.user.tenant_id, clinicId, departmentId);
  }

  // Blood Bank
  @Get('blood-bank/inventory')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'staff')
  @ApiOperation({ summary: 'Get blood bank inventory' })
  getBloodBankInventory(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.hospitalService.getBloodBankInventory(req.user.tenant_id, clinicId);
  }

  // Laboratory
  @Get('lab/pending-reports')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'staff')
  @ApiOperation({ summary: 'Get pending lab reports' })
  getPendingLabReports(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.hospitalService.getPendingLabReports(req.user.tenant_id, clinicId);
  }
}

