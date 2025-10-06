import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Supplier } from './supplier.entity';
import { OrderItem } from './order-item.entity';
import { User } from '../../auth/entities/user.entity';

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  supplier_id: string;

  // Order details
  @Column({ length: 100 })
  order_number: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  order_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  expected_delivery_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actual_delivery_date?: Date;

  // Status tracking
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  // Financial
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  // Additional info
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('json', { nullable: true })
  shipping_address?: Record<string, any>;

  // Audit
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => Supplier, supplier => supplier.orders)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user?: User;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  items: OrderItem[];
}
