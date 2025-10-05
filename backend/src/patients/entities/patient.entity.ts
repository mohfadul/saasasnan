import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { PatientInsurance } from '../../billing/entities/patient-insurance.entity';

@Entity('patients')
export class Patient extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  // Encrypted PHI fields
  @Column({ type: 'bytea' })
  encrypted_demographics: Buffer;

  @Column({ length: 100, nullable: true })
  demographics_key_id?: string;

  // Non-PHI fields
  @Column({ length: 100, nullable: true })
  patient_external_id?: string;

  @Column('jsonb', { default: [] })
  tags: string[];

  @Column('jsonb', { default: {} })
  consent_flags: Record<string, any>;

  @Column('jsonb', { default: {} })
  medical_alert_flags: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  last_visit_at?: Date;

  // Audit fields
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => Tenant, tenant => tenant.patients)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, user => user.created_patients)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @OneToMany(() => PatientInsurance, insurance => insurance.patient)
  insurances: PatientInsurance[];
}
