import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  subdomain: string;

  @Column('jsonb', { default: {} })
  config: Record<string, any>;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active',
    enum: ['active', 'suspended', 'inactive']
  })
  status: string;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Patient, patient => patient.tenant)
  patients: Patient[];
}
