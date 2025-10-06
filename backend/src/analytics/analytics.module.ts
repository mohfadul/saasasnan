import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DashboardService } from './dashboard.service';
import { ReportsService } from './reports.service';
import { CacheService } from '../common/services/cache.service';

// Analytics Entities
import { AnalyticsMetric } from './entities/analytics-metric.entity';
import { AnalyticsDashboard } from './entities/analytics-dashboard.entity';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { AnalyticsReport } from './entities/analytics-report.entity';

// Related Entities
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Payment } from '../billing/entities/payment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';
import { ClinicalNote } from '../clinical/entities/clinical-note.entity';
import { TreatmentPlan } from '../clinical/entities/treatment-plan.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Analytics entities
      AnalyticsMetric,
      AnalyticsDashboard,
      DashboardWidget,
      AnalyticsReport,
      
      // Related entities for analytics queries
      Appointment,
      Invoice,
      Payment,
      Patient,
      User,
      ClinicalNote,
      TreatmentPlan,
      Tenant,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DashboardService, ReportsService, CacheService],
  exports: [AnalyticsService, DashboardService, ReportsService],
})
export class AnalyticsModule {}
