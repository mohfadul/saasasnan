import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentProvider } from '../entities/payment.entity';
import { PaymentAuditLog, PaymentAuditAction } from '../entities/payment-audit-log.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { PaymentValidationService } from './payment-validation.service';
import {
  CreateSudanPaymentDto,
  UpdatePaymentDto,
  ConfirmPaymentDto,
  RejectPaymentDto,
  PaymentQueryDto,
} from '../dto/create-sudan-payment.dto';

@Injectable()
export class SudanPaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(PaymentAuditLog)
    private auditLogRepository: Repository<PaymentAuditLog>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private validationService: PaymentValidationService,
  ) {}

  /**
   * User-facing: Create a pending payment
   */
  async createPayment(
    createDto: CreateSudanPaymentDto,
    tenantId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Payment> {
    // Validate payment submission
    this.validationService.validatePaymentSubmission(
      createDto.provider,
      createDto.reference_id,
      createDto.amount,
      createDto.wallet_phone,
      createDto.receipt_url,
    );

    // Verify invoice exists
    const invoice = await this.invoicesRepository.findOne({
      where: { id: createDto.invoice_id, tenant_id: tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if payment amount is valid
    if (createDto.amount > invoice.balance_amount) {
      throw new BadRequestException(
        `Payment amount (${createDto.amount}) exceeds invoice balance (${invoice.balance_amount})`,
      );
    }

    // Generate unique payment number
    const paymentNumber = await this.generatePaymentNumber(tenantId);

    // Create payment record
    const payment = this.paymentsRepository.create({
      tenant_id: tenantId,
      invoice_id: createDto.invoice_id,
      payment_number: paymentNumber,
      payment_date: new Date(),
      payment_method: this.mapProviderToMethod(createDto.provider) as any,
      amount: createDto.amount,
      provider: createDto.provider,
      reference_id: createDto.reference_id,
      payer_name: createDto.payer_name,
      wallet_phone: createDto.wallet_phone,
      receipt_url: createDto.receipt_url,
      notes: createDto.notes,
      payment_status: PaymentStatus.PENDING,
      created_by: userId,
      processing_fee: 0,
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Update invoice status to pending
    await this.invoicesRepository.update(
      { id: invoice.id },
      { status: 'pending' as any },
    );

    // Create audit log entry
    await this.createAuditLog({
      tenantId,
      paymentId: savedPayment.id,
      action: PaymentAuditAction.CREATED,
      performedBy: userId,
      newStatus: PaymentStatus.PENDING,
      ipAddress,
      userAgent,
      changes: {
        provider: createDto.provider,
        amount: createDto.amount,
        reference_id: createDto.reference_id,
      },
      notes: 'Payment created by user',
    });

    return savedPayment;
  }

  /**
   * User-facing: Get payment status
   */
  async getPaymentById(
    paymentId: string,
    tenantId: string,
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId, tenant_id: tenantId },
      relations: ['invoice', 'reviewed_by_user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Admin: Get all pending payments
   */
  async getPendingPayments(
    tenantId: string,
    filters?: PaymentQueryDto,
  ): Promise<Payment[]> {
    const query = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('payment.created_by_user', 'created_by_user')
      .where('payment.tenant_id = :tenantId', { tenantId })
      .andWhere('payment.payment_status = :status', { status: PaymentStatus.PENDING })
      .orderBy('payment.created_at', 'ASC');

    if (filters?.provider) {
      query.andWhere('payment.provider = :provider', { provider: filters.provider });
    }

    if (filters?.payer_name) {
      query.andWhere('payment.payer_name LIKE :payerName', {
        payerName: `%${filters.payer_name}%`,
      });
    }

    if (filters?.reference_id) {
      query.andWhere('payment.reference_id = :referenceId', {
        referenceId: filters.reference_id,
      });
    }

    if (filters?.start_date) {
      query.andWhere('payment.payment_date >= :startDate', {
        startDate: filters.start_date,
      });
    }

    if (filters?.end_date) {
      query.andWhere('payment.payment_date <= :endDate', {
        endDate: filters.end_date,
      });
    }

    return query.getMany();
  }

  /**
   * Admin: Confirm payment
   */
  async confirmPayment(
    paymentId: string,
    tenantId: string,
    adminUserId: string,
    confirmDto: ConfirmPaymentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId, tenant_id: tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment cannot be confirmed. Current status: ${payment.payment_status}`,
      );
    }

    // Use transaction for atomicity
    const queryRunner = this.paymentsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const previousStatus = payment.payment_status;

      // Update payment status
      payment.payment_status = PaymentStatus.CONFIRMED;
      payment.reviewed_by = adminUserId;
      payment.reviewed_at = new Date();
      payment.admin_notes = confirmDto.admin_notes || '';

      await queryRunner.manager.save(payment);

      // Update invoice
      if (payment.invoice) {
        const invoice = payment.invoice;
        const newBalance = invoice.balance_amount - payment.amount;

        // Update paid amount and balance
        invoice.paid_amount = (invoice.paid_amount || 0) + payment.amount;
        invoice.balance_amount = newBalance;

        // Update invoice status
        if (newBalance <= 0) {
          invoice.status = 'paid' as any;
        } else if (invoice.paid_amount > 0) {
          invoice.status = 'pending' as any; // You might want a PARTIALLY_PAID status
        }

        await queryRunner.manager.save(invoice);
      }

      // Create audit log
      await this.createAuditLog({
        tenantId,
        paymentId: payment.id,
        action: PaymentAuditAction.CONFIRMED,
        performedBy: adminUserId,
        previousStatus,
        newStatus: PaymentStatus.CONFIRMED,
        ipAddress,
        userAgent,
        changes: {
          reviewed_by: adminUserId,
          reviewed_at: payment.reviewed_at,
        },
        notes: confirmDto.admin_notes || 'Payment confirmed by admin',
      });

      await queryRunner.commitTransaction();

      // TODO: Send notification to user (SMS/Email/WhatsApp)
      // await this.notificationService.sendPaymentConfirmation(payment);

      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Admin: Reject payment
   */
  async rejectPayment(
    paymentId: string,
    tenantId: string,
    adminUserId: string,
    rejectDto: RejectPaymentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId, tenant_id: tenantId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment cannot be rejected. Current status: ${payment.payment_status}`,
      );
    }

    const previousStatus = payment.payment_status;

    // Update payment status
    payment.payment_status = PaymentStatus.REJECTED;
    payment.reviewed_by = adminUserId;
    payment.reviewed_at = new Date();
    payment.admin_notes = rejectDto.reason;

    const savedPayment = await this.paymentsRepository.save(payment);

    // Create audit log
    await this.createAuditLog({
      tenantId,
      paymentId: payment.id,
      action: PaymentAuditAction.REJECTED,
      performedBy: adminUserId,
      previousStatus,
      newStatus: PaymentStatus.REJECTED,
      ipAddress,
      userAgent,
      changes: {
        reviewed_by: adminUserId,
        reviewed_at: payment.reviewed_at,
      },
      notes: rejectDto.reason,
    });

    // TODO: Send notification to user (SMS/Email/WhatsApp)
    // await this.notificationService.sendPaymentRejection(payment, rejectDto.reason);

    return savedPayment;
  }

  /**
   * Get payment audit trail
   */
  async getPaymentAuditLog(
    paymentId: string,
    tenantId: string,
  ): Promise<PaymentAuditLog[]> {
    return this.auditLogRepository.find({
      where: { payment_id: paymentId, tenant_id: tenantId },
      relations: ['performed_by_user'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Generate unique payment number
   */
  private async generatePaymentNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const count = await this.paymentsRepository.count({
      where: { tenant_id: tenantId },
    });

    const sequence = (count + 1).toString().padStart(6, '0');
    return `PAY-${year}${month}-${sequence}`;
  }

  /**
   * Map provider to payment method
   */
  private mapProviderToMethod(provider: PaymentProvider): string {
    const mapping: Record<PaymentProvider, string> = {
      [PaymentProvider.BANK_OF_KHARTOUM]: 'bank_transfer',
      [PaymentProvider.FAISAL_ISLAMIC_BANK]: 'bank_transfer',
      [PaymentProvider.OMDURMAN_NATIONAL_BANK]: 'bank_transfer',
      [PaymentProvider.ZAIN_BEDE]: 'mobile_wallet',
      [PaymentProvider.CASHI]: 'mobile_wallet',
      [PaymentProvider.CASH_ON_DELIVERY]: 'cash',
      [PaymentProvider.CASH_AT_BRANCH]: 'cash',
      [PaymentProvider.OTHER]: 'bank_transfer',
    };

    return mapping[provider] || 'bank_transfer';
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(data: {
    tenantId: string;
    paymentId: string;
    action: PaymentAuditAction;
    performedBy: string;
    previousStatus?: string;
    newStatus?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: Record<string, any>;
    notes?: string;
  }): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      tenant_id: data.tenantId,
      payment_id: data.paymentId,
      action: data.action,
      performed_by: data.performedBy,
      previous_status: data.previousStatus,
      new_status: data.newStatus,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      changes: data.changes,
      notes: data.notes,
    });

    await this.auditLogRepository.save(auditLog);
  }
}

