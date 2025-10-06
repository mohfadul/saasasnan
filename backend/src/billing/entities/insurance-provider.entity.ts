import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PatientInsurance } from './patient-insurance.entity';

@Entity('insurance_providers')
export class InsuranceProvider extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ length: 255 })
  name: string;

  @Column('json')
  contact_info: Record<string, any>;

  @Column('json', { default: {} })
  coverage_details: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  copay_percentage: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active',
    enum: ['active', 'inactive', 'suspended']
  })
  status: string;

  @OneToMany(() => PatientInsurance, patientInsurance => patientInsurance.insuranceProvider)
  patientInsurances: PatientInsurance[];
}
