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
import { InventoryService, CreateInventoryDto, UpdateInventoryDto, InventoryTransactionDto } from './inventory.service';
import { User } from '../auth/entities/user.entity';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  create(@Body() createInventoryDto: CreateInventoryDto, @Request() req: { user: User }) {
    return this.inventoryService.create(createInventoryDto, req.user.tenant_id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  findAll(@Request() req: { user: User }, @Query('clinicId') clinicId?: string) {
    return this.inventoryService.findAll(req.user.tenant_id, clinicId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved successfully' })
  getLowStockItems(@Request() req: { user: User }, @Query('clinicId') clinicId?: string) {
    return this.inventoryService.getLowStockItems(req.user.tenant_id, clinicId);
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired items' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Expired items retrieved successfully' })
  getExpiredItems(@Request() req: { user: User }, @Query('clinicId') clinicId?: string) {
    return this.inventoryService.getExpiredItems(req.user.tenant_id, clinicId);
  }

  @Get('expiring-soon')
  @ApiOperation({ summary: 'Get items expiring soon' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead to check (default: 30)' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Items expiring soon retrieved successfully' })
  getExpiringSoon(
    @Request() req: { user: User }, 
    @Query('days') days?: number,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.inventoryService.getExpiringSoon(req.user.tenant_id, days || 30, clinicId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get inventory transactions' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filter by product ID' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiQuery({ name: 'transactionType', required: false, description: 'Filter by transaction type' })
  @ApiResponse({ status: 200, description: 'Inventory transactions retrieved successfully' })
  getTransactions(
    @Request() req: { user: User },
    @Query('productId') productId?: string,
    @Query('clinicId') clinicId?: string,
    @Query('transactionType') transactionType?: string,
  ) {
    return this.inventoryService.getInventoryTransactions(
      req.user.tenant_id,
      productId,
      clinicId,
      transactionType as any,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiQuery({ name: 'clinicId', required: false, description: 'Filter by clinic ID' })
  @ApiResponse({ status: 200, description: 'Inventory statistics retrieved successfully' })
  getStats(@Request() req: { user: User }, @Query('clinicId') clinicId?: string) {
    return this.inventoryService.getInventoryStats(req.user.tenant_id, clinicId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: { user: User }) {
    return this.inventoryService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Request() req: { user: User },
  ) {
    return this.inventoryService.update(id, updateInventoryDto, req.user.tenant_id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.inventoryService.remove(id, req.user.tenant_id);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory stock' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  adjustInventory(
    @Param('id') id: string,
    @Body() body: { adjustment: number; reason: string },
    @Request() req: { user: User },
  ) {
    return this.inventoryService.adjustInventory(id, body.adjustment, body.reason, req.user.tenant_id, req.user);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create inventory transaction' })
  @ApiResponse({ status: 201, description: 'Inventory transaction created successfully' })
  createTransaction(
    @Body() transactionDto: InventoryTransactionDto,
    @Request() req: { user: User },
  ) {
    return this.inventoryService.addTransaction(
      transactionDto,
      req.user.tenant_id,
      req.user.clinic_id || '',
      req.user,
    );
  }
}
