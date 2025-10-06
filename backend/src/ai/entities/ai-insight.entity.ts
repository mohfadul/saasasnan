import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum InsightType {
  PERFORMANCE = 'performance',
  OPPORTUNITY = 'opportunity',
  RISK = 'risk',
  TREND = 'trend',
  RECOMMENDATION = 'recommendation',
  ANOMALY = 'anomaly',
  PATTERN = 'pattern',
  FORECAST = 'forecast',
}

export enum InsightCategory {
  APPOINTMENT = 'appointment',
  REVENUE = 'revenue',
  PATIENT = 'patient',
  PROVIDER = 'provider',
  CLINICAL = 'clinical',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  MARKETING = 'marketing',
}

export enum InsightPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum InsightStatus {
  NEW = 'new',
  REVIEWED = 'reviewed',
  ACTED_ON = 'acted_on',
  DISMISSED = 'dismissed',
  ARCHIVED = 'archived',
}

@Entity('ai_insights')
export class AIInsight extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  clinic_id?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: InsightType,
  })
  insight_type: InsightType;

  @Column({
    type: 'enum',
    enum: InsightCategory,
  })
  category: InsightCategory;

  @Column({
    type: 'enum',
    enum: InsightPriority,
    default: InsightPriority.MEDIUM,
  })
  priority: InsightPriority;

  @Column({
    type: 'enum',
    enum: InsightStatus,
    default: InsightStatus.NEW,
  })
  status: InsightStatus;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  confidence_score?: number;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  impact_score?: number;

  @Column({ type: 'json' })
  data_points: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  recommendations?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  supporting_evidence?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  related_metrics?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  detected_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewed_by?: string;

  @Column({ type: 'text', nullable: true })
  review_notes?: string;

  @Column({ type: 'json', nullable: true })
  action_taken?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  action_taken_at?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  action_taken_by?: string;

  @Column({ type: 'boolean', default: false })
  is_automated: boolean;

  @Column({ type: 'boolean', default: false })
  requires_human_review: boolean;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'integer', default: 30 }) // days
  auto_archive_days: number;

  @Column({ type: 'timestamp', nullable: true })
  auto_archive_at?: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
