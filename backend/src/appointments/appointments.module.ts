import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AdvancedAppointmentsService } from './advanced-appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentRecurrence } from './entities/appointment-recurrence.entity';
import { AppointmentWaitlist } from './entities/appointment-waitlist.entity';
import { AppointmentConflict } from './entities/appointment-conflict.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentRecurrence,
      AppointmentWaitlist,
      AppointmentConflict,
      Patient,
      User,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AdvancedAppointmentsService],
  exports: [AppointmentsService, AdvancedAppointmentsService],
})
export class AppointmentsModule {}
