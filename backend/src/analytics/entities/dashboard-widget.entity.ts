import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AnalyticsDashboard } from './analytics-dashboard.entity';

export enum WidgetType {
  CHART = 'chart',
  KPI = 'kpi',
  TABLE = 'table',
  GAUGE = 'gauge',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  SCATTER = 'scatter',
  FUNNEL = 'funnel',
  PIE = 'pie',
  BAR = 'bar',
  LINE = 'line',
  AREA = 'area',
  METRIC = 'metric',
  ALERT = 'alert',
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  SCATTER = 'scatter',
  RADAR = 'radar',
  POLAR = 'polar',
  BUBBLE = 'bubble',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  FUNNEL = 'funnel',
}

@Entity('dashboard_widgets')
export class DashboardWidget extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dashboard_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: WidgetType,
  })
  widget_type: WidgetType;

  @Column({
    type: 'enum',
    enum: ChartType,
    nullable: true,
  })
  chart_type?: ChartType;

  @Column({ type: 'json' })
  widget_config: Record<string, any>;

  @Column({ type: 'json' })
  data_config: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  chart_options?: Record<string, any>;

  @Column({ type: 'integer' })
  position_x: number;

  @Column({ type: 'integer' })
  position_y: number;

  @Column({ type: 'integer' })
  width: number;

  @Column({ type: 'integer' })
  height: number;

  @Column({ type: 'integer', default: 1 })
  min_width: number;

  @Column({ type: 'integer', default: 1 })
  min_height: number;

  @Column({ type: 'boolean', default: true })
  is_resizable: boolean;

  @Column({ type: 'boolean', default: true })
  is_movable: boolean;

  @Column({ type: 'boolean', default: false })
  is_hidden: boolean;

  @Column({ type: 'json', nullable: true })
  filters?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  drill_down_config?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  last_updated_at?: Date;

  @Column({ type: 'json', nullable: true })
  cache_settings?: Record<string, any>;

  @Column({ type: 'integer', default: 300 }) // seconds
  cache_ttl: number;

  @Column({ type: 'json', nullable: true })
  alert_config?: Record<string, any>;

  @ManyToOne(() => AnalyticsDashboard, dashboard => dashboard.widgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: AnalyticsDashboard;
}
