import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalController } from './clinical.controller';
import { ClinicalNotesService } from './clinical-notes.service';
import { ClinicalNote } from './entities/clinical-note.entity';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { TreatmentPlanItem } from './entities/treatment-plan-item.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalNote,
      TreatmentPlan,
      TreatmentPlanItem,
      Patient,
      Appointment,
      User,
    ]),
  ],
  controllers: [ClinicalController],
  providers: [ClinicalNotesService],
  exports: [ClinicalNotesService],
})
export class ClinicalModule {}
