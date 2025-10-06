import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Appointment } from './appointment.entity';

export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum RecurrenceEndType {
  NEVER = 'never',
  AFTER_COUNT = 'after_count',
  ON_DATE = 'on_date',
}

@Entity('appointment_recurrences')
export class AppointmentRecurrence extends BaseEntity {
  @Column({ type: 'uuid' })
  appointment_id: string;

  @Column({
    type: 'enum',
    enum: RecurrenceType,
  })
  recurrence_type: RecurrenceType;

  @Column({ type: 'integer', default: 1 })
  interval_value: number; // Every X days/weeks/months/years

  @Column({ type: 'integer', nullable: true })
  recurrence_count?: number; // Number of occurrences to create

  @Column({
    type: 'enum',
    enum: RecurrenceEndType,
    default: RecurrenceEndType.NEVER,
  })
  end_type: RecurrenceEndType;

  @Column({ type: 'date', nullable: true })
  end_date?: Date; // End date for recurrence

  @Column({ type: 'json', default: '[]' })
  days_of_week: number[]; // 0-6 (Sunday-Saturday) for weekly recurrence

  @Column({ type: 'json', default: '[]' })
  days_of_month: number[]; // 1-31 for monthly recurrence

  @Column({ type: 'json', default: '[]' })
  months_of_year: number[]; // 1-12 for yearly recurrence

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_generated_at?: Date;

  @ManyToOne(() => Appointment, appointment => appointment.recurrences)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}
