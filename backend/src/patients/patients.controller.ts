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
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { User } from '../auth/entities/user.entity';
import { TenantGuard } from '../tenants/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'staff')
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createPatientDto: CreatePatientDto, @Request() req: { user: User }) {
    return this.patientsService.create(createPatientDto, req.user.tenant_id, req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff')
  @ApiOperation({ summary: 'Get all patients for tenant' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Patients retrieved successfully' })
  findAll(
    @Request() req: { user: User },
    @Query('clinicId') clinicId?: string,
  ) {
    return this.patientsService.findAll(req.user.tenant_id, clinicId);
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff')
  @ApiOperation({ summary: 'Search patients' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  search(
    @Request() req: { user: User },
    @Query('q') searchTerm: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.patientsService.searchPatients(req.user.tenant_id, searchTerm, clinicId);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin')
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Patient statistics retrieved successfully' })
  getStats(
    @Request() req: { user: User },
    @Query('clinicId') clinicId?: string,
  ) {
    return this.patientsService.getPatientStats(req.user.tenant_id, clinicId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'doctor', 'dentist', 'staff', 'patient')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findOne(@Param('id') id: string, @Request() req: { user: User}) {
    return this.patientsService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin', 'staff')
  @ApiOperation({ summary: 'Update patient' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @Request() req: { user: User },
  ) {
    return this.patientsService.update(id, updatePatientDto, req.user.tenant_id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'hospital_admin')
  @ApiOperation({ summary: 'Delete patient' })
  @ApiResponse({ status: 200, description: 'Patient deleted successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.patientsService.remove(id, req.user.tenant_id);
  }
}
