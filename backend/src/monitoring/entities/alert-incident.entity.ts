import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Alert } from './alert.entity';

export enum IncidentStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('alert_incidents')
export class AlertIncident extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  alert_id: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
  })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
  })
  severity: IncidentSeverity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  triggered_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledged_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  acknowledged_by?: string;

  @Column({ type: 'uuid', nullable: true })
  resolved_by?: string;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  trigger_value: number;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  threshold_value: number;

  @Column({ type: 'json', nullable: true })
  context_data?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  resolution_notes?: string;

  @Column({ type: 'json', nullable: true })
  notification_log?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Alert)
  @JoinColumn({ name: 'alert_id' })
  alert: Alert;
}
