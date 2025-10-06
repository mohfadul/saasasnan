import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { PatientInsurance } from '../../billing/entities/patient-insurance.entity';

@Entity('patients')
export class Patient extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  clinic_id: string;

  // Encrypted PHI fields
  @Column({ type: 'longblob' })
  encrypted_demographics: Buffer;

  @Column({ length: 100, nullable: true })
  demographics_key_id?: string;

  // Non-PHI fields
  @Column({ length: 100, nullable: true })
  patient_external_id?: string;

  @Column({ type: 'json', default: '[]' })
  tags: string[];

  @Column({ type: 'json', default: '{}' })
  consent_flags: Record<string, any>;

  @Column({ type: 'json', default: '{}' })
  medical_alert_flags: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  last_visit_at?: Date;

  // Audit fields
  @Column({ type: 'varchar', length: 36, nullable: true })
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
