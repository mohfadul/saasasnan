import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from './entities/product.entity';
import { Supplier } from './entities/supplier.entity';

export interface CreateOrderDto {
  supplierId: string;
  clinicId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress?: Record<string, any>;
  notes?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingAddress?: Record<string, any>;
  notes?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createOrderDto: CreateOrderDto, tenantId: string, user: any): Promise<Order> {
    // Check if supplier exists
    const supplier = await this.suppliersRepository.findOne({
      where: { id: createOrderDto.supplierId, tenant_id: tenantId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId, tenant_id: tenantId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      orderItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: totalPrice,
        product_name: product.name,
        product_sku: product.sku,
      });
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Create order
    const order = this.ordersRepository.create({
      tenant_id: tenantId,
      clinic_id: createOrderDto.clinicId,
      supplier_id: createOrderDto.supplierId,
      order_number: orderNumber,
      subtotal: subtotal,
      total_amount: subtotal, // Add tax, shipping, discount later
      shipping_address: createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      status: OrderStatus.DRAFT,
      created_by: user.id,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Create order items
    const items = orderItems.map(item => 
      this.orderItemsRepository.create({
        ...item,
        order_id: savedOrder.id,
      })
    );

    await this.orderItemsRepository.save(items);

    return await this.findOne(savedOrder.id, tenantId);
  }

  async findAll(tenantId: string, clinicId?: string, supplierId?: string, status?: OrderStatus): Promise<Order[]> {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('order.clinic_id = :clinicId', { clinicId });
    }

    if (supplierId) {
      query.andWhere('order.supplier_id = :supplierId', { supplierId });
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return await query
      .orderBy('order.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['supplier', 'items', 'items.product', 'created_by_user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);

    Object.assign(order, {
      status: updateOrderDto.status || order.status,
      expected_delivery_date: updateOrderDto.expectedDeliveryDate ? new Date(updateOrderDto.expectedDeliveryDate) : order.expected_delivery_date,
      actual_delivery_date: updateOrderDto.actualDeliveryDate ? new Date(updateOrderDto.actualDeliveryDate) : order.actual_delivery_date,
      shipping_address: updateOrderDto.shippingAddress || order.shipping_address,
      notes: updateOrderDto.notes !== undefined ? updateOrderDto.notes : order.notes,
    });

    return await this.ordersRepository.save(order);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const order = await this.findOne(id, tenantId);
    
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft orders');
    }

    await this.ordersRepository.softDelete(id);
  }

  async confirmOrder(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Can only confirm draft orders');
    }

    order.status = OrderStatus.PENDING;
    return await this.ordersRepository.save(order);
  }

  async markAsDelivered(id: string, tenantId: string): Promise<Order> {
    const order = await this.findOne(id, tenantId);
    
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Can only mark shipped orders as delivered');
    }

    order.status = OrderStatus.DELIVERED;
    order.actual_delivery_date = new Date();
    return await this.ordersRepository.save(order);
  }

  async getOrderStats(tenantId: string, clinicId?: string): Promise<any> {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.tenant_id = :tenantId', { tenantId });

    if (clinicId) {
      query.andWhere('order.clinic_id = :clinicId', { clinicId });
    }

    const totalOrders = await query.getCount();

    const statusCounts = await query
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const totalValue = await query
      .clone()
      .select('SUM(order.total_amount)', 'totalValue')
      .getRawOne();

    return {
      totalOrders,
      statusStats,
      totalValue: parseFloat(totalValue.totalValue || '0'),
      averageOrderValue: totalOrders > 0 ? parseFloat(totalValue.totalValue || '0') / totalOrders : 0,
    };
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    // This would use the database function we created
    // For now, we'll generate a simple order number
    const year = new Date().getFullYear();
    const count = await this.ordersRepository.count({
      where: { tenant_id: tenantId },
    });
    
    return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
