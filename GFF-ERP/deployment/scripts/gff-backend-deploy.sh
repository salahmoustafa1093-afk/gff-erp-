#!/bin/bash
# ═══════════════════════════════════════════
#  GFF ERP Backend Deployment Script
#  Deploys the backend on Ubuntu Server
# ═══════════════════════════════════════════

set -e

PROJECT_DIR="/root/gff-erp/gff-backend"
DEPLOY_DIR="/opt/gff-backend-3005"
PORT=3000
LOG_FILE="/var/log/gff-deploy-$(date +%Y%m%d-%H%M%S).log"

# ───── Colors ─────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] !${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

section() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

mkdir -p /var/log
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

section "GFF ERP Backend Deployment Started"
log "Log file: $LOG_FILE"
echo ""

# ═══════════════════════════════════════════
#  STEP 1: Stop Old Instances
# ═══════════════════════════════════════════

section "STEP 1: Stopping Old Instances"

# 1.1 - Find and kill processes on port 3000
log "Checking for processes on port $PORT..."
PIDS=$(ss -tlnp | grep ":$PORT" | grep -oP 'pid=\K[0-9]+' || true)
if [ -n "$PIDS" ]; then
    warn "Found processes on port $PORT: $PIDS"
    for PID in $PIDS; do
        log "Killing PID: $PID"
        kill -9 "$PID" 2>/dev/null || true
    done
    success "Processes killed"
    sleep 2
else
    success "No processes found on port $PORT"
fi

# 1.2 - Kill PM2 process
log "Stopping PM2 processes (if any)..."
pm2 delete gff-backend 2>/dev/null || true
pm2 delete gff-backend-3005 2>/dev/null || true
pm2 delete all 2>/dev/null || true
success "PM2 processes cleared"

# 1.3 - Kill old screen sessions
log "Checking for old screen sessions..."
OLD_SCREENS=$(screen -ls | grep "gff-backend" | awk '{print $1}' || true)
if [ -n "$OLD_SCREENS" ]; then
    for session in $OLD_SCREENS; do
        log "Killing screen session: $session"
        screen -S "$session" -X quit 2>/dev/null || true
    done
    success "Screen sessions killed"
else
    success "No screen sessions found"
fi

# 1.4 - Remove old deploy directory
log "Removing old deploy directory: $DEPLOY_DIR"
rm -rf "$DEPLOY_DIR"
success "Old deploy directory removed"

# ═══════════════════════════════════════════
#  STEP 2: Clean Project
# ═══════════════════════════════════════════

section "STEP 2: Cleaning Project"

cd "$PROJECT_DIR" || {
    error "Cannot access project directory: $PROJECT_DIR"
    exit 1
}

log "Project directory: $(pwd)"
log "Removing node_modules..."
rm -rf node_modules
success "node_modules removed"

log "Removing dist..."
rm -rf dist
success "dist removed"

log "Removing package-lock.json..."
rm -f package-lock.json
success "package-lock.json removed"

log "Removing corrupted directories (starting with {)..."
find "$PROJECT_DIR" -maxdepth 2 -type d -name '{*' -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_DIR" -maxdepth 2 -type d -name '*}' -exec rm -rf {} + 2>/dev/null || true
success "Corrupted directories cleaned"

log "Verifying required files exist..."
for file in "package.json" "prisma/schema.prisma" "src/main.ts" "src/app.module.ts"; do
    if [ -f "$file" ]; then
        success "  Found: $file"
    else
        error "  Missing: $file"
        exit 1
    fi
done

# ═══════════════════════════════════════════
#  STEP 3: Write Config Files
# ═══════════════════════════════════════════

section "STEP 3: Writing Configuration Files"

# 3.1 - tsconfig.json
log "Writing tsconfig.json..."
cat > "$PROJECT_DIR/tsconfig.json" << 'CONFIGEOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictBindCallApply": false,
    "noEmitOnError": false,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["src/*"],
      "@common/*": ["src/common/*"],
      "@prisma/*": ["src/prisma/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
CONFIGEOF
success "tsconfig.json written"

# 3.2 - nest-cli.json
log "Writing nest-cli.json..."
cat > "$PROJECT_DIR/nest-cli.json" << 'NESTEOF'
{"$schema":"https://json.schemastore.org/nest-cli","collection":"@nestjs/schematics","sourceRoot":"src","compilerOptions":{"deleteOutDir":true,"webpack":true}}
NESTEOF
success "nest-cli.json written"

# 3.3 - .env
log "Writing .env file..."
cat > "$PROJECT_DIR/.env" << 'ENVEOF'
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://gff_admin:GffSecurePass2025!@localhost:5432/gff_erp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
THROTTLE_TTL=60
THROTTLE_LIMIT=10
ENVEOF
success ".env written"

# ═══════════════════════════════════════════
#  STEP 4: npm install
# ═══════════════════════════════════════════

section "STEP 4: Running npm install"

cd "$PROJECT_DIR"

log "Attempting npm install (prefer-offline, no-audit, no-fund)..."
if npm install --prefer-offline --no-audit --no-fund 2>&1 | tee -a "$LOG_FILE"; then
    success "npm install completed successfully"
else
    warn "Primary install failed, trying fallback method..."
    rm -rf node_modules package-lock.json
    log "Attempting npm install (ignore-scripts, no-audit, no-fund)..."
    if npm install --ignore-scripts --no-audit --no-fund 2>&1 | tee -a "$LOG_FILE"; then
        success "npm install completed with fallback method"
    else
        warn "Both methods failed, trying in /tmp directory..."
        rm -rf node_modules package-lock.json
        TMP_DIR="/tmp/gff-backend-install-$$"
        mkdir -p "$TMP_DIR"
        cp -r "$PROJECT_DIR"/* "$TMP_DIR/"
        cd "$TMP_DIR"
        log "Installing in /tmp..."
        if npm install --ignore-scripts --no-audit --no-fund 2>&1 | tee -a "$LOG_FILE"; then
            log "Moving node_modules back to project..."
            rm -rf "$PROJECT_DIR/node_modules"
            mv "$TMP_DIR/node_modules" "$PROJECT_DIR/"
            success "npm install completed via /tmp workaround"
        else
            error "npm install failed in all attempts"
            rm -rf "$TMP_DIR"
            exit 1
        fi
        rm -rf "$TMP_DIR"
        cd "$PROJECT_DIR"
    fi
fi

# ═══════════════════════════════════════════
#  STEP 5: Prisma Generate
# ═══════════════════════════════════════════

section "STEP 5: Running Prisma Generate"

cd "$PROJECT_DIR"

log "Running npx prisma generate..."
npx prisma generate 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    success "Prisma generate completed successfully"
else
    error "Prisma generate failed"
    exit 1
fi

# Verify @prisma/client was generated
if [ -d "node_modules/@prisma/client" ]; then
    success "@prisma/client directory verified"
else
    error "@prisma/client directory not found after generate"
    exit 1
fi

# ═══════════════════════════════════════════
#  STEP 6: Build
# ═══════════════════════════════════════════

section "STEP 6: Building the Project"

cd "$PROJECT_DIR"

log "Attempting: npm run build..."
if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    success "Build completed with npm run build"
else
    warn "npm run build failed, trying npx nest build --webpack..."
    if npx nest build --webpack 2>&1 | tee -a "$LOG_FILE"; then
        success "Build completed with npx nest build --webpack"
    else
        error "Build failed with all methods"
        exit 1
    fi
fi

# Verify dist/main.js exists
if [ -f "dist/main.js" ]; then
    success "dist/main.js verified"
else
    warn "dist/main.js not found, checking alternative paths..."
    find dist -name "main.js" -type f 2>/dev/null || true
    if [ -f "dist/main.js" ]; then
        success "dist/main.js found"
    else
        error "dist/main.js not found — build may have failed"
        exit 1
    fi
fi

# ═══════════════════════════════════════════
#  STEP 7: Start Server
# ═══════════════════════════════════════════

section "STEP 7: Starting the Server"

cd "$PROJECT_DIR"

# Check if pm2 is available
if command -v pm2 &> /dev/null; then
    log "PM2 detected — using PM2 to start server"
    pm2 start dist/main.js --name gff-backend 2>&1 | tee -a "$LOG_FILE"
    pm2 save 2>/dev/null || true
    success "Server started with PM2"
else
    log "PM2 not found — using screen"
    screen -S gff-backend -dm bash -c "cd $PROJECT_DIR && PORT=3000 node dist/main.js 2>&1 | tee -a /var/log/gff-backend.log"
    sleep 3
    if screen -ls | grep -q "gff-backend"; then
        success "Server started with screen session: gff-backend"
    else
        error "Failed to start screen session"
        exit 1
    fi
fi

# ═══════════════════════════════════════════
#  STEP 8: Verify Server
# ═══════════════════════════════════════════

section "STEP 8: Verifying Server"

log "Waiting 5 seconds for server to start..."
sleep 5

# Check port is listening
log "Checking if port $PORT is listening..."
LISTENING=$(ss -tlnp | grep ":$PORT" || true)
if [ -n "$LISTENING" ]; then
    success "Server is listening on port $PORT"
    echo "$LISTENING"
else
    warn "Port $PORT not detected yet, waiting additional 5 seconds..."
    sleep 5
    LISTENING=$(ss -tlnp | grep ":$PORT" || true)
    if [ -n "$LISTENING" ]; then
        success "Server is now listening on port $PORT"
    else
        error "Server does not appear to be listening on port $PORT"
    fi
fi

# Test health endpoint
log "Testing health endpoint: http://localhost:$PORT/api/v1/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/v1/health" 2>&1 || echo "FAILED")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    success "Health check passed! Response:"
    curl -s "http://localhost:$PORT/api/v1/health" 2>&1 | tee -a "$LOG_FILE"
    echo ""
elif [ "$HEALTH_RESPONSE" = "FAILED" ]; then
    error "Health check failed — could not connect"
else
    warn "Health check returned HTTP $HEALTH_RESPONSE"
fi

# Test Swagger endpoint
log "Testing Swagger endpoint: http://localhost:$PORT/api/docs"
SWAGGER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/docs" 2>&1 || echo "FAILED")
if [ "$SWAGGER_RESPONSE" = "200" ] || [ "$SWAGGER_RESPONSE" = "301" ] || [ "$SWAGGER_RESPONSE" = "302" ]; then
    success "Swagger endpoint is accessible (HTTP $SWAGGER_RESPONSE)"
else
    warn "Swagger endpoint returned HTTP $SWAGGER_RESPONSE"
fi

# Show process info
log "Active process details:"
ss -tlnp | grep ":$PORT" || true

if command -v pm2 &> /dev/null; then
    log "PM2 status:"
    pm2 status 2>&1 | tee -a "$LOG_FILE" || true
else
    log "Screen sessions:"
    screen -ls 2>&1 | grep "gff-backend" || true
fi

# ═══════════════════════════════════════════
#  FINAL: Summary
# ═══════════════════════════════════════════

section "Deployment Complete!"

echo -e "${GREEN}GFF ERP Backend deployed successfully!${NC}"
echo ""
echo -e "${CYAN}Project:${NC}       $PROJECT_DIR"
echo -e "${CYAN}Port:${NC}           $PORT"
echo -e "${CYAN}Health Check:${NC}   http://localhost:$PORT/api/v1/health"
echo -e "${CYAN}Swagger Docs:${NC}   http://localhost:$PORT/api/docs"
echo -e "${CYAN}Log File:${NC}       $LOG_FILE"
if command -v pm2 &> /dev/null; then
    echo -e "${CYAN}Process Manager:${NC} PM2"
    echo -e "${YELLOW}Use: pm2 status | pm2 logs gff-backend | pm2 restart gff-backend${NC}"
else
    echo -e "${CYAN}Process Manager:${NC} Screen"
    echo -e "${YELLOW}Use: screen -r gff-backend (to view) | Ctrl+A+D (to detach)${NC}"
fi
echo ""
log "All done! Check the log file for full output: $LOG_FILE"
