import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThan, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { AppointmentRecurrence, RecurrenceType, RecurrenceEndType } from './entities/appointment-recurrence.entity';
import { AppointmentWaitlist, WaitlistStatus } from './entities/appointment-waitlist.entity';
import { AppointmentConflict, ConflictType, ConflictStatus } from './entities/appointment-conflict.entity';

export interface CreateRecurringAppointmentDto {
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  reason?: string;
  roomId?: string;
  recurrenceType: RecurrenceType;
  intervalValue?: number;
  endType: RecurrenceEndType;
  endDate?: string;
  recurrenceCount?: number;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  monthsOfYear?: number[];
}

export interface CreateWaitlistEntryDto {
  patientId: string;
  appointmentType: string;
  durationMinutes: number;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  preferredProviderId?: string;
  notes?: string;
  reasonForAppointment?: string;
  priorityLevel?: number;
  isUrgent?: boolean;
  contactMethod?: string;
  contactTimePreference?: string;
}

export interface ConflictResolutionDto {
  resolution: 'reschedule_primary' | 'reschedule_conflicting' | 'cancel_primary' | 'cancel_conflicting' | 'ignore';
  rescheduleTo?: {
    startTime: string;
    endTime: string;
    roomId?: string;
  };
  cancellationReason?: string;
  notes?: string;
}

@Injectable()
export class AdvancedAppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentRecurrence)
    private recurrenceRepository: Repository<AppointmentRecurrence>,
    @InjectRepository(AppointmentWaitlist)
    private waitlistRepository: Repository<AppointmentWaitlist>,
    @InjectRepository(AppointmentConflict)
    private conflictRepository: Repository<AppointmentConflict>,
  ) {}

  // Recurring Appointments
  async createRecurringAppointment(
    createDto: CreateRecurringAppointmentDto,
    tenantId: string,
    user: any,
  ): Promise<{ masterAppointment: Appointment; generatedAppointments: Appointment[] }> {
    // Create the master appointment
    const masterAppointment = this.appointmentsRepository.create({
      tenant_id: tenantId,
      clinic_id: user.clinic_id || 'default-clinic', // Assuming clinic_id is available
      patient_id: createDto.patientId,
      provider_id: createDto.providerId,
      start_time: new Date(createDto.startTime),
      end_time: new Date(createDto.endTime),
      appointment_type: createDto.appointmentType,
      reason: createDto.reason,
      room_id: createDto.roomId,
      status: AppointmentStatus.SCHEDULED,
      master_appointment_id: null, // This is the master
      created_by: user.id,
    });

    const savedMasterAppointment = await this.appointmentsRepository.save(masterAppointment);

    // Create recurrence pattern
    const recurrence = this.recurrenceRepository.create({
      appointment_id: savedMasterAppointment.id,
      recurrence_type: createDto.recurrenceType,
      interval_value: createDto.intervalValue || 1,
      recurrence_count: createDto.recurrenceCount,
      end_type: createDto.endType,
      end_date: createDto.endDate ? new Date(createDto.endDate) : null,
      days_of_week: createDto.daysOfWeek || [],
      days_of_month: createDto.daysOfMonth || [],
      months_of_year: createDto.monthsOfYear || [],
      is_active: true,
    });

    await this.recurrenceRepository.save(recurrence);

    // Generate recurring appointments
    const generatedAppointments = await this.generateRecurringAppointments(savedMasterAppointment, recurrence);

    return { masterAppointment: savedMasterAppointment, generatedAppointments };
  }

  private async generateRecurringAppointments(
    masterAppointment: Appointment,
    recurrence: AppointmentRecurrence,
  ): Promise<Appointment[]> {
    const generatedAppointments: Appointment[] = [];
    const startDate = new Date(masterAppointment.start_time);
    const endDate = new Date(masterAppointment.end_time);

    let currentDate = new Date(startDate);
    let generatedCount = 0;
    const maxAppointments = recurrence.recurrence_count || 100; // Safety limit

    while (generatedCount < maxAppointments) {
      // Calculate next occurrence based on recurrence type
      const nextDate = this.calculateNextOccurrence(currentDate, recurrence);
      
      if (!nextDate) break;

      // Check if we've reached the end date
      if (recurrence.end_type === RecurrenceEndType.ON_DATE && 
          recurrence.end_date && nextDate > recurrence.end_date) {
        break;
      }

      // Create the recurring appointment
      const appointmentStart = new Date(nextDate);
      appointmentStart.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
      
      const appointmentEnd = new Date(nextDate);
      appointmentEnd.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds());

      const recurringAppointment = this.appointmentsRepository.create({
        ...masterAppointment,
        id: undefined, // Let database generate new ID
        start_time: appointmentStart,
        end_time: appointmentEnd,
        master_appointment_id: masterAppointment.id,
        created_at: undefined,
        updated_at: undefined,
      });

      const savedAppointment = await this.appointmentsRepository.save(recurringAppointment);
      generatedAppointments.push(savedAppointment);

      currentDate = nextDate;
      generatedCount++;
    }

    // Update recurrence last generated timestamp
    recurrence.last_generated_at = new Date();
    await this.recurrenceRepository.save(recurrence);

    return generatedAppointments;
  }

  private calculateNextOccurrence(currentDate: Date, recurrence: AppointmentRecurrence): Date | null {
    const nextDate = new Date(currentDate);

    switch (recurrence.recurrence_type) {
      case RecurrenceType.DAILY:
        nextDate.setDate(nextDate.getDate() + recurrence.interval_value);
        break;
      case RecurrenceType.WEEKLY:
        nextDate.setDate(nextDate.getDate() + (7 * recurrence.interval_value));
        break;
      case RecurrenceType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval_value);
        break;
      case RecurrenceType.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval_value);
        break;
      default:
        return null;
    }

    return nextDate;
  }

  // Waitlist Management
  async addToWaitlist(createDto: CreateWaitlistEntryDto, tenantId: string, user: any): Promise<AppointmentWaitlist> {
    const waitlistEntry = this.waitlistRepository.create({
      tenant_id: tenantId,
      clinic_id: user.clinic_id || 'default-clinic',
      patient_id: createDto.patientId,
      requested_by: user.id,
      preferred_date: createDto.preferredDate ? new Date(createDto.preferredDate) : null,
      preferred_time_start: createDto.preferredTimeStart,
      preferred_time_end: createDto.preferredTimeEnd,
      appointment_type: createDto.appointmentType,
      duration_minutes: createDto.durationMinutes,
      preferred_provider_id: createDto.preferredProviderId,
      notes: createDto.notes,
      reason_for_appointment: createDto.reasonForAppointment,
      priority_level: createDto.priorityLevel || 5,
      is_urgent: createDto.isUrgent || false,
      contact_method: createDto.contactMethod || 'any',
      contact_time_preference: createDto.contactTimePreference || 'any',
      status: WaitlistStatus.ACTIVE,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      created_by: user.id,
    });

    return await this.waitlistRepository.save(waitlistEntry);
  }

  async getWaitlist(tenantId: string, clinicId?: string, status?: WaitlistStatus): Promise<AppointmentWaitlist[]> {
    const query = this.waitlistRepository
      .createQueryBuilder('waitlist')
      .leftJoinAndSelect('waitlist.patient', 'patient')
      .leftJoinAndSelect('waitlist.requested_by_user', 'requested_by_user')
      .leftJoinAndSelect('waitlist.preferred_provider', 'preferred_provider')
      .where('waitlist.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('waitlist.clinic_id = :clinicId', { clinicId });
    }

    if (status) {
      query.andWhere('waitlist.status = :status', { status });
    }

    return await query
      .orderBy('waitlist.priority_level', 'DESC')
      .addOrderBy('waitlist.is_urgent', 'DESC')
      .addOrderBy('waitlist.created_at', 'ASC')
      .getMany();
  }

  async scheduleFromWaitlist(
    waitlistId: string,
    appointmentData: {
      startTime: string;
      endTime: string;
      providerId: string;
      roomId?: string;
    },
    tenantId: string,
    user: any,
  ): Promise<{ waitlistEntry: AppointmentWaitlist; appointment: Appointment }> {
    const waitlistEntry = await this.waitlistRepository.findOne({
      where: { id: waitlistId, tenant_id: tenantId },
      relations: ['patient'],
    });

    if (!waitlistEntry) {
      throw new NotFoundException('Waitlist entry not found');
    }

    if (waitlistEntry.status !== WaitlistStatus.ACTIVE) {
      throw new BadRequestException('Waitlist entry is not active');
    }

    // Create appointment
    const appointment = this.appointmentsRepository.create({
      tenant_id: tenantId,
      clinic_id: waitlistEntry.clinic_id,
      patient_id: waitlistEntry.patient_id,
      provider_id: appointmentData.providerId,
      start_time: new Date(appointmentData.startTime),
      end_time: new Date(appointmentData.endTime),
      appointment_type: waitlistEntry.appointment_type,
      reason: waitlistEntry.reason_for_appointment,
      room_id: appointmentData.roomId,
      status: AppointmentStatus.SCHEDULED,
      created_by: user.id,
    });

    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Update waitlist entry
    waitlistEntry.status = WaitlistStatus.SCHEDULED;
    waitlistEntry.scheduled_appointment_id = savedAppointment.id;
    waitlistEntry.scheduled_at = new Date();
    await this.waitlistRepository.save(waitlistEntry);

    return { waitlistEntry, appointment: savedAppointment };
  }

  // Conflict Detection and Resolution
  async detectConflicts(appointmentId: string, tenantId: string): Promise<AppointmentConflict[]> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId, tenant_id: tenantId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const conflicts: AppointmentConflict[] = [];

    // Check for provider double booking
    const providerConflicts = await this.appointmentsRepository.find({
      where: {
        tenant_id: tenantId,
        provider_id: appointment.provider_id,
        status: In([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
        id: Not(appointmentId),
        start_time: LessThan(appointment.end_time),
        end_time: MoreThan(appointment.start_time),
      },
    });

    for (const conflictingAppointment of providerConflicts) {
      const conflict = this.conflictRepository.create({
        tenant_id: tenantId,
        clinic_id: appointment.clinic_id,
        primary_appointment_id: appointmentId,
        conflicting_appointment_id: conflictingAppointment.id,
        conflict_type: ConflictType.PROVIDER_DOUBLE_BOOKING,
        description: `Provider double booking: Provider is already scheduled for another appointment during this time`,
        conflict_details: {
          provider_id: appointment.provider_id,
          overlapping_start: conflictingAppointment.start_time,
          overlapping_end: conflictingAppointment.end_time,
        },
        severity_level: 4,
        detected_at: new Date(),
      });

      conflicts.push(await this.conflictRepository.save(conflict));
    }

    // Check for patient double booking
    const patientConflicts = await this.appointmentsRepository.find({
      where: {
        tenant_id: tenantId,
        patient_id: appointment.patient_id,
        status: In([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
        id: Not(appointmentId),
        start_time: LessThan(appointment.end_time),
        end_time: MoreThan(appointment.start_time),
      },
    });

    for (const conflictingAppointment of patientConflicts) {
      const conflict = this.conflictRepository.create({
        tenant_id: tenantId,
        clinic_id: appointment.clinic_id,
        primary_appointment_id: appointmentId,
        conflicting_appointment_id: conflictingAppointment.id,
        conflict_type: ConflictType.PATIENT_DOUBLE_BOOKING,
        description: `Patient double booking: Patient is already scheduled for another appointment during this time`,
        conflict_details: {
          patient_id: appointment.patient_id,
          overlapping_start: conflictingAppointment.start_time,
          overlapping_end: conflictingAppointment.end_time,
        },
        severity_level: 3,
        detected_at: new Date(),
      });

      conflicts.push(await this.conflictRepository.save(conflict));
    }

    // Check for room double booking (if room is specified)
    if (appointment.room_id) {
      const roomConflicts = await this.appointmentsRepository.find({
        where: {
          tenant_id: tenantId,
          room_id: appointment.room_id,
          status: In([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
          id: Not(appointmentId),
          start_time: LessThan(appointment.end_time),
          end_time: MoreThan(appointment.start_time),
        },
      });

      for (const conflictingAppointment of roomConflicts) {
        const conflict = this.conflictRepository.create({
          tenant_id: tenantId,
          clinic_id: appointment.clinic_id,
          primary_appointment_id: appointmentId,
          conflicting_appointment_id: conflictingAppointment.id,
          conflict_type: ConflictType.ROOM_DOUBLE_BOOKING,
          description: `Room double booking: Room is already scheduled for another appointment during this time`,
          conflict_details: {
            room_id: appointment.room_id,
            overlapping_start: conflictingAppointment.start_time,
            overlapping_end: conflictingAppointment.end_time,
          },
          severity_level: 2,
          detected_at: new Date(),
        });

        conflicts.push(await this.conflictRepository.save(conflict));
      }
    }

    return conflicts;
  }

  async resolveConflict(
    conflictId: string,
    resolutionDto: ConflictResolutionDto,
    tenantId: string,
    user: any,
  ): Promise<AppointmentConflict> {
    const conflict = await this.conflictRepository.findOne({
      where: { id: conflictId, tenant_id: tenantId },
      relations: ['primary_appointment', 'conflicting_appointment'],
    });

    if (!conflict) {
      throw new NotFoundException('Conflict not found');
    }

    if (conflict.status !== ConflictStatus.DETECTED) {
      throw new BadRequestException('Conflict has already been resolved');
    }

    // Apply resolution based on type
    switch (resolutionDto.resolution) {
      case 'reschedule_primary':
        if (resolutionDto.rescheduleTo) {
          conflict.primary_appointment.start_time = new Date(resolutionDto.rescheduleTo.startTime);
          conflict.primary_appointment.end_time = new Date(resolutionDto.rescheduleTo.endTime);
          if (resolutionDto.rescheduleTo.roomId) {
            conflict.primary_appointment.room_id = resolutionDto.rescheduleTo.roomId;
          }
          await this.appointmentsRepository.save(conflict.primary_appointment);
        }
        break;

      case 'reschedule_conflicting':
        if (resolutionDto.rescheduleTo) {
          conflict.conflicting_appointment.start_time = new Date(resolutionDto.rescheduleTo.startTime);
          conflict.conflicting_appointment.end_time = new Date(resolutionDto.rescheduleTo.endTime);
          if (resolutionDto.rescheduleTo.roomId) {
            conflict.conflicting_appointment.room_id = resolutionDto.rescheduleTo.roomId;
          }
          await this.appointmentsRepository.save(conflict.conflicting_appointment);
        }
        break;

      case 'cancel_primary':
        conflict.primary_appointment.status = AppointmentStatus.CANCELLED;
        conflict.primary_appointment.cancellation_reason = resolutionDto.cancellationReason;
        conflict.primary_appointment.cancelled_at = new Date();
        await this.appointmentsRepository.save(conflict.primary_appointment);
        break;

      case 'cancel_conflicting':
        conflict.conflicting_appointment.status = AppointmentStatus.CANCELLED;
        conflict.conflicting_appointment.cancellation_reason = resolutionDto.cancellationReason;
        conflict.conflicting_appointment.cancelled_at = new Date();
        await this.appointmentsRepository.save(conflict.conflicting_appointment);
        break;

      case 'ignore':
        // Just mark as ignored, no changes to appointments
        break;
    }

    // Update conflict status
    conflict.status = ConflictStatus.RESOLVED;
    conflict.resolution_notes = resolutionDto.notes;
    conflict.resolved_by = user.id;
    conflict.resolved_at = new Date();

    return await this.conflictRepository.save(conflict);
  }

  async getConflicts(tenantId: string, clinicId?: string, status?: ConflictStatus): Promise<AppointmentConflict[]> {
    const query = this.conflictRepository
      .createQueryBuilder('conflict')
      .leftJoinAndSelect('conflict.primary_appointment', 'primary_appointment')
      .leftJoinAndSelect('conflict.conflicting_appointment', 'conflicting_appointment')
      .leftJoinAndSelect('conflict.resolved_by_user', 'resolved_by_user')
      .where('conflict.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('conflict.clinic_id = :clinicId', { clinicId });
    }

    if (status) {
      query.andWhere('conflict.status = :status', { status });
    }

    return await query
      .orderBy('conflict.severity_level', 'DESC')
      .addOrderBy('conflict.detected_at', 'DESC')
      .getMany();
  }

  // Analytics and Reporting
  async getAppointmentAnalytics(
    tenantId: string,
    clinicId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('appointment.clinic_id = :clinicId', { clinicId });
    }

    if (startDate && endDate) {
      query.andWhere('appointment.start_time BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const totalAppointments = await query.getCount();

    const statusBreakdown = await query
      .clone()
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.status')
      .getRawMany();

    const providerStats = await query
      .clone()
      .leftJoin('appointment.provider', 'provider')
      .select('provider.email', 'provider_email')
      .addSelect('COUNT(*)', 'appointment_count')
      .groupBy('provider.email')
      .getRawMany();

    const waitlistStats = await this.waitlistRepository
      .createQueryBuilder('waitlist')
      .where('waitlist.tenant_id = :tenantId', { tenantId })
      .select('waitlist.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('waitlist.status')
      .getRawMany();

    return {
      totalAppointments,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      providerStats,
      waitlistStats: waitlistStats.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}
