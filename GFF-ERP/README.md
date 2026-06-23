# GFF ERP Enterprise - Golden Farmonia Fidex

## Enterprise Resource Planning System for Feed Distribution, Manufacturing & Poultry Management

---

## Table of Contents
1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Quick Start](#quick-start)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Deployment](#deployment)
9. [API Documentation](#api-documentation)
10. [Module Overview](#module-overview)
11. [Security](#security)
12. [Support](#support)

---

## Overview

GFF ERP Enterprise is a comprehensive, production-ready ERP system built for Golden Farmonia Fidex (GFF) - a leading company in feed distribution, manufacturing, and poultry farm supplies. The system covers all business operations including:

- **Sales & Distribution** - Orders, invoices, returns, customers
- **Procurement** - Purchase orders, GRN, suppliers
- **Inventory** - Multi-warehouse, FIFO/Weighted-Average costing
- **Feed Manufacturing** - Formulas, production orders, quality control
- **Poultry Management** - Chicks batches, egg production, mortality tracking
- **Finance & Accounting** - Double-entry, chart of accounts, financial reports
- **HR & Payroll** - Employees, attendance, payroll processing
- **CRM** - Leads, activities, pipeline management
- **Logistics** - Fleet, drivers, trips, fuel tracking

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript 5 |
| Frontend | React 18, TypeScript 5, Vite 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| UI Library | Material UI 5 |
| State Management | Redux Toolkit, React Query |
| Forms | Formik + Yup |
| Charts | Recharts |
| Authentication | JWT with Refresh Tokens |
| Authorization | RBAC with 14 Roles |
| Server | Ubuntu 24.04, Nginx, PM2 |

---

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 24.04 LTS (or 22.04 LTS)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Node.js**: 20.x LTS
- **PostgreSQL**: 16.x
- **Nginx**: 1.24+

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Storage**: 100 GB SSD

---

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# 1. Upload the project to your server
tar -xzf gff-erp-enterprise.tar.gz -C /var/www/
cd /var/www/gff-erp

# 2. Run the setup script (installs all dependencies)
sudo bash deployment/scripts/setup.sh

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# 4. Run the deployment script
sudo bash deployment/scripts/deploy.sh

# 5. Access the application
# Frontend: https://your-domain.com
# API: https://your-domain.com/api
# Swagger: https://your-domain.com/api/docs
```

### Option 2: Manual Setup

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed manual installation.

---

## Installation

### Step 1: System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential nginx postgresql-16

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
psql --version  # Should show 16.x
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE gff_erp;

-- Create application user
CREATE USER gff_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE gff_erp TO gff_user;

-- Exit
\q

# Run initialization script
psql -U postgres -d gff_erp -f database/init.sql
```

### Step 3: Backend Installation

```bash
cd /var/www/gff-erp/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (creates admin user, roles, chart of accounts)
npx prisma db seed

# Build the application
npm run build
```

### Step 4: Frontend Installation

```bash
cd /var/www/gff-erp/frontend

# Install dependencies
npm install

# Build the application
npm run build

# The build output will be in the 'dist' directory
```

---

## Configuration

### Backend Environment Variables

Create `backend/.env` file:

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://gff_user:your_secure_password@localhost:5432/gff_erp?schema=public"

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Company
COMPANY_NAME="Golden Farmonia Fidex"
COMPANY_SHORT_NAME="GFF"
DEFAULT_BRANCH_ID=1

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=./uploads

# Email (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend Environment Variables

Create `frontend/.env.production` file:

```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_APP_NAME="GFF ERP"
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=ar
VITE_CURRENCY=EGP
VITE_DATE_FORMAT=DD/MM/YYYY
```

---

## Database Setup

### Migrations

```bash
cd /var/www/gff-erp/backend

# Generate Prisma client
npx prisma generate

# Deploy migrations (creates all tables)
npx prisma migrate deploy

# Seed database with initial data
npx prisma db seed
```

### What Gets Seeded

1. **Company Settings** - Default company configuration
2. **Branches** - Main branch
3. **Admin User** - admin@gff.com / admin123
4. **Roles** - 14 predefined roles (SUPER_ADMIN, ADMIN, MANAGER, etc.)
5. **Permissions** - All module permissions (module:action format)
6. **Role-Permissions** - Default assignments
7. **Chart of Accounts** - Complete double-entry accounting structure
8. **Units** - KG, TON, BAG, PIECE, BOX, LITER, METER
9. **Leave Types** - Annual, Sick, Emergency, Unpaid
10. **Number Sequences** - Auto-numbering for all documents

---

## Running the Application

### Development Mode

```bash
# Terminal 1 - Backend
cd /var/www/gff-erp/backend
npm run start:dev

# Terminal 2 - Frontend
cd /var/www/gff-erp/frontend
npm run dev
```

### Production Mode

```bash
# Start backend with PM2
cd /var/www/gff-erp/backend
pm2 start deployment/pm2/ecosystem.config.js

# Frontend is served by Nginx (static files from frontend/dist)

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Nginx Configuration

```bash
# Copy Nginx config
sudo cp deployment/nginx/gff-erp.conf /etc/nginx/sites-available/gff-erp

# Enable site
sudo ln -s /etc/nginx/sites-available/gff-erp /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

---

## Deployment

### Using Deploy Script

```bash
cd /var/www/gff-erp
sudo bash deployment/scripts/deploy.sh
```

This script will:
1. Create database backup
2. Pull latest code
3. Install dependencies
4. Run migrations
5. Build applications
6. Restart services
7. Run health checks

### Manual Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment procedures.

---

## API Documentation

Once the application is running, access the Swagger documentation:

```
https://your-domain.com/api/docs
```

### Authentication

All API requests require a Bearer token:

```bash
# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gff.com","password":"admin123"}'

# Response: { "accessToken": "...", "refreshToken": "..." }

# Use token in subsequent requests
curl https://your-domain.com/api/sales/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Branch-Id: 1"
```

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login |
| `POST /api/auth/refresh` | Refresh access token |
| `GET /api/dashboard/kpis` | Dashboard KPIs |
| `GET /api/sales/orders` | Sales orders list |
| `POST /api/sales/orders` | Create sales order |
| `GET /api/inventory` | Inventory levels |
| `GET /api/accounting/ledger` | General ledger |
| `GET /api/reports/sales` | Sales reports |

---

## Module Overview

### Core Modules (45+ Backend Modules)

| Module | Description | Frontend Pages |
|--------|-------------|----------------|
| **Auth** | JWT authentication, login, refresh | Login, Forgot Password |
| **Dashboard** | Real-time KPIs, charts, summaries | Dashboard |
| **Sales** | Orders, invoices, returns, price lists | 6 pages |
| **Purchases** | POs, GRN, returns, suppliers | 5 pages |
| **Inventory** | Stock levels, movements, transfers | 5 pages |
| **Products** | Catalog, categories, brands, units | 3 pages |
| **Warehouses** | Multi-warehouse management | 2 pages |
| **Branches** | Multi-branch operations | 1 page |
| **Customers** | CRM, statements, credit limits | 4 pages |
| **Suppliers** | Vendor management, rating | 4 pages |
| **Treasury** | Cash position, transfers | 2 pages |
| **Banks** | Accounts, transactions, reconciliation | 4 pages |
| **Cashboxes** | Cash management, daily reports | 2 pages |
| **Accounting** | COA, journals, ledger, financial reports | 10 pages |
| **HR** | Employees, attendance, payroll | 11 pages |
| **CRM** | Leads, activities, pipeline | 5 pages |
| **Logistics** | Vehicles, drivers, trips, fuel | 11 pages |
| **Production** | Manufacturing orders, QC, yield | 5 pages |
| **Feed Formulation** | Nutritional calculations, formulas | 4 pages |
| **Poultry** | Chicks batches, mortality, eggs | 8 pages |
| **Reports** | Sales, inventory, financial reports | 4 pages |
| **Settings** | Company, profile, preferences | 1 page |

---

## Security

### Authentication & Authorization
- JWT with access and refresh tokens
- 14 predefined roles from SUPER_ADMIN to VIEWER
- Granular permissions (module:action format)
- Branch-based data isolation
- Password hashing with bcrypt

### Data Protection
- HTTPS enforcement
- CORS configuration
- Helmet.js security headers
- Input validation (class-validator)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention
- Rate limiting

### Audit
- All mutations logged with old/new data
- User action tracking
- Branch-scoped audit trail

See [docs/SECURITY_REPORT.md](docs/SECURITY_REPORT.md) for complete security documentation.

---

## Default Login Credentials

```
Email:    admin@gff.com
Password: admin123
Role:     SUPER_ADMIN
Branch:   Main Branch
```

**IMPORTANT:** Change the default password after first login.

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Total Files | 642 |
| Total Lines of Code | 115,994 |
| Backend TypeScript Files | 447 (52,605 lines) |
| Frontend TypeScript Files | 160 (47,194 lines) |
| Documentation | 9 files (10,882 lines) |
| Backend Modules | 45+ |
| Frontend Pages | 27 modules |
| Database Models | 41 |
| Database Enums | 54 |
| API Endpoints | 200+ |
| System Roles | 14 |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | System architecture and design |
| [docs/DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) | Database schema and ERD |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | API reference guide |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Detailed installation steps |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment procedures |
| [docs/SECURITY_REPORT.md](docs/SECURITY_REPORT.md) | Security audit report |
| [docs/TEST_REPORT.md](docs/TEST_REPORT.md) | Testing strategy and cases |
| [docs/PERFORMANCE_REPORT.md](docs/PERFORMANCE_REPORT.md) | Performance optimization |
| [docs/FINAL_AUDIT_REPORT.md](docs/FINAL_AUDIT_REPORT.md) | Final quality audit |

---

## Backup

### Automated Daily Backups

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /var/www/gff-erp/deployment/scripts/backup.sh >> /var/log/gff-backup.log 2>&1
```

### Manual Backup

```bash
/var/www/gff-erp/deployment/scripts/backup.sh
```

Backups are stored in `/var/backups/gff-erp/` with automatic retention (30 days).

---

## Monitoring

### PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs gff-erp-backend

# Monitor resources
pm2 monit
```

### Health Check Endpoint
```bash
curl https://your-domain.com/api/health
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -U gff_user -d gff_erp -h localhost -c "SELECT 1"
```

### Application Won't Start
```bash
# Check logs
pm2 logs gff-erp-backend

# Verify environment variables
cat /var/www/gff-erp/backend/.env

# Check port availability
sudo lsof -i :3000
```

### Frontend Build Issues
```bash
# Clear cache and rebuild
cd /var/www/gff-erp/frontend
rm -rf node_modules dist
npm install
npm run build
```

---

## Support

For technical support or questions:
- **Email:** support@gff-erp.com
- **Documentation:** See `docs/` directory
- **API Docs:** Available at `/api/docs` when application is running

---

## License

Proprietary - Golden Farmonia Fidex (GFF)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release |

---

**Built with precision for Golden Farmonia Fidex (GFF)**
