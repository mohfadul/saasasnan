import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Metric, MetricType, MetricStatus } from './entities/metric.entity';
import { Alert, AlertStatus, AlertCondition, AlertSeverity } from './entities/alert.entity';
import { AlertIncident, IncidentStatus } from './entities/alert-incident.entity';

export interface MetricData {
  tenant_id: string;
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  source?: string;
  metadata?: Record<string, any>;
}

export interface AlertEvaluationResult {
  alert_id: string;
  should_trigger: boolean;
  current_value: number;
  threshold_value: number;
  condition: AlertCondition;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(AlertIncident)
    private incidentRepository: Repository<AlertIncident>,
  ) {}

  // Metric Collection
  async recordMetric(metricData: MetricData): Promise<Metric> {
    const metric = this.metricRepository.create({
      ...metricData,
      timestamp: new Date(),
      status: MetricStatus.ACTIVE,
    });

    return await this.metricRepository.save(metric);
  }

  async recordMetrics(metricsData: MetricData[]): Promise<Metric[]> {
    const metrics = metricsData.map(data => this.metricRepository.create({
      ...data,
      timestamp: new Date(),
      status: MetricStatus.ACTIVE,
    }));

    return await this.metricRepository.save(metrics);
  }

  // Metric Retrieval
  async getMetrics(
    tenantId: string,
    name?: string,
    startDate?: Date,
    endDate?: Date,
    labels?: Record<string, string>,
  ): Promise<Metric[]> {
    const query = this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.tenant_id = :tenantId', { tenantId })
      .andWhere('metric.status = :status', { status: MetricStatus.ACTIVE });

    if (name) {
      query.andWhere('metric.name = :name', { name });
    }

    if (startDate && endDate) {
      query.andWhere('metric.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    if (labels) {
      for (const [key, value] of Object.entries(labels)) {
        query.andWhere(`metric.labels->>:key = :value`, { key, value });
      }
    }

    return await query
      .orderBy('metric.timestamp', 'DESC')
      .getMany();
  }

  async getMetricAggregation(
    tenantId: string,
    name: string,
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count',
    startDate: Date,
    endDate: Date,
    groupBy?: string,
  ): Promise<any[]> {
    const query = this.metricRepository
      .createQueryBuilder('metric')
      .select([
        `metric.${aggregation === 'avg' ? 'AVG' : aggregation.toUpperCase()}(value) as value`,
        'metric.timestamp',
      ])
      .where('metric.tenant_id = :tenantId', { tenantId })
      .andWhere('metric.name = :name', { name })
      .andWhere('metric.status = :status', { status: MetricStatus.ACTIVE })
      .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (groupBy === 'hour') {
      query.addSelect('DATE_TRUNC(\'hour\', metric.timestamp) as period');
      query.groupBy('DATE_TRUNC(\'hour\', metric.timestamp)');
    } else if (groupBy === 'day') {
      query.addSelect('DATE_TRUNC(\'day\', metric.timestamp) as period');
      query.groupBy('DATE_TRUNC(\'day\', metric.timestamp)');
    } else if (groupBy === 'week') {
      query.addSelect('DATE_TRUNC(\'week\', metric.timestamp) as period');
      query.groupBy('DATE_TRUNC(\'week\', metric.timestamp)');
    }

    return await query
      .orderBy('period', 'ASC')
      .getRawMany();
  }

  // Alert Management
  async createAlert(
    tenantId: string,
    alertData: {
      name: string;
      description?: string;
      metric_name: string;
      condition: AlertCondition;
      threshold: number;
      severity: AlertSeverity;
      evaluation_interval_seconds?: number;
      cooldown_seconds?: number;
      labels_filter?: Record<string, string>;
      notification_channels: Record<string, any>;
      message_template?: string;
    },
  ): Promise<Alert> {
    const alert = this.alertRepository.create({
      tenant_id: tenantId,
      ...alertData,
      status: AlertStatus.ACTIVE,
      enabled: true,
      trigger_count: 0,
    });

    return await this.alertRepository.save(alert);
  }

  async updateAlert(
    alertId: string,
    tenantId: string,
    updateData: Partial<Alert>,
  ): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, tenant_id: tenantId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    Object.assign(alert, updateData);
    return await this.alertRepository.save(alert);
  }

  async deleteAlert(alertId: string, tenantId: string): Promise<void> {
    await this.alertRepository.delete({ id: alertId, tenant_id: tenantId });
  }

  async getAlerts(
    tenantId: string,
    status?: AlertStatus,
    enabled?: boolean,
  ): Promise<Alert[]> {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.tenant_id = :tenantId', { tenantId });

    if (status) {
      query.andWhere('alert.status = :status', { status });
    }

    if (enabled !== undefined) {
      query.andWhere('alert.enabled = :enabled', { enabled });
    }

    return await query
      .orderBy('alert.created_at', 'DESC')
      .getMany();
  }

  // Alert Evaluation
  async evaluateAlerts(tenantId: string): Promise<AlertEvaluationResult[]> {
    const activeAlerts = await this.alertRepository.find({
      where: {
        tenant_id: tenantId,
        status: AlertStatus.ACTIVE,
        enabled: true,
      },
    });

    const results: AlertEvaluationResult[] = [];

    for (const alert of activeAlerts) {
      try {
        const evaluation = await this.evaluateAlert(alert);
        results.push(evaluation);

        if (evaluation.should_trigger) {
          await this.handleAlertTrigger(alert, evaluation);
        }
      } catch (error) {
        this.logger.error(`Error evaluating alert ${alert.id}:`, error);
      }
    }

    return results;
  }

  private async evaluateAlert(alert: Alert): Promise<AlertEvaluationResult> {
    // Get the latest metric value for the alert's metric
    const latestMetric = await this.metricRepository.findOne({
      where: {
        tenant_id: alert.tenant_id,
        name: alert.metric_name,
        status: MetricStatus.ACTIVE,
      },
      order: { timestamp: 'DESC' },
    });

    if (!latestMetric) {
      return {
        alert_id: alert.id,
        should_trigger: false,
        current_value: 0,
        threshold_value: alert.threshold,
        condition: alert.condition,
      };
    }

    // Check if alert is in cooldown period
    if (alert.last_triggered_at && alert.cooldown_seconds > 0) {
      const cooldownEnd = new Date(alert.last_triggered_at.getTime() + alert.cooldown_seconds * 1000);
      if (new Date() < cooldownEnd) {
        return {
          alert_id: alert.id,
          should_trigger: false,
          current_value: latestMetric.value,
          threshold_value: alert.threshold,
          condition: alert.condition,
        };
      }
    }

    // Evaluate condition
    const shouldTrigger = this.evaluateCondition(
      latestMetric.value,
      alert.threshold,
      alert.condition,
    );

    return {
      alert_id: alert.id,
      should_trigger: shouldTrigger,
      current_value: latestMetric.value,
      threshold_value: alert.threshold,
      condition: alert.condition,
    };
  }

  private evaluateCondition(
    currentValue: number,
    thresholdValue: number,
    condition: AlertCondition,
  ): boolean {
    switch (condition) {
      case AlertCondition.GREATER_THAN:
        return currentValue > thresholdValue;
      case AlertCondition.GREATER_THAN_OR_EQUAL:
        return currentValue >= thresholdValue;
      case AlertCondition.LESS_THAN:
        return currentValue < thresholdValue;
      case AlertCondition.LESS_THAN_OR_EQUAL:
        return currentValue <= thresholdValue;
      case AlertCondition.EQUALS:
        return currentValue === thresholdValue;
      case AlertCondition.NOT_EQUALS:
        return currentValue !== thresholdValue;
      default:
        return false;
    }
  }

  private async handleAlertTrigger(alert: Alert, evaluation: AlertEvaluationResult): Promise<void> {
    // Create incident
    const incident = this.incidentRepository.create({
      alert_id: alert.id,
      severity: alert.severity as any,
      title: `${alert.name} - Threshold Exceeded`,
      description: `${alert.metric_name} ${this.getConditionDescription(alert.condition)} ${alert.threshold}. Current value: ${evaluation.current_value}`,
      triggered_at: new Date(),
      trigger_value: evaluation.current_value,
      threshold_value: alert.threshold,
      context_data: {
        metric_name: alert.metric_name,
        condition: alert.condition,
        labels_filter: alert.labels_filter,
      },
    });

    await this.incidentRepository.save(incident);

    // Update alert
    alert.status = AlertStatus.TRIGGERED;
    alert.last_triggered_at = new Date();
    alert.trigger_count += 1;
    await this.alertRepository.save(alert);

    // Send notifications
    await this.sendNotifications(alert, incident);

    this.logger.log(`Alert triggered: ${alert.name} (${alert.id})`);
  }

  private getConditionDescription(condition: AlertCondition): string {
    switch (condition) {
      case AlertCondition.GREATER_THAN:
        return 'is greater than';
      case AlertCondition.GREATER_THAN_OR_EQUAL:
        return 'is greater than or equal to';
      case AlertCondition.LESS_THAN:
        return 'is less than';
      case AlertCondition.LESS_THAN_OR_EQUAL:
        return 'is less than or equal to';
      case AlertCondition.EQUALS:
        return 'equals';
      case AlertCondition.NOT_EQUALS:
        return 'does not equal';
      default:
        return 'meets condition';
    }
  }

  private async sendNotifications(alert: Alert, incident: AlertIncident): Promise<void> {
    const channels = alert.notification_channels;
    const message = this.formatNotificationMessage(alert, incident);

    // Email notifications
    if (channels.email && channels.email.enabled) {
      await this.sendEmailNotification(channels.email, message);
    }

    // Slack notifications
    if (channels.slack && channels.slack.enabled) {
      await this.sendSlackNotification(channels.slack, message);
    }

    // Webhook notifications
    if (channels.webhook && channels.webhook.enabled) {
      await this.sendWebhookNotification(channels.webhook, message);
    }
  }

  private formatNotificationMessage(alert: Alert, incident: AlertIncident): string {
    const template = alert.message_template || `
🚨 **${alert.name}**

**Severity:** ${alert.severity.toUpperCase()}
**Metric:** ${alert.metric_name}
**Current Value:** ${incident.trigger_value}
**Threshold:** ${incident.threshold_value}
**Condition:** ${this.getConditionDescription(alert.condition)}
**Time:** ${incident.triggered_at.toISOString()}

${alert.description || ''}
    `;

    return template.trim();
  }

  private async sendEmailNotification(emailConfig: any, message: string): Promise<void> {
    // Implementation would depend on your email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Email notification sent to ${emailConfig.recipients}: ${message}`);
  }

  private async sendSlackNotification(slackConfig: any, message: string): Promise<void> {
    // Implementation would depend on your Slack integration
    this.logger.log(`Slack notification sent to ${slackConfig.channel}: ${message}`);
  }

  private async sendWebhookNotification(webhookConfig: any, message: string): Promise<void> {
    // Implementation would depend on your webhook service
    this.logger.log(`Webhook notification sent to ${webhookConfig.url}: ${message}`);
  }

  // Incident Management
  async acknowledgeIncident(
    incidentId: string,
    userId: string,
    notes?: string,
  ): Promise<AlertIncident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.status = IncidentStatus.ACKNOWLEDGED;
    incident.acknowledged_at = new Date();
    incident.acknowledged_by = userId;

    if (notes) {
      incident.resolution_notes = notes;
    }

    return await this.incidentRepository.save(incident);
  }

  async resolveIncident(
    incidentId: string,
    userId: string,
    resolutionNotes?: string,
  ): Promise<AlertIncident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.status = IncidentStatus.RESOLVED;
    incident.resolved_at = new Date();
    incident.resolved_by = userId;

    if (resolutionNotes) {
      incident.resolution_notes = resolutionNotes;
    }

    const updatedIncident = await this.incidentRepository.save(incident);

    // Update alert status
    const alert = await this.alertRepository.findOne({
      where: { id: incident.alert_id },
    });

    if (alert) {
      alert.status = AlertStatus.ACTIVE;
      alert.last_resolved_at = new Date();
      await this.alertRepository.save(alert);
    }

    return updatedIncident;
  }

  async getIncidents(
    tenantId: string,
    status?: IncidentStatus,
    severity?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AlertIncident[]> {
    const query = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.alert', 'alert')
      .where('alert.tenant_id = :tenantId', { tenantId });

    if (status) {
      query.andWhere('incident.status = :status', { status });
    }

    if (severity) {
      query.andWhere('incident.severity = :severity', { severity });
    }

    if (startDate && endDate) {
      query.andWhere('incident.triggered_at BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return await query
      .orderBy('incident.triggered_at', 'DESC')
      .getMany();
  }

  // Health Checks
  async performHealthCheck(tenantId: string): Promise<any> {
    const checks = {
      database: await this.checkDatabaseHealth(),
      metrics: await this.checkMetricsHealth(tenantId),
      alerts: await this.checkAlertsHealth(tenantId),
      incidents: await this.checkIncidentsHealth(tenantId),
    };

    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks,
    };
  }

  private async checkDatabaseHealth(): Promise<any> {
    try {
      await this.metricRepository.query('SELECT 1');
      return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Database connection failed', error: error.message };
    }
  }

  private async checkMetricsHealth(tenantId: string): Promise<any> {
    try {
      const recentMetrics = await this.metricRepository.count({
        where: {
          tenant_id: tenantId,
          timestamp: Between(
            new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
            new Date(),
          ),
        },
      });

      return {
        status: recentMetrics > 0 ? 'healthy' : 'warning',
        message: `${recentMetrics} metrics received in last 5 minutes`,
        count: recentMetrics,
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Metrics check failed', error: error.message };
    }
  }

  private async checkAlertsHealth(tenantId: string): Promise<any> {
    try {
      const activeAlerts = await this.alertRepository.count({
        where: { tenant_id: tenantId, status: AlertStatus.ACTIVE, enabled: true },
      });

      const triggeredAlerts = await this.alertRepository.count({
        where: { tenant_id: tenantId, status: AlertStatus.TRIGGERED },
      });

      return {
        status: 'healthy',
        message: `${activeAlerts} active alerts, ${triggeredAlerts} triggered`,
        active_count: activeAlerts,
        triggered_count: triggeredAlerts,
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Alerts check failed', error: error.message };
    }
  }

  private async checkIncidentsHealth(tenantId: string): Promise<any> {
    try {
      const openIncidents = await this.incidentRepository
        .createQueryBuilder('incident')
        .leftJoin('incident.alert', 'alert')
        .where('alert.tenant_id = :tenantId', { tenantId })
        .andWhere('incident.status IN (:...statuses)', { statuses: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED] })
        .getCount();

      return {
        status: openIncidents === 0 ? 'healthy' : 'warning',
        message: `${openIncidents} open incidents`,
        open_count: openIncidents,
      };
    } catch (error) {
      return { status: 'unhealthy', message: 'Incidents check failed', error: error.message };
    }
  }
}
