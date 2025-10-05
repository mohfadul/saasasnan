import { IsString, IsDateString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Clinic ID' })
  @IsUUID()
  clinicId: string;

  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Provider ID' })
  @IsUUID()
  providerId: string;

  @ApiProperty({ description: 'Appointment start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Appointment end time' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Appointment type' })
  @IsOptional()
  @IsString()
  appointmentType?: string;

  @ApiPropertyOptional({ description: 'Appointment reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Room ID' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Appointment status' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Recurrence pattern' })
  @IsOptional()
  recurrencePattern?: Record<string, any>;
}
