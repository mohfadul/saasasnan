import { Injectable } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { ProductsService } from './products.service';
import { OrdersService } from './orders.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private suppliersService: SuppliersService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
  ) {}

  async getOverview(tenantId: string): Promise<any> {
    const [supplierStats, productStats, orderStats] = await Promise.all([
      this.suppliersService.getSupplierStats(tenantId),
      this.productsService.getProductStats(tenantId),
      this.ordersService.getOrderStats(tenantId),
    ]);

    return {
      suppliers: supplierStats,
      products: productStats,
      orders: orderStats,
      summary: {
        totalSuppliers: supplierStats.totalSuppliers,
        totalProducts: productStats.totalProducts,
        totalOrders: orderStats.totalOrders,
        averageSupplierRating: supplierStats.averageRating,
      },
    };
  }
}
