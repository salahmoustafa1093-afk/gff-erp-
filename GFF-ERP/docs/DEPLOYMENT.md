# GFF ERP Enterprise - Deployment Guide

**Document Version:** 1.0  
**Date:** June 2025  
**Environment:** Production  
**Status:** Production Ready

---

## Table of Contents

1. [Deployment Architecture](#1-deployment-architecture)
2. [Server Preparation Checklist](#2-server-preparation-checklist)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Migration in Production](#4-database-migration-in-production)
5. [Backend Deployment](#5-backend-deployment)
6. [Frontend Deployment](#6-frontend-deployment)
7. [Nginx Reverse Proxy Setup](#7-nginx-reverse-proxy-setup)
8. [SSL Certificate Configuration](#8-ssl-certificate-configuration)
9. [PM2 Process Management](#9-pm2-process-management)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Backup Strategy](#11-backup-strategy)
12. [Monitoring and Alerting](#12-monitoring-and-alerting)
13. [Log Rotation](#13-log-ration)
14. [Update Procedures](#14-update-procedures)
15. [Rollback Procedures](#15-rollback-procedures)
16. [Health Check Endpoints](#16-health-check-endpoints)
17. [Performance Tuning](#17-performance-tuning)
18. [Security Hardening Checklist](#18-security-hardening-checklist)

---

## 1. Deployment Architecture

```
+-------------------------------------------------------------------+
|                       PRODUCTION SERVER                            |
|                    Ubuntu 24.04 LTS                                |
+-------------------------------------------------------------------+
|                                                                    |
|  +----------------+     +----------------+     +----------------+ |
|  |   Nginx        | --> |   PM2          | --> |   PostgreSQL 16 | |
|  |   Port 80/443  |     |   Port 3000    |     |   Port 5432    | |
|  |                |     |                |     |                | |
|  | - Rate Limit   |     | - 4 instances  |     | - Local auth   | |
|  | - SSL/TLS      |     | - Cluster mode |     | - PgBouncer    | |
|  | - Static files |     | - Auto-restart |     | - Daily backup | |
|  | - API proxy    |     | - Log rotation |     | - Replication  | |
|  +----------------+     +----------------+     +----------------+ |
|                                                                    |
|  Directory Structure:                                              |
|  /opt/gff-erp/backend/     - NestJS application                   |
|  /opt/gff-erp/frontend/    - React application                    |
|  /var/www/gff-erp/         - Built frontend files                 |
|  /var/log/gff-erp/         - Application logs                     |
|  /opt/gff-erp/backups/     - Database backups                     |
|  /opt/gff-erp/uploads/     - User uploads                         |
+-------------------------------------------------------------------+
```

---

## 2. Server Preparation Checklist

Before deploying, verify the following:

### 2.1 System Requirements

- [ ] Ubuntu 24.04 LTS installed and updated
- [ ] Minimum 4 CPU cores (8+ recommended)
- [ ] Minimum 8 GB RAM (16+ recommended)
- [ ] Minimum 100 GB SSD storage (250+ recommended)
- [ ] Static IP address configured
- [ ] Domain name pointing to server IP
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled (password login disabled)
- [ ] Automatic security updates enabled

### 2.2 Required Software

- [ ] PostgreSQL 16 installed and configured
- [ ] Node.js 20 LTS installed via NVM
- [ ] Nginx 1.24+ installed
- [ ] PM2 installed globally
- [ ] Certbot installed for SSL
- [ ] Git installed
- [ ] Fail2ban installed and configured

### 2.3 Application Prerequisites

- [ ] Application user (`gff-erp`) created
- [ ] Directory structure created
- [ ] Database created with proper permissions
- [ ] Log directories created with proper permissions
- [ ] Backup directory created
- [ ] Upload directory created

### 2.4 Security

- [ ] UFW firewall enabled (allow 22, 80, 443 only)
- [ ] SSH configured (key auth, disable root login)
- [ ] Fail2ban configured for SSH and Nginx
- [ ] PostgreSQL not exposed externally
- [ ] Strong database password set
- [ ] JWT secrets generated securely

---

## 3. Environment Configuration

### 3.1 Backend Environment Variables (.env)

```env
# ============================================
# GFF ERP - Production Environment Variables
# ============================================

# Application
NODE_ENV=production
PORT=3000
HOST=127.0.0.1

# Database
DATABASE_URL="postgresql://gff_erp_user:STRONG_PASSWORD@localhost:5432/gff_erp_db?schema=public&connection_limit=20&pool_timeout=30"

# Security - Use strong, randomly generated secrets
JWT_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
JWT_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# CORS - Update with your domain
CORS_ORIGINS=https://erp.yourdomain.com

# Logging
LOG_LEVEL=warn
LOG_FILE=/var/log/gff-erp/app.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30

# Uploads
UPLOAD_DIR=/opt/gff-erp/uploads
MAX_FILE_SIZE=10485760

# Company
COMPANY_NAME="GFF ERP Enterprise"
DEFAULT_LANGUAGE=ar
DEFAULT_CURRENCY=SAR

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900

# Session
SESSION_SECRET=<generate-32-char-random-string>

# Features
ENABLE_AUDIT_LOG=true
ENABLE_AUTO_JOURNAL=true
```

### 3.2 Frontend Environment Variables (.env)

```env
VITE_API_BASE_URL=https://erp.yourdomain.com/api
VITE_APP_NAME="GFF ERP Enterprise"
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=ar
```

---

## 4. Database Migration in Production

### 4.1 Pre-Migration Checklist

- [ ] Full database backup taken
- [ ] Migration reviewed in staging environment
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Rollback plan ready

### 4.2 Migration Steps

```bash
# 1. Backup database first
/opt/gff-erp/scripts/backup.sh

# 2. Stop application (or put in maintenance mode)
pm2 stop gff-erp-backend

# 3. Deploy new code
cd /opt/gff-erp/backend
git pull origin main  # or deploy new version

# 4. Install dependencies
npm install --production

# 5. Generate Prisma client
npx prisma generate

# 6. Deploy migrations
npx prisma migrate deploy

# 7. Restart application
pm2 start ecosystem.config.js

# 8. Verify
pm2 status
curl http://localhost:3000/api/health
```

### 4.3 Migration Rollback

If migration fails:

```bash
# 1. Stop application
pm2 stop gff-erp-backend

# 2. Restore from backup
pg_restore -U gff_erp_user -d gff_erp_db /opt/gff-erp/backups/latest.dump

# 3. Rollback code
cd /opt/gff-erp/backend
git checkout previous-version

# 4. Reinstall dependencies
npm install --production
npx prisma generate

# 5. Restart
pm2 start ecosystem.config.js
```

---

## 5. Backend Deployment

### 5.1 Deployment Steps

```bash
#!/bin/bash
set -euo pipefail

echo "=== GFF ERP Backend Deployment ==="

# Variables
APP_DIR="/opt/gff-erp/backend"
LOG_DIR="/var/log/gff-erp"
BACKUP_DIR="/opt/gff-erp/backups"
DEPLOY_USER="gff-erp"

echo "[1/8] Backing up database..."
$BACKUP_DIR/scripts/backup.sh

echo "[2/8] Pulling latest code..."
cd $APP_DIR
sudo -u $DEPLOY_USER git pull origin main

echo "[3/8] Installing dependencies..."
sudo -u $DEPLOY_USER npm ci --production

echo "[4/8] Generating Prisma client..."
sudo -u $DEPLOY_USER npx prisma generate

echo "[5/8] Running database migrations..."
sudo -u $DEPLOY_USER npx prisma migrate deploy

echo "[6/8] Building application..."
sudo -u $DEPLOY_USER npm run build

echo "[7/8] Reloading PM2 (zero-downtime)..."
sudo -u $DEPLOY_USER pm2 reload gff-erp-backend --update-env

echo "[8/8] Verifying deployment..."
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "Deployment successful!"
    pm2 status
else
    echo "Deployment verification failed! Rolling back..."
    # Trigger rollback
    exit 1
fi

echo "=== Deployment Complete ==="
```

### 5.2 Health Check After Deployment

```bash
# API health
curl -f http://localhost:3000/api/health || exit 1

# Database connectivity
curl -f http://localhost:3000/api/health/db || exit 1

# Authentication
curl -f -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}' || true

# PM2 status
pm2 status
```

---

## 6. Frontend Deployment

### 6.1 Build and Deploy

```bash
#!/bin/bash
set -euo pipefail

echo "=== GFF ERP Frontend Deployment ==="

# Variables
FRONTEND_DIR="/opt/gff-erp/frontend"
NGINX_ROOT="/var/www/gff-erp"
DEPLOY_USER="gff-erp"

echo "[1/4] Installing dependencies..."
cd $FRONTEND_DIR
sudo -u $DEPLOY_USER npm ci

echo "[2/4] Building production bundle..."
sudo -u $DEPLOY_USER npm run build

echo "[3/4] Deploying to Nginx..."
# Backup current version
if [ -d "$NGINX_ROOT" ]; then
    sudo mv $NGINX_ROOT ${NGINX_ROOT}.bak.$(date +%Y%m%d%H%M%S)
fi
sudo cp -r $FRONTEND_DIR/dist $NGINX_ROOT
sudo chown -R www-data:www-data $NGINX_ROOT
sudo chmod -R 755 $NGINX_ROOT

echo "[4/4] Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "=== Frontend Deployment Complete ==="
```

### 6.2 Verify Frontend

```bash
# Check static files
curl -I https://erp.yourdomain.com

# Check API proxy
curl -I https://erp.yourdomain.com/api/health

# Check assets
curl -I https://erp.yourdomain.com/assets/index.js
```

---

## 7. Nginx Reverse Proxy Setup

### 7.1 Configuration

```nginx
# /etc/nginx/sites-available/gff-erp

upstream gff_erp_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name erp.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        root /var/www/gff-erp;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API
    location /api {
        proxy_pass http://gff_erp_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Uploads
    location /uploads {
        alias /opt/gff-erp/uploads;
        expires 7d;
    }
}
```

### 7.2 Enable and Test

```bash
sudo ln -sf /etc/nginx/sites-available/gff-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL Certificate Configuration

### 8.1 Obtain Certificate

```bash
sudo certbot --nginx -d erp.yourdomain.com
```

### 8.2 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet") | crontab -
```

---

## 9. PM2 Process Management

### 9.1 Ecosystem Configuration

```javascript
// /opt/gff-erp/backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'gff-erp-backend',
    script: './dist/main.js',
    cwd: '/opt/gff-erp/backend',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production', PORT: 3000 },
    log_file: '/var/log/gff-erp/pm2/combined.log',
    out_file: '/var/log/gff-erp/pm2/out.log',
    error_file: '/var/log/gff-erp/pm2/error.log',
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 5,
    watch: false,
  }]
};
```

### 9.2 Start and Configure

```bash
# Start application
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Enable startup
pm2 startup systemd
```

---

## 10. Environment Variables Reference

### 10.1 Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | JWT signing secret | `<random-64-char>` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `<random-64-char>` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://erp.yourdomain.com` |

### 10.2 Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `BCRYPT_ROUNDS` | Password hash rounds | `12` |
| `MAX_LOGIN_ATTEMPTS` | Failed login threshold | `5` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size | `10485760` |

---

## 11. Backup Strategy

### 11.1 Automated Daily Backups

```bash
#!/bin/bash
# /opt/gff-erp/scripts/backup.sh

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/gff-erp/backups"
DB_NAME="gff_erp_db"
DB_USER="gff_erp_user"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "[$(date)] Starting database backup..."
pg_dump -U "$DB_USER" -d "$DB_NAME" -F custom -f "$BACKUP_DIR/gff_erp_$DATE.dump"

# Compress
gzip -f "$BACKUP_DIR/gff_erp_$DATE.dump"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /opt/gff-erp uploads/

# Remove old backups
find "$BACKUP_DIR" -name "gff_erp_*.dump.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed: gff_erp_$DATE.dump.gz"
```

### 11.2 Cron Schedule

```bash
# Daily at 2:00 AM
0 2 * * * /opt/gff-erp/scripts/backup.sh >> /var/log/gff-erp/backup.log 2>&1
```

---

## 12. Monitoring and Alerting

### 12.1 System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Disk usage monitoring
df -h

# Memory monitoring
free -h

# Process monitoring
pm2 monit
```

### 12.2 Log Monitoring

```bash
# Application logs
pm2 logs gff-erp-backend

# Nginx logs
sudo tail -f /var/log/nginx/gff-erp-error.log

# System logs
sudo journalctl -u gff-erp-backend -f
```

### 12.3 Health Check Endpoint

```bash
# API health check
curl http://localhost:3000/api/health

# Full health check
curl http://localhost:3000/api/health/detailed
```

---

## 13. Log Rotation

### 13.1 Application Logs

```bash
# /etc/logrotate.d/gff-erp
/var/log/gff-erp/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 gff-erp gff-erp
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 13.2 Nginx Logs

```bash
# Already handled by default logrotate
# /etc/logrotate.d/nginx
```

### 13.3 PM2 Logs

```bash
# PM2 log rotation module
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

---

## 14. Update Procedures

### 14.1 Standard Update

```bash
# 1. Backup
/opt/gff-erp/scripts/backup.sh

# 2. Pull latest code
cd /opt/gff-erp && git pull

# 3. Update backend
cd /opt/gff-erp/backend
npm ci --production
npx prisma migrate deploy
npm run build

# 4. Update frontend
cd /opt/gff-erp/frontend
npm ci
npm run build

# 5. Deploy frontend
sudo cp -r dist/* /var/www/gff-erp/

# 6. Restart
pm2 reload gff-erp-backend
sudo systemctl reload nginx
```

### 14.2 Emergency Hotfix

```bash
# Direct patch without full deployment

# 1. Apply patch
cd /opt/gff-erp/backend
git apply hotfix.patch

# 2. Quick build
npm run build

# 3. Reload (zero-downtime)
pm2 reload gff-erp-backend
```

---

## 15. Rollback Procedures

### 15.1 Quick Rollback

```bash
# Rollback to previous PM2 version
pm2 revert gff-erp-backend
```

### 15.2 Full Rollback

```bash
#!/bin/bash
set -euo pipefail

echo "=== GFF ERP Rollback ==="

# 1. Stop application
pm2 stop gff-erp-backend

# 2. Restore database from backup
LATEST_BACKUP=$(ls -t /opt/gff-erp/backups/*.dump.gz | head -1)
echo "Restoring from: $LATEST_BACKUP"

dropdb -U gff_erp_user gff_erp_db
createdb -U gff_erp_user gff_erp_db
gunzip -c "$LATEST_BACKUP" | pg_restore -U gff_erp_user -d gff_erp_db

# 3. Rollback code
cd /opt/gff-erp/backend
git checkout HEAD~1  # or specific version tag

# 4. Rebuild
npm ci --production
npx prisma generate
npm run build

# 5. Restart
pm2 start ecosystem.config.js

# 6. Verify
sleep 5
curl -f http://localhost:3000/api/health

echo "=== Rollback Complete ==="
```

---

## 16. Health Check Endpoints

### 16.1 Basic Health Check

```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-06-01T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400
}
```

### 16.2 Detailed Health Check

```bash
GET /api/health/detailed

Response:
{
  "status": "ok",
  "timestamp": "2025-06-01T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": { "status": "ok", "responseTime": 12 },
    "disk": { "status": "ok", "freePercent": 72 },
    "memory": { "status": "ok", "freePercent": 45 }
  }
}
```

---

## 17. Performance Tuning

### 17.1 Node.js Optimization

```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable GC exposure
export NODE_OPTIONS="$NODE_OPTIONS --expose-gc"
```

### 17.2 PostgreSQL Optimization

```ini
# /etc/postgresql/16/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 17.3 Nginx Optimization

```nginx
worker_processes auto;
worker_connections 4096;
use epoll;
multi_accept on;
keepalive_timeout 65;
```

---

## 18. Security Hardening Checklist

### 18.1 Operating System

- [ ] Automatic security updates enabled
- [ ] SSH key authentication only (disable password)
- [ ] Root login disabled
- [ ] Fail2ban configured for SSH
- [ ] Unnecessary services disabled
- [ ] Server timezone set to UTC

### 18.2 Network

- [ ] UFW enabled with minimal ports
- [ ] PostgreSQL not exposed externally
- [ ] Backend only accessible via localhost/Nginx
- [ ] DDoS protection via Nginx rate limiting

### 18.3 Application

- [ ] Strong JWT secrets (64+ random characters)
- [ ] Bcrypt rounds set to 12+
- [ ] Account lockout enabled
- [ ] CORS restricted to production domain
- [ ] Helmet.js security headers enabled
- [ ] Input validation on all endpoints
- [ ] Audit logging enabled

### 18.4 Data

- [ ] Database backups automated
- [ ] SSL/TLS 1.2+ enforced
- [ ] Strong database password
- [ ] Sensitive data encrypted at rest

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-01 | Technical Team | Initial document |

---

*This document is the property of GFF ERP Enterprise. Unauthorized distribution is prohibited.*
