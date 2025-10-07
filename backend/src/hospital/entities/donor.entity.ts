import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blood_donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  blood_group: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  last_donation_date: Date;

  @Column({ type: 'int', default: 0 })
  total_donations: number;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'blacklisted'], default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  medical_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

