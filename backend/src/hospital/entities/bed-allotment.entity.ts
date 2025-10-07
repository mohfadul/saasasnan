import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bed_allotments')
export class BedAllotment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column()
  bed_id: string;

  @Column()
  patient_id: string;

  @Column({ type: 'timestamp' })
  allotment_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  discharge_date: Date;

  @Column({ type: 'enum', enum: ['active', 'discharged', 'transferred'], default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  assigned_by: string; // user_id who assigned

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

