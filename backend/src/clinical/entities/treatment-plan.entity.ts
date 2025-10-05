import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../auth/entities/user.entity';
import { ClinicalNote } from './clinical-note.entity';
import { TreatmentPlanItem } from './treatment-plan-item.entity';

export enum TreatmentPlanStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum TreatmentPlanPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('treatment_plans')
export class TreatmentPlan extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid', nullable: true })
  clinical_note_id?: string;

  @Column({ type: 'uuid' })
  provider_id: string; // Dentist who created the plan

  // Plan details
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TreatmentPlanStatus,
    default: TreatmentPlanStatus.DRAFT,
  })
  status: TreatmentPlanStatus;

  @Column({
    type: 'enum',
    enum: TreatmentPlanPriority,
    default: TreatmentPlanPriority.MEDIUM,
  })
  priority: TreatmentPlanPriority;

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  estimated_completion_date?: Date;

  @Column({ type: 'date', nullable: true })
  actual_completion_date?: Date;

  // Financial information
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimated_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actual_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  insurance_estimate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  patient_responsibility: number;

  // Progress tracking
  @Column({ type: 'integer', default: 0 })
  total_items: number;

  @Column({ type: 'integer', default: 0 })
  completed_items: number;

  @Column({ type: 'integer', default: 0 })
  in_progress_items: number;

  @Column({ type: 'integer', default: 0 })
  pending_items: number;

  // Additional information
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  patient_consent_notes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  patient_consent_date?: Date;

  @Column({ type: 'boolean', default: false })
  patient_consent_obtained: boolean;

  // Status tracking
  @Column({ type: 'timestamptz', nullable: true })
  proposed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  // Audit
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @ManyToOne(() => ClinicalNote, { nullable: true })
  @JoinColumn({ name: 'clinical_note_id' })
  clinical_note?: ClinicalNote;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;

  @OneToMany(() => TreatmentPlanItem, item => item.treatment_plan)
  items: TreatmentPlanItem[];
}
