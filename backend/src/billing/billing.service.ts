import { Injectable } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';
import { InsuranceService } from './insurance.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly paymentsService: PaymentsService,
    private readonly insuranceService: InsuranceService,
  ) {}

  async getOverview(tenantId: string): Promise<any> {
    // Get invoice stats
    const invoiceStats = await this.invoicesService.getInvoiceStats(tenantId);
    
    // Get payment stats
    const paymentStats = await this.paymentsService.getPaymentStats(tenantId);
    
    // Get insurance stats
    const insuranceStats = await this.insuranceService.getInsuranceStats(tenantId);
    
    // Get overdue invoices
    const overdueInvoices = await this.invoicesService.getOverdueInvoices(tenantId);

    return {
      invoices: invoiceStats,
      payments: paymentStats,
      insurance: insuranceStats,
      overdueInvoices: overdueInvoices.length,
      summary: {
        totalRevenue: invoiceStats.totalRevenue,
        outstandingAmount: invoiceStats.outstandingAmount,
        totalPayments: paymentStats.totalPayments,
        overdueCount: overdueInvoices.length,
        collectionRate: invoiceStats.totalInvoices > 0 
          ? ((invoiceStats.totalRevenue / (invoiceStats.totalRevenue + invoiceStats.outstandingAmount)) * 100).toFixed(2)
          : 0,
      },
    };
  }
}
