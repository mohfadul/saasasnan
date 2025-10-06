import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TreatmentPlan } from './treatment-plan.entity';
import { User } from '../../auth/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum TreatmentItemStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum TreatmentItemType {
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
  EXAMINATION = 'examination',
  CLEANING = 'cleaning',
  RESTORATION = 'restoration',
  EXTRACTION = 'extraction',
  IMPLANT = 'implant',
  ORTHODONTIC = 'orthodontic',
  PERIODONTAL = 'periodontal',
  ENDODONTIC = 'endodontic',
  PROSTHODONTIC = 'prosthodontic',
  SURGERY = 'surgery',
  OTHER = 'other',
}

@Entity('treatment_plan_items')
export class TreatmentPlanItem extends BaseEntity {
  @Column({ type: 'uuid' })
  treatment_plan_id: string;

  @Column({ type: 'uuid', nullable: true })
  appointment_id?: string; // If scheduled

  @Column({ type: 'uuid', nullable: true })
  provider_id?: string; // Assigned provider

  // Item details
  @Column({ type: 'varchar', length: 255 })
  procedure_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  procedure_code?: string; // CDT code or custom code

  @Column({
    type: 'enum',
    enum: TreatmentItemType,
  })
  item_type: TreatmentItemType;

  @Column({
    type: 'enum',
    enum: TreatmentItemStatus,
    default: TreatmentItemStatus.PENDING,
  })
  status: TreatmentItemStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'integer', default: 60 })
  estimated_duration_minutes: number;

  // Scheduling
  @Column({ type: 'date', nullable: true })
  scheduled_date?: Date;

  @Column({ type: 'time', nullable: true })
  scheduled_time?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room_id?: string;

  // Financial
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  insurance_coverage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  patient_responsibility: number;

  // Progress tracking
  @Column({ type: 'integer', default: 0 })
  completion_percentage: number;

  @Column({ type: 'text', nullable: true })
  progress_notes?: string;

  // Dependencies
  @Column({ type: 'uuid', nullable: true })
  depends_on_item_id?: string; // Item that must be completed first

  @Column({ type: 'integer', default: 1 })
  sequence_order: number; // Order within the treatment plan

  // Additional information
  @Column({ type: 'text', nullable: true })
  special_instructions?: string;

  @Column({ type: 'json', default: '[]' })
  required_materials?: string[]; // Materials needed for the procedure

  @Column({ type: 'json', default: '[]' })
  contraindications?: string[]; // Medical contraindications

  // Status tracking
  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @ManyToOne(() => TreatmentPlan, treatmentPlan => treatmentPlan.items)
  @JoinColumn({ name: 'treatment_plan_id' })
  treatment_plan: TreatmentPlan;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider?: User;
}
