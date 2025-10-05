import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ length: 255 })
  name: string;

  @Column('jsonb')
  contact_info: Record<string, any>;

  @Column('jsonb', { default: {} })
  business_info: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'active',
    enum: ['active', 'pending', 'suspended', 'inactive']
  })
  status: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ default: 0 })
  total_orders: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  on_time_delivery_rate: number;

  @OneToMany(() => Product, product => product.supplier)
  products: Product[];

  @OneToMany(() => Order, order => order.supplier)
  orders: Order[];
}
