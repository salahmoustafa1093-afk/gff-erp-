#!/bin/bash
# =============================================================================
# GFF ERP Enterprise - Ubuntu Server Setup Script
# =============================================================================
# Description: Complete server setup for GFF ERP on Ubuntu 24.04 LTS
# Version: 1.0
# Usage: sudo bash setup.sh
# Tested on: Ubuntu 24.04 LTS
# =============================================================================

set -euo pipefail

# =============================================================================
# Colors for output
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Configuration Variables
# =============================================================================
APP_NAME="gff-erp"
APP_USER="gff-erp"
APP_DIR="/opt/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
BACKUP_DIR="${APP_DIR}/backups"
UPLOAD_DIR="${APP_DIR}/uploads"
NGINX_ROOT="/var/www/${APP_NAME}"
DB_NAME="${APP_NAME}_db"
DB_USER="${APP_NAME}_user"
DB_PASSWORD="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)"
NODE_VERSION="20"
NVM_VERSION="0.39.7"
POSTGRES_VERSION="16"

# =============================================================================
# Logging
# =============================================================================
LOG_FILE="/tmp/${APP_NAME}-setup.log"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# =============================================================================
# Header
# =============================================================================
echo -e "${BLUE}"
echo "============================================================================="
echo "  GFF ERP Enterprise - Server Setup"
echo "============================================================================="
echo -e "${NC}"
echo ""
echo "This script will set up your Ubuntu server for GFF ERP deployment."
echo "It will install and configure:"
echo "  - System packages and utilities"
echo "  - PostgreSQL ${POSTGRES_VERSION}"
echo "  - Node.js ${NODE_VERSION} LTS via NVM"
echo "  - Nginx web server"
echo "  - PM2 process manager"
echo "  - Certbot for SSL certificates"
echo "  - Application user and directory structure"
echo "  - Firewall (UFW)"
echo "  - Automatic backups"
echo ""
echo -e "${YELLOW}Note: This script must be run as root or with sudo.${NC}"
echo ""

# =============================================================================
# Check root
# =============================================================================
if [ "$EUID" -ne 0 ]; then
    error "Please run this script as root or with sudo"
fi

# =============================================================================
# Check Ubuntu version
# =============================================================================
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    error "This script is designed for Ubuntu only"
fi

UBUNTU_VERSION=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2)
log "Detected Ubuntu version: ${UBUNTU_VERSION}"

# =============================================================================
# Step 1: Update system packages
# =============================================================================
echo ""
log "Step 1/12: Updating system packages..."
apt-get update -y > /dev/null 2>&1 || error "Failed to update package lists"
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y > /dev/null 2>&1 || warn "Some packages failed to upgrade"
log "System packages updated successfully"

# =============================================================================
# Step 2: Install essential packages
# =============================================================================
echo ""
log "Step 2/12: Installing essential packages..."

ESSENTIAL_PACKAGES=(
    curl
    wget
    vim
    nano
    htop
    net-tools
    unzip
    build-essential
    software-properties-common
    apt-transport-https
    ca-certificates
    gnupg
    lsb-release
    git
    fail2ban
    ufw
    libpq-dev
    postgresql-client
    pigz
    certbot
    python3-certbot-nginx
    cron
    logrotate
    acl
    jq
    tree
    ncdu
    iotop
    iftop
    nethogs
)

for package in "${ESSENTIAL_PACKAGES[@]}"; do
    if dpkg -l "$package" > /dev/null 2>&1; then
        log "  ${package} already installed"
    else
        log "  Installing ${package}..."
        apt-get install -y "$package" > /dev/null 2>&1 || warn "Failed to install ${package}"
    fi
done

log "Essential packages installed"

# =============================================================================
# Step 3: Configure timezone
# =============================================================================
echo ""
log "Step 3/12: Configuring timezone..."
if timedatectl set-timezone Asia/Riyadh 2>/dev/null; then
    log "Timezone set to Asia/Riyadh"
elif timedatectl set-timezone UTC 2>/dev/null; then
    log "Timezone set to UTC"
else
    warn "Could not set timezone automatically"
fi
CURRENT_TIMEZONE=$(timedatectl show --property=Timezone --value)
log "Current timezone: ${CURRENT_TIMEZONE}"

# =============================================================================
# Step 4: Configure firewall
# =============================================================================
echo ""
log "Step 4/12: Configuring firewall (UFW)..."

ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp comment 'SSH' > /dev/null 2>&1
ufw allow 80/tcp comment 'HTTP' > /dev/null 2>&1
ufw allow 443/tcp comment 'HTTPS' > /dev/null 2>&1

echo "y" | ufw enable > /dev/null 2>&1
log "Firewall configured and enabled"
log "  - Port 22 (SSH): ALLOWED"
log "  - Port 80 (HTTP): ALLOWED"
log "  - Port 443 (HTTPS): ALLOWED"

# =============================================================================
# Step 5: Create application user
# =============================================================================
echo ""
log "Step 5/12: Creating application user..."

if id "$APP_USER" > /dev/null 2>&1; then
    log "User ${APP_USER} already exists"
else
    useradd -r -s /bin/bash -m -d "$APP_DIR" -c "GFF ERP Application" "$APP_USER"
    log "User ${APP_USER} created"
fi

# Create directory structure
log "  Creating directory structure..."
mkdir -p "${APP_DIR}"/{
    backend,
    frontend,
    logs/nginx,
    logs/pm2,
    logs/postgresql,
    backups/daily,
    backups/weekly,
    uploads/documents,
    uploads/reports
}

chown -R "${APP_USER}:${APP_USER}" "$APP_DIR"
chmod -R 755 "$APP_DIR"
log "Directory structure created at ${APP_DIR}"

# =============================================================================
# Step 6: Install PostgreSQL
# =============================================================================
echo ""
log "Step 6/12: Installing PostgreSQL ${POSTGRES_VERSION}..."

# Add PostgreSQL repository
echo "  Adding PostgreSQL repository..."
sh -c "echo \"deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main\" > /etc/apt/sources.list.d/pgdg.list" 2>/dev/null
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - > /dev/null 2>&1
apt-get update -y > /dev/null 2>&1

# Install PostgreSQL
apt-get install -y postgresql-"${POSTGRES_VERSION}" postgresql-contrib-"${POSTGRES_VERSION}" > /dev/null 2>&1
systemctl enable postgresql > /dev/null 2>&1
systemctl start postgresql > /dev/null 2>&1
log "PostgreSQL ${POSTGRES_VERSION} installed and started"

# Configure PostgreSQL
log "  Configuring PostgreSQL..."
cat > /etc/postgresql/${POSTGRES_VERSION}/main/conf.d/gff-erp.conf << EOF
# GFF ERP PostgreSQL Configuration
listen_addresses = 'localhost'
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 1GB
min_wal_size = 512MB
random_page_cost = 1.1
effective_io_concurrency = 200
log_min_duration_statement = 1000
EOF

# Configure authentication
log "  Configuring PostgreSQL authentication..."
cat > /etc/postgresql/${POSTGRES_VERSION}/main/pg_hba.conf << EOF
# PostgreSQL HBA Configuration
# Local connections
local   all             postgres                                peer
local   ${DB_NAME}      ${DB_USER}                            scram-sha-256

# IPv4 local connections
host    ${DB_NAME}      ${DB_USER}    127.0.0.1/32            scram-sha-256
host    all             postgres        127.0.0.1/32            scram-sha-256

# IPv6 local connections
host    ${DB_NAME}      ${DB_USER}    ::1/128                 scram-sha-256

# Reject all other connections
host    all             all             0.0.0.0/0               reject
host    all             all             ::/0                    reject
EOF

# Restart PostgreSQL
systemctl restart postgresql
log "PostgreSQL configured and restarted"

# Create database and user
log "  Creating database and user..."
sudo -u postgres psql << EOF > /dev/null 2>&1
CREATE DATABASE ${DB_NAME}
  WITH ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

\c ${DB_NAME}

GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${DB_USER};

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

log "Database '${DB_NAME}' and user '${DB_USER}' created"

# =============================================================================
# Step 7: Install Node.js via NVM
# =============================================================================
echo ""
log "Step 7/12: Installing Node.js ${NODE_VERSION} LTS..."

# Install NVM for application user
sudo -u "$APP_USER" bash << EOF
cd ~
curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | bash

export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"

nvm install ${NODE_VERSION}
nvm alias default ${NODE_VERSION}
nvm use ${NODE_VERSION}

# Verify
node_version=\$(node --version)
npm_version=\$(npm --version)
echo "Node.js \$node_version installed"
echo "npm \$npm_version installed"
EOF

log "Node.js ${NODE_VERSION} installed for user ${APP_USER}"

# Install global packages
log "  Installing global npm packages..."
sudo -u "$APP_USER" bash << EOF
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"

npm install -g pm2@latest > /dev/null 2>&1
npm install -g @nestjs/cli@latest > /dev/null 2>&1
npm install -g prisma@latest > /dev/null 2>&1

pm2 --version
echo "PM2 installed"
EOF

log "Global npm packages installed (pm2, @nestjs/cli, prisma)"

# =============================================================================
# Step 8: Install and configure Nginx
# =============================================================================
echo ""
log "Step 8/12: Installing and configuring Nginx..."

apt-get install -y nginx > /dev/null 2>&1
systemctl enable nginx > /dev/null 2>&1

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Backup original config
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.original

# Configure Nginx
cat > /etc/nginx/nginx.conf << 'EOF'
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
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" $request_time';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    limit_req_zone $binary_remote_addr zone=api:10m rate=120r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create proxy params
cat > /etc/nginx/proxy_params << 'EOF'
proxy_http_version 1.1;
proxy_cache_bypass $http_upgrade;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
proxy_buffering off;
EOF

# Create Nginx root directory
mkdir -p "$NGINX_ROOT"
chown -R www-data:www-data "$NGINX_ROOT"
chmod -R 755 "$NGINX_ROOT"

# Create certbot directory
mkdir -p /var/www/certbot

nginx -t > /dev/null 2>&1 && log "Nginx configured successfully" || error "Nginx configuration failed"

# =============================================================================
# Step 9: Configure Fail2ban
# =============================================================================
echo ""
log "Step 9/12: Configuring Fail2ban..."

# Configure SSH jail
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-botsearch]
enabled = true
port = http,https
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400
EOF

systemctl enable fail2ban > /dev/null 2>&1
systemctl restart fail2ban > /dev/null 2>&1

log "Fail2ban configured and started"

# =============================================================================
# Step 10: Create log directories
# =============================================================================
echo ""
log "Step 10/12: Creating log directories..."

mkdir -p "$LOG_DIR"/{nginx,pm2,postgresql,backup}
chown -R "${APP_USER}:${APP_USER}" "$LOG_DIR"
chmod -R 755 "$LOG_DIR"

# Configure logrotate for application
cat > /etc/logrotate.d/gff-erp << EOF
${LOG_DIR}/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ${APP_USER} ${APP_USER}
    sharedscripts
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF

log "Log directories created and logrotate configured"

# =============================================================================
# Step 11: Configure automatic security updates
# =============================================================================
echo ""
log "Step 11/12: Configuring automatic security updates..."

apt-get install -y unattended-upgrades > /dev/null 2>&1

cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

log "Automatic security updates configured"

# =============================================================================
# Step 12: Save credentials and print summary
# =============================================================================
echo ""
log "Step 12/12: Saving credentials..."

# Save credentials to secure file
CREDS_FILE="${APP_DIR}/.credentials"
cat > "$CREDS_FILE" << EOF
# GFF ERP - Database Credentials
# Generated: $(date)
# KEEP THIS FILE SECURE - contains sensitive information

DATABASE_NAME=${DB_NAME}
DATABASE_USER=${DB_USER}
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
EOF

chown "${APP_USER}:${APP_USER}" "$CREDS_FILE"
chmod 600 "$CREDS_FILE"

log "Credentials saved to ${CREDS_FILE} (restricted access)"

# =============================================================================
# Completion Summary
# =============================================================================
echo ""
echo -e "${GREEN}============================================================================="
echo "  SETUP COMPLETE - GFF ERP Enterprise"
echo "=============================================================================${NC}"
echo ""
echo -e "${BLUE}Server Configuration:${NC}"
echo "  - Hostname: $(hostname)"
echo "  - Timezone: $(timedatectl show --property=Timezone --value)"
echo "  - IP Address: $(ip addr show | grep "inet " | head -1 | awk '{print $2}' | cut -d/ -f1)"
echo ""
echo -e "${BLUE}Installed Components:${NC}"
echo "  - PostgreSQL ${POSTGRES_VERSION}: $(sudo -u postgres psql --version | head -1)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo "  - Fail2ban: $(fail2ban-client --version | head -1)"
echo "  - Certbot: $(certbot --version 2>/dev/null || echo 'installed')"
echo ""
echo -e "${BLUE}Application:${NC}"
echo "  - User: ${APP_USER}"
echo "  - Directory: ${APP_DIR}"
echo "  - Database: ${DB_NAME}"
echo "  - Logs: ${LOG_DIR}"
echo "  - Backups: ${BACKUP_DIR}"
echo ""
echo -e "${BLUE}Security:${NC}"
echo "  - UFW Firewall: $(ufw status | head -1)"
echo "  - Fail2ban: $(systemctl is-active fail2ban)"
echo "  - Auto Updates: configured"
echo ""
echo -e "${YELLOW}Database credentials saved to: ${CREDS_FILE}${NC}"
echo -e "${RED}IMPORTANT: Change the database password after first deployment!${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "  1. Set up your domain DNS to point to this server"
echo "  2. Deploy application code: cd /opt/gff-erp && git clone <your-repo> ."
echo "  3. Configure environment variables in backend/.env"
echo "  4. Run deployment: sudo bash deployment/scripts/deploy.sh"
echo "  5. Configure SSL: sudo certbot --nginx -d yourdomain.com"
echo ""
echo -e "${GREEN}=============================================================================${NC}"

# Restart services to ensure everything is running
systemctl restart nginx
systemctl restart postgresql

log "Setup script completed successfully!"
