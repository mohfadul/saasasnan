import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsUUID, Matches, Min, MaxLength } from 'class-validator';
import { PaymentProvider, PaymentMethod } from '../entities/payment.entity';

export class CreateSudanPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  invoice_id: string;

  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reference_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  payer_name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+2499[0-9]{8}$/, {
    message: 'Wallet phone must be a valid Sudan mobile number (e.g., +249912345678)',
  })
  wallet_phone?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  receipt_url?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePaymentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  payer_name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+2499[0-9]{8}$/, {
    message: 'Wallet phone must be a valid Sudan mobile number (e.g., +249912345678)',
  })
  wallet_phone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  receipt_url?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConfirmPaymentDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  admin_notes?: string;
}

export class RejectPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string; // Reason for rejection (required)
}

export class PaymentQueryDto {
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  payer_name?: string;

  @IsOptional()
  @IsString()
  reference_id?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}

