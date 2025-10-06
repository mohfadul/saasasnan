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
import { MarketplaceService } from './marketplace.service';
import { SuppliersService, CreateSupplierDto, UpdateSupplierDto } from './suppliers.service';
import { ProductsService, CreateProductDto, UpdateProductDto, ProductFilters } from './products.service';
import { OrdersService } from './orders.service';
import { User } from '../auth/entities/user.entity';

@ApiTags('Marketplace')
@Controller('marketplace')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly suppliersService: SuppliersService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
  ) {}

  // Suppliers endpoints
  @Post('suppliers')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  createSupplier(@Body() createSupplierDto: CreateSupplierDto, @Request() req: { user: User }) {
    return this.suppliersService.create(createSupplierDto, req.user.tenant_id);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  getSuppliers(@Request() req: { user: User }, @Query('status') status?: string) {
    return this.suppliersService.findAll(req.user.tenant_id, status);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  getSupplier(@Param('id') id: string, @Request() req: { user: User }) {
    return this.suppliersService.findOne(id, req.user.tenant_id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  updateSupplier(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Request() req: { user: User },
  ) {
    return this.suppliersService.update(id, updateSupplierDto, req.user.tenant_id);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  deleteSupplier(@Param('id') id: string, @Request() req: { user: User }) {
    return this.suppliersService.remove(id, req.user.tenant_id);
  }

  @Get('suppliers/stats/overview')
  @ApiOperation({ summary: 'Get supplier statistics' })
  @ApiResponse({ status: 200, description: 'Supplier statistics retrieved successfully' })
  getSupplierStats(@Request() req: { user: User }) {
    return this.suppliersService.getSupplierStats(req.user.tenant_id);
  }

  // Products endpoints
  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  createProduct(@Body() createProductDto: CreateProductDto, @Request() req: { user: User }) {
    return this.productsService.create(createProductDto, req.user.tenant_id);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'supplierId', required: false, description: 'Filter by supplier ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'isFeatured', required: false, description: 'Filter featured products' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  getProducts(
    @Request() req: { user: User },
    @Query() filters: ProductFilters,
  ) {
    return this.productsService.findAll(req.user.tenant_id, filters);
  }

  @Get('products/search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'supplierId', required: false, description: 'Filter by supplier ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  searchProducts(
    @Request() req: { user: User },
    @Query('q') searchTerm: string,
    @Query() filters: ProductFilters,
  ) {
    return this.productsService.searchProducts(req.user.tenant_id, searchTerm, filters);
  }

  @Get('products/featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return' })
  @ApiResponse({ status: 200, description: 'Featured products retrieved successfully' })
  getFeaturedProducts(
    @Request() req: { user: User },
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getFeaturedProducts(req.user.tenant_id, limit || 10);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  getProduct(@Param('id') id: string, @Request() req: { user: User }) {
    return this.productsService.findOne(id, req.user.tenant_id);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: { user: User },
  ) {
    return this.productsService.update(id, updateProductDto, req.user.tenant_id);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  deleteProduct(@Param('id') id: string, @Request() req: { user: User }) {
    return this.productsService.remove(id, req.user.tenant_id);
  }

  @Get('products/stats/overview')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Product statistics retrieved successfully' })
  getProductStats(@Request() req: { user: User }) {
    return this.productsService.getProductStats(req.user.tenant_id);
  }

  // Orders endpoints
  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'supplierId', required: false, description: 'Filter by supplier ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  getOrders(
    @Request() req: { user: User },
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(req.user.tenant_id, req.user.clinic_id, supplierId, status as any);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  getOrder(@Param('id') id: string, @Request() req: { user: User }) {
    return this.ordersService.findOne(id, req.user.tenant_id);
  }

  // Marketplace overview
  @Get('overview')
  @ApiOperation({ summary: 'Get marketplace overview statistics' })
  @ApiResponse({ status: 200, description: 'Marketplace overview retrieved successfully' })
  getMarketplaceOverview(@Request() req: { user: User }) {
    return this.marketplaceService.getOverview(req.user.tenant_id);
  }
}
