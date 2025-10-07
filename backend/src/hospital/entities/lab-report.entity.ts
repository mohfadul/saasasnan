import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('lab_reports')
export class LabReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column()
  patient_id: string;

  @Column()
  template_id: string;

  @Column({ nullable: true })
  doctor_id: string;

  @Column({ nullable: true })
  lab_technician_id: string;

  @Column({ type: 'json', nullable: true })
  test_results: any; // Actual test results

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'date' })
  test_date: Date;

  @Column({ type: 'date', nullable: true })
  result_date: Date;

  @Column({ type: 'enum', enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

