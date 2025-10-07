import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('patient_documents')
export class PatientDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column()
  patient_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  file_path: string;

  @Column({ nullable: true })
  file_type: string; // pdf, image, etc.

  @Column({ type: 'int', nullable: true })
  file_size: number; // in bytes

  @Column({ nullable: true })
  uploaded_by: string; // user_id

  @Column({ type: 'enum', enum: ['lab_result', 'prescription', 'scan', 'report', 'consent', 'other'], default: 'other' })
  document_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

