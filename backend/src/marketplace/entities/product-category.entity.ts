import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_categories')
export class ProductCategory extends BaseEntity {
  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id?: string;

  @Column({ default: 0 })
  sort_order: number;

  @ManyToOne(() => ProductCategory, category => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent?: ProductCategory;

  @OneToMany(() => ProductCategory, category => category.parent)
  children: ProductCategory[];

  @OneToMany(() => Product, product => product.category)
  products: Product[];
}
