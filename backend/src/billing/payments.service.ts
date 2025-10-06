import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

export interface CreatePaymentDto {
  invoiceId?: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  processingFee?: number;
  notes?: string;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, tenantId: string, user: any): Promise<Payment> {
    // Use transaction to ensure payment and invoice update are atomic
    const queryRunner = this.paymentsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate invoice if provided
      let invoice;
      if (createPaymentDto.invoiceId) {
        invoice = await queryRunner.manager.findOne(Invoice, {
          where: { id: createPaymentDto.invoiceId, tenant_id: tenantId },
        });

        if (!invoice) {
          throw new NotFoundException('Invoice not found');
        }

        // Check if payment amount exceeds remaining balance
        if (createPaymentDto.amount > invoice.balance_amount) {
          throw new BadRequestException('Payment amount exceeds remaining balance');
        }
      }

      // Generate payment number
      const paymentNumber = await this.generatePaymentNumber(tenantId);

      // Create payment
      const payment = queryRunner.manager.create(Payment, {
        tenant_id: tenantId,
        invoice_id: createPaymentDto.invoiceId,
        payment_number: paymentNumber,
        payment_date: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
        payment_method: createPaymentDto.paymentMethod,
        amount: createPaymentDto.amount,
        transaction_id: createPaymentDto.transactionId,
        gateway_response: createPaymentDto.gatewayResponse,
        processing_fee: createPaymentDto.processingFee || 0,
        status: PaymentStatus.COMPLETED,
        notes: createPaymentDto.notes,
        created_by: user.id,
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // Update invoice if payment is associated with an invoice
      if (createPaymentDto.invoiceId && invoice) {
        invoice.paid_amount += createPaymentDto.amount;
        invoice.balance_amount = invoice.total_amount - invoice.paid_amount;
        
        // Update invoice status based on payment
        if (invoice.balance_amount <= 0) {
          invoice.status = InvoiceStatus.PAID;
        } else if (invoice.paid_amount > 0 && invoice.status === InvoiceStatus.DRAFT) {
          invoice.status = InvoiceStatus.SENT;
        }

        await queryRunner.manager.save(invoice);
      }

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    tenantId: string,
    invoiceId?: string,
    paymentMethod?: PaymentMethod,
    status?: PaymentStatus,
    startDate?: string,
    endDate?: string,
  ): Promise<Payment[]> {
    const query = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('payment.created_by_user', 'created_by_user')
      .where('payment.tenant_id = :tenantId', { tenantId });

    if (invoiceId) {
      query.andWhere('payment.invoice_id = :invoiceId', { invoiceId });
    }

    if (paymentMethod) {
      query.andWhere('payment.payment_method = :paymentMethod', { paymentMethod });
    }

    if (status) {
      query.andWhere('payment.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('payment.payment_date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return await query
      .orderBy('payment.payment_date', 'DESC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['invoice', 'created_by_user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, tenantId: string): Promise<Payment> {
    const payment = await this.findOne(id, tenantId);

    Object.assign(payment, {
      payment_status: updatePaymentDto.status || payment.payment_status,
      transaction_id: updatePaymentDto.transactionId || payment.transaction_id,
      gateway_response: updatePaymentDto.gatewayResponse || payment.gateway_response,
      notes: updatePaymentDto.notes !== undefined ? updatePaymentDto.notes : payment.notes,
    });

    return await this.paymentsRepository.save(payment);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const payment = await this.findOne(id, tenantId);
    
    if (payment.payment_status === PaymentStatus.COMPLETED && payment.invoice_id) {
      // Reverse the payment on the invoice
      await this.updateInvoiceBalance(payment.invoice_id, -payment.amount);
    }

    await this.paymentsRepository.softDelete(id);
  }

  async processOnlinePayment(
    invoiceId: string,
    amount: number,
    gatewayResponse: Record<string, any>,
    tenantId: string,
    user: any,
  ): Promise<Payment> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id: invoiceId, tenant_id: tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if payment was successful based on gateway response
    const isSuccessful = this.validateGatewayResponse(gatewayResponse);

    const payment = await this.create({
      invoiceId,
      paymentMethod: PaymentMethod.ONLINE,
      amount,
      transactionId: gatewayResponse.transaction_id,
      gatewayResponse,
      processingFee: gatewayResponse.processing_fee || 0,
      notes: `Online payment via ${gatewayResponse.gateway}`,
    }, tenantId, user);

    // Update payment status based on gateway response
    if (!isSuccessful) {
      payment.payment_status = PaymentStatus.FAILED;
      await this.paymentsRepository.save(payment);
    }

    return payment;
  }

  async refundPayment(id: string, amount: number, reason: string, tenantId: string): Promise<Payment> {
    const originalPayment = await this.findOne(id, tenantId);
    
    if (originalPayment.payment_status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    if (amount > originalPayment.amount) {
      throw new BadRequestException('Refund amount cannot exceed original payment amount');
    }

    // Create refund payment
    const refundPayment = await this.create({
      invoiceId: originalPayment.invoice_id,
      paymentMethod: originalPayment.payment_method,
      amount: -amount, // Negative amount for refund
      notes: `Refund for payment ${originalPayment.payment_number}: ${reason}`,
    }, tenantId, { id: 'system' });

    // Update original payment status if fully refunded
    if (amount === originalPayment.amount) {
      originalPayment.payment_status = PaymentStatus.REFUNDED;
      await this.paymentsRepository.save(originalPayment);
    }

    return refundPayment;
  }

  async getPaymentStats(tenantId: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.tenant_id = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (startDate && endDate) {
      query.andWhere('payment.payment_date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const totalPayments = await query.getCount();

    const totalAmount = await query
      .select('SUM(payment.amount)', 'totalAmount')
      .getRawOne();

    const methodStats = await query
      .clone()
      .select('payment.payment_method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy('payment.payment_method')
      .getRawMany();

    const methodBreakdown = methodStats.reduce((acc, item) => {
      acc[item.method] = {
        count: parseInt(item.count),
        amount: parseFloat(item.amount),
      };
      return acc;
    }, {});

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount.totalAmount || '0'),
      methodBreakdown,
      averagePaymentAmount: totalPayments > 0 ? parseFloat(totalAmount.totalAmount || '0') / totalPayments : 0,
    };
  }

  private async updateInvoiceBalance(invoiceId: string, paymentAmount: number): Promise<void> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return;
    }

    invoice.paid_amount += paymentAmount;
    invoice.balance_amount = invoice.total_amount - invoice.paid_amount;

    // Update invoice status based on balance
    if (invoice.balance_amount <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paid_date = new Date();
    } else if (invoice.due_date < new Date()) {
      invoice.status = InvoiceStatus.OVERDUE;
    } else {
      invoice.status = InvoiceStatus.SENT;
    }

    await this.invoicesRepository.save(invoice);
  }

  private async generatePaymentNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.paymentsRepository.count({
      where: { tenant_id: tenantId },
    });
    
    return `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private validateGatewayResponse(response: Record<string, any>): boolean {
    // This would contain actual gateway validation logic
    // For now, we'll assume success if there's no error
    return !response.error && response.status === 'success';
  }
}
