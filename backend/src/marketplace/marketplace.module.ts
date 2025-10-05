import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { SuppliersService } from './suppliers.service';
import { ProductsService } from './products.service';
import { OrdersService } from './orders.service';
import { Supplier } from './entities/supplier.entity';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      Product,
      ProductCategory,
      Order,
      OrderItem,
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    SuppliersService,
    ProductsService,
    OrdersService,
  ],
  exports: [
    MarketplaceService,
    SuppliersService,
    ProductsService,
    OrdersService,
  ],
})
export class MarketplaceModule {}
