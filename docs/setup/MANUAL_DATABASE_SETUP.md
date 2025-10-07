# Manual Database Setup Guide

## Option 1: Using Docker (Recommended)

### Prerequisites
- Docker Desktop installed
- Docker Compose available

### Steps
1. Run the setup script:
   ```bash
   # Windows
   .\start-dev-environment.ps1
   
   # Or manually
   docker-compose up -d
   ```

2. Wait for containers to start (about 30 seconds)

3. Verify database is running:
   ```bash
   docker exec healthcare-postgres psql -U postgres -d healthcare_platform -c "SELECT version();"
   ```

## Option 2: Local PostgreSQL Installation

### Windows Installation
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the 'postgres' user
4. Update `backend/.env` with your credentials

### Database Setup
1. Open pgAdmin or command line
2. Create database:
   ```sql
   CREATE DATABASE healthcare_platform;
   ```

3. Run schema:
   ```bash
   psql -U postgres -d healthcare_platform -f database/schema.sql
   ```

## Option 3: Cloud Database (Quick Setup)

### Supabase (Free Tier)
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Update `backend/.env`:
   ```
   DB_HOST=your-project.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-password
   DB_NAME=postgres
   ```

### Railway (Free Tier)
1. Go to https://railway.app
2. Deploy PostgreSQL template
3. Get connection details
4. Update environment variables

## Verification

Test database connection:
```bash
cd backend
npm run start:dev
```

Check API health:
```bash
curl http://localhost:3001/api/docs
```

## Troubleshooting

### Common Issues
1. **Port 5432 already in use**: Change port in docker-compose.yml
2. **Permission denied**: Run terminal as administrator
3. **Connection refused**: Check if PostgreSQL is running
4. **Authentication failed**: Verify credentials in .env file

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

## Next Steps
Once database is running:
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd admin-panel && npm start`
3. Test login with default credentials
4. Verify all endpoints work
