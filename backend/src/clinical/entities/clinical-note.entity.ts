import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../auth/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { TreatmentPlan } from './treatment-plan.entity';

export enum NoteType {
  CONSULTATION = 'consultation',
  EXAMINATION = 'examination',
  TREATMENT = 'treatment',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  PROGRESS = 'progress',
  DISCHARGE = 'discharge',
}

export enum NoteStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  AMENDED = 'amended',
  ARCHIVED = 'archived',
}

@Entity('clinical_notes')
export class ClinicalNote extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid', nullable: true })
  appointment_id?: string;

  @Column({ type: 'uuid' })
  provider_id: string; // Dentist who wrote the note

  // Note details
  @Column({
    type: 'enum',
    enum: NoteType,
  })
  note_type: NoteType;

  @Column({
    type: 'enum',
    enum: NoteStatus,
    default: NoteStatus.DRAFT,
  })
  status: NoteStatus;

  @Column({ type: 'text' })
  chief_complaint: string;

  @Column({ type: 'text', nullable: true })
  history_of_present_illness?: string;

  @Column({ type: 'text', nullable: true })
  medical_history?: string;

  @Column({ type: 'text', nullable: true })
  dental_history?: string;

  @Column({ type: 'text', nullable: true })
  examination_findings?: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  treatment_rendered?: string;

  @Column({ type: 'text', nullable: true })
  treatment_plan?: string;

  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Column({ type: 'text', nullable: true })
  follow_up_instructions?: string;

  @Column({ type: 'text', nullable: true })
  additional_notes?: string;

  // Clinical data
  @Column({ type: 'jsonb', default: '{}' })
  vital_signs?: Record<string, any>; // Blood pressure, temperature, etc.

  @Column({ type: 'jsonb', default: '[]' })
  medications?: Record<string, any>[]; // Current medications

  @Column({ type: 'jsonb', default: '[]' })
  allergies?: string[]; // Known allergies

  @Column({ type: 'jsonb', default: '[]' })
  procedures_performed?: Record<string, any>[]; // Procedures done during visit

  // Digital signatures and amendments
  @Column({ type: 'text', nullable: true })
  provider_signature?: string;

  @Column({ type: 'timestamptz', nullable: true })
  signed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  amended_by?: string;

  @Column({ type: 'timestamptz', nullable: true })
  amended_at?: Date;

  @Column({ type: 'text', nullable: true })
  amendment_reason?: string;

  // Audit
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'amended_by' })
  amended_by_user?: User;

  @OneToMany(() => TreatmentPlan, treatmentPlan => treatmentPlan.clinical_note)
  treatment_plans: TreatmentPlan[];
}
