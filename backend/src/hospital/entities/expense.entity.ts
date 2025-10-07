import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hospital_expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column()
  category: string; // salaries, utilities, supplies, equipment, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  department_id: string;

  @Column({ nullable: true })
  vendor_name: string;

  @Column({ nullable: true })
  receipt_number: string;

  @Column({ nullable: true })
  approved_by: string; // user_id

  @Column({ type: 'enum', enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

