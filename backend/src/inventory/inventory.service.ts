import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { Inventory, InventoryStatus } from './entities/inventory.entity';
import { InventoryTransaction, TransactionType } from './entities/inventory-transaction.entity';
import { Product } from '../marketplace/entities/product.entity';
import { User } from '../auth/entities/user.entity';

export interface CreateInventoryDto {
  productId: string;
  clinicId: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  averageCost?: number;
}

export interface UpdateInventoryDto {
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  averageCost?: number;
}

export interface InventoryTransactionDto {
  productId: string;
  transactionType: TransactionType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto, tenantId: string): Promise<Inventory> {
    // Check if product exists and belongs to tenant
    const product = await this.productRepository.findOne({
      where: { id: createInventoryDto.productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if inventory already exists for this product in this clinic
    const existingInventory = await this.inventoryRepository.findOne({
      where: {
        tenant_id: tenantId,
        clinic_id: createInventoryDto.clinicId,
        product_id: createInventoryDto.productId,
      },
    });

    if (existingInventory) {
      throw new BadRequestException('Inventory already exists for this product in this clinic');
    }

    const inventory = this.inventoryRepository.create({
      tenant_id: tenantId,
      clinic_id: createInventoryDto.clinicId,
      product_id: createInventoryDto.productId,
      current_stock: createInventoryDto.currentStock,
      minimum_stock: createInventoryDto.minimumStock,
      maximum_stock: createInventoryDto.maximumStock,
      location: createInventoryDto.location,
      batch_number: createInventoryDto.batchNumber,
      expiry_date: createInventoryDto.expiryDate ? new Date(createInventoryDto.expiryDate) : null,
      average_cost: createInventoryDto.averageCost,
      last_cost: createInventoryDto.averageCost,
    });

    return await this.inventoryRepository.save(inventory);
  }

  async findAll(tenantId: string, clinicId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('inventory.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('inventory.clinic_id = :clinicId', { clinicId });
    }

    return await query
      .orderBy('inventory.status', 'ASC')
      .addOrderBy('inventory.current_stock', 'ASC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['product', 'product.supplier'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto, tenantId: string): Promise<Inventory> {
    const inventory = await this.findOne(id, tenantId);

    Object.assign(inventory, {
      current_stock: updateInventoryDto.currentStock !== undefined ? updateInventoryDto.currentStock : inventory.current_stock,
      minimum_stock: updateInventoryDto.minimumStock !== undefined ? updateInventoryDto.minimumStock : inventory.minimum_stock,
      maximum_stock: updateInventoryDto.maximumStock !== undefined ? updateInventoryDto.maximumStock : inventory.maximum_stock,
      location: updateInventoryDto.location !== undefined ? updateInventoryDto.location : inventory.location,
      batch_number: updateInventoryDto.batchNumber !== undefined ? updateInventoryDto.batchNumber : inventory.batch_number,
      expiry_date: updateInventoryDto.expiryDate !== undefined ? new Date(updateInventoryDto.expiryDate) : inventory.expiry_date,
      average_cost: updateInventoryDto.averageCost !== undefined ? updateInventoryDto.averageCost : inventory.average_cost,
    });

    return await this.inventoryRepository.save(inventory);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const inventory = await this.findOne(id, tenantId);
    
    if (inventory.current_stock > 0) {
      throw new BadRequestException('Cannot delete inventory with stock remaining');
    }

    await this.inventoryRepository.softDelete(id);
  }

  async addTransaction(
    transactionDto: InventoryTransactionDto,
    tenantId: string,
    clinicId: string,
    user: User,
  ): Promise<InventoryTransaction> {
    // Find inventory for this product in this clinic
    const inventory = await this.inventoryRepository.findOne({
      where: {
        tenant_id: tenantId,
        clinic_id: clinicId,
        product_id: transactionDto.productId,
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for this product in this clinic');
    }

    // Calculate new stock level
    const newStock = inventory.current_stock + transactionDto.quantity;
    
    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock for this transaction');
    }

    // Update inventory
    inventory.current_stock = newStock;
    
    // Update cost if provided
    if (transactionDto.unitCost) {
      inventory.last_cost = transactionDto.unitCost;
      
      // Calculate new average cost
      if (transactionDto.quantity > 0) {
        const totalValue = (inventory.average_cost || 0) * inventory.current_stock + 
                          transactionDto.unitCost * transactionDto.quantity;
        inventory.average_cost = totalValue / newStock;
      }
    }

    // Update status based on stock level
    if (newStock <= inventory.minimum_stock) {
      inventory.status = InventoryStatus.LOW_STOCK;
    } else if (newStock <= 0) {
      inventory.status = InventoryStatus.OUT_OF_STOCK;
    } else {
      inventory.status = InventoryStatus.ACTIVE;
    }

    // Check for expired items
    if (inventory.expiry_date && inventory.expiry_date < new Date()) {
      inventory.status = InventoryStatus.EXPIRED;
    }

    await this.inventoryRepository.save(inventory);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      tenant_id: tenantId,
      clinic_id: clinicId,
      product_id: transactionDto.productId,
      inventory_id: inventory.id,
      transaction_type: transactionDto.transactionType,
      quantity: transactionDto.quantity,
      unit_cost: transactionDto.unitCost,
      total_cost: transactionDto.unitCost ? transactionDto.unitCost * transactionDto.quantity : null,
      reference_type: transactionDto.referenceType,
      reference_id: transactionDto.referenceId,
      notes: transactionDto.notes,
      created_by: user.id,
    });

    return await this.transactionRepository.save(transaction);
  }

  async getLowStockItems(tenantId: string, clinicId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenant_id = :tenantId', { tenantId })
      .andWhere('inventory.current_stock <= inventory.minimum_stock');

    if (clinicId) {
      query.andWhere('inventory.clinic_id = :clinicId', { clinicId });
    }

    return await query
      .orderBy('inventory.current_stock', 'ASC')
      .getMany();
  }

  async getExpiredItems(tenantId: string, clinicId?: string): Promise<Inventory[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenant_id = :tenantId', { tenantId })
      .andWhere('inventory.expiry_date < :today', { today: new Date() });

    if (clinicId) {
      query.andWhere('inventory.clinic_id = :clinicId', { clinicId });
    }

    return await query
      .orderBy('inventory.expiry_date', 'ASC')
      .getMany();
  }

  async getExpiringSoon(tenantId: string, days: number = 30, clinicId?: string): Promise<Inventory[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenant_id = :tenantId', { tenantId })
      .andWhere('inventory.expiry_date BETWEEN :today AND :futureDate', {
        today: new Date(),
        futureDate: futureDate,
      });

    if (clinicId) {
      query.andWhere('inventory.clinic_id = :clinicId', { clinicId });
    }

    return await query
      .orderBy('inventory.expiry_date', 'ASC')
      .getMany();
  }

  async getInventoryTransactions(
    tenantId: string,
    productId?: string,
    clinicId?: string,
    transactionType?: TransactionType,
  ): Promise<InventoryTransaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.inventory', 'inventory')
      .where('transaction.tenant_id = :tenantId', { tenantId });

    if (productId) {
      query.andWhere('transaction.product_id = :productId', { productId });
    }

    if (clinicId) {
      query.andWhere('transaction.clinic_id = :clinicId', { clinicId });
    }

    if (transactionType) {
      query.andWhere('transaction.transaction_type = :transactionType', { transactionType });
    }

    return await query
      .orderBy('transaction.created_at', 'DESC')
      .getMany();
  }

  async getInventoryStats(tenantId: string, clinicId?: string): Promise<any> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('inventory.clinic_id = :clinicId', { clinicId });
    }

    const totalItems = await query.getCount();

    const lowStockCount = await query
      .clone()
      .andWhere('inventory.current_stock <= inventory.minimum_stock')
      .getCount();

    const outOfStockCount = await query
      .clone()
      .andWhere('inventory.current_stock = 0')
      .getCount();

    const expiredCount = await query
      .clone()
      .andWhere('inventory.expiry_date < :today', { today: new Date() })
      .getCount();

    const totalValue = await query
      .clone()
      .select('SUM(inventory.current_stock * inventory.average_cost)', 'totalValue')
      .getRawOne();

    return {
      totalItems,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      expiredItems: expiredCount,
      totalValue: parseFloat(totalValue.totalValue || '0'),
    };
  }

  async adjustInventory(
    inventoryId: string,
    adjustment: number,
    reason: string,
    tenantId: string,
    user: User,
  ): Promise<InventoryTransaction> {
    const inventory = await this.findOne(inventoryId, tenantId);

    return await this.addTransaction(
      {
        productId: inventory.product_id,
        transactionType: TransactionType.ADJUSTMENT,
        quantity: adjustment,
        notes: reason,
      },
      tenantId,
      inventory.clinic_id,
      user,
    );
  }
}
