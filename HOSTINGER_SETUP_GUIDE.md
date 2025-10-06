# Healthcare SaaS Platform - Hostinger Setup Guide

## Overview
This guide helps you migrate the Healthcare SaaS Platform from PostgreSQL to MySQL for Hostinger hosting compatibility.

## Prerequisites
- Hostinger hosting account (Web or Cloud hosting plan)
- MySQL database created in Hostinger control panel
- Domain name configured
- FTP/SFTP access or File Manager access

## Step 1: Hostinger Database Setup

### 1.1 Create MySQL Database
1. Log into your Hostinger control panel
2. Go to **Databases** → **MySQL Databases**
3. Create a new database:
   - Database name: `healthcare_platform` (or your preferred name)
   - Username: `healthcare_user` (or your preferred username)
   - Password: Generate a strong password
   - Host: `localhost` (for shared hosting) or provided host

### 1.2 Note Database Credentials
Save these credentials for later use:
```
Database Host: localhost (or provided host)
Database Port: 3306
Database Name: your_database_name
Username: your_username
Password: your_password
```

## Step 2: Update Backend Configuration

### 2.1 Install MySQL Dependencies
```bash
cd backend
npm uninstall pg
npm install mysql2@^3.6.5
```

### 2.2 Update Environment Configuration
Create `backend/.env` with your Hostinger database credentials:
```env
# Hostinger MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_hostinger_db_user
DB_PASSWORD=your_hostinger_db_password
DB_NAME=your_hostinger_db_name
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Encryption Configuration
ENCRYPTION_KEY=your-encryption-key-change-in-production

# Email Configuration (using Hostinger's SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-email@your-domain.com
SMTP_PASS=your-email-password

# Security Configuration
CORS_ORIGIN=https://your-domain.com
SESSION_SECRET=your-session-secret
```

### 2.3 Database Module Already Updated
The `backend/src/database/database.module.ts` has been updated for MySQL compatibility.

## Step 3: Database Schema Setup

### 3.1 Import MySQL Schema
1. Access your Hostinger database via phpMyAdmin or MySQL command line
2. Import the `database/mysql-schema.sql` file
3. Verify all tables are created successfully

### 3.2 Verify Schema Import
Check that these key tables exist:
- `tenants`
- `users`
- `patients`
- `appointments`
- `products`
- `invoices`
- `payments`

## Step 4: Entity Updates for MySQL

### 4.1 Key Changes Made
- UUID columns changed to VARCHAR(36)
- JSONB columns changed to JSON
- BYTEA columns changed to LONGBLOB
- PostgreSQL-specific types replaced with MySQL equivalents

### 4.2 Entities Updated
- `Patient` entity
- `BaseEntity` (compatible with MySQL)
- All other entities will need similar updates

## Step 5: Local Development with MySQL

### 5.1 Using Docker (Recommended)
```bash
# Start MySQL with Docker
docker-compose -f docker-compose.mysql.yml up -d

# Access phpMyAdmin at http://localhost:8080
# Default credentials:
# Username: healthcare_user
# Password: healthcare_password
```

### 5.2 Using Local MySQL Installation
```bash
# Install MySQL locally
# Create database
mysql -u root -p
CREATE DATABASE healthcare_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON healthcare_platform.* TO 'healthcare_user'@'localhost' IDENTIFIED BY 'healthcare_password';
FLUSH PRIVILEGES;

# Import schema
mysql -u healthcare_user -p healthcare_platform < database/mysql-schema.sql
```

## Step 6: Testing MySQL Compatibility

### 6.1 Test Database Connection
```bash
cd backend
npm run start:dev
```

### 6.2 Verify Connection
Check the console for successful database connection messages.

### 6.3 Test Basic Operations
- User registration/login
- Patient creation
- Appointment scheduling
- Product management

## Step 7: Hostinger Deployment

### 7.1 Upload Backend Files
1. Upload the entire `backend` folder to your Hostinger hosting
2. Ensure Node.js is enabled in your hosting plan
3. Set the document root to the backend folder

### 7.2 Configure Hostinger Environment
1. Set environment variables in Hostinger control panel
2. Configure domain routing
3. Set up SSL certificate

### 7.3 Upload Frontend Files
1. Upload the `admin-panel` build to your domain
2. Configure API endpoints to point to your backend
3. Test frontend-backend connectivity

## Step 8: Production Optimizations

### 8.1 MySQL Performance
```sql
-- Add performance indexes
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_appointments_start_time_status ON appointments(start_time, status);
CREATE INDEX idx_invoices_date_status ON invoices(invoice_date, status);
```

### 8.2 Security Hardening
- Use strong passwords
- Enable SSL/TLS
- Configure firewall rules
- Regular security updates

### 8.3 Monitoring Setup
- Monitor database performance
- Set up error logging
- Configure backup schedules

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: Check database credentials and host settings

#### 2. Authentication Failed
```
Error: Access denied for user
```
**Solution**: Verify username and password in Hostinger database settings

#### 3. Character Set Issues
```
Error: Incorrect string value
```
**Solution**: Ensure UTF8MB4 character set is used

#### 4. SSL Connection Issues
```
Error: SSL connection error
```
**Solution**: Set `DB_SSL=false` in environment variables

### Performance Issues

#### 1. Slow Queries
- Add appropriate indexes
- Optimize query patterns
- Monitor slow query log

#### 2. Connection Pool Exhaustion
- Increase pool size
- Implement connection recycling
- Monitor connection usage

## Migration Checklist

- [ ] Hostinger MySQL database created
- [ ] Database credentials obtained
- [ ] Backend dependencies updated (pg → mysql2)
- [ ] Environment variables configured
- [ ] MySQL schema imported
- [ ] Entities updated for MySQL compatibility
- [ ] Local testing completed
- [ ] Hostinger deployment completed
- [ ] Frontend-backend connectivity tested
- [ ] Production optimizations applied
- [ ] Security measures implemented
- [ ] Monitoring configured

## Support Resources

### Hostinger Documentation
- [Hostinger MySQL Database Setup](https://support.hostinger.com/en/articles/1583299-how-to-create-mysql-database)
- [Hostinger Node.js Hosting](https://support.hostinger.com/en/articles/1583301-how-to-set-up-node-js-applications)

### MySQL Documentation
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

## Next Steps

1. **Complete Entity Updates**: Update all remaining entities for MySQL compatibility
2. **Performance Testing**: Test with production-like data volumes
3. **Security Audit**: Review all security configurations
4. **Backup Strategy**: Implement automated database backups
5. **Monitoring Setup**: Configure comprehensive monitoring

---

**Note**: This migration ensures full compatibility with Hostinger's MySQL hosting environment while maintaining all existing functionality.
