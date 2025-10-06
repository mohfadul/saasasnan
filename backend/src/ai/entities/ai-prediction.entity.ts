import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { AIModel } from './ai-model.entity';

export enum PredictionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum PredictionType {
  APPOINTMENT_NO_SHOW = 'appointment_no_show',
  REVENUE_FORECAST = 'revenue_forecast',
  PATIENT_OUTCOME = 'patient_outcome',
  TREATMENT_SUCCESS = 'treatment_success',
  BILLING_RISK = 'billing_risk',
  PATIENT_ENGAGEMENT = 'patient_engagement',
  PROVIDER_PERFORMANCE = 'provider_performance',
  INVENTORY_DEMAND = 'inventory_demand',
}

@Entity('ai_predictions')
export class AIPrediction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  model_id: string;

  @Column({
    type: 'enum',
    enum: PredictionType,
  })
  prediction_type: PredictionType;

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.PENDING,
  })
  status: PredictionStatus;

  @Column({ type: 'json' })
  input_data: Record<string, any>;

  @Column({ type: 'json' })
  prediction_result: Record<string, any>;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  confidence_score?: number;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  probability_score?: number;

  @Column({ type: 'json', nullable: true })
  feature_contributions?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  explanation?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  predicted_for_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actual_outcome_date?: Date;

  @Column({ type: 'json', nullable: true })
  actual_outcome?: Record<string, any>;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  accuracy_score?: number;

  @Column({ type: 'boolean', default: false })
  is_validated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  validated_at?: Date;

  @Column({ type: 'integer', default: 30 }) // days
  expiry_days: number;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => AIModel)
  @JoinColumn({ name: 'model_id' })
  model: AIModel;
}
