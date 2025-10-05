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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Payment,
      InsuranceProvider,
      PatientInsurance,
      Patient,
    ]),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    InvoicesService,
    PaymentsService,
    InsuranceService,
  ],
  exports: [
    BillingService,
    InvoicesService,
    PaymentsService,
    InsuranceService,
  ],
})
export class BillingModule {}
