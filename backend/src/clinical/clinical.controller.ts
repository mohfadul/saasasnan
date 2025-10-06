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
import { ClinicalNotesService, CreateClinicalNoteDto, UpdateClinicalNoteDto, CreateTreatmentPlanDto, UpdateTreatmentPlanDto } from './clinical-notes.service';
import { User } from '../auth/entities/user.entity';
import { TenantGuard } from '../tenants/tenant.guard';

@ApiTags('Clinical')
@Controller('clinical')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class ClinicalController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  // Clinical Notes endpoints
  @Post('notes')
  @ApiOperation({ summary: 'Create a new clinical note' })
  @ApiResponse({ status: 201, description: 'Clinical note created successfully' })
  createClinicalNote(@Body() createDto: CreateClinicalNoteDto, @Request() req: { user: User }) {
    return this.clinicalNotesService.createClinicalNote(createDto, req.user.tenant_id, req.user);
  }

  @Get('notes')
  @ApiOperation({ summary: 'Get all clinical notes' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filter by provider ID' })
  @ApiQuery({ name: 'noteType', required: false, description: 'Filter by note type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Clinical notes retrieved successfully' })
  getClinicalNotes(
    @Request() req: { user: User },
    @Query('patientId') patientId?: string,
    @Query('providerId') providerId?: string,
    @Query('noteType') noteType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.clinicalNotesService.findAllClinicalNotes(
      req.user.tenant_id,
      patientId,
      providerId,
      noteType as any,
      status as any,
      startDate,
      endDate,
    );
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get clinical note by ID' })
  @ApiResponse({ status: 200, description: 'Clinical note retrieved successfully' })
  getClinicalNote(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.findOneClinicalNote(id, req.user.tenant_id);
  }

  @Patch('notes/:id')
  @ApiOperation({ summary: 'Update clinical note' })
  @ApiResponse({ status: 200, description: 'Clinical note updated successfully' })
  updateClinicalNote(
    @Param('id') id: string,
    @Body() updateDto: UpdateClinicalNoteDto,
    @Request() req: { user: User },
  ) {
    return this.clinicalNotesService.updateClinicalNote(id, updateDto, req.user.tenant_id, req.user);
  }

  @Patch('notes/:id/finalize')
  @ApiOperation({ summary: 'Finalize clinical note' })
  @ApiResponse({ status: 200, description: 'Clinical note finalized successfully' })
  finalizeClinicalNote(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.finalizeClinicalNote(id, req.user.tenant_id, req.user);
  }

  @Patch('notes/:id/amend')
  @ApiOperation({ summary: 'Amend clinical note' })
  @ApiResponse({ status: 200, description: 'Clinical note amended successfully' })
  amendClinicalNote(
    @Param('id') id: string,
    @Body() body: { amendmentReason: string },
    @Request() req: { user: User },
  ) {
    return this.clinicalNotesService.amendClinicalNote(id, body.amendmentReason, req.user.tenant_id, req.user);
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Delete clinical note' })
  @ApiResponse({ status: 200, description: 'Clinical note deleted successfully' })
  deleteClinicalNote(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.removeClinicalNote(id, req.user.tenant_id);
  }

  // Treatment Plans endpoints
  @Post('treatment-plans')
  @ApiOperation({ summary: 'Create a new treatment plan' })
  @ApiResponse({ status: 201, description: 'Treatment plan created successfully' })
  createTreatmentPlan(@Body() createDto: CreateTreatmentPlanDto, @Request() req: { user: User }) {
    return this.clinicalNotesService.createTreatmentPlan(createDto, req.user.tenant_id, req.user);
  }

  @Get('treatment-plans')
  @ApiOperation({ summary: 'Get all treatment plans' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filter by provider ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiResponse({ status: 200, description: 'Treatment plans retrieved successfully' })
  getTreatmentPlans(
    @Request() req: { user: User },
    @Query('patientId') patientId?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.clinicalNotesService.findAllTreatmentPlans(
      req.user.tenant_id,
      patientId,
      providerId,
      status as any,
      priority,
    );
  }

  @Get('treatment-plans/:id')
  @ApiOperation({ summary: 'Get treatment plan by ID' })
  @ApiResponse({ status: 200, description: 'Treatment plan retrieved successfully' })
  getTreatmentPlan(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.findOneTreatmentPlan(id, req.user.tenant_id);
  }

  @Patch('treatment-plans/:id')
  @ApiOperation({ summary: 'Update treatment plan' })
  @ApiResponse({ status: 200, description: 'Treatment plan updated successfully' })
  updateTreatmentPlan(
    @Param('id') id: string,
    @Body() updateDto: UpdateTreatmentPlanDto,
    @Request() req: { user: User },
  ) {
    return this.clinicalNotesService.updateTreatmentPlan(id, updateDto, req.user.tenant_id, req.user);
  }

  @Patch('treatment-plans/:id/propose')
  @ApiOperation({ summary: 'Propose treatment plan to patient' })
  @ApiResponse({ status: 200, description: 'Treatment plan proposed successfully' })
  proposeTreatmentPlan(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.proposeTreatmentPlan(id, req.user.tenant_id, req.user);
  }

  @Patch('treatment-plans/:id/accept')
  @ApiOperation({ summary: 'Accept treatment plan' })
  @ApiResponse({ status: 200, description: 'Treatment plan accepted successfully' })
  acceptTreatmentPlan(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.acceptTreatmentPlan(id, req.user.tenant_id);
  }

  @Patch('treatment-plans/:id/complete')
  @ApiOperation({ summary: 'Complete treatment plan' })
  @ApiResponse({ status: 200, description: 'Treatment plan completed successfully' })
  completeTreatmentPlan(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.completeTreatmentPlan(id, req.user.tenant_id, req.user);
  }

  @Delete('treatment-plans/:id')
  @ApiOperation({ summary: 'Delete treatment plan' })
  @ApiResponse({ status: 200, description: 'Treatment plan deleted successfully' })
  deleteTreatmentPlan(@Param('id') id: string, @Request() req: { user: User }) {
    return this.clinicalNotesService.removeTreatmentPlan(id, req.user.tenant_id);
  }

  // Analytics
  @Get('analytics')
  @ApiOperation({ summary: 'Get clinical analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Clinical analytics retrieved successfully' })
  getClinicalAnalytics(
    @Request() req: { user: User },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.clinicalNotesService.getClinicalAnalytics(req.user.tenant_id, startDate, endDate);
  }
}
