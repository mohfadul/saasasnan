import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Supplier } from './supplier.entity';
import { ProductCategory } from './product-category.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { OrderItem } from './order-item.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  supplier_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  category_id?: string;

  // Product details
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100 })
  sku: string;

  @Column({ length: 100, nullable: true })
  barcode?: string;

  @Column({ length: 255, nullable: true })
  brand?: string;

  @Column({ length: 255, nullable: true })
  model?: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  selling_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimum_price?: number;

  // Product attributes
  @Column({ type: 'json', default: '{}' })
  attributes: Record<string, any>;

  @Column({ type: 'json', default: '{}' })
  specifications: Record<string, any>;

  @Column({ type: 'json', default: '[]' })
  images: string[];

  // Status and metadata
  @Column({
    type: 'varchar',
    length: 50,
    default: 'active',
    enum: ['active', 'inactive', 'discontinued']
  })
  status: string;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ type: 'json', default: '[]' })
  tags: string[];

  // SEO and search
  @Column({ length: 255, nullable: true })
  meta_title?: string;

  @Column({ type: 'text', nullable: true })
  meta_description?: string;

  @Column({ type: 'json', default: '[]' })
  search_keywords: string[];

  @ManyToOne(() => Supplier, supplier => supplier.products)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => ProductCategory, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category?: ProductCategory;

  @OneToMany('Inventory', 'product')
  inventories: Inventory[];

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  order_items: OrderItem[];
}
