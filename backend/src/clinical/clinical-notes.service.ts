import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalNote, NoteType, NoteStatus } from './entities/clinical-note.entity';
import { TreatmentPlan, TreatmentPlanStatus } from './entities/treatment-plan.entity';
import { TreatmentPlanItem, TreatmentItemStatus } from './entities/treatment-plan-item.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../auth/entities/user.entity';

export interface CreateClinicalNoteDto {
  patientId: string;
  appointmentId?: string;
  noteType: NoteType;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  dentalHistory?: string;
  examinationFindings?: string;
  diagnosis?: string;
  treatmentRendered?: string;
  treatmentPlan?: string;
  recommendations?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
  vitalSigns?: Record<string, any>;
  medications?: Record<string, any>[];
  allergies?: string[];
  proceduresPerformed?: Record<string, any>[];
}

export interface UpdateClinicalNoteDto {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  dentalHistory?: string;
  examinationFindings?: string;
  diagnosis?: string;
  treatmentRendered?: string;
  treatmentPlan?: string;
  recommendations?: string;
  followUpInstructions?: string;
  additionalNotes?: string;
  vitalSigns?: Record<string, any>;
  medications?: Record<string, any>[];
  allergies?: string[];
  proceduresPerformed?: Record<string, any>[];
}

export interface CreateTreatmentPlanDto {
  patientId: string;
  clinicalNoteId?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedCost: number;
  insuranceEstimate?: number;
  notes?: string;
  items: {
    procedureName: string;
    procedureCode?: string;
    itemType: 'procedure' | 'consultation' | 'examination' | 'cleaning' | 'restoration' | 'extraction' | 'implant' | 'orthodontic' | 'periodontal' | 'endodontic' | 'prosthodontic' | 'surgery' | 'other';
    description?: string;
    quantity?: number;
    estimatedDurationMinutes?: number;
    unitCost: number;
    dependsOnItemId?: string;
    sequenceOrder?: number;
    specialInstructions?: string;
    requiredMaterials?: string[];
    contraindications?: string[];
  }[];
}

export interface UpdateTreatmentPlanDto {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  estimatedCompletionDate?: string;
  estimatedCost?: number;
  insuranceEstimate?: number;
  notes?: string;
  status?: TreatmentPlanStatus;
}

@Injectable()
export class ClinicalNotesService {
  constructor(
    @InjectRepository(ClinicalNote)
    private clinicalNotesRepository: Repository<ClinicalNote>,
    @InjectRepository(TreatmentPlan)
    private treatmentPlansRepository: Repository<TreatmentPlan>,
    @InjectRepository(TreatmentPlanItem)
    private treatmentPlanItemsRepository: Repository<TreatmentPlanItem>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  // Clinical Notes CRUD
  async createClinicalNote(createDto: CreateClinicalNoteDto, tenantId: string, user: any): Promise<ClinicalNote> {
    // Validate patient exists
    const patient = await this.patientsRepository.findOne({
      where: { id: createDto.patientId, tenant_id: tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate appointment if provided
    if (createDto.appointmentId) {
      const appointment = await this.appointmentsRepository.findOne({
        where: { id: createDto.appointmentId, tenant_id: tenantId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }
    }

    const clinicalNote = this.clinicalNotesRepository.create({
      tenant_id: tenantId,
      clinic_id: user.clinic_id || 'default-clinic',
      patient_id: createDto.patientId,
      appointment_id: createDto.appointmentId,
      provider_id: user.id,
      note_type: createDto.noteType,
      status: NoteStatus.DRAFT,
      chief_complaint: createDto.chiefComplaint,
      history_of_present_illness: createDto.historyOfPresentIllness,
      medical_history: createDto.medicalHistory,
      dental_history: createDto.dentalHistory,
      examination_findings: createDto.examinationFindings,
      diagnosis: createDto.diagnosis,
      treatment_rendered: createDto.treatmentRendered,
      treatment_plan: createDto.treatmentPlan,
      recommendations: createDto.recommendations,
      follow_up_instructions: createDto.followUpInstructions,
      additional_notes: createDto.additionalNotes,
      vital_signs: createDto.vitalSigns || {},
      medications: createDto.medications || [],
      allergies: createDto.allergies || [],
      procedures_performed: createDto.proceduresPerformed || [],
      created_by: user.id,
    });

    return await this.clinicalNotesRepository.save(clinicalNote);
  }

  async findAllClinicalNotes(
    tenantId: string,
    patientId?: string,
    providerId?: string,
    noteType?: NoteType,
    status?: NoteStatus,
    startDate?: string,
    endDate?: string,
    user?: User,
  ): Promise<ClinicalNote[]> {
    const query = this.clinicalNotesRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.patient', 'patient')
      .leftJoinAndSelect('note.provider', 'provider')
      .leftJoinAndSelect('note.appointment', 'appointment')
      .leftJoinAndSelect('note.created_by_user', 'created_by_user')
      .where('note.tenant_id = :tenantId', { tenantId });

    if (patientId) {
      query.andWhere('note.patient_id = :patientId', { patientId });
    }

    if (providerId) {
      query.andWhere('note.provider_id = :providerId', { providerId });
    }

    if (noteType) {
      query.andWhere('note.note_type = :noteType', { noteType });
    }

    if (status) {
      query.andWhere('note.status = :status', { status });
    }

    // Role-based filtering
    if (user) {
      if (user.role === 'patient') {
        // Patients see only their own clinical notes
        query.andWhere('note.patient_id IN (SELECT id FROM patients WHERE user_id = :userId)', { userId: user.id });
      } else if (user.role === 'doctor' || user.role === 'dentist') {
        // Providers see only notes they created (unless searching by patientId/providerId)
        if (!patientId && !providerId) {
          query.andWhere('note.provider_id = :userId', { userId: user.id });
        }
      }
    }

    if (startDate && endDate) {
      query.andWhere('note.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return await query
      .orderBy('note.created_at', 'DESC')
      .getMany();
  }

  async findOneClinicalNote(id: string, tenantId: string, user?: User): Promise<ClinicalNote> {
    const clinicalNote = await this.clinicalNotesRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['patient', 'provider', 'appointment', 'created_by_user', 'amended_by_user', 'treatment_plans'],
    });

    if (!clinicalNote) {
      throw new NotFoundException(`Clinical note with ID ${id} not found`);
    }

    // Role-based access control
    if (user) {
      if (user.role === 'patient') {
        // Verify this note belongs to a patient record linked to this user
        const patient = await this.patientsRepository.findOne({
          where: { id: clinicalNote.patient_id, user_id: user.id },
        });
        if (!patient) {
          throw new ForbiddenException('Access denied: Not your clinical note');
        }
      } else if (user.role === 'doctor' || user.role === 'dentist') {
        // Providers can only view notes they created (unless admin)
        const isAdmin = ['super_admin', 'hospital_admin'].includes(user.role);
        if (!isAdmin && clinicalNote.provider_id !== user.id) {
          throw new ForbiddenException('Access denied: Not your clinical note');
        }
      }
    }

    return clinicalNote;
  }

  async updateClinicalNote(
    id: string,
    updateDto: UpdateClinicalNoteDto,
    tenantId: string,
    user: any,
  ): Promise<ClinicalNote> {
    const clinicalNote = await this.findOneClinicalNote(id, tenantId);

    if (clinicalNote.status === NoteStatus.FINALIZED) {
      throw new BadRequestException('Cannot edit finalized clinical notes');
    }

    // Update fields
    Object.assign(clinicalNote, {
      chief_complaint: updateDto.chiefComplaint || clinicalNote.chief_complaint,
      history_of_present_illness: updateDto.historyOfPresentIllness !== undefined ? updateDto.historyOfPresentIllness : clinicalNote.history_of_present_illness,
      medical_history: updateDto.medicalHistory !== undefined ? updateDto.medicalHistory : clinicalNote.medical_history,
      dental_history: updateDto.dentalHistory !== undefined ? updateDto.dentalHistory : clinicalNote.dental_history,
      examination_findings: updateDto.examinationFindings !== undefined ? updateDto.examinationFindings : clinicalNote.examination_findings,
      diagnosis: updateDto.diagnosis !== undefined ? updateDto.diagnosis : clinicalNote.diagnosis,
      treatment_rendered: updateDto.treatmentRendered !== undefined ? updateDto.treatmentRendered : clinicalNote.treatment_rendered,
      treatment_plan: updateDto.treatmentPlan !== undefined ? updateDto.treatmentPlan : clinicalNote.treatment_plan,
      recommendations: updateDto.recommendations !== undefined ? updateDto.recommendations : clinicalNote.recommendations,
      follow_up_instructions: updateDto.followUpInstructions !== undefined ? updateDto.followUpInstructions : clinicalNote.follow_up_instructions,
      additional_notes: updateDto.additionalNotes !== undefined ? updateDto.additionalNotes : clinicalNote.additional_notes,
      vital_signs: updateDto.vitalSigns || clinicalNote.vital_signs,
      medications: updateDto.medications || clinicalNote.medications,
      allergies: updateDto.allergies || clinicalNote.allergies,
      procedures_performed: updateDto.proceduresPerformed || clinicalNote.procedures_performed,
    });

    return await this.clinicalNotesRepository.save(clinicalNote);
  }

  async finalizeClinicalNote(id: string, tenantId: string, user: any): Promise<ClinicalNote> {
    const clinicalNote = await this.findOneClinicalNote(id, tenantId);

    if (clinicalNote.status === NoteStatus.FINALIZED) {
      throw new BadRequestException('Clinical note is already finalized');
    }

    clinicalNote.status = NoteStatus.FINALIZED;
    clinicalNote.provider_signature = `${user.email}`; // In real implementation, this would be a proper digital signature
    clinicalNote.signed_at = new Date();

    return await this.clinicalNotesRepository.save(clinicalNote);
  }

  async amendClinicalNote(
    id: string,
    amendmentReason: string,
    tenantId: string,
    user: any,
  ): Promise<ClinicalNote> {
    const clinicalNote = await this.findOneClinicalNote(id, tenantId);

    if (clinicalNote.status !== NoteStatus.FINALIZED) {
      throw new BadRequestException('Only finalized clinical notes can be amended');
    }

    clinicalNote.status = NoteStatus.AMENDED;
    clinicalNote.amended_by = user.id;
    clinicalNote.amended_at = new Date();
    clinicalNote.amendment_reason = amendmentReason;

    return await this.clinicalNotesRepository.save(clinicalNote);
  }

  async removeClinicalNote(id: string, tenantId: string): Promise<void> {
    const clinicalNote = await this.findOneClinicalNote(id, tenantId);

    if (clinicalNote.status === NoteStatus.FINALIZED) {
      throw new BadRequestException('Cannot delete finalized clinical notes');
    }

    await this.clinicalNotesRepository.softDelete(id);
  }

  // Treatment Plans CRUD
  async createTreatmentPlan(createDto: CreateTreatmentPlanDto, tenantId: string, user: any): Promise<TreatmentPlan> {
    // Validate patient exists
    const patient = await this.patientsRepository.findOne({
      where: { id: createDto.patientId, tenant_id: tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate clinical note if provided
    if (createDto.clinicalNoteId) {
      const clinicalNote = await this.clinicalNotesRepository.findOne({
        where: { id: createDto.clinicalNoteId, tenant_id: tenantId },
      });

      if (!clinicalNote) {
        throw new NotFoundException('Clinical note not found');
      }
    }

    // Create treatment plan
    const treatmentPlan = this.treatmentPlansRepository.create({
      tenant_id: tenantId,
      clinic_id: user.clinic_id || 'default-clinic',
      patient_id: createDto.patientId,
      clinical_note_id: createDto.clinicalNoteId,
      provider_id: user.id,
      title: createDto.title,
      description: createDto.description,
      status: TreatmentPlanStatus.DRAFT,
      priority: createDto.priority as any,
      start_date: createDto.startDate ? new Date(createDto.startDate) : null,
      estimated_completion_date: createDto.estimatedCompletionDate ? new Date(createDto.estimatedCompletionDate) : null,
      estimated_cost: createDto.estimatedCost,
      insurance_estimate: createDto.insuranceEstimate || 0,
      patient_responsibility: createDto.estimatedCost - (createDto.insuranceEstimate || 0),
      notes: createDto.notes,
      total_items: createDto.items.length,
      created_by: user.id,
    });

    const savedTreatmentPlan = await this.treatmentPlansRepository.save(treatmentPlan);

    // Create treatment plan items
    const items = createDto.items.map((item, index) =>
      this.treatmentPlanItemsRepository.create({
        treatment_plan_id: savedTreatmentPlan.id,
        procedure_name: item.procedureName,
        procedure_code: item.procedureCode,
        item_type: item.itemType as any,
        description: item.description,
        quantity: item.quantity || 1,
        estimated_duration_minutes: item.estimatedDurationMinutes || 60,
        unit_cost: item.unitCost,
        total_cost: item.unitCost * (item.quantity || 1),
        depends_on_item_id: item.dependsOnItemId,
        sequence_order: item.sequenceOrder || index + 1,
        special_instructions: item.specialInstructions,
        required_materials: item.requiredMaterials || [],
        contraindications: item.contraindications || [],
      })
    );

    await this.treatmentPlanItemsRepository.save(items);

    return await this.findOneTreatmentPlan(savedTreatmentPlan.id, tenantId);
  }

  async findAllTreatmentPlans(
    tenantId: string,
    patientId?: string,
    providerId?: string,
    status?: TreatmentPlanStatus,
    priority?: string,
    user?: User,
  ): Promise<TreatmentPlan[]> {
    const query = this.treatmentPlansRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.patient', 'patient')
      .leftJoinAndSelect('plan.provider', 'provider')
      .leftJoinAndSelect('plan.clinical_note', 'clinical_note')
      .leftJoinAndSelect('plan.items', 'items')
      .where('plan.tenant_id = :tenantId', { tenantId });

    if (patientId) {
      query.andWhere('plan.patient_id = :patientId', { patientId });
    }

    if (providerId) {
      query.andWhere('plan.provider_id = :providerId', { providerId });
    }

    if (status) {
      query.andWhere('plan.status = :status', { status });
    }

    // Role-based filtering
    if (user) {
      if (user.role === 'patient') {
        // Patients see only their own treatment plans
        query.andWhere('plan.patient_id IN (SELECT id FROM patients WHERE user_id = :userId)', { userId: user.id });
      } else if (user.role === 'doctor' || user.role === 'dentist') {
        // Providers see only plans they created (unless searching explicitly)
        if (!patientId && !providerId) {
          query.andWhere('plan.provider_id = :userId', { userId: user.id });
        }
      }
    }

    if (priority) {
      query.andWhere('plan.priority = :priority', { priority });
    }

    return await query
      .orderBy('plan.priority', 'DESC')
      .addOrderBy('plan.created_at', 'DESC')
      .getMany();
  }

  async findOneTreatmentPlan(id: string, tenantId: string, user?: User): Promise<TreatmentPlan> {
    const treatmentPlan = await this.treatmentPlansRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['patient', 'provider', 'clinical_note', 'items', 'created_by_user'],
    });

    if (!treatmentPlan) {
      throw new NotFoundException(`Treatment plan with ID ${id} not found`);
    }

    // Role-based access control
    if (user) {
      if (user.role === 'patient') {
        // Verify this plan belongs to a patient record linked to this user
        const patient = await this.patientsRepository.findOne({
          where: { id: treatmentPlan.patient_id, user_id: user.id },
        });
        if (!patient) {
          throw new ForbiddenException('Access denied: Not your treatment plan');
        }
      } else if (user.role === 'doctor' || user.role === 'dentist') {
        // Providers can only view plans they created (unless admin)
        const isAdmin = ['super_admin', 'hospital_admin'].includes(user.role);
        if (!isAdmin && treatmentPlan.provider_id !== user.id) {
          throw new ForbiddenException('Access denied: Not your treatment plan');
        }
      }
    }

    return treatmentPlan;
  }

  async updateTreatmentPlan(
    id: string,
    updateDto: UpdateTreatmentPlanDto,
    tenantId: string,
    user: any,
  ): Promise<TreatmentPlan> {
    const treatmentPlan = await this.findOneTreatmentPlan(id, tenantId);

    if (treatmentPlan.status === TreatmentPlanStatus.COMPLETED) {
      throw new BadRequestException('Cannot edit completed treatment plans');
    }

    Object.assign(treatmentPlan, {
      title: updateDto.title || treatmentPlan.title,
      description: updateDto.description !== undefined ? updateDto.description : treatmentPlan.description,
      priority: updateDto.priority || treatmentPlan.priority,
      start_date: updateDto.startDate ? new Date(updateDto.startDate) : treatmentPlan.start_date,
      estimated_completion_date: updateDto.estimatedCompletionDate ? new Date(updateDto.estimatedCompletionDate) : treatmentPlan.estimated_completion_date,
      estimated_cost: updateDto.estimatedCost !== undefined ? updateDto.estimatedCost : treatmentPlan.estimated_cost,
      insurance_estimate: updateDto.insuranceEstimate !== undefined ? updateDto.insuranceEstimate : treatmentPlan.insurance_estimate,
      notes: updateDto.notes !== undefined ? updateDto.notes : treatmentPlan.notes,
      status: updateDto.status || treatmentPlan.status,
    });

    // Update patient responsibility if cost or insurance estimate changed
    if (updateDto.estimatedCost !== undefined || updateDto.insuranceEstimate !== undefined) {
      treatmentPlan.patient_responsibility = treatmentPlan.estimated_cost - treatmentPlan.insurance_estimate;
    }

    return await this.treatmentPlansRepository.save(treatmentPlan);
  }

  async proposeTreatmentPlan(id: string, tenantId: string, user: any): Promise<TreatmentPlan> {
    const treatmentPlan = await this.findOneTreatmentPlan(id, tenantId);

    if (treatmentPlan.status !== TreatmentPlanStatus.DRAFT) {
      throw new BadRequestException('Only draft treatment plans can be proposed');
    }

    treatmentPlan.status = TreatmentPlanStatus.PROPOSED;
    treatmentPlan.proposed_at = new Date();

    return await this.treatmentPlansRepository.save(treatmentPlan);
  }

  async acceptTreatmentPlan(id: string, tenantId: string): Promise<TreatmentPlan> {
    const treatmentPlan = await this.findOneTreatmentPlan(id, tenantId);

    if (treatmentPlan.status !== TreatmentPlanStatus.PROPOSED) {
      throw new BadRequestException('Only proposed treatment plans can be accepted');
    }

    treatmentPlan.status = TreatmentPlanStatus.ACCEPTED;
    treatmentPlan.accepted_at = new Date();
    treatmentPlan.patient_consent_obtained = true;
    treatmentPlan.patient_consent_date = new Date();

    return await this.treatmentPlansRepository.save(treatmentPlan);
  }

  async completeTreatmentPlan(id: string, tenantId: string, user: any): Promise<TreatmentPlan> {
    const treatmentPlan = await this.findOneTreatmentPlan(id, tenantId);

    if (treatmentPlan.status !== TreatmentPlanStatus.ACCEPTED && treatmentPlan.status !== TreatmentPlanStatus.IN_PROGRESS) {
      throw new BadRequestException('Only accepted or in-progress treatment plans can be completed');
    }

    // Check if all items are completed
    const incompleteItems = treatmentPlan.items.filter(item => item.status !== TreatmentItemStatus.COMPLETED);
    if (incompleteItems.length > 0) {
      throw new BadRequestException('Cannot complete treatment plan with incomplete items');
    }

    treatmentPlan.status = TreatmentPlanStatus.COMPLETED;
    treatmentPlan.completed_items = treatmentPlan.total_items;
    treatmentPlan.actual_completion_date = new Date();
    treatmentPlan.completed_at = new Date();

    return await this.treatmentPlansRepository.save(treatmentPlan);
  }

  async removeTreatmentPlan(id: string, tenantId: string): Promise<void> {
    const treatmentPlan = await this.findOneTreatmentPlan(id, tenantId);

    if (treatmentPlan.status === TreatmentPlanStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed treatment plans');
    }

    await this.treatmentPlansRepository.softDelete(id);
  }

  // Analytics
  async getClinicalAnalytics(tenantId: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.clinicalNotesRepository
      .createQueryBuilder('note')
      .where('note.tenant_id = :tenantId', { tenantId });

    if (startDate && endDate) {
      query.andWhere('note.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const totalNotes = await query.getCount();

    const noteTypeStats = await query
      .clone()
      .select('note.note_type', 'noteType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('note.note_type')
      .getRawMany();

    const providerStats = await query
      .clone()
      .leftJoin('note.provider', 'provider')
      .select('provider.email', 'provider_email')
      .addSelect('COUNT(*)', 'note_count')
      .groupBy('provider.email')
      .getRawMany();

    const treatmentPlanStats = await this.treatmentPlansRepository
      .createQueryBuilder('plan')
      .where('plan.tenant_id = :tenantId', { tenantId })
      .select('plan.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('plan.status')
      .getRawMany();

    return {
      totalNotes,
      noteTypeStats: noteTypeStats.reduce((acc, item) => {
        acc[item.noteType] = parseInt(item.count);
        return acc;
      }, {}),
      providerStats,
      treatmentPlanStats: treatmentPlanStats.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}
