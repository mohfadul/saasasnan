import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

export enum MetricStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

@Entity('metrics')
@Index(['tenant_id', 'name', 'timestamp'])
@Index(['tenant_id', 'status', 'timestamp'])
export class Metric extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  type: MetricType;

  @Column({
    type: 'enum',
    enum: MetricStatus,
    default: MetricStatus.ACTIVE,
  })
  status: MetricStatus;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  value: number;

  @Column({ type: 'json', nullable: true })
  labels?: Record<string, string>;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
