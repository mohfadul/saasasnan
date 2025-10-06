import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Invoice, InvoiceStatus, CustomerType } from './entities/invoice.entity';
import { InvoiceItem, ItemType } from './entities/invoice-item.entity';
import { Patient } from '../patients/entities/patient.entity';
import { InsuranceProvider } from './entities/insurance-provider.entity';

export interface CreateInvoiceDto {
  clinicId: string;
  customerType: CustomerType;
  customerId?: string;
  customerInfo: Record<string, any>;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    itemType?: ItemType;
    referenceId?: string;
    taxRate?: number;
  }[];
  dueDate?: string;
  notes?: string;
  termsAndConditions?: string;
  paymentTerms?: number;
}

export interface UpdateInvoiceDto {
  customerInfo?: Record<string, any>;
  dueDate?: string;
  status?: InvoiceStatus;
  notes?: string;
  termsAndConditions?: string;
  paymentTerms?: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemsRepository: Repository<InvoiceItem>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(InsuranceProvider)
    private insuranceProvidersRepository: Repository<InsuranceProvider>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, tenantId: string, user: any): Promise<Invoice> {
    // Validate customer if customerId is provided
    if (createInvoiceDto.customerId) {
      if (createInvoiceDto.customerType === CustomerType.PATIENT) {
        const patient = await this.patientsRepository.findOne({
          where: { id: createInvoiceDto.customerId, tenant_id: tenantId },
        });
        if (!patient) {
          throw new NotFoundException('Patient not found');
        }
      } else if (createInvoiceDto.customerType === CustomerType.INSURANCE) {
        const insuranceProvider = await this.insuranceProvidersRepository.findOne({
          where: { id: createInvoiceDto.customerId, tenant_id: tenantId },
        });
        if (!insuranceProvider) {
          throw new NotFoundException('Insurance provider not found');
        }
      }
    }

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const invoiceItems = [];

    for (const item of createInvoiceDto.items) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate || 0) / 100;
      
      subtotal += itemTotal;
      totalTax += itemTax;

      invoiceItems.push({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: itemTotal,
        item_type: item.itemType,
        reference_id: item.referenceId,
        tax_rate: item.taxRate || 0,
        tax_amount: itemTax,
      });
    }

    const totalAmount = subtotal + totalTax;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Create invoice
    const invoice = this.invoicesRepository.create({
      tenant_id: tenantId,
      clinic_id: createInvoiceDto.clinicId,
      invoice_number: invoiceNumber,
      invoice_date: new Date(),
      due_date: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : this.calculateDueDate(createInvoiceDto.paymentTerms || 30),
      customer_type: createInvoiceDto.customerType,
      customer_id: createInvoiceDto.customerId,
      customer_info: createInvoiceDto.customerInfo,
      subtotal: subtotal,
      tax_amount: totalTax,
      total_amount: totalAmount,
      balance_amount: totalAmount,
      payment_terms: createInvoiceDto.paymentTerms || 30,
      notes: createInvoiceDto.notes,
      terms_and_conditions: createInvoiceDto.termsAndConditions,
      status: InvoiceStatus.DRAFT,
      created_by: user.id,
    });

    const savedInvoice = await this.invoicesRepository.save(invoice);

    // Create invoice items
    const items = invoiceItems.map(item => 
      this.invoiceItemsRepository.create({
        ...item,
        invoice_id: savedInvoice.id,
      })
    );

    await this.invoiceItemsRepository.save(items.flat());

    return await this.findOne(savedInvoice.id, tenantId);
  }

  async findAll(
    tenantId: string,
    clinicId?: string,
    status?: InvoiceStatus,
    customerType?: CustomerType,
    startDate?: string,
    endDate?: string,
  ): Promise<Invoice[]> {
    const query = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('invoice.clinic_id = :clinicId', { clinicId });
    }

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    if (customerType) {
      query.andWhere('invoice.customer_type = :customerType', { customerType });
    }

    if (startDate && endDate) {
      query.andWhere('invoice.invoice_date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return await query
      .orderBy('invoice.invoice_date', 'DESC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['items', 'payments', 'created_by_user'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, tenantId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);

    Object.assign(invoice, {
      customer_info: updateInvoiceDto.customerInfo || invoice.customer_info,
      due_date: updateInvoiceDto.dueDate ? new Date(updateInvoiceDto.dueDate) : invoice.due_date,
      status: updateInvoiceDto.status || invoice.status,
      notes: updateInvoiceDto.notes !== undefined ? updateInvoiceDto.notes : invoice.notes,
      terms_and_conditions: updateInvoiceDto.termsAndConditions !== undefined ? updateInvoiceDto.termsAndConditions : invoice.terms_and_conditions,
      payment_terms: updateInvoiceDto.paymentTerms !== undefined ? updateInvoiceDto.paymentTerms : invoice.payment_terms,
    });

    return await this.invoicesRepository.save(invoice);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const invoice = await this.findOne(id, tenantId);
    
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft invoices');
    }

    await this.invoicesRepository.softDelete(id);
  }

  async sendInvoice(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Can only send draft invoices');
    }

    invoice.status = InvoiceStatus.SENT;
    return await this.invoicesRepository.save(invoice);
  }

  async markAsPaid(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    
    invoice.status = InvoiceStatus.PAID;
    invoice.paid_amount = invoice.total_amount;
    invoice.balance_amount = 0;
    invoice.paid_date = new Date();

    return await this.invoicesRepository.save(invoice);
  }

  async getOverdueInvoices(tenantId: string, clinicId?: string): Promise<Invoice[]> {
    const query = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.tenant_id = :tenantId', { tenantId })
      .andWhere('invoice.due_date < :today', { today: new Date() })
      .andWhere('invoice.status NOT IN (:...statuses)', { 
        statuses: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] 
      });

    if (clinicId) {
      query.andWhere('invoice.clinic_id = :clinicId', { clinicId });
    }

    return await query
      .orderBy('invoice.due_date', 'ASC')
      .getMany();
  }

  async getInvoiceStats(tenantId: string, clinicId?: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('invoice.clinic_id = :clinicId', { clinicId });
    }

    if (startDate && endDate) {
      query.andWhere('invoice.invoice_date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const totalInvoices = await query.getCount();

    const statusCounts = await query
      .select('invoice.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('invoice.status')
      .getRawMany();

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const totalRevenue = await query
      .clone()
      .select('SUM(invoice.total_amount)', 'totalRevenue')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .getRawOne();

    const outstandingAmount = await query
      .clone()
      .select('SUM(invoice.balance_amount)', 'outstandingAmount')
      .where('invoice.balance_amount > 0')
      .getRawOne();

    return {
      totalInvoices,
      statusStats,
      totalRevenue: parseFloat(totalRevenue.totalRevenue || '0'),
      outstandingAmount: parseFloat(outstandingAmount.outstandingAmount || '0'),
      averageInvoiceValue: totalInvoices > 0 ? parseFloat(totalRevenue.totalRevenue || '0') / totalInvoices : 0,
    };
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    // This would use the database function we created
    // For now, we'll generate a simple invoice number
    const year = new Date().getFullYear();
    const count = await this.invoicesRepository.count({
      where: { tenant_id: tenantId },
    });
    
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private calculateDueDate(paymentTerms: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }
}
