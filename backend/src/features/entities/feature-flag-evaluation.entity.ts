import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FeatureFlag } from './feature-flag.entity';
import { User } from '../../auth/entities/user.entity';

export enum EvaluationContext {
  USER = 'user',
  SESSION = 'session',
  REQUEST = 'request',
  SYSTEM = 'system',
}

@Entity('feature_flag_evaluations')
@Index(['feature_flag_id', 'context_type', 'context_id'], { unique: true })
export class FeatureFlagEvaluation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  feature_flag_id: string;

  @Column({
    type: 'enum',
    enum: EvaluationContext,
  })
  context_type: EvaluationContext;

  @Column({ type: 'varchar', length: 255 })
  context_id: string;

  @Column({ type: 'jsonb' })
  evaluated_value: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  variant?: string;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  rollout_percentage?: number;

  @Column({ type: 'boolean', default: false })
  is_targeted: boolean;

  @Column({ type: 'jsonb', nullable: true })
  targeting_match?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  evaluation_context?: Record<string, any>;

  @Column({ type: 'timestamp' })
  evaluated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => FeatureFlag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_flag_id' })
  feature_flag: FeatureFlag;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'context_id' })
  user?: User;
}
