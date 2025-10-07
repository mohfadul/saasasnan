import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blood_bank_inventory')
export class BloodBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column()
  blood_group: string; // A+, A-, B+, B-, AB+, AB-, O+, O-

  @Column({ type: 'int', default: 0 })
  quantity: number; // in units/bags

  @Column({ nullable: true })
  donor_id: string;

  @Column({ type: 'date', nullable: true })
  collection_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'enum', enum: ['available', 'reserved', 'used', 'expired'], default: 'available' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

