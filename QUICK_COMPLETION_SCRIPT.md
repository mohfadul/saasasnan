# Quick Role Protection - Marketplace Module

Add these decorators to `backend/src/marketplace/marketplace.controller.ts`:

```typescript
// Suppliers (6 endpoints)
@Post('suppliers')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff')

@Get('suppliers')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Get('suppliers/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Patch('suppliers/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'supplier')

@Delete('suppliers/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin')

@Get('suppliers/stats/overview')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin')

// Products (9 endpoints)
@Post('products')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'supplier')

@Get('products')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Get('products/search')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Get('products/featured')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Get('products/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Patch('products/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'supplier')

@Delete('products/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin')

@Get('products/stats/overview')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin')

// Orders (2 endpoints)
@Get('orders')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

@Get('orders/:id')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin', 'staff', 'supplier')

// Overview (1 endpoint)
@Get('overview')
@UseGuards(RolesGuard)
@Roles('super_admin', 'hospital_admin')
```

**Total**: 18 endpoints  
**Security Level**: Admin/Staff/Supplier access

