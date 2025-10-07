import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',  // Renamed from clinic_admin
  DENTIST = 'dentist',
  DOCTOR = 'doctor',                  // New role
  PHARMACIST = 'pharmacist',          // New role
  STAFF = 'staff',
  SUPPLIER = 'supplier',
  PATIENT = 'patient',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  clinic_id?: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  encrypted_password?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({ length: 100, nullable: true })
  first_name?: string;

  @Column({ length: 100, nullable: true })
  last_name?: string;

  @Column({ length: 50, nullable: true })
  phone?: string;

  @Column({ default: false })
  mfa_enabled: boolean;

  @Column({ length: 100, nullable: true })
  mfa_secret?: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  account_locked_until?: Date;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => Patient, patient => patient.created_by_user)
  created_patients: Patient[];
}
