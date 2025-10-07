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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../tenants/tenant.guard';
import { PharmacyService } from './pharmacy.service';
import { InventoryService, CreateInventoryDto, UpdateInventoryDto, AdjustStockDto } from './inventory.service';
import { SalesService, CreateSaleDto } from './sales.service';
import { PrescriptionService, CreatePrescriptionDto } from './prescription.service';
import { SuppliersService, CreateSupplierDto, UpdateSupplierDto } from './suppliers.service';

@ApiTags('Pharmacy')
@Controller('pharmacy')
@UseGuards(AuthGuard('jwt'), TenantGuard)
@ApiBearerAuth()
export class PharmacyController {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly inventoryService: InventoryService,
    private readonly salesService: SalesService,
    private readonly prescriptionService: PrescriptionService,
    private readonly suppliersService: SuppliersService,
  ) {}

  // ===== DASHBOARD =====
  @Get('dashboard')
  @ApiOperation({ summary: 'Get pharmacy dashboard overview' })
  getDashboard(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.pharmacyService.getDashboardOverview(req.user.tenant_id, clinicId);
  }

  // ===== INVENTORY =====
  @Post('inventory')
  @ApiOperation({ summary: 'Add drug to inventory' })
  createInventory(@Body() createDto: CreateInventoryDto, @Request() req) {
    return this.inventoryService.create(createDto, req.user.tenant_id, req.user.id);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get all inventory items' })
  getInventory(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.inventoryService.findAll(req.user.tenant_id, clinicId);
  }

  @Get('inventory/:id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  getInventoryItem(@Param('id') id: string, @Request() req) {
    return this.inventoryService.findOne(id, req.user.tenant_id);
  }

  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update inventory item' })
  updateInventory(@Param('id') id: string, @Body() updateDto: UpdateInventoryDto, @Request() req) {
    return this.inventoryService.update(id, updateDto, req.user.tenant_id);
  }

  @Post('inventory/:id/adjust')
  @ApiOperation({ summary: 'Adjust stock quantity' })
  adjustStock(@Param('id') id: string, @Body() adjustDto: AdjustStockDto, @Request() req) {
    return this.inventoryService.adjustStock(id, adjustDto, req.user.tenant_id);
  }

  @Delete('inventory/:id')
  @ApiOperation({ summary: 'Delete inventory item' })
  deleteInventory(@Param('id') id: string, @Request() req) {
    return this.inventoryService.delete(id, req.user.tenant_id);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring drugs' })
  getExpiringDrugs(@Request() req, @Query('days') days?: string, @Query('clinicId') clinicId?: string) {
    return this.pharmacyService.getExpiringDrugs(req.user.tenant_id, clinicId, days ? parseInt(days) : 30);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock drugs' })
  getLowStockDrugs(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.pharmacyService.getLowStockDrugs(req.user.tenant_id, clinicId);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock drugs' })
  getOutOfStockDrugs(@Request() req, @Query('clinicId') clinicId?: string) {
    return this.pharmacyService.getOutOfStockDrugs(req.user.tenant_id, clinicId);
  }

  // ===== SALES / POS =====
  @Post('sales')
  @ApiOperation({ summary: 'Create a sale transaction' })
  createSale(@Body() createDto: CreateSaleDto, @Request() req) {
    return this.salesService.create(createDto, req.user.tenant_id, req.user.id);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get all sales' })
  getSales(
    @Request() req,
    @Query('clinicId') clinicId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.findAll(req.user.tenant_id, clinicId, startDate, endDate);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Get sale by ID' })
  getSale(@Param('id') id: string, @Request() req) {
    return this.salesService.findOne(id, req.user.tenant_id);
  }

  @Get('sales/analytics')
  @ApiOperation({ summary: 'Get sales analytics' })
  getSalesAnalytics(
    @Request() req,
    @Query('period') period: 'daily' | 'weekly' | 'monthly',
    @Query('clinicId') clinicId?: string,
  ) {
    return this.salesService.getSalesAnalytics(req.user.tenant_id, period || 'daily', clinicId);
  }

  // ===== PRESCRIPTIONS =====
  @Post('prescriptions')
  @ApiOperation({ summary: 'Create doctor prescription' })
  createPrescription(@Body() createDto: CreatePrescriptionDto, @Request() req) {
    return this.prescriptionService.create(createDto, req.user.tenant_id);
  }

  @Get('prescriptions')
  @ApiOperation({ summary: 'Get all prescriptions' })
  getPrescriptions(@Request() req, @Query('clinicId') clinicId?: string, @Query('status') status?: string) {
    return this.prescriptionService.findAll(req.user.tenant_id, clinicId, status);
  }

  @Get('prescriptions/:id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  getPrescription(@Param('id') id: string, @Request() req) {
    return this.prescriptionService.findOne(id, req.user.tenant_id);
  }

  @Patch('prescriptions/:id/verify')
  @ApiOperation({ summary: 'Verify prescription' })
  verifyPrescription(@Param('id') id: string, @Request() req) {
    return this.prescriptionService.verify(id, req.user.tenant_id, req.user.id);
  }

  @Patch('prescriptions/:id/pickup')
  @ApiOperation({ summary: 'Mark prescription as picked up' })
  markPrescriptionPickedUp(@Param('id') id: string, @Request() req) {
    return this.prescriptionService.markPickedUp(id, req.user.tenant_id);
  }

  // ===== SUPPLIERS =====
  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier' })
  createSupplier(@Body() createDto: CreateSupplierDto, @Request() req) {
    return this.suppliersService.create(createDto, req.user.tenant_id);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  getSuppliers(@Request() req, @Query('status') status?: string) {
    return this.suppliersService.findAll(req.user.tenant_id, status);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  getSupplier(@Param('id') id: string, @Request() req) {
    return this.suppliersService.findOne(id, req.user.tenant_id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  updateSupplier(@Param('id') id: string, @Body() updateDto: UpdateSupplierDto, @Request() req) {
    return this.suppliersService.update(id, updateDto, req.user.tenant_id);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete supplier' })
  deleteSupplier(@Param('id') id: string, @Request() req) {
    return this.suppliersService.delete(id, req.user.tenant_id);
  }
}

