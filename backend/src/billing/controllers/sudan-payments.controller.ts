import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Ip,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { SudanPaymentsService } from '../services/sudan-payments.service';
import {
  CreateSudanPaymentDto,
  UpdatePaymentDto,
  ConfirmPaymentDto,
  RejectPaymentDto,
  PaymentQueryDto,
} from '../dto/create-sudan-payment.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentAuditLog } from '../entities/payment-audit-log.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class SudanPaymentsController {
  constructor(private readonly sudanPaymentsService: SudanPaymentsService) {}

  /**
   * User-facing: Create a new payment (pending status)
   * POST /payments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() createPaymentDto: CreateSudanPaymentDto,
    @Request() req: any,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<Payment> {
    return this.sudanPaymentsService.createPayment(
      createPaymentDto,
      req.user.tenantId,
      req.user.userId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * User-facing: Get payment status by ID
   * GET /payments/:id
   */
  @Get(':id')
  async getPayment(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Payment> {
    return this.sudanPaymentsService.getPaymentById(id, req.user.tenantId);
  }

  /**
   * User-facing: Get payment audit trail
   * GET /payments/:id/audit-log
   */
  @Get(':id/audit-log')
  async getPaymentAuditLog(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PaymentAuditLog[]> {
    return this.sudanPaymentsService.getPaymentAuditLog(id, req.user.tenantId);
  }

  /**
   * Admin: Get all pending payments
   * GET /admin/payments/pending
   */
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'clinic_admin', 'finance_admin')
  async getPendingPayments(
    @Query() queryDto: PaymentQueryDto,
    @Request() req: any,
  ): Promise<Payment[]> {
    return this.sudanPaymentsService.getPendingPayments(
      req.user.tenantId,
      queryDto,
    );
  }

  /**
   * Admin: Confirm a payment
   * POST /admin/payments/:id/confirm
   */
  @Post('admin/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'clinic_admin', 'finance_admin')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('id') id: string,
    @Body() confirmDto: ConfirmPaymentDto,
    @Request() req: any,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<Payment> {
    // Check if user has FINANCE role
    const allowedRoles = ['super_admin', 'clinic_admin', 'finance_admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('Only finance administrators can confirm payments');
    }

    return this.sudanPaymentsService.confirmPayment(
      id,
      req.user.tenantId,
      req.user.userId,
      confirmDto,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Admin: Reject a payment
   * POST /admin/payments/:id/reject
   */
  @Post('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'clinic_admin', 'finance_admin')
  @HttpCode(HttpStatus.OK)
  async rejectPayment(
    @Param('id') id: string,
    @Body() rejectDto: RejectPaymentDto,
    @Request() req: any,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<Payment> {
    // Check if user has FINANCE role
    const allowedRoles = ['super_admin', 'clinic_admin', 'finance_admin'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('Only finance administrators can reject payments');
    }

    return this.sudanPaymentsService.rejectPayment(
      id,
      req.user.tenantId,
      req.user.userId,
      rejectDto,
      ipAddress,
      userAgent,
    );
  }
}

