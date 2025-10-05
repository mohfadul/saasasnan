import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../auth/entities/user.entity';

export enum WaitlistStatus {
  ACTIVE = 'active',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('appointment_waitlist')
export class AppointmentWaitlist extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid' })
  requested_by: string; // User who added to waitlist

  // Appointment preferences
  @Column({ type: 'date', nullable: true })
  preferred_date?: Date;

  @Column({ type: 'time', nullable: true })
  preferred_time_start?: string;

  @Column({ type: 'time', nullable: true })
  preferred_time_end?: string;

  @Column({ type: 'varchar', length: 255 })
  appointment_type: string;

  @Column({ type: 'integer', default: 60 })
  duration_minutes: number;

  @Column({ type: 'uuid', nullable: true })
  preferred_provider_id?: string; // Preferred dentist/staff

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  reason_for_appointment?: string;

  // Priority and urgency
  @Column({ type: 'integer', default: 5 })
  priority_level: number; // 1-10 (10 being highest priority)

  @Column({ type: 'boolean', default: false })
  is_urgent: boolean;

  // Contact preferences
  @Column({ type: 'varchar', length: 50, default: 'any' })
  contact_method: string; // 'phone', 'email', 'sms', 'any'

  @Column({ type: 'varchar', length: 50, default: 'any' })
  contact_time_preference: string; // 'morning', 'afternoon', 'evening', 'any'

  // Status tracking
  @Column({
    type: 'enum',
    enum: WaitlistStatus,
    default: WaitlistStatus.ACTIVE,
  })
  status: WaitlistStatus;

  @Column({ type: 'timestamptz', nullable: true })
  contacted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  scheduled_appointment_id?: string;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at?: Date;

  // Audit
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by' })
  requested_by_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'preferred_provider_id' })
  preferred_provider?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;
}
