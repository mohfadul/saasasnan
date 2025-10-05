import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';
import { DashboardWidget } from './dashboard-widget.entity';

export enum DashboardType {
  EXECUTIVE = 'executive',
  OPERATIONAL = 'operational',
  CLINICAL = 'clinical',
  FINANCIAL = 'financial',
  CUSTOM = 'custom',
}

export enum DashboardStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('analytics_dashboards')
export class AnalyticsDashboard extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  clinic_id?: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DashboardType,
  })
  dashboard_type: DashboardType;

  @Column({
    type: 'enum',
    enum: DashboardStatus,
    default: DashboardStatus.ACTIVE,
  })
  status: DashboardStatus;

  @Column({ type: 'jsonb' })
  layout_config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  filters_config?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  refresh_settings?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'boolean', default: true })
  auto_refresh: boolean;

  @Column({ type: 'integer', default: 300 }) // seconds
  refresh_interval: number;

  @Column({ type: 'timestamp', nullable: true })
  last_refreshed_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  sharing_settings?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @OneToMany(() => DashboardWidget, widget => widget.dashboard)
  widgets: DashboardWidget[];
}
