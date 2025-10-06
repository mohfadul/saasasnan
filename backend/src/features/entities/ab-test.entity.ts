import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ABTestType {
  CONVERSION = 'conversion',
  ENGAGEMENT = 'engagement',
  PERFORMANCE = 'performance',
  UX = 'ux',
  FEATURE = 'feature',
}

export enum ABTestTrafficSplit {
  EQUAL = 'equal',
  CUSTOM = 'custom',
  WEIGHTED = 'weighted',
}

@Entity('ab_tests')
export class ABTest extends BaseEntity {
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
    enum: ABTestType,
  })
  test_type: ABTestType;

  @Column({
    type: 'enum',
    enum: ABTestStatus,
    default: ABTestStatus.DRAFT,
  })
  status: ABTestStatus;

  @Column({
    type: 'enum',
    enum: ABTestTrafficSplit,
    default: ABTestTrafficSplit.EQUAL,
  })
  traffic_split: ABTestTrafficSplit;

  @Column({ type: 'json' })
  variants: Record<string, any>;

  @Column({ type: 'json' })
  traffic_allocation: Record<string, number>;

  @Column({ type: 'json', nullable: true })
  targeting_rules?: Record<string, any>;

  @Column({ type: 'json' })
  success_metrics: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.05 })
  significance_level: number;

  @Column({ type: 'integer', nullable: true })
  minimum_sample_size?: number;

  @Column({ type: 'integer', nullable: true })
  maximum_duration_days?: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  planned_end_date?: Date;

  @Column({ type: 'json' })
  results: {
    total_participants: number;
    variant_stats: Record<string, {
      participants: number;
      conversions: number;
      conversion_rate: number;
      confidence_interval: [number, number];
      is_winner: boolean;
      statistical_significance: number;
    }>;
    winner?: string;
    is_statistically_significant: boolean;
    test_duration_days: number;
  };

  @Column({ type: 'boolean', default: false })
  auto_stop_on_significance: boolean;

  @Column({ type: 'boolean', default: false })
  auto_apply_winner: boolean;

  @Column({ type: 'json', nullable: true })
  experiment_config?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
