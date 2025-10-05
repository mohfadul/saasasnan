import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { InsuranceProvider } from './insurance-provider.entity';
import { Patient } from '../../patients/entities/patient.entity';

@Entity('patient_insurance')
export class PatientInsurance extends BaseEntity {
  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid' })
  insurance_provider_id: string;

  @Column({ length: 100 })
  policy_number: string;

  @Column({ length: 100, nullable: true })
  group_number?: string;

  @Column({ type: 'date', nullable: true })
  effective_date?: Date;

  @Column({ type: 'date', nullable: true })
  expiration_date?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  copay_amount?: number;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active',
    enum: ['active', 'inactive', 'expired']
  })
  status: string;

  @ManyToOne(() => Patient, patient => patient.insurances)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => InsuranceProvider, provider => provider.patientInsurances)
  @JoinColumn({ name: 'insurance_provider_id' })
  insuranceProvider: InsuranceProvider;
}
