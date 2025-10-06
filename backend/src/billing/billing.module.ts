import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';
import { InsuranceService } from './insurance.service';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from './entities/payment.entity';
import { InsuranceProvider } from './entities/insurance-provider.entity';
import { PatientInsurance } from './entities/patient-insurance.entity';
import { Patient } from '../patients/entities/patient.entity';
// Sudan Payment System
import { PaymentAuditLog } from './entities/payment-audit-log.entity';
import { SudanPaymentsController } from './controllers/sudan-payments.controller';
import { SudanPaymentsService } from './services/sudan-payments.service';
import { PaymentValidationService } from './services/payment-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Payment,
      InsuranceProvider,
      PatientInsurance,
      Patient,
      PaymentAuditLog, // Sudan Payment System
    ]),
  ],
  controllers: [
    BillingController,
    SudanPaymentsController, // Sudan Payment System
  ],
  providers: [
    BillingService,
    InvoicesService,
    PaymentsService,
    InsuranceService,
    SudanPaymentsService, // Sudan Payment System
    PaymentValidationService, // Sudan Payment System
  ],
  exports: [
    BillingService,
    InvoicesService,
    PaymentsService,
    InsuranceService,
    SudanPaymentsService, // Sudan Payment System
  ],
})
export class BillingModule {}
