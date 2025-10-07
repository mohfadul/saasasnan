import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('doctor_dayoffs')
export class DoctorDayoff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  doctor_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ default: 'approved' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}

