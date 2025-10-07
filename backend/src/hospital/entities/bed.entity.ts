import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hospital_beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  clinic_id: string;

  @Column()
  department_id: string;

  @Column()
  bed_number: string;

  @Column()
  bed_type: string; // ICU, general, private, etc.

  @Column({ type: 'enum', enum: ['available', 'occupied', 'maintenance', 'reserved'], default: 'available' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_per_day: number;

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  room_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

