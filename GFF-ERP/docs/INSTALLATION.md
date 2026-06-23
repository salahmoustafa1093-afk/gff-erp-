# GFF ERP Enterprise - Installation Guide

**Document Version:** 1.0  
**Date:** June 2025  
**Target OS:** Ubuntu 24.04 LTS  
**Status:** Production Ready

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [System Requirements](#2-system-requirements)
3. [Server Preparation](#3-server-preparation)
4. [PostgreSQL Installation](#4-postgresql-installation)
5. [Node.js Installation](#5-nodejs-installation)
6. [Nginx Installation](#6-nginx-installation)
7. [Project Setup](#7-project-setup)
8. [Backend Setup](#8-backend-setup)
9. [Frontend Setup](#9-frontend-setup)
10. [Nginx Configuration](#10-nginx-configuration)
11. [PM2 Configuration](#11-pm2-configuration)
12. [SSL Setup](#12-ssl-setup)
13. [First Admin Login](#13-first-admin-login)
14. [Post-Installation Verification](#14-post-installation-verification)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Ubuntu Server | 24.04 LTS | Operating system |
| Node.js | 20.x LTS | JavaScript runtime |
| PostgreSQL | 16.x | Relational database |
| Nginx | 1.24+ | Reverse proxy / web server |
| PM2 | 5.x | Process manager |
| npm | 10.x | Package manager |
| Git | 2.x+ | Version control |

### 1.2 Required Access

- Root or sudo access to the server
- Domain name pointing to server IP (for SSL)
- Firewall access to ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## 2. System Requirements

### 2.1 Minimum Requirements

| Resource | Small (< 20 users) | Medium (20-100 users) | Large (100+ users) |
|----------|-------------------|----------------------|-------------------|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **RAM** | 4 GB | 8 GB | 16+ GB |
| **Disk** | 50 GB SSD | 100 GB SSD | 250+ GB SSD |
| **Network** | 100 Mbps | 1 Gbps | 1 Gbps |

### 2.2 Storage Breakdown

| Component | Estimated Size |
|-----------|---------------|
| Operating System | 10 GB |
| PostgreSQL (initial) | 5 GB |
| Application code | 2 GB |
| Frontend build | 500 MB |
| Logs (30 days) | 5 GB |
| Backups (30 days) | 20 GB |
| Uploads/Documents | 10 GB |
| **Total Initial** | **~30 GB** |

---

## 3. Server Preparation

### 3.1 Update System Packages

```bash
# Update package lists and upgrade all packages
sudo apt update && sudo apt upgrade -y

# Install essential utilities
sudo apt install -y curl wget vim nano htop net-tools unzip \
    build-essential software-properties-common apt-transport-https \
    ca-certificates gnupg lsb-release git fail2ban ufw \
    libpq-dev postgresql-client

# Set timezone to Riyadh (Saudi Arabia) - adjust as needed
sudo timedatectl set-timezone Asia/Riyadh

# Verify timezone
date
```

### 3.2 Configure Firewall

```bash
# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow PostgreSQL only from localhost (do NOT expose to internet)
# sudo ufw allow 5432/tcp  # Only if remote access needed

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 3.3 Create Application User

```bash
# Create dedicated system user for the application
sudo useradd -r -s /bin/bash -m -d /opt/gff-erp -c "GFF ERP Application" gff-erp

# Add to sudo group for deployment
sudo usermod -aG sudo gff-erp

# Set directory permissions
sudo mkdir -p /opt/gff-erp/{backend,frontend,logs,backups,uploads}
sudo chown -R gff-erp:gff-erp /opt/gff-erp
sudo chmod 755 /opt/gff-erp

# Create SSH directory for deployment keys
sudo mkdir -p /opt/gff-erp/.ssh
sudo chmod 700 /opt/gff-erp/.ssh
```

### 3.4 Create Log Directories

```bash
sudo mkdir -p /var/log/gff-erp
sudo chown -R gff-erp:gff-erp /var/log/gff-erp
sudo chmod 755 /var/log/gff-erp
```

---

## 4. PostgreSQL Installation

### 4.1 Install PostgreSQL 16

```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16 postgresql-client-16

# Enable and start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Verify installation
psql --version
sudo -u postgres psql -c "SELECT version();"
```

### 4.2 Configure PostgreSQL

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Update the following settings:

```ini
# Connection Settings
listen_addresses = 'localhost'
max_connections = 200

# Memory Settings (adjust based on your RAM)
shared_buffers = 256MB                  # 25% of RAM for dedicated DB server
effective_cache_size = 768MB            # 50% of total RAM
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL Settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 1GB
min_wal_size = 512MB

# Query Planner
random_page_cost = 1.1                  # For SSD storage
effective_io_concurrency = 200          # For SSD storage

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_min_duration_statement = 1000       # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Locale and Encoding
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
timezone = 'UTC'
```

### 4.3 Configure Authentication

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Ensure the file contains:

```
# Local connections (Unix socket)
local   all             postgres                                peer
local   gff_erp_db      gff_erp_user                            scram-sha-256

# IPv4 local connections
host    gff_erp_db      gff_erp_user    127.0.0.1/32            scram-sha-256
host    all             postgres        127.0.0.1/32            scram-sha-256

# IPv6 local connections
host    gff_erp_db      gff_erp_user    ::1/128                 scram-sha-256

# Reject all other connections
host    all             all             0.0.0.0/0               reject
```

### 4.4 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql
```

```sql
-- Create application database
CREATE DATABASE gff_erp_db
  WITH ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Create application user with strong password
CREATE USER gff_erp_user WITH ENCRYPTED PASSWORD 'YourStrongPasswordHere!2025';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE gff_erp_db TO gff_erp_user;

-- Connect to database
\c gff_erp_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gff_erp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gff_erp_user;

-- Verify
\du
\l

-- Exit
\q
```

### 4.5 Restart PostgreSQL

```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

### 4.6 Test Connection

```bash
# Test connection as application user
psql -U gff_erp_user -d gff_erp_db -h localhost -W

# Should prompt for password and connect
# Type \q to exit
```

---

## 5. Node.js Installation

### 5.1 Install Node.js 20 LTS via NVM

```bash
# Switch to application user
sudo su - gff-erp

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20 LTS
nvm install 20
nvm alias default 20
nvm use 20

# Verify installation
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x

# Exit back to root
exit
```

### 5.2 Install Global npm Packages

```bash
sudo su - gff-erp

npm install -g pm2@latest
npm install -g @nestjs/cli@latest
npm install -g prisma@latest

# Verify
pm2 --version
nest --version
prisma --version

exit
```

---

## 6. Nginx Installation

### 6.1 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Enable and start
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify
nginx -version
sudo systemctl status nginx
```

### 6.2 Remove Default Configuration

```bash
# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Create backup of original config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.original
```

### 6.3 Basic Nginx Configuration

```bash
sudo nano /etc/nginx/nginx.conf
```

Replace with optimized configuration:

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" $request_time';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=120r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

    # Include application config
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

---

## 7. Project Setup

### 7.1 Create Project Directory Structure

```bash
# Switch to application user
sudo su - gff-erp

# Create directory structure
mkdir -p /opt/gff-erp/{backend,frontend,logs,backups,uploads}
mkdir -p /opt/gff-erp/logs/{nginx,pm2,postgresql}

exit
```

### 7.2 Transfer Project Files

```bash
# Option 1: Clone from Git repository
cd /opt/gff-erp
sudo -u gff-erp git clone https://your-repo.com/gff-erp.git .

# Option 2: Extract from archive
cd /opt/gff-erp
sudo -u gff-erp tar -xzf /path/to/gff-erp.tar.gz

# Option 3: Upload via SCP from local machine
# scp -r ./gff-erp user@server:/opt/
```

**Expected directory structure:**
```
/opt/gff-erp/
├── backend/          # NestJS backend source
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React frontend source
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── logs/             # Application logs
├── backups/          # Database backups
└── uploads/          # File uploads
```

---

## 8. Backend Setup

### 8.1 Install Backend Dependencies

```bash
# Switch to application user
sudo su - gff-erp

cd /opt/gff-erp/backend

# Install dependencies
npm install

# Verify node_modules created
ls node_modules | head -20
```

### 8.2 Configure Environment Variables

```bash
cd /opt/gff-erp/backend

cp .env.example .env
nano .env
```

Complete `.env` file:

```env
# ============================================
# GFF ERP Enterprise - Backend Configuration
# ============================================

# Application
NODE_ENV=production
PORT=3000
HOST=127.0.0.1

# Database
DATABASE_URL="postgresql://gff_erp_user:YourStrongPasswordHere!2025@localhost:5432/gff_erp_db?schema=public&connection_limit=20&pool_timeout=30"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# CORS
CORS_ORIGINS=https://erp.yourdomain.com,https://admin.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/gff-erp/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=30

# Uploads
UPLOAD_DIR=/opt/gff-erp/uploads
MAX_FILE_SIZE=10485760

# Company
COMPANY_NAME="GFF ERP Enterprise"
COMPANY_LOGO=/assets/logo.png
DEFAULT_LANGUAGE=ar
DEFAULT_CURRENCY=SAR

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900

# Session
SESSION_SECRET=your-session-secret-change-this

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@gff-erp.com

# Redis (optional - for caching and sessions)
# REDIS_URL=redis://localhost:6379

# Features
ENABLE_AUDIT_LOG=true
ENABLE_AUTO_JOURNAL=true
ENABLE_NOTIFICATIONS=false
```

### 8.3 Generate Prisma Client

```bash
cd /opt/gff-erp/backend

# Generate Prisma client
npx prisma generate

# Verify generation
ls node_modules/.prisma/client/
```

### 8.4 Run Database Migrations

```bash
cd /opt/gff-erp/backend

# Deploy migrations to production database
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 8.5 Seed Database

```bash
cd /opt/gff-erp/backend

# Run seed script (creates default admin user, chart of accounts, etc.)
npx prisma db seed

# If seed script is not configured, run directly:
# npx ts-node prisma/seed.ts
```

Default seed data includes:
- System admin user (username: `admin`, password: `admin123`)
- Default roles (Admin, Manager, Accountant, Sales, Inventory)
- Standard chart of accounts
- Default units of measurement
- System settings
- First branch

### 8.6 Build Backend

```bash
cd /opt/gff-erp/backend

# Build the application
npm run build

# Verify build output
ls dist/
```

### 8.7 Test Backend Startup

```bash
cd /opt/gff-erp/backend

# Start in development mode to test
NODE_ENV=production node dist/main.js &

# Test health endpoint
curl http://localhost:3000/api/health

# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Stop the test process
kill %1
```

---

## 9. Frontend Setup

### 9.1 Install Frontend Dependencies

```bash
# Switch to application user
sudo su - gff-erp

cd /opt/gff-erp/frontend

# Install dependencies
npm install

# Verify
ls node_modules | head -10
```

### 9.2 Configure Frontend Environment

```bash
cd /opt/gff-erp/frontend

cp .env.example .env
nano .env
```

```env
# ============================================
# GFF ERP Frontend Configuration
# ============================================

# API Configuration
VITE_API_BASE_URL=https://erp.yourdomain.com/api

# Application
VITE_APP_NAME="GFF ERP Enterprise"
VITE_APP_VERSION=1.0.0

# Localization
VITE_DEFAULT_LANGUAGE=ar
VITE_SUPPORTED_LANGUAGES=ar,en

# Features
VITE_ENABLE_NOTIFICATIONS=false
VITE_ENABLE_ANALYTICS=false

# Uploads
VITE_MAX_FILE_SIZE=10485760
```

### 9.3 Build Frontend

```bash
cd /opt/gff-erp/frontend

# Build production bundle
npm run build

# Verify build output
ls dist/
# Should contain: index.html, assets/, etc.
```

### 9.4 Copy Frontend to Nginx Directory

```bash
# Copy built frontend to Nginx web root
sudo mkdir -p /var/www/gff-erp
sudo cp -r /opt/gff-erp/frontend/dist/* /var/www/gff-erp/
sudo chown -R www-data:www-data /var/www/gff-erp
sudo chmod -R 755 /var/www/gff-erp
```

---

## 10. Nginx Configuration

### 10.1 Create GFF ERP Nginx Config

```bash
sudo nano /etc/nginx/sites-available/gff-erp
```

```nginx
# GFF ERP Enterprise - Nginx Configuration

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=120r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

# Upstream for backend
upstream gff_erp_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name erp.yourdomain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main server block
server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;

    # SSL Certificates (will be created by Certbot)
    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Logging
    access_log /var/log/nginx/gff-erp-access.log main;
    error_log /var/log/nginx/gff-erp-error.log warn;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/rss+xml font/truetype application/x-font-ttf font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Frontend - Static Files
    location / {
        root /var/www/gff-erp;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API - Proxy to Backend
    location /api {
        # Apply rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        # Auth endpoints have stricter limits
        location /api/auth/login {
            limit_req zone=auth_limit burst=5 nodelay;
            proxy_pass http://gff_erp_backend;
            include /etc/nginx/proxy_params;
        }
        
        proxy_pass http://gff_erp_backend;
        include /etc/nginx/proxy_params;
    }

    # Uploads
    location /uploads {
        alias /opt/gff-erp/uploads;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Health check (no rate limit)
    location /api/health {
        proxy_pass http://gff_erp_backend;
        include /etc/nginx/proxy_params;
        access_log off;
    }

    # Block common attack paths
    location ~ /\.(env|git|svn|htaccess|ini|log|sh|sql) {
        deny all;
        return 404;
    }

    location ~ /(vendor|node_modules|composer\.json|package\.json) {
        deny all;
        return 404;
    }
}
```

### 10.2 Create Proxy Parameters

```bash
sudo nano /etc/nginx/proxy_params
```

```nginx
proxy_http_version 1.1;
proxy_cache_bypass $http_upgrade;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
proxy_buffering off;
```

### 10.3 Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/gff-erp /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 11. PM2 Configuration

### 11.1 Create PM2 Ecosystem Config

```bash
sudo su - gff-erp

cd /opt/gff-erp/backend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'gff-erp-backend',
      script: './dist/main.js',
      cwd: '/opt/gff-erp/backend',
      instances: 'max',           // Use all CPU cores
      exec_mode: 'cluster',       // Cluster mode for load balancing
      max_memory_restart: '1G',   // Restart if memory > 1GB
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logging
      log_file: '/var/log/gff-erp/pm2/combined.log',
      out_file: '/var/log/gff-erp/pm2/out.log',
      error_file: '/var/log/gff-erp/pm2/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      
      // Monitoring
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Advanced
      source_map_support: false,
      instance_var: 'INSTANCE_ID',
      
      // Watch (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
    }
  ]
};
EOF

exit
```

### 11.2 Create PM2 Log Directory

```bash
sudo mkdir -p /var/log/gff-erp/pm2
sudo chown -R gff-erp:gff-erp /var/log/gff-erp/pm2
```

### 11.3 Start Backend with PM2

```bash
sudo su - gff-erp

cd /opt/gff-erp/backend

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd

# The command above will output a command to run with sudo, e.g.:
# sudo env PATH=$PATH:/home/gff-erp/.nvm/versions/node/v20.x.x/bin pm2 startup systemd -u gff-erp --hp /opt/gff-erp
# Run that command

exit
```

### 11.4 Configure PM2 Startup (run the command from pm2 startup output)

```bash
# Example - use the exact command from pm2 startup output:
sudo env PATH=$PATH:/opt/gff-erp/.nvm/versions/node/v20.15.0/bin pm2 startup systemd -u gff-erp --hp /opt/gff-erp

# Save the PM2 process list
sudo su - gff-erp -c "pm2 save"
```

### 11.5 PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs gff-erp-backend

# Restart
pm2 restart gff-erp-backend

# Reload (zero-downtime)
pm2 reload gff-erp-backend

# Stop
pm2 stop gff-erp-backend

# Monitor
pm2 monit
```

---

## 12. SSL Setup

### 12.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Create directory for Let's Encrypt
sudo mkdir -p /var/www/certbot
```

### 12.2 Obtain SSL Certificate

```bash
# Obtain certificate (replace with your domain)
sudo certbot --nginx -d erp.yourdomain.com --agree-tos --non-interactive --email admin@yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 12.3 Auto-Renewal

```bash
# Add cron job for auto-renewal
sudo crontab -e

# Add this line:
0 3 * * * /usr/bin/certbot renew --quiet --nginx
```

### 12.4 Verify SSL

```bash
# Check certificate
sudo certbot certificates

# Test HTTPS (after full deployment)
curl -I https://erp.yourdomain.com
```

---

## 13. First Admin Login

### 13.1 Default Admin Credentials

After seeding the database, the following admin account is created:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |
| **Role** | System Administrator |

> **IMPORTANT:** Change the default password immediately after first login!

### 13.2 Initial Setup Steps

1. Navigate to `https://erp.yourdomain.com`
2. Login with username `admin` and password `admin123`
3. **Immediately change the admin password:**
   - Go to Settings > Users
   - Edit admin user
   - Set a strong password (minimum 12 characters)
4. Create your organization branches
5. Create additional users with appropriate roles
6. Configure chart of accounts
7. Add your product catalog
8. Set up warehouses

---

## 14. Post-Installation Verification

### 14.1 Verification Checklist

| # | Check | Command/Method | Expected Result |
|---|-------|---------------|----------------|
| 1 | Backend running | `pm2 status` | `gff-erp-backend` status = `online` |
| 2 | API responding | `curl http://localhost:3000/api/health` | `{"status":"ok"}` |
| 3 | Frontend serving | `curl -I https://erp.yourdomain.com` | HTTP 200 |
| 4 | Nginx running | `sudo systemctl status nginx` | `active (running)` |
| 5 | PostgreSQL running | `sudo systemctl status postgresql` | `active (running)` |
| 6 | SSL certificate | `curl -vI https://erp.yourdomain.com 2>&1 \| grep "SSL"` | TLS 1.2 or 1.3 |
| 7 | Database connection | `sudo -u gff-erp psql -d gff_erp_db -c "\dt"` | Tables listed |
| 8 | Login works | Login via web UI | Successful login |
| 9 | API auth works | `curl -H "Authorization: Bearer <token>" https://erp.yourdomain.com/api/users` | User list |
| 10 | Branch selection | Select branch in UI | Data loads correctly |
| 11 | File upload | Upload a test file | File uploaded successfully |
| 12 | Backup script | Run backup script | Backup file created |

### 14.2 Automated Health Check

```bash
#!/bin/bash
# /opt/gff-erp/scripts/health-check.sh

echo "=== GFF ERP Health Check ==="
echo "Date: $(date)"

# Check PM2
echo -n "PM2 Status: "
pm2 status | grep gff-erp-backend | grep -q "online" && echo "OK" || echo "FAIL"

# Check API
echo -n "API Health: "
curl -sf http://localhost:3000/api/health > /dev/null && echo "OK" || echo "FAIL"

# Check Nginx
echo -n "Nginx: "
systemctl is-active nginx > /dev/null && echo "OK" || echo "FAIL"

# Check PostgreSQL
echo -n "PostgreSQL: "
systemctl is-active postgresql > /dev/null && echo "OK" || echo "FAIL"

# Check disk space
echo "Disk Usage:"
df -h / | tail -1 | awk '{print "  " $5 " used (" $4 " free)"}'

# Check memory
echo "Memory Usage:"
free -h | grep Mem | awk '{print "  " $3 " used (" $4 " free)"}'

echo "=== Health Check Complete ==="
```

---

## 15. Troubleshooting

### 15.1 Backend Won't Start

**Symptom:** PM2 shows `errored` status

```bash
# Check logs
pm2 logs gff-erp-backend

# Common issues:
# 1. Database connection
curl -I http://localhost:3000/api/health

# 2. Check environment variables
cat /opt/gff-erp/backend/.env

# 3. Check if port is in use
sudo lsof -i :3000

# 4. Check Prisma generation
npx prisma generate

# 5. Check for build errors
npm run build
```

### 15.2 Database Connection Errors

```bash
# Test PostgreSQL connection
psql -U gff_erp_user -d gff_erp_db -h localhost -c "SELECT 1"

# If connection fails:
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Check pg_hba.conf authentication
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep gff_erp_user

# 3. Check PostgreSQL is listening
sudo netstat -tlnp | grep 5432

# 4. Reset password if needed
sudo -u postgres psql -c "ALTER USER gff_erp_user WITH PASSWORD 'newpassword';"

# 5. Update .env with new password
```

### 15.3 Frontend Not Loading

```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/gff-erp-error.log

# Verify frontend files exist
ls -la /var/www/gff-erp/

# Check Nginx configuration
sudo nginx -t

# Verify API proxy
sudo cat /etc/nginx/sites-enabled/gff-erp | grep -A5 "location /api"
```

### 15.4 Permission Issues

```bash
# Fix ownership
sudo chown -R gff-erp:gff-erp /opt/gff-erp
sudo chmod -R 755 /opt/gff-erp
sudo chown -R www-data:www-data /var/www/gff-erp
sudo chmod -R 755 /var/www/gff-erp

# Fix log permissions
sudo chown -R gff-erp:gff-erp /var/log/gff-erp
```

### 15.5 SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check certificate expiry
echo | openssl s_client -servername erp.yourdomain.com -connect erp.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Force renewal
sudo certbot renew --force-renewal
```

### 15.6 Memory Issues

```bash
# Check memory usage
free -h

# Check PM2 memory usage
pm2 status

# If backend using too much memory, restart
pm2 restart gff-erp-backend

# Add swap space if needed
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 15.7 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `connection refused` | Backend not running | `pm2 start ecosystem.config.js` |
| `database does not exist` | Wrong DB name | Check `DATABASE_URL` in `.env` |
| `permission denied` | Wrong credentials | Check DB user/password |
| `502 Bad Gateway` | Nginx can't reach backend | Check PM2 status, restart |
| `404 Not Found` | API route missing | Check URL, verify backend build |
| `401 Unauthorized` | Invalid/missing token | Re-login, check token expiry |
| `403 Forbidden` | No permission | Check user roles |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-01 | Technical Team | Initial document |

---

*This document is the property of GFF ERP Enterprise. Unauthorized distribution is prohibited.*
