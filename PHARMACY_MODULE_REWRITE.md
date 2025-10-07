# Pharmacy Module - Complete Rewrite for Healthcare SaaS

**Source**: Angular + Express + MongoDB Pharmacy Dashboard  
**Target**: NestJS + React + MySQL Healthcare SaaS Module  
**Date**: October 7, 2025  
**Status**: 🔄 In Progress

---

## 📊 Analysis of Original Pharmacy Dashboard

### **Technology Stack (Original):**
- **Frontend**: Angular 8 + Angular Material
- **Backend**: Express.js + Node.js
- **Database**: MongoDB (Mongoose)
- **Features**: Inventory, Sales, Suppliers, Doctor Orders, Analytics

### **Core Features Identified:**

1. **Drug Inventory Management**
   - Add/Edit/Delete drugs
   - Batch tracking with expiry dates
   - Image uploads
   - Price management
   - Stock quantities

2. **Point of Sale (POS)**
   - Shopping cart
   - Billing and checkout
   - Multiple payment methods
   - Sales receipts
   - Tax calculations

3. **Supplier Management**
   - Supplier CRUD
   - Contact information
   - Drugs available per supplier
   - Email notifications for expiry/low stock

4. **Doctor Prescriptions**
   - Prescription orders from doctors
   - Verification workflow
   - Pickup tracking
   - Order status management

5. **Sales Analytics**
   - Sales charts and graphs
   - Revenue tracking
   - Sales history

6. **Alerts & Notifications**
   - Expiring drugs alerts
   - Out of stock alerts
   - Low stock warnings
   - Email notifications to suppliers

7. **Predictions (ML)**
   - Sales predictions using TensorFlow.js/Brain.js
   - Demand forecasting

---

## ✅ Created Backend Entities (NestJS + TypeORM)

### **Files Created:** `backend/src/pharmacy/entities/`

1. **`drug.entity.ts`** (98 lines)
   - Complete drug information
   - Pricing, dosage, manufacturer
   - Requires prescription flag
   - Controlled substance flag
   - Storage requirements
   - Side effects and contraindications

2. **`drug-inventory.entity.ts`** (77 lines)
   - Stock quantities (current, min, max)
   - Batch tracking
   - Expiry dates
   - Shelf location
   - Alert flags (expiry, low stock)
   - Status (available, low_stock, out_of_stock, expired)

3. **`pharmacy-sale.entity.ts`** (82 lines)
   - Sale transactions
   - Customer/patient information
   - Prescription reference
   - Financial breakdown (subtotal, tax, discount, total)
   - Payment tracking (paid, balance)
   - Multiple payment methods

4. **`pharmacy-sale-item.entity.ts`** (48 lines)
   - Individual sale line items
   - Quantity and pricing
   - Batch reference

5. **`pharmacy-supplier.entity.ts`** (68 lines)
   - Supplier information
   - Contact details
   - Performance metrics (rating, on-time delivery)
   - Notification preferences
   - Status tracking

6. **`doctor-prescription.entity.ts`** (75 lines)
   - Doctor information
   - Patient reference
   - Prescription tracking
   - Verification workflow
   - Pickup dates and status

7. **`prescription-item.entity.ts`** (55 lines)
   - Prescribed drugs
   - Dosage instructions
   - Quantity prescribed vs dispensed
   - Duration and frequency

8. **`drug-category.entity.ts`** (28 lines)
   - Drug categorization
   - Hierarchical support

---

## 🎯 Architecture Mapping

### **Original → Healthcare SaaS**

| Original (Angular/Express/Mongo) | Healthcare SaaS (React/NestJS/MySQL) |
|----------------------------------|--------------------------------------|
| Mongoose Schemas | TypeORM Entities |
| Express Routes | NestJS Controllers |
| Simple middleware | Guards + Interceptors |
| No multi-tenancy | Tenant-scoped |
| MongoDB _id | UUID primary keys |
| Simple auth | JWT + RBAC |
| Angular Material | Tailwind + ShadCN UI |
| No real-time | Potential Socket.io |
| Basic validation | class-validator DTOs |
| No audit logging | Complete audit trails |

---

## 🏗️ Planned Structure

```
backend/src/pharmacy/
├── entities/
│   ├── drug.entity.ts ✅
│   ├── drug-inventory.entity.ts ✅
│   ├── drug-category.entity.ts ✅
│   ├── pharmacy-sale.entity.ts ✅
│   ├── pharmacy-sale-item.entity.ts ✅
│   ├── pharmacy-supplier.entity.ts ✅
│   ├── doctor-prescription.entity.ts ✅
│   └── prescription-item.entity.ts ✅
│
├── dto/
│   ├── create-drug.dto.ts ⏳
│   ├── create-sale.dto.ts ⏳
│   ├── create-prescription.dto.ts ⏳
│   └── ...more DTOs
│
├── pharmacy.controller.ts ⏳
├── pharmacy.service.ts ⏳
├── sales.service.ts ⏳
├── inventory.service.ts ⏳
├── prescription.service.ts ⏳
├── suppliers.service.ts ⏳
└── pharmacy.module.ts ✅

admin-panel/src/components/pharmacy/
├── DrugInventoryTable.tsx ⏳
├── DrugInventoryForm.tsx ⏳
├── POSWindow.tsx ⏳
├── SalesCheckout.tsx ⏳
├── PrescriptionTable.tsx ⏳
├── PrescriptionForm.tsx ⏳
├── PharmacySupplierTable.tsx ⏳
├── ExpiryAlerts.tsx ⏳
└── StockAlerts.tsx ⏳

admin-panel/src/pages/
└── PharmacyPage.tsx ⏳

admin-panel/src/types/
└── pharmacy.ts ⏳

database/schemas/
└── pharmacy-schema.sql ⏳
```

---

## 🎯 Key Features to Implement

### **1. Drug Inventory Management**
- CRUD operations for drugs
- Batch tracking with expiry dates
- Multi-location support
- Image upload for drugs
- Category management
- Stock level tracking

### **2. Point of Sale (POS)**
- Shopping cart interface
- Quick drug search
- Barcode scanning support
- Receipt generation
- Multiple payment methods
- Tax calculations

### **3. Prescription Management**
- Doctor prescription entry
- Verification workflow
- Pickup tracking
- Patient linkage
- Dosage instructions

### **4. Supplier Management**
- Supplier CRUD
- Drug-supplier relationships
- Automated reorder notifications
- Performance tracking

### **5. Alerts & Notifications**
- Expiry alerts (30/60/90 days)
- Low stock alerts
- Out of stock notifications
- Email to suppliers
- Dashboard widgets

### **6. Analytics & Reports**
- Sales charts (daily, weekly, monthly)
- Revenue analytics
- Top-selling drugs
- Stock movement reports
- Expiry reports

---

## 🔧 Integration with Healthcare SaaS

### **Multi-Tenancy:**
- All entities include `tenant_id`
- All entities include `clinic_id`
- Tenant isolation enforced
- Clinic-level pharmacy inventory

### **Authentication:**
- Uses existing JWT auth
- RBAC for pharmacy staff
- Cashier, Pharmacist, Manager roles

### **Database:**
- MySQL instead of MongoDB
- Proper foreign keys
- Indexed for performance
- Audit logging built-in

### **Frontend:**
- React instead of Angular
- Tailwind CSS + ShadCN UI
- React Query for state management
- Follows existing admin panel patterns

---

## 📋 Next Steps

### **Backend (Remaining):**
1. Create DTOs for all operations
2. Implement services (Sales, Inventory, Prescriptions, Suppliers)
3. Create controllers with proper guards
4. Add validation and error handling
5. Implement alert/notification system
6. Add analytics endpoints

### **Frontend (Complete):**
1. Create PharmacyPage with tabs
2. Build DrugInventory components
3. Build POS interface
4. Build Prescription management
5. Build Supplier management
6. Create alerts dashboard
7. Add TypeScript types

### **Database:**
1. Create complete pharmacy schema
2. Add indexes for performance
3. Create seed data
4. Migration scripts

### **Integration:**
1. Register module in app.module.ts
2. Add pharmacy routes to sidebar
3. Create pharmacy permissions
4. Test complete workflow

---

## 📊 Estimated Work

**Total Components:** ~20 files  
**Backend Services:** ~1,500 lines  
**Frontend Components:** ~2,500 lines  
**Database Schema:** ~500 lines  
**TypeScript Types:** ~400 lines  
**Total Effort:** Large (multi-hour project)

---

## 🎯 Current Status

✅ **Completed:**
- Entity design (8 entities, 500+ lines)
- Module structure
- Architecture planning

⏳ **In Progress:**
- Services implementation
- Controllers
- DTOs

📋 **Pending:**
- Frontend components
- Database schema
- Integration
- Testing

---

**This is a comprehensive rewrite. Would you like me to:**
1. **Continue building everything** (services, controllers, frontend, database)?
2. **Build just the POS feature first** (focused approach)?
3. **Create a detailed blueprint** for you to review before building?

Let me know how you'd like to proceed!

