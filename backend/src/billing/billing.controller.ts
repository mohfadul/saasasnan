import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { InvoicesService, CreateInvoiceDto, UpdateInvoiceDto } from './invoices.service';
import { PaymentsService, CreatePaymentDto, UpdatePaymentDto } from './payments.service';
import { InsuranceService, CreateInsuranceProviderDto, UpdateInsuranceProviderDto, CreatePatientInsuranceDto } from './insurance.service';
import { User } from '../auth/entities/user.entity';
import { TenantGuard } from '../tenants/tenant.guard';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly invoicesService: InvoicesService,
    private readonly paymentsService: PaymentsService,
    private readonly insuranceService: InsuranceService,
  ) {}

  // Invoice endpoints
  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req: { user: User }) {
    return this.invoicesService.create(createInvoiceDto, req.user.tenant_id, req.user);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'customerType', required: false, description: 'Filter by customer type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  getInvoices(
    @Request() req: { user: User },
    @Query('clinicId') clinicId?: string,
    @Query('status') status?: string,
    @Query('customerType') customerType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoicesService.findAll(
      req.user.tenant_id,
      clinicId,
      status as any,
      customerType as any,
      startDate,
      endDate,
    );
  }

  @Get('invoices/overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Overdue invoices retrieved successfully' })
  getOverdueInvoices(@Request() req: { user: User }, @Query('clinicId') clinicId?: string) {
    return this.invoicesService.getOverdueInvoices(req.user.tenant_id, clinicId);
  }

  @Get('invoices/stats')
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Invoice statistics retrieved successfully' })
  getInvoiceStats(
    @Request() req: { user: User },
    @Query('clinicId') clinicId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoicesService.getInvoiceStats(req.user.tenant_id, clinicId, startDate, endDate);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  getInvoice(@Param('id') id: string, @Request() req: { user: User }) {
    return this.invoicesService.findOne(id, req.user.tenant_id);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  updateInvoice(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: { user: User },
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, req.user.tenant_id);
  }

  @Patch('invoices/:id/send')
  @ApiOperation({ summary: 'Send invoice to customer' })
  @ApiResponse({ status: 200, description: 'Invoice sent successfully' })
  sendInvoice(@Param('id') id: string, @Request() req: { user: User }) {
    return this.invoicesService.sendInvoice(id, req.user.tenant_id);
  }

  @Patch('invoices/:id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid successfully' })
  markInvoiceAsPaid(@Param('id') id: string, @Request() req: { user: User }) {
    return this.invoicesService.markAsPaid(id, req.user.tenant_id);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  deleteInvoice(@Param('id') id: string, @Request() req: { user: User }) {
    return this.invoicesService.remove(id, req.user.tenant_id);
  }

  // Payment endpoints
  @Post('payments')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req: { user: User }) {
    return this.paymentsService.create(createPaymentDto, req.user.tenant_id, req.user);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'invoiceId', required: false, description: 'Filter by invoice ID' })
  @ApiQuery({ name: 'paymentMethod', required: false, description: 'Filter by payment method' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  getPayments(
    @Request() req: { user: User },
    @Query('invoiceId') invoiceId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.findAll(
      req.user.tenant_id,
      invoiceId,
      paymentMethod as any,
      status as any,
      startDate,
      endDate,
    );
  }

  @Get('payments/stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  getPaymentStats(
    @Request() req: { user: User },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getPaymentStats(req.user.tenant_id, startDate, endDate);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  getPayment(@Param('id') id: string, @Request() req: { user: User }) {
    return this.paymentsService.findOne(id, req.user.tenant_id);
  }

  @Patch('payments/:id')
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req: { user: User },
  ) {
    return this.paymentsService.update(id, updatePaymentDto, req.user.tenant_id);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  refundPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string },
    @Request() req: { user: User },
  ) {
    return this.paymentsService.refundPayment(id, body.amount, body.reason, req.user.tenant_id);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  deletePayment(@Param('id') id: string, @Request() req: { user: User }) {
    return this.paymentsService.remove(id, req.user.tenant_id);
  }

  // Insurance Provider endpoints
  @Post('insurance-providers')
  @ApiOperation({ summary: 'Create insurance provider' })
  @ApiResponse({ status: 201, description: 'Insurance provider created successfully' })
  createInsuranceProvider(@Body() createDto: CreateInsuranceProviderDto, @Request() req: { user: User }) {
    return this.insuranceService.createInsuranceProvider(createDto, req.user.tenant_id);
  }

  @Get('insurance-providers')
  @ApiOperation({ summary: 'Get all insurance providers' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Insurance providers retrieved successfully' })
  getInsuranceProviders(@Request() req: { user: User }, @Query('status') status?: string) {
    return this.insuranceService.findAllInsuranceProviders(req.user.tenant_id, status);
  }

  @Get('insurance-providers/:id')
  @ApiOperation({ summary: 'Get insurance provider by ID' })
  @ApiResponse({ status: 200, description: 'Insurance provider retrieved successfully' })
  getInsuranceProvider(@Param('id') id: string, @Request() req: { user: User }) {
    return this.insuranceService.findOneInsuranceProvider(id, req.user.tenant_id);
  }

  @Patch('insurance-providers/:id')
  @ApiOperation({ summary: 'Update insurance provider' })
  @ApiResponse({ status: 200, description: 'Insurance provider updated successfully' })
  updateInsuranceProvider(
    @Param('id') id: string,
    @Body() updateDto: UpdateInsuranceProviderDto,
    @Request() req: { user: User },
  ) {
    return this.insuranceService.updateInsuranceProvider(id, updateDto, req.user.tenant_id);
  }

  @Delete('insurance-providers/:id')
  @ApiOperation({ summary: 'Delete insurance provider' })
  @ApiResponse({ status: 200, description: 'Insurance provider deleted successfully' })
  deleteInsuranceProvider(@Param('id') id: string, @Request() req: { user: User }) {
    return this.insuranceService.removeInsuranceProvider(id, req.user.tenant_id);
  }

  // Patient Insurance endpoints
  @Post('patient-insurance')
  @ApiOperation({ summary: 'Create patient insurance' })
  @ApiResponse({ status: 201, description: 'Patient insurance created successfully' })
  createPatientInsurance(@Body() createDto: CreatePatientInsuranceDto, @Request() req: { user: User }) {
    return this.insuranceService.createPatientInsurance(createDto, req.user.tenant_id);
  }

  @Get('patients/:patientId/insurance')
  @ApiOperation({ summary: 'Get patient insurance information' })
  @ApiResponse({ status: 200, description: 'Patient insurance retrieved successfully' })
  getPatientInsurances(@Param('patientId') patientId: string, @Request() req: { user: User }) {
    return this.insuranceService.getPatientInsurances(patientId, req.user.tenant_id);
  }

  @Patch('patient-insurance/:id')
  @ApiOperation({ summary: 'Update patient insurance' })
  @ApiResponse({ status: 200, description: 'Patient insurance updated successfully' })
  updatePatientInsurance(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreatePatientInsuranceDto>,
    @Request() req: { user: User },
  ) {
    return this.insuranceService.updatePatientInsurance(id, updateDto, req.user.tenant_id);
  }

  @Delete('patient-insurance/:id')
  @ApiOperation({ summary: 'Delete patient insurance' })
  @ApiResponse({ status: 200, description: 'Patient insurance deleted successfully' })
  deletePatientInsurance(@Param('id') id: string, @Request() req: { user: User }) {
    return this.insuranceService.removePatientInsurance(id, req.user.tenant_id);
  }

  @Get('insurance/stats')
  @ApiOperation({ summary: 'Get insurance statistics' })
  @ApiResponse({ status: 200, description: 'Insurance statistics retrieved successfully' })
  getInsuranceStats(@Request() req: { user: User }) {
    return this.insuranceService.getInsuranceStats(req.user.tenant_id);
  }

  // Billing overview
  @Get('overview')
  @ApiOperation({ summary: 'Get billing overview' })
  @ApiResponse({ status: 200, description: 'Billing overview retrieved successfully' })
  getBillingOverview(@Request() req: { user: User }) {
    return this.billingService.getOverview(req.user.tenant_id);
  }
}
