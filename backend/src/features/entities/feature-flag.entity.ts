import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  STRING = 'string',
  NUMBER = 'number',
  JSON = 'json',
}

export enum FeatureFlagStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum FeatureFlagRolloutStrategy {
  IMMEDIATE = 'immediate',
  GRADUAL = 'gradual',
  PERCENTAGE = 'percentage',
  TARGETED = 'targeted',
  A_B_TEST = 'a_b_test',
}

@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FeatureFlagType,
    default: FeatureFlagType.BOOLEAN,
  })
  type: FeatureFlagType;

  @Column({
    type: 'enum',
    enum: FeatureFlagStatus,
    default: FeatureFlagStatus.DRAFT,
  })
  status: FeatureFlagStatus;

  @Column({
    type: 'enum',
    enum: FeatureFlagRolloutStrategy,
    default: FeatureFlagRolloutStrategy.IMMEDIATE,
  })
  rollout_strategy: FeatureFlagRolloutStrategy;

  @Column({ type: 'jsonb' })
  default_value: any;

  @Column({ type: 'jsonb' })
  rollout_config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  targeting_rules?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  variants?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_experiment: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  experiment_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  experiment_config?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'integer', default: 0 })
  evaluation_count: number;

  @Column({ type: 'integer', default: 0 })
  positive_evaluations: number;

  @Column({ type: 'jsonb', nullable: true })
  metrics?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  requires_approval: boolean;

  @Column({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
