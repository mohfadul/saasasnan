import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum MetricType {
  APPOINTMENT = 'appointment',
  REVENUE = 'revenue',
  PATIENT = 'patient',
  PROVIDER = 'provider',
  INVENTORY = 'inventory',
  CLINICAL = 'clinical',
  OPERATIONAL = 'operational',
}

export enum MetricCategory {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  REAL_TIME = 'real_time',
}

export enum MetricStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  PROCESSING = 'processing',
}

@Entity('analytics_metrics')
export class AnalyticsMetric extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  clinic_id?: string;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  metric_type: MetricType;

  @Column({
    type: 'enum',
    enum: MetricCategory,
  })
  metric_category: MetricCategory;

  @Column({ type: 'varchar', length: 100 })
  metric_name: string;

  @Column({ type: 'varchar', length: 255 })
  metric_description: string;

  @Column({ type: 'jsonb' })
  metric_data: Record<string, any>;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  numeric_value?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'date' })
  metric_date: Date;

  @Column({ type: 'timestamp' })
  calculated_at: Date;

  @Column({
    type: 'enum',
    enum: MetricStatus,
    default: MetricStatus.ACTIVE,
  })
  status: MetricStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  comparison_data?: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  growth_rate?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  trend_direction?: number; // -1 (down), 0 (stable), 1 (up)

  @Column({ type: 'jsonb', nullable: true })
  breakdown_data?: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
