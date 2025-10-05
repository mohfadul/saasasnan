import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';

export enum ReportType {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  CLINICAL = 'clinical',
  PATIENT = 'patient',
  PROVIDER = 'provider',
  APPOINTMENT = 'appointment',
  INVENTORY = 'inventory',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ReportFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('analytics_reports')
export class AnalyticsReport extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  clinic_id?: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'varchar', length: 255 })
  report_name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  report_type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportFormat,
  })
  report_format: ReportFormat;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({
    type: 'enum',
    enum: ReportFrequency,
    default: ReportFrequency.ONCE,
  })
  frequency: ReportFrequency;

  @Column({ type: 'jsonb' })
  report_config: Record<string, any>;

  @Column({ type: 'jsonb' })
  filters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  schedule_config?: Record<string, any>;

  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  generated_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'integer', nullable: true })
  file_size?: number; // bytes

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_path?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  download_url?: string;

  @Column({ type: 'integer', default: 0 })
  download_count: number;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'jsonb', nullable: true })
  recipient_list?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'boolean', default: true })
  auto_delete: boolean;

  @Column({ type: 'integer', default: 30 }) // days
  retention_days: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;
}
