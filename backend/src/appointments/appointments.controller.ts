import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../auth/entities/user.entity';
import { TenantGuard } from '../tenants/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff', 'patient')
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - appointment conflicts' })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: { user: User }) {
    return this.appointmentsService.create(createAppointmentDto, req.user.tenant_id, req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff', 'patient')
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filter by provider ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  findAll(
    @Request() req: { user: User },
    @Query('clinicId') clinicId?: string,
    @Query('providerId') providerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll(
      req.user.tenant_id,
      clinicId,
      providerId,
      startDate,
      endDate,
      req.user,
    );
  }

  @Get('schedule/:providerId')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff')
  @ApiOperation({ summary: 'Get provider schedule for a specific date' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Provider schedule retrieved successfully' })
  getProviderSchedule(
    @Param('providerId') providerId: string,
    @Request() req: { user: User },
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getProviderSchedule(providerId, req.user.tenant_id, date);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin')
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Appointment statistics retrieved successfully' })
  getStats(
    @Request() req: { user: User },
    @Query('clinicId') clinicId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getAppointmentStats(
      req.user.tenant_id,
      clinicId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff', 'patient')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string, @Request() req: { user: User }) {
    return this.appointmentsService.findOne(id, req.user.tenant_id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: any,
    @Request() req: { user: User },
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, req.user.tenant_id);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff', 'patient')
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  cancelAppointment(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: { user: User },
  ) {
    return this.appointmentsService.cancelAppointment(id, body.reason, req.user.tenant_id, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin')
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.appointmentsService.remove(id, req.user.tenant_id);
  }
}
