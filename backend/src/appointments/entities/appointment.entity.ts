import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { AppointmentRecurrence } from './appointment-recurrence.entity';
import { AppointmentConflict } from './appointment-conflict.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
export class Appointment extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  clinic_id: string;

  @Column({ type: 'varchar', length: 36 })
  patient_id: string;

  @Column({ type: 'varchar', length: 36 })
  provider_id: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ length: 100, nullable: true })
  appointment_type?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  room_id?: string;

  // Status tracking
  @Column({ type: 'timestamp', nullable: true })
  checked_in_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  seen_by_provider_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  // Recurrence
  @Column({ type: 'json', nullable: true })
  recurrence_pattern?: Record<string, any>;

  @Column({ type: 'varchar', length: 36, nullable: true })
  master_appointment_id?: string;

  // Audit
  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by?: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @OneToMany(() => AppointmentRecurrence, recurrence => recurrence.appointment)
  recurrences: AppointmentRecurrence[];

  @OneToMany(() => AppointmentConflict, conflict => conflict.primary_appointment)
  conflicts_as_primary: AppointmentConflict[];

  @OneToMany(() => AppointmentConflict, conflict => conflict.conflicting_appointment)
  conflicts_as_conflicting: AppointmentConflict[];
}
