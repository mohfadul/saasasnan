import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Supplier } from './entities/supplier.entity';

export interface CreateProductDto {
  supplierId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  brand?: string;
  model?: string;
  costPrice: number;
  sellingPrice: number;
  minimumPrice?: number;
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  images?: string[];
  isFeatured?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: string;
}

export interface ProductFilters {
  supplierId?: string;
  categoryId?: string;
  status?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string[];
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createProductDto: CreateProductDto, tenantId: string): Promise<Product> {
    // Check if supplier exists and belongs to tenant
    const supplier = await this.suppliersRepository.findOne({
      where: { id: createProductDto.supplierId, tenant_id: tenantId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Check if SKU already exists for this tenant
    const existingProduct = await this.productsRepository.findOne({
      where: { sku: createProductDto.sku, tenant_id: tenantId },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    // Check category if provided
    if (createProductDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: createProductDto.categoryId, tenant_id: tenantId },
      });

      if (!category) {
        throw new NotFoundException('Product category not found');
      }
    }

    const product = this.productsRepository.create({
      tenant_id: tenantId,
      supplier_id: createProductDto.supplierId,
      category_id: createProductDto.categoryId,
      name: createProductDto.name,
      description: createProductDto.description,
      sku: createProductDto.sku,
      barcode: createProductDto.barcode,
      brand: createProductDto.brand,
      model: createProductDto.model,
      cost_price: createProductDto.costPrice,
      selling_price: createProductDto.sellingPrice,
      minimum_price: createProductDto.minimumPrice,
      attributes: createProductDto.attributes || {},
      specifications: createProductDto.specifications || {},
      images: createProductDto.images || [],
      is_featured: createProductDto.isFeatured || false,
      tags: createProductDto.tags || [],
      meta_title: createProductDto.metaTitle,
      meta_description: createProductDto.metaDescription,
      search_keywords: createProductDto.searchKeywords || [],
    });

    return await this.productsRepository.save(product);
  }

  async findAll(tenantId: string, filters: ProductFilters = {}): Promise<Product[]> {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.tenant_id = :tenantId', { tenantId });

    // Apply filters
    if (filters.supplierId) {
      query.andWhere('product.supplier_id = :supplierId', { supplierId: filters.supplierId });
    }

    if (filters.categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters.isFeatured !== undefined) {
      query.andWhere('product.is_featured = :isFeatured', { isFeatured: filters.isFeatured });
    }

    if (filters.minPrice) {
      query.andWhere('product.selling_price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice) {
      query.andWhere('product.selling_price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      query.andWhere('product.tags && :tags', { tags: filters.tags });
    }

    return await query
      .orderBy('product.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['supplier', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    // Check if SKU is being changed and if it conflicts
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productsRepository.findOne({
        where: { sku: updateProductDto.sku, tenant_id: tenantId },
      });

      if (existingProduct) {
        throw new BadRequestException('Product with this SKU already exists');
      }
    }

    // Check supplier if being changed
    if (updateProductDto.supplierId) {
      const supplier = await this.suppliersRepository.findOne({
        where: { id: updateProductDto.supplierId, tenant_id: tenantId },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    // Check category if being changed
    if (updateProductDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateProductDto.categoryId, tenant_id: tenantId },
      });

      if (!category) {
        throw new NotFoundException('Product category not found');
      }
    }

    // Update fields
    Object.assign(product, {
      supplier_id: updateProductDto.supplierId || product.supplier_id,
      category_id: updateProductDto.categoryId !== undefined ? updateProductDto.categoryId : product.category_id,
      name: updateProductDto.name || product.name,
      description: updateProductDto.description !== undefined ? updateProductDto.description : product.description,
      sku: updateProductDto.sku || product.sku,
      barcode: updateProductDto.barcode !== undefined ? updateProductDto.barcode : product.barcode,
      brand: updateProductDto.brand !== undefined ? updateProductDto.brand : product.brand,
      model: updateProductDto.model !== undefined ? updateProductDto.model : product.model,
      cost_price: updateProductDto.costPrice !== undefined ? updateProductDto.costPrice : product.cost_price,
      selling_price: updateProductDto.sellingPrice !== undefined ? updateProductDto.sellingPrice : product.selling_price,
      minimum_price: updateProductDto.minimumPrice !== undefined ? updateProductDto.minimumPrice : product.minimum_price,
      attributes: updateProductDto.attributes !== undefined ? updateProductDto.attributes : product.attributes,
      specifications: updateProductDto.specifications !== undefined ? updateProductDto.specifications : product.specifications,
      images: updateProductDto.images !== undefined ? updateProductDto.images : product.images,
      status: updateProductDto.status || product.status,
      is_featured: updateProductDto.isFeatured !== undefined ? updateProductDto.isFeatured : product.is_featured,
      tags: updateProductDto.tags !== undefined ? updateProductDto.tags : product.tags,
      meta_title: updateProductDto.metaTitle !== undefined ? updateProductDto.metaTitle : product.meta_title,
      meta_description: updateProductDto.metaDescription !== undefined ? updateProductDto.metaDescription : product.meta_description,
      search_keywords: updateProductDto.searchKeywords !== undefined ? updateProductDto.searchKeywords : product.search_keywords,
    });

    return await this.productsRepository.save(product);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const product = await this.findOne(id, tenantId);
    await this.productsRepository.softDelete(id);
  }

  async searchProducts(tenantId: string, searchTerm: string, filters: ProductFilters = {}): Promise<Product[]> {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.status = :status', { status: 'active' });

    // Full-text search
    if (searchTerm) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search OR product.brand ILIKE :search OR product.tags && :searchArray)',
        { 
          search: `%${searchTerm}%`,
          searchArray: [searchTerm]
        }
      );
    }

    // Apply additional filters
    if (filters.supplierId) {
      query.andWhere('product.supplier_id = :supplierId', { supplierId: filters.supplierId });
    }

    if (filters.categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.minPrice) {
      query.andWhere('product.selling_price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice) {
      query.andWhere('product.selling_price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    return await query
      .orderBy('product.is_featured', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .getMany();
  }

  async getFeaturedProducts(tenantId: string, limit: number = 10): Promise<Product[]> {
    return await this.productsRepository.find({
      where: { 
        tenant_id: tenantId, 
        status: 'active', 
        is_featured: true 
      },
      relations: ['supplier', 'category'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getProductStats(tenantId: string): Promise<any> {
    const totalProducts = await this.productsRepository.count({
      where: { tenant_id: tenantId },
    });

    const activeProducts = await this.productsRepository.count({
      where: { tenant_id: tenantId, status: 'active' },
    });

    const featuredProducts = await this.productsRepository.count({
      where: { tenant_id: tenantId, is_featured: true },
    });

    const categoriesCount = await this.categoriesRepository.count({
      where: { tenant_id: tenantId },
    });

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      featuredProducts,
      categoriesCount,
    };
  }
}
