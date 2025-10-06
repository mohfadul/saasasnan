import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum ModelType {
  PREDICTIVE = 'predictive',
  CLASSIFICATION = 'classification',
  REGRESSION = 'regression',
  CLUSTERING = 'clustering',
  NLP = 'nlp',
  COMPUTER_VISION = 'computer_vision',
  RECOMMENDATION = 'recommendation',
}

export enum ModelStatus {
  TRAINING = 'training',
  TRAINED = 'trained',
  DEPLOYED = 'deployed',
  DEPRECATED = 'deprecated',
  FAILED = 'failed',
}

export enum ModelCategory {
  APPOINTMENT_PREDICTION = 'appointment_prediction',
  REVENUE_FORECASTING = 'revenue_forecasting',
  PATIENT_OUTCOME = 'patient_outcome',
  NO_SHOW_PREDICTION = 'no_show_prediction',
  TREATMENT_RECOMMENDATION = 'treatment_recommendation',
  BILLING_OPTIMIZATION = 'billing_optimization',
  CLINICAL_INSIGHTS = 'clinical_insights',
  PATIENT_ENGAGEMENT = 'patient_engagement',
}

@Entity('ai_models')
export class AIModel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  model_name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ModelType,
  })
  model_type: ModelType;

  @Column({
    type: 'enum',
    enum: ModelCategory,
  })
  model_category: ModelCategory;

  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.TRAINING,
  })
  status: ModelStatus;

  @Column({ type: 'varchar', length: 100 })
  algorithm: string; // e.g., 'random_forest', 'neural_network', 'linear_regression'

  @Column({ type: 'varchar', length: 255, nullable: true })
  model_file_path?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model_version: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  accuracy?: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  precision?: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  recall?: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  f1_score?: number;

  @Column({ type: 'json' })
  model_config: Record<string, any>;

  @Column({ type: 'json' })
  training_data_config: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  feature_importance?: Record<string, any>;

  @Column({ type: 'integer', nullable: true })
  training_samples?: number;

  @Column({ type: 'integer', nullable: true })
  validation_samples?: number;

  @Column({ type: 'integer', nullable: true })
  test_samples?: number;

  @Column({ type: 'timestamp', nullable: true })
  last_trained_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_deployed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_retrain_at?: Date;

  @Column({ type: 'integer', default: 30 }) // days
  retrain_frequency: number;

  @Column({ type: 'boolean', default: true })
  auto_retrain: boolean;

  @Column({ type: 'json', nullable: true })
  performance_metrics?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  deployment_config?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  monitoring_config?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_production: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
