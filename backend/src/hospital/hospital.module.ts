import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';
import { DepartmentsService } from './departments.service';
import { BedsService } from './beds.service';
import { BloodBankService } from './blood-bank.service';
import { LabService } from './lab.service';
import { SchedulesService } from './schedules.service';
import { ServicesManagementService } from './services-management.service';
import { FinancialService } from './financial.service';
import { Department } from './entities/department.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { DoctorDayoff } from './entities/doctor-dayoff.entity';
import { Bed } from './entities/bed.entity';
import { BedAllotment } from './entities/bed-allotment.entity';
import { BloodBank } from './entities/blood-bank.entity';
import { Donor } from './entities/donor.entity';
import { LabReport } from './entities/lab-report.entity';
import { LabTemplate } from './entities/lab-template.entity';
import { Service } from './entities/service.entity';
import { ServicePackage } from './entities/service-package.entity';
import { PatientDocument } from './entities/patient-document.entity';
import { Expense } from './entities/expense.entity';
import { FinancialRecord } from './entities/financial-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      DoctorSchedule,
      DoctorDayoff,
      Bed,
      BedAllotment,
      BloodBank,
      Donor,
      LabReport,
      LabTemplate,
      Service,
      ServicePackage,
      PatientDocument,
      Expense,
      FinancialRecord,
    ]),
  ],
  controllers: [HospitalController],
  providers: [
    HospitalService,
    DepartmentsService,
    BedsService,
    BloodBankService,
    LabService,
    SchedulesService,
    ServicesManagementService,
    FinancialService,
  ],
  exports: [
    HospitalService,
    DepartmentsService,
    BedsService,
    BloodBankService,
    LabService,
    SchedulesService,
    ServicesManagementService,
    FinancialService,
  ],
})
export class HospitalModule {}

