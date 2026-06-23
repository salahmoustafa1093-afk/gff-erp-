#!/bin/bash
# =============================================================================
# GFF ERP Enterprise - Deployment Script
# =============================================================================
# Description: Automated deployment script for GFF ERP
# Version: 1.0
# Usage: sudo bash deploy.sh [--first-deploy] [--skip-backup] [--skip-tests]
# =============================================================================

set -euo pipefail

# =============================================================================
# Colors
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# Configuration
# =============================================================================
APP_NAME="gff-erp"
APP_USER="gff-erp"
APP_DIR="/opt/${APP_NAME}"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
BACKUP_DIR="${APP_DIR}/backups"
NGINX_ROOT="/var/www/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
DEPLOY_LOG="${LOG_DIR}/deploy.log"
PM2_CONFIG="${BACKEND_DIR}/ecosystem.config.js"

# Deployment options
FIRST_DEPLOY=false
SKIP_BACKUP=false
SKIP_TESTS=false

# =============================================================================
# Parse arguments
# =============================================================================
for arg in "$@"; do
    case $arg in
        --first-deploy)
            FIRST_DEPLOY=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            # Unknown option
            ;;
    esac
done

# =============================================================================
# Logging
# =============================================================================
mkdir -p "$LOG_DIR"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$DEPLOY_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1${NC}" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$DEPLOY_LOG"
    exit 1
}

section() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  $1"
    echo "============================================================================="
    echo -e "${NC}"
    echo -e "\n\n=== $1 ===" >> "$DEPLOY_LOG"
}

# =============================================================================
# Check root
# =============================================================================
if [ "$EUID" -ne 0 ]; then
    error "Please run this script as root or with sudo"
fi

# =============================================================================
# Header
# =============================================================================
section "GFF ERP Enterprise - Deployment"
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Host: $(hostname)"
echo "First deploy: $FIRST_DEPLOY"
echo "Skip backup: $SKIP_BACKUP"
echo "Skip tests: $SKIP_TESTS"
echo ""

# =============================================================================
# Pre-deployment checks
# =============================================================================
section "Pre-Deployment Checks"

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    error "Application directory not found: ${APP_DIR}"
fi
log "Application directory found: ${APP_DIR}"

# Check if backend exists
if [ ! -d "$BACKEND_DIR" ]; then
    error "Backend directory not found: ${BACKEND_DIR}"
fi
log "Backend directory found: ${BACKEND_DIR}"

# Check if frontend exists
if [ ! -d "$FRONTEND_DIR" ]; then
    error "Frontend directory not found: ${FRONTEND_DIR}"
fi
log "Frontend directory found: ${FRONTEND_DIR}"

# Check if running as application user or can sudo to it
if ! id "$APP_USER" > /dev/null 2>&1; then
    error "Application user not found: ${APP_USER}"
fi
log "Application user found: ${APP_USER}"

# Check PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    error "PostgreSQL is not running"
fi
log "PostgreSQL is running"

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    warn "Nginx is not running, will start after deployment"
fi
log "Nginx status checked"

# =============================================================================
# Step 1: Backup database
# =============================================================================
section "Step 1/9: Database Backup"

if [ "$SKIP_BACKUP" = true ]; then
    warn "Skipping database backup as requested"
else
    if [ -f "${APP_DIR}/scripts/backup.sh" ]; then
        log "Running backup script..."
        bash "${APP_DIR}/scripts/backup.sh" || warn "Backup script failed, continuing..."
    else
        log "Creating manual backup..."
        BACKUP_FILE="${BACKUP_DIR}/pre-deploy-$(date +%Y%m%d_%H%M%S).sql.gz"
        
        # Get database credentials from .env
        if [ -f "${BACKEND_DIR}/.env" ]; then
            DB_URL=$(grep DATABASE_URL "${BACKEND_DIR}/.env" | cut -d'=' -f2- | tr -d '"')
            DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
            DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        else
            DB_NAME="${APP_NAME}_db"
            DB_USER="${APP_NAME}_user"
        fi
        
        pg_dump -U "$DB_USER" -d "$DB_NAME" -F plain 2>/dev/null | gzip > "$BACKUP_FILE" || warn "Backup failed, continuing..."
        
        if [ -f "$BACKUP_FILE" ]; then
            log "Backup created: ${BACKUP_FILE}"
        fi
    fi
fi

# =============================================================================
# Step 2: Pull latest code
# =============================================================================
section "Step 2/9: Pulling Latest Code"

log "Pulling latest code..."

# Pull backend
cd "$BACKEND_DIR"
if [ -d ".git" ]; then
    sudo -u "$APP_USER" git pull origin main >> "$DEPLOY_LOG" 2>&1 || warn "Git pull failed, using existing code"
    log "Backend code updated"
else
    log "Backend is not a git repository, using existing code"
fi

# Pull frontend
cd "$FRONTEND_DIR"
if [ -d ".git" ]; then
    sudo -u "$APP_USER" git pull origin main >> "$DEPLOY_LOG" 2>&1 || warn "Git pull failed, using existing code"
    log "Frontend code updated"
else
    log "Frontend is not a git repository, using existing code"
fi

# =============================================================================
# Step 3: Install backend dependencies
# =============================================================================
section "Step 3/9: Installing Backend Dependencies"

cd "$BACKEND_DIR"

log "Installing backend dependencies..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    cd ${BACKEND_DIR}
    npm ci --production >> ${DEPLOY_LOG} 2>&1
" || error "Failed to install backend dependencies"

log "Backend dependencies installed"

# =============================================================================
# Step 4: Generate Prisma client and run migrations
# =============================================================================
section "Step 4/9: Database Setup"

cd "$BACKEND_DIR"

# Generate Prisma client
log "Generating Prisma client..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    cd ${BACKEND_DIR}
    npx prisma generate >> ${DEPLOY_LOG} 2>&1
" || error "Failed to generate Prisma client"

log "Prisma client generated"

# Run database migrations
log "Running database migrations..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    cd ${BACKEND_DIR}
    npx prisma migrate deploy >> ${DEPLOY_LOG} 2>&1
" || error "Database migration failed"

log "Database migrations completed"

# Seed database on first deploy
if [ "$FIRST_DEPLOY" = true ]; then
    log "First deploy - seeding database..."
    sudo -u "$APP_USER" bash -c "
        export NVM_DIR=\"\$HOME/.nvm\"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
        cd ${BACKEND_DIR}
        npx prisma db seed >> ${DEPLOY_LOG} 2>&1 || echo 'No seed script configured'
    " || warn "Database seed failed"
    log "Database seeding completed"
fi

# =============================================================================
# Step 5: Build backend
# =============================================================================
section "Step 5/9: Building Backend"

cd "$BACKEND_DIR"

log "Building backend application..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    cd ${BACKEND_DIR}
    npm run build >> ${DEPLOY_LOG} 2>&1
" || error "Backend build failed"

# Verify build output
if [ ! -f "${BACKEND_DIR}/dist/main.js" ]; then
    error "Backend build output not found: ${BACKEND_DIR}/dist/main.js"
fi

log "Backend built successfully"

# =============================================================================
# Step 6: Build frontend
# =============================================================================
section "Step 6/9: Building Frontend"

cd "$FRONTEND_DIR"

log "Installing frontend dependencies..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    cd ${FRONTEND_DIR}
    npm ci >> ${DEPLOY_LOG} 2>&1
" || error "Failed to install frontend dependencies"

log "Building frontend..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    cd ${FRONTEND_DIR}
    npm run build >> ${DEPLOY_LOG} 2>&1
" || error "Frontend build failed"

# Verify build output
if [ ! -d "${FRONTEND_DIR}/dist" ]; then
    error "Frontend build output not found: ${FRONTEND_DIR}/dist"
fi

log "Frontend built successfully"

# =============================================================================
# Step 7: Deploy frontend to Nginx
# =============================================================================
section "Step 7/9: Deploying Frontend to Nginx"

log "Deploying frontend to Nginx..."

# Backup current frontend
if [ -d "$NGINX_ROOT" ] && [ "$(ls -A "$NGINX_ROOT")" ]; then
    BACKUP_WEB="${BACKUP_DIR}/web-$(date +%Y%m%d_%H%M%S)"
    cp -r "$NGINX_ROOT" "$BACKUP_WEB" 2>/dev/null || true
    log "Previous frontend backed up to: ${BACKUP_WEB}"
fi

# Copy new frontend
rm -rf "${NGINX_ROOT:?}/"*
cp -r "${FRONTEND_DIR}/dist/"* "$NGINX_ROOT/"
chown -R www-data:www-data "$NGINX_ROOT"
chmod -R 755 "$NGINX_ROOT"

log "Frontend deployed to: ${NGINX_ROOT}"

# =============================================================================
# Step 8: Restart services
# =============================================================================
section "Step 8/9: Restarting Services"

# Restart backend with PM2
log "Restarting backend with PM2..."
sudo -u "$APP_USER" bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
    
    cd ${BACKEND_DIR}
    
    if pm2 list | grep -q 'gff-erp-backend'; then
        # Reload existing (zero-downtime)
        pm2 reload ecosystem.config.js --update-env >> ${DEPLOY_LOG} 2>&1
    else
        # Start new
        pm2 start ecosystem.config.js >> ${DEPLOY_LOG} 2>&1
    fi
    
    pm2 save >> ${DEPLOY_LOG} 2>&1
" || error "Failed to restart backend"

log "Backend restarted with PM2"

# Wait for backend to be ready
log "Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if ! curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    warn "Backend health check failed, retrying in 10 seconds..."
    sleep 10
    
    if ! curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        error "Backend failed to start. Check logs: pm2 logs gff-erp-backend"
    fi
fi

log "Backend is healthy"

# Reload Nginx
log "Reloading Nginx..."
nginx -t >> "$DEPLOY_LOG" 2>&1 || error "Nginx configuration test failed"
systemctl reload nginx || error "Failed to reload Nginx"

log "Nginx reloaded"

# =============================================================================
# Step 9: Health checks
# =============================================================================
section "Step 9/9: Health Checks"

HEALTH_PASS=true

# Check 1: Backend API
log "Check 1: Backend API health..."
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    log "  [PASS] Backend API is responding"
else
    warn "  [FAIL] Backend API is not responding"
    HEALTH_PASS=false
fi

# Check 2: Nginx
log "Check 2: Nginx..."
if systemctl is-active --quiet nginx; then
    log "  [PASS] Nginx is running"
else
    warn "  [FAIL] Nginx is not running"
    HEALTH_PASS=false
fi

# Check 3: PostgreSQL
log "Check 3: PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    log "  [PASS] PostgreSQL is running"
else
    warn "  [FAIL] PostgreSQL is not running"
    HEALTH_PASS=false
fi

# Check 4: PM2 processes
log "Check 4: PM2 processes..."
if sudo -u "$APP_USER" bash -c "export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"; pm2 list" | grep -q "gff-erp-backend.*online"; then
    log "  [PASS] PM2 process is online"
else
    warn "  [FAIL] PM2 process is not online"
    HEALTH_PASS=false
fi

# Check 5: Frontend files
log "Check 5: Frontend files..."
if [ -f "${NGINX_ROOT}/index.html" ]; then
    log "  [PASS] Frontend files are deployed"
else
    warn "  [FAIL] Frontend index.html not found"
    HEALTH_PASS=false
fi

# =============================================================================
# Deployment Summary
# =============================================================================
section "Deployment Summary"

if [ "$HEALTH_PASS" = true ]; then
    echo -e "${GREEN}"
    echo "  Deployment completed successfully!"
    echo -e "${NC}"
else
    echo -e "${YELLOW}"
    echo "  Deployment completed with warnings."
    echo "  Please review the health check results above."
    echo -e "${NC}"
fi

echo "  Deployment Date: $(date)"
echo "  Deployment Log: ${DEPLOY_LOG}"
echo ""
echo "  Services Status:"
echo "    - Backend (PM2): $(sudo -u "$APP_USER" bash -c "export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"; pm2 list" 2>/dev/null | grep -c "gff-erp-backend.*online" || echo 0) instances online"
echo "    - Nginx: $(systemctl is-active nginx)"
echo "    - PostgreSQL: $(systemctl is-active postgresql)"
echo ""
echo "  Useful Commands:"
echo "    View logs:        pm2 logs gff-erp-backend"
echo "    Monitor:          pm2 monit"
echo "    Restart backend:  pm2 restart gff-erp-backend"
echo "    Check health:     curl http://localhost:3000/api/health"
echo "    Nginx status:     systemctl status nginx"
echo ""

if [ "$FIRST_DEPLOY" = true ]; then
    echo -e "${CYAN}"
    echo "  FIRST DEPLOYMENT NOTES:"
    echo "  - Default admin credentials:"
    echo "      Username: admin"
    echo "      Password: admin123"
    echo "  - CHANGE THE DEFAULT PASSWORD IMMEDIATELY!"
    echo "  - Configure SSL: sudo certbot --nginx -d yourdomain.com"
    echo -e "${NC}"
fi

log "Deployment completed"

# Exit with appropriate code
if [ "$HEALTH_PASS" = true ]; then
    exit 0
else
    exit 1
fi
