import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('financial_records')
export class FinancialRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  income: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expense: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  net_balance: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  recorded_by: string; // user_id

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

