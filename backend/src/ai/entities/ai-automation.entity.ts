import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum AutomationType {
  SCHEDULING = 'scheduling',
  BILLING = 'billing',
  COMMUNICATION = 'communication',
  CLINICAL = 'clinical',
  MARKETING = 'marketing',
  INVENTORY = 'inventory',
  REPORTING = 'reporting',
  NOTIFICATION = 'notification',
}

export enum AutomationTrigger {
  SCHEDULE = 'schedule',
  EVENT = 'event',
  CONDITION = 'condition',
  PREDICTION = 'prediction',
  MANUAL = 'manual',
  API = 'api',
}

export enum AutomationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error',
  DISABLED = 'disabled',
}

export enum AutomationExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

@Entity('ai_automations')
export class AIAutomation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  clinic_id?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AutomationType,
  })
  automation_type: AutomationType;

  @Column({
    type: 'enum',
    enum: AutomationTrigger,
  })
  trigger_type: AutomationTrigger;

  @Column({
    type: 'enum',
    enum: AutomationStatus,
    default: AutomationStatus.ACTIVE,
  })
  status: AutomationStatus;

  @Column({ type: 'jsonb' })
  trigger_config: Record<string, any>;

  @Column({ type: 'jsonb' })
  action_config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  condition_config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  ai_config?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  is_enabled: boolean;

  @Column({ type: 'integer', default: 0 })
  execution_count: number;

  @Column({ type: 'integer', default: 0 })
  success_count: number;

  @Column({ type: 'integer', default: 0 })
  failure_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_executed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_execution_at?: Date;

  @Column({ type: 'integer', default: 0 }) // minutes
  execution_frequency: number;

  @Column({ type: 'boolean', default: false })
  requires_approval: boolean;

  @Column({ type: 'jsonb', nullable: true })
  approval_config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  error_handling_config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  notification_config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'integer', default: 1000 }) // max executions per day
  daily_limit: number;

  @Column({ type: 'integer', default: 0 })
  daily_execution_count: number;

  @Column({ type: 'date', nullable: true })
  daily_count_reset_date?: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

@Entity('ai_automation_executions')
export class AIAutomationExecution extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  automation_id: string;

  @Column({
    type: 'enum',
    enum: AutomationExecutionStatus,
    default: AutomationExecutionStatus.PENDING,
  })
  status: AutomationExecutionStatus;

  @Column({ type: 'jsonb' })
  trigger_data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  execution_data?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result_data?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'integer', nullable: true }) // milliseconds
  execution_time?: number;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'jsonb', nullable: true })
  error_details?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => AIAutomation)
  @JoinColumn({ name: 'automation_id' })
  automation: AIAutomation;
}
