import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { MLService } from './ml-service';
import { InsightsService } from './insights.service';

// AI Entities
import { AIModel } from './entities/ai-model.entity';
import { AIPrediction } from './entities/ai-prediction.entity';
import { AIInsight } from './entities/ai-insight.entity';
import { AIAutomation, AIAutomationExecution } from './entities/ai-automation.entity';

// Related Entities for AI Operations
import { Appointment } from '../appointments/entities/appointment.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Patient } from '../patients/entities/patient.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // AI entities
      AIModel,
      AIPrediction,
      AIInsight,
      AIAutomation,
      AIAutomationExecution,
      
      // Related entities for AI operations
      Appointment,
      Invoice,
      Patient,
    ]),
    AnalyticsModule,
  ],
  controllers: [AIController],
  providers: [MLService, InsightsService],
  exports: [MLService, InsightsService],
})
export class AIModule {}
