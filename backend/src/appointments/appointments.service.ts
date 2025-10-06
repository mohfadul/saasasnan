import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../auth/entities/user.entity';
import { PHIEncryptionService } from '../common/services/phi-encryption.service';

export interface UpdateAppointmentDto {
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  appointmentType?: string;
  reason?: string;
  roomId?: string;
  cancellationReason?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    private phiEncryptionService: PHIEncryptionService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, tenantId: string, user: User): Promise<Appointment> {
    // Check for conflicts
    await this.checkForConflicts(
      createAppointmentDto.providerId,
      createAppointmentDto.startTime,
      createAppointmentDto.endTime,
      tenantId,
    );

    const appointment = this.appointmentsRepository.create({
      tenant_id: tenantId,
      clinic_id: createAppointmentDto.clinicId,
      patient_id: createAppointmentDto.patientId,
      provider_id: createAppointmentDto.providerId,
      start_time: new Date(createAppointmentDto.startTime),
      end_time: new Date(createAppointmentDto.endTime),
      appointment_type: createAppointmentDto.appointmentType,
      reason: createAppointmentDto.reason,
      room_id: createAppointmentDto.roomId,
      status: createAppointmentDto.status || AppointmentStatus.SCHEDULED,
      recurrence_pattern: createAppointmentDto.recurrencePattern,
      created_by: user.id,
    });

    return await this.appointmentsRepository.save(appointment);
  }

  async findAll(
    tenantId: string,
    clinicId?: string,
    providerId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Appointment[]> {
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .where('appointment.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('appointment.clinic_id = :clinicId', { clinicId });
    }

    if (providerId) {
      query.andWhere('appointment.provider_id = :providerId', { providerId });
    }

    if (startDate && endDate) {
      query.andWhere('appointment.start_time BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const appointments = await query
      .orderBy('appointment.start_time', 'ASC')
      .getMany();

    // Decrypt patient demographics for each appointment
    const decryptedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        if (appointment.patient && appointment.patient.encrypted_demographics) {
          try {
            const decryptedDemographics = await this.phiEncryptionService.decryptPatientDemographics({
              encryptedData: appointment.patient.encrypted_demographics,
              encryptionContext: {},
              keyId: appointment.patient.demographics_key_id,
              algorithm: 'aes-256-gcm',
            });
            
            return {
              ...appointment,
              patient: {
                ...appointment.patient,
                demographics: decryptedDemographics,
              },
            };
          } catch (error) {
            console.error('Error decrypting patient demographics:', error);
            return appointment;
          }
        }
        return appointment;
      })
    );

    return decryptedAppointments;
  }

  async findOne(id: string, tenantId: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['patient', 'provider', 'tenant'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    tenantId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, tenantId);

    // Check for conflicts if time is being changed
    if (updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
      const startTime = updateAppointmentDto.startTime ? new Date(updateAppointmentDto.startTime) : appointment.start_time;
      const endTime = updateAppointmentDto.endTime ? new Date(updateAppointmentDto.endTime) : appointment.end_time;
      
      await this.checkForConflicts(appointment.provider_id, startTime.toISOString(), endTime.toISOString(), tenantId, id);
    }

    // Update fields
    if (updateAppointmentDto.startTime) {
      appointment.start_time = new Date(updateAppointmentDto.startTime);
    }
    if (updateAppointmentDto.endTime) {
      appointment.end_time = new Date(updateAppointmentDto.endTime);
    }
    if (updateAppointmentDto.status) {
      appointment.status = updateAppointmentDto.status;
      
      // Set status-specific timestamps
      switch (updateAppointmentDto.status) {
        case AppointmentStatus.CHECKED_IN:
          appointment.checked_in_at = new Date();
          break;
        case AppointmentStatus.IN_PROGRESS:
          appointment.seen_by_provider_at = new Date();
          break;
        case AppointmentStatus.COMPLETED:
          appointment.completed_at = new Date();
          break;
        case AppointmentStatus.CANCELLED:
          appointment.cancelled_at = new Date();
          break;
      }
    }
    if (updateAppointmentDto.appointmentType) {
      appointment.appointment_type = updateAppointmentDto.appointmentType;
    }
    if (updateAppointmentDto.reason) {
      appointment.reason = updateAppointmentDto.reason;
    }
    if (updateAppointmentDto.roomId) {
      appointment.room_id = updateAppointmentDto.roomId;
    }
    if (updateAppointmentDto.cancellationReason) {
      appointment.cancellation_reason = updateAppointmentDto.cancellationReason;
    }

    return await this.appointmentsRepository.save(appointment);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const appointment = await this.findOne(id, tenantId);
    await this.appointmentsRepository.softDelete(id);
  }

  async cancelAppointment(id: string, reason: string, tenantId: string): Promise<Appointment> {
    return this.update(id, {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: reason,
    }, tenantId);
  }

  private async checkForConflicts(
    providerId: string,
    startTime: string,
    endTime: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<void> {
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.tenant_id = :tenantId', { tenantId })
      .andWhere('appointment.provider_id = :providerId', { providerId })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere(
        '(appointment.start_time < :endTime AND appointment.end_time > :startTime)',
        {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        },
      );

    if (excludeId) {
      query.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const conflicts = await query.getMany();

    if (conflicts.length > 0) {
      throw new BadRequestException('Appointment conflicts with existing appointments');
    }
  }

  async getProviderSchedule(
    providerId: string,
    tenantId: string,
    date: string,
  ): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.appointmentsRepository.find({
      where: {
        tenant_id: tenantId,
        provider_id: providerId,
        start_time: Between(startOfDay, endOfDay),
      },
      relations: ['patient'],
      order: { start_time: 'ASC' },
    });
  }

  async getAppointmentStats(tenantId: string, clinicId?: string, startDate?: string, endDate?: string): Promise<any> {
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

    const total = await query.getCount();
    
    const statusCounts = await query
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.status')
      .getRawMany();

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    return {
      total,
      statusStats,
      completedRate: statusStats[AppointmentStatus.COMPLETED] / total || 0,
      cancellationRate: statusStats[AppointmentStatus.CANCELLED] / total || 0,
      noShowRate: statusStats[AppointmentStatus.NO_SHOW] / total || 0,
    };
  }
}
