#!/bin/bash
# GFF ERP Backend Deployment Script
# Run this on your Ubuntu server as root

set -e

echo "========================================="
echo "GFF ERP Backend Deployment"
echo "========================================="

# === Step 1: Stop old processes ===
echo "[1/8] Stopping old processes..."
fuser -k 3000/tcp 2>/dev/null || echo "No process on port 3000"
pm2 delete gff-backend 2>/dev/null || echo "No gff-backend in PM2"
screen -S gff-backend -X quit 2>/dev/null || echo "No old screen session"
rm -rf /opt/gff-backend-3005 2>/dev/null

# === Step 2: Verify project path ===
echo "[2/8] Setting up project directory..."
PROJECT_DIR="/root/gff-erp/gff-backend"
mkdir -p /root/gff-erp

# Check if project exists at expected path
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Project not found at $PROJECT_DIR"
    echo "Checking alternative paths..."
    
    if [ -d "/opt/gff-erp/GFF-ERP/backend" ]; then
        echo "Found at /opt/gff-erp/GFF-ERP/backend, copying..."
        cp -r /opt/gff-erp/GFF-ERP/backend "$PROJECT_DIR"
    else
        echo "ERROR: Project not found! Please provide the correct path."
        exit 1
    fi
fi

cd "$PROJECT_DIR"

# === Step 3: Clean project ===
echo "[3/8] Cleaning project..."
rm -rf node_modules dist package-lock.json

# Remove corrupted directories (names starting with {)
find . -maxdepth 2 -type d -name '{*' -exec rm -rf {} + 2>/dev/null || true

# Verify required files exist
for file in package.json prisma/schema.prisma src/main.ts src/app.module.ts; do
    if [ ! -f "$file" ]; then
        echo "WARNING: Missing file: $file"
    fi
done

# === Step 4: Write config files ===
echo "[4/8] Writing config files..."

# tsconfig.json
cat > tsconfig.json << 'EOF'
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
EOF

# nest-cli.json
cat > nest-cli.json << 'EOF'
{"$schema":"https://json.schemastore.org/nest-cli","collection":"@nestjs/schematics","sourceRoot":"src","compilerOptions":{"deleteOutDir":true,"webpack":true}}
EOF

# .env
cat > .env << 'EOF'
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
EOF

echo "Config files written."

# === Step 5: npm install ===
echo "[5/8] Running npm install..."
npm install --prefer-offline --no-audit --no-fund || npm install --ignore-scripts --no-audit --no-fund

# === Step 6: Prisma Generate ===
echo "[6/8] Running Prisma generate..."
npx prisma generate

# === Step 7: Build ===
echo "[7/8] Building project..."
npm run build || npx nest build --webpack

# Verify dist exists
if [ ! -f "dist/main.js" ]; then
    echo "ERROR: Build failed! dist/main.js not found."
    exit 1
fi

echo "Build successful!"

# === Step 8: Start server ===
echo "[8/8] Starting server..."
if command -v pm2 &> /dev/null; then
    pm2 start dist/main.js --name gff-backend
    pm2 save
else
    echo "PM2 not found, using screen..."
    screen -S gff-backend -dm bash -c "cd $PROJECT_DIR && PORT=3000 node dist/main.js"
fi

# === Verification ===
echo ""
echo "========================================="
echo "Waiting for server to start..."
sleep 5

echo "Health check:"
curl -s http://localhost:3000/api/v1/health || echo "Health check failed!"

echo ""
echo "Swagger URL: http://localhost:3000/api/docs"
echo "========================================="
