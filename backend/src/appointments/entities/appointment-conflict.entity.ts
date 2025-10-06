import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Appointment } from './appointment.entity';
import { User } from '../../auth/entities/user.entity';

export enum ConflictType {
  PROVIDER_DOUBLE_BOOKING = 'provider_double_booking',
  ROOM_DOUBLE_BOOKING = 'room_double_booking',
  PATIENT_DOUBLE_BOOKING = 'patient_double_booking',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  RESOURCE_UNAVAILABLE = 'resource_unavailable',
}

export enum ConflictStatus {
  DETECTED = 'detected',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
  ESCALATED = 'escalated',
}

@Entity('appointment_conflicts')
export class AppointmentConflict extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  primary_appointment_id: string;

  @Column({ type: 'uuid' })
  conflicting_appointment_id: string;

  @Column({
    type: 'enum',
    enum: ConflictType,
  })
  conflict_type: ConflictType;

  @Column({
    type: 'enum',
    enum: ConflictStatus,
    default: ConflictStatus.DETECTED,
  })
  status: ConflictStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', default: '{}' })
  conflict_details: Record<string, any>; // Additional conflict information

  @Column({ type: 'text', nullable: true })
  resolution_notes?: string;

  @Column({ type: 'uuid', nullable: true })
  resolved_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at?: Date;

  @Column({ type: 'integer', default: 1 })
  severity_level: number; // 1-5 (5 being most severe)

  @Column({ type: 'boolean', default: false })
  auto_resolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  detected_at: Date;

  @ManyToOne(() => Appointment, appointment => appointment.conflicts_as_primary)
  @JoinColumn({ name: 'primary_appointment_id' })
  primary_appointment: Appointment;

  @ManyToOne(() => Appointment, appointment => appointment.conflicts_as_conflicting)
  @JoinColumn({ name: 'conflicting_appointment_id' })
  conflicting_appointment: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'resolved_by' })
  resolved_by_user?: User;
}
