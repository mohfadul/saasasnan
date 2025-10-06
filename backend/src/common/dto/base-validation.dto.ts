import { IsOptional, IsString, Length, Matches, IsEmail, IsPhoneNumber, IsDateString, IsObject, ValidateNested, IsArray, IsEnum, IsUUID, IsBoolean, IsNumber, Min, Max, registerDecorator, ValidationOptions } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class BaseValidationDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.trim())
  id?: string;

  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  created_by?: string;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @IsEnum(['created_at', 'updated_at', 'name', 'status'])
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ContactInfoDto {
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format'
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  state?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  @Transform(({ value }) => value?.trim())
  zip_code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  country?: string;
}

export class DemographicsDto extends ContactInfoDto {
  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'First name must contain only letters, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Last name must contain only letters, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Emergency contact phone must be a valid international format'
  })
  emergency_contact_phone?: string;
}

export class AddressDto {
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value?.trim())
  street: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  street2?: string;

  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  city: string;

  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  state: string;

  @IsString()
  @Length(1, 20)
  @Matches(/^\d{5}(-\d{4})?$/, {
    message: 'ZIP code must be in format 12345 or 12345-6789'
  })
  zip_code: string;

  @IsString()
  @Length(1, 50)
  @Transform(({ value }) => value?.trim())
  country: string = 'USA';
}

export class MedicalInfoDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @IsOptional()
  @IsObject()
  medical_alert_flags?: Record<string, boolean>;
}

export class AppointmentDto {
  @IsString()
  @IsUUID()
  patient_id: string;

  @IsString()
  @IsUUID()
  provider_id: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  appointment_type: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  @Transform(({ value }) => value?.trim())
  reason?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  room_id?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

export class BillingDto {
  @IsString()
  @IsUUID()
  patient_id: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  appointment_id?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export class UserDto extends BaseValidationDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character'
  })
  password: string;

  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'First name must contain only letters, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  first_name: string;

  @IsString()
  @Length(1, 50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Last name must contain only letters, spaces, hyphens, and apostrophes'
  })
  @Transform(({ value }) => value?.trim())
  last_name: string;

  @IsString()
  @IsEnum(['super_admin', 'clinic_admin', 'dentist', 'staff', 'supplier', 'patient'])
  role: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info?: ContactInfoDto;
}

// Custom validation decorators
export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {
        message: 'Phone number must be a valid international format'
      },
      validator: {
        validate(value: any) {
          if (!value) return true; // Optional field
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          return typeof value === 'string' && phoneRegex.test(value);
        }
      }
    });
  };
}

export function IsValidDateOfBirth(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidDateOfBirth',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {
        message: 'Date of birth must be a valid date and person must be at least 0 years old'
      },
      validator: {
        validate(value: any) {
          if (!value) return true; // Optional field
          const date = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - date.getFullYear();
          return !isNaN(date.getTime()) && age >= 0 && age <= 150;
        }
      }
    });
  };
}

