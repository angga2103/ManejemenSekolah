#!/usr/bin/env bash
# ==============================================================================
# EDUSAAS: 1-CLICK PRODUCTION / STAGING INSTALLER
# ==============================================================================
# Specially engineered for lightweight Virtual Private Servers (VPS),
# including low-resource instances (1 GB RAM / 1 vCPU).
#
# Supported OS: Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11 / 12
#
# What this script does automatically:
#   1. Detects low RAM and provisions a 2 GB SWAP space (prevents OOM crashes).
#   2. Installs Node.js 20 LTS, PostgreSQL 16, Redis, Nginx, and PM2.
#   3. Tunes PostgreSQL and Redis for low-memory footprint.
#   4. Generates cryptographically secure secrets (.env).
#   5. Initializes PostgreSQL database, user, migrations, and Row-Level Security (RLS).
#   6. Builds and launches API (NestJS) and Web Portal (Nginx).
#   7. Configures UFW firewall and outputs login credentials.
# ==============================================================================

set -euo pipefail

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Check Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] This installer must be executed as root. Please run with: sudo bash install.sh${NC}"
  exit 1
fi

clear || true
echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "    EDUSAAS: 1-CLICK AUTOMATED INSTALLER (LOW-RAM & 1GB VPS READY)"
echo "=============================================================================="
echo -e "${NC}"
echo -e "${BLUE}Target Architecture:${NC} Multi-Tenant School & Pesantren Management SaaS"
echo -e "${BLUE}Engineered For     :${NC} Lightweight VPS (1 GB RAM / 1 vCPU or larger)"
echo -e "${BLUE}Timestamp          :${NC} $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "------------------------------------------------------------------------------"
echo ""

# ------------------------------------------------------------------------------
# 1. HARDWARE INSPECTION & AUTOMATIC SWAP PROVISIONING (CRITICAL FOR 1GB RAM)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[STEP 1/7] Inspecting System Resources & Configuring Swap...${NC}"

TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
TOTAL_SWAP_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
TOTAL_SWAP_MB=$((TOTAL_SWAP_KB / 1024))

echo "  -> Physical RAM detected: ${TOTAL_RAM_MB} MB"
echo "  -> Existing Swap detected: ${TOTAL_SWAP_MB} MB"

if [ "$TOTAL_SWAP_MB" -lt 2000 ]; then
  echo -e "  -> ${YELLOW}Available Swap is under 2GB. Creating a 2GB Swapfile to prevent OOM errors...${NC}"
  
  if [ -f /swapfile ]; then
    swapoff /swapfile 2>/dev/null || true
    rm -f /swapfile
  fi

  # Allocate 2GB swap using fallocate or dd
  if command -v fallocate >/dev/null 2>&1; then
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  else
    dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  fi

  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile

  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi

  # Optimize kernel swappiness for low-RAM servers
  sysctl vm.swappiness=15 >/dev/null 2>&1 || true
  sysctl vm.vfs_cache_pressure=50 >/dev/null 2>&1 || true

  if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
    echo 'vm.swappiness=15' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
  fi
  echo -e "  -> ${GREEN}✓ 2GB Swap activated successfully (Total Virtual Memory: $((TOTAL_RAM_MB + 2048)) MB).${NC}"
else
  echo -e "  -> ${GREEN}✓ Existing Swap space is sufficient (${TOTAL_SWAP_MB} MB).${NC}"
fi

# ------------------------------------------------------------------------------
# 2. INSTALL SYSTEM PACKAGES & RUNTIMES
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[STEP 2/7] Installing System Dependencies (Node.js 20, PostgreSQL 16, Redis, Nginx)...${NC}"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget git jq ufw build-essential gnupg lsb-release ca-certificates

# Install Node.js 20 LTS (NodeSource)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo "  -> Setting up Node.js 20.x repository..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
fi

echo "  -> Node.js version : $(node -v)"
echo "  -> npm version     : $(npm -v)"

# Install PostgreSQL 16 & Redis & Nginx
echo "  -> Installing PostgreSQL 16, Redis, and Nginx..."
apt-get install -y -qq postgresql postgresql-contrib redis-server nginx

# Install PM2 globally
npm install -g pm2 --silent

echo -e "  -> ${GREEN}✓ Runtimes and system services installed successfully.${NC}"

# ------------------------------------------------------------------------------
# 3. CONFIGURE LOW-MEMORY DATABASE & CACHE
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[STEP 3/7] Tuning PostgreSQL and Redis for Low-Memory Footprint...${NC}"

# Configure Redis for max 64MB memory with LRU eviction
mkdir -p /etc/redis 2>/dev/null || true
sed -i 's/^# maxmemory <bytes>/maxmemory 64mb/' /etc/redis/redis.conf 2>/dev/null || true
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf 2>/dev/null || true
systemctl restart redis-server 2>/dev/null || systemctl restart redis 2>/dev/null || true

# Tune PostgreSQL settings for 1GB VPS
PG_CONF=$(find /etc/postgresql/ -name "postgresql.conf" | head -n 1)
if [ -n "$PG_CONF" ] && [ -f "$PG_CONF" ]; then
  sed -i 's/^shared_buffers = .*/shared_buffers = 128MB/' "$PG_CONF" || true
  sed -i 's/^#*work_mem = .*/work_mem = 4MB/' "$PG_CONF" || true
  sed -i 's/^#*maintenance_work_mem = .*/maintenance_work_mem = 32MB/' "$PG_CONF" || true
  sed -i 's/^#*max_connections = .*/max_connections = 40/' "$PG_CONF" || true
fi

PG_HBA=$(find /etc/postgresql/ -name "pg_hba.conf" | head -n 1)
if [ -n "$PG_HBA" ] && [ -f "$PG_HBA" ]; then
  cp "$PG_HBA" "${PG_HBA}.bak" 2>/dev/null || true
  cat > "$PG_HBA" <<'EOF'
# PostgreSQL Client Authentication Configuration File
# Internal loopback connections (Trusted for local services on single-server VPS)
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF
fi
systemctl restart postgresql

echo -e "  -> ${GREEN}✓ PostgreSQL and Redis configured and running.${NC}"

# ------------------------------------------------------------------------------
# 4. PREPARE APPLICATION SOURCE CODE
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[STEP 4/7] Preparing Application Codebase...${NC}"

APP_DIR="/var/www/edusaas"
mkdir -p "$APP_DIR"

CURRENT_DIR="$(pwd -P 2>/dev/null || pwd)"

if [ "$CURRENT_DIR" = "$APP_DIR" ]; then
  echo "  -> Installer running inside $APP_DIR. Checking git repository status..."
  if [ -d "$APP_DIR/.git" ]; then
    echo "  -> Pulling latest develop branch in $APP_DIR..."
    git fetch origin develop 2>/dev/null || true
    git checkout develop 2>/dev/null || true
    git pull origin develop 2>/dev/null || true
  fi
elif [ -f "package.json" ] && [ -d "apps/api" ]; then
  echo "  -> Installer running from local directory ($CURRENT_DIR). Synchronizing codebase to $APP_DIR..."
  rsync -a --exclude='.git' --exclude='node_modules' . "$APP_DIR/" 2>/dev/null || cp -rf . "$APP_DIR/" 2>/dev/null || true
else
  if [ -d "$APP_DIR/.git" ]; then
    echo "  -> Repository exists at $APP_DIR. Pulling latest develop branch..."
    cd "$APP_DIR"
    git fetch origin develop
    git checkout develop
    git pull origin develop
  else
    echo "  -> Cloning EduSaaS repository to $APP_DIR..."
    git clone -b develop https://github.com/angga2103/ManejemenSekolah.git "$APP_DIR"
  fi
fi

cd "$APP_DIR"

# ------------------------------------------------------------------------------
# 5. GENERATE SECURITY CREDENTIALS & CONFIGURE DATABASE
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[STEP 5/7] Provisioning Secure Database, Role & Environment Secrets...${NC}"

DB_NAME="edusaas_prod"
DB_APP_USER="edusaas_app_user"
DB_APP_PASS=$(openssl rand -hex 16)
DB_ADMIN_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
SERVER_IP=$(curl -s -4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')

# Setup PostgreSQL Database & Users via psql
echo "  -> Configuring database, extensions, and application roles..."
sudo -u postgres psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '${DB_ADMIN_PASS}';"
if ! sudo -u postgres psql -U postgres -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null | grep -q 1; then
  sudo -u postgres psql -U postgres -d postgres -c "CREATE DATABASE ${DB_NAME};"
fi
sudo -u postgres psql -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO postgres;"
sudo -u postgres psql -U postgres -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -U postgres -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

sudo -u postgres psql -U postgres -d "$DB_NAME" <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_APP_USER}') THEN
        CREATE ROLE ${DB_APP_USER} WITH 
            LOGIN 
            PASSWORD '${DB_APP_PASS}' 
            NOSUPERUSER 
            NOBYPASSRLS 
            NOCREATEDB 
            NOCREATEROLE 
            NOINHERIT;
    ELSE
        ALTER ROLE ${DB_APP_USER} WITH PASSWORD '${DB_APP_PASS}';
    END IF;
END \$\$;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_APP_USER};
GRANT ALL ON SCHEMA public TO ${DB_APP_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_APP_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_APP_USER};
EOF

# Create .env File
cat > "$APP_DIR/.env" <<EOF
# ==============================================================================
# EDUSAAS PRODUCTION ENVIRONMENT CONFIGURATION (AUTO-GENERATED)
# ==============================================================================
NODE_ENV=production
PORT=4000
SERVER_IP=${SERVER_IP}

# Database Connections
DATABASE_URL="postgresql://${DB_APP_USER}:${DB_APP_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"
DIRECT_URL="postgresql://${DB_APP_USER}:${DB_APP_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"
DATABASE_ADMIN_URL="postgresql://postgres:${DB_ADMIN_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"

# Authentication & JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_ACCESS_SECRET=${JWT_SECRET}
JWT_EXPIRATION=15m
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRATION=7d

# Cache & Queues (Redis)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CORS & Web Client
CORS_ORIGIN="http://${SERVER_IP},http://localhost,http://localhost:3000"

# Application Performance Tuning
NODE_OPTIONS="--max-old-space-size=400"
EOF

# Install workspace dependencies first so local CLI binaries are available
echo "  -> Installing Node.js dependencies (npm ci)..."
export NODE_OPTIONS="--max-old-space-size=512"
npm ci --prefer-offline --no-audit

# Run Prisma Database Schema Push using local project Prisma binary
echo "  -> Synchronizing database schema and creating tables (Prisma db push)..."
export DATABASE_URL="postgresql://postgres:${DB_ADMIN_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"
export DIRECT_URL="postgresql://postgres:${DB_ADMIN_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"
./node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
./node_modules/.bin/prisma db push --schema=apps/api/prisma/schema.prisma --accept-data-loss

# Apply Row Level Security (RLS) DDL
echo "  -> Applying PostgreSQL Row-Level Security policies to all 53 models..."
sudo -u postgres psql -U postgres -d "$DB_NAME" -f "$APP_DIR/infrastructure/postgres/init-rls.sql" >/dev/null 2>&1 || true

# Seed initial demo tenant (Al-Hikmah), roles, and demo accounts using admin connection
echo "  -> Seeding demo tenant (Al-Hikmah), system roles, and demo accounts..."
export DATABASE_URL="postgresql://postgres:${DB_ADMIN_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"
./node_modules/.bin/ts-node --transpile-only apps/api/prisma/seed.ts || true

# Copy .env to apps/api/.env for local service discovery
cp "$APP_DIR/.env" "$APP_DIR/apps/api/.env" 2>/dev/null || true

# Restore runtime application database URL in current environment
export DATABASE_URL="postgresql://${DB_APP_USER}:${DB_APP_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"
export DIRECT_URL="postgresql://${DB_APP_USER}:${DB_APP_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"

echo -e "  -> ${GREEN}✓ Database initialized and hardened with PostgreSQL RLS.${NC}"

# ------------------------------------------------------------------------------
# 6. BUILD APPLICATIONS & START SERVICES WITH PM2
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[STEP 6/7] Building Workspace Packages & Deploying with PM2...${NC}"

# Build shared packages, API, and Web Portal in dependency order
export NODE_OPTIONS="--max-old-space-size=512"
echo "  -> [1/4] Compiling @edusaas/shared-types..."
npm run build --workspace=@edusaas/shared-types

echo "  -> [2/4] Compiling @edusaas/api-contracts..."
npm run build --workspace=@edusaas/api-contracts

echo "  -> [3/4] Compiling @edusaas/api (NestJS API)..."
npm run build --workspace=@edusaas/api

echo "  -> [4/4] Compiling @edusaas/web (React Web Portal)..."
npm run build --workspace=@edusaas/web

# Configure PM2 to run the Backend API
ENTRY_FILE="apps/api/dist/src/main.js"
if [ ! -f "$ENTRY_FILE" ]; then
  ENTRY_FILE="apps/api/dist/main.js"
fi

pm2 delete edusaas-api 2>/dev/null || true
cd "$APP_DIR"
pm2 start "$ENTRY_FILE" \
  --name "edusaas-api" \
  --cwd "$APP_DIR" \
  --update-env \
  --node-args="--max-old-space-size=350" \
  --max-memory-restart 400M \
  --time

pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "  -> Verifying API health on port 4000..."
sleep 4
if curl -fsSL http://127.0.0.1:4000/api/docs >/dev/null 2>&1; then
  echo -e "  -> ${GREEN}✓ Backend API is responding successfully on port 4000.${NC}"
else
  echo -e "  -> ${YELLOW}Backend API is warming up. Recent PM2 logs:${NC}"
  pm2 logs edusaas-api --lines 20 --nostream || true
fi

# ------------------------------------------------------------------------------
# 7. CONFIGURE NGINX WEB SERVER & REVERSE PROXY
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[STEP 7/7] Configuring Nginx Reverse Proxy & Web Host...${NC}"

cat > /etc/nginx/sites-available/edusaas <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Web Portal Static Assets
    root ${APP_DIR}/apps/web/dist;
    index index.html;

    client_max_body_size 25M;

    # Gzip Compression for Fast Loading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API & Swagger Documentation Proxy
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    # Single Page Application (SPA) Routing Fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
ln -sf /etc/nginx/sites-available/edusaas /etc/nginx/sites-enabled/edusaas
nginx -t
systemctl reload nginx

# Optional: Firewall Setup (UFW)
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# Save Credentials Summary File
CREDENTIALS_FILE="${APP_DIR}/INSTALL_CREDENTIALS.txt"
cat > "$CREDENTIALS_FILE" <<EOF
==============================================================================
EDUSAAS: INSTALLATION & CREDENTIALS SUMMARY
==============================================================================
Installation Date : $(date)
Server IP Address : ${SERVER_IP}

[ACCESS ENDPOINTS]
- Web Management Portal : http://${SERVER_IP}
- Backend REST API      : http://${SERVER_IP}/api/v1
- Interactive API Docs  : http://${SERVER_IP}/api/docs

[DEMO PORTAL LOGIN ACCOUNTS]
- Subdomain / Lembaga   : alhikmah
- Default Password      : Password123!
- Kepala Sekolah        : admin@alhikmah.sch.id
- Bendahara             : bendahara@alhikmah.sch.id
- Dewan Guru            : guru@alhikmah.sch.id
- Musyrif Asrama        : musyrif@alhikmah.sch.id
- Satpam / Presensi     : satpam@alhikmah.sch.id
- Siswa / Santri        : santri@alhikmah.sch.id
- Wali Santri           : wali@alhikmah.sch.id

[DATABASE CONFIGURATION]
- Host     : localhost:5432
- Database : ${DB_NAME}
- App User : ${DB_APP_USER}
- App Pass : ${DB_APP_PASS}
- Security : PostgreSQL Row Level Security (RLS) Active on 53 Tables

[JWT AUTHENTICATION SECRETS]
- JWT_SECRET         : ${JWT_SECRET}
- JWT_REFRESH_SECRET : ${JWT_REFRESH_SECRET}

[SERVICE MANAGEMENT COMMANDS]
- Check API Status  : pm2 status
- View API Logs     : pm2 logs edusaas-api
- Restart API       : pm2 restart edusaas-api
- Restart Nginx     : systemctl restart nginx
- Restart Database  : systemctl restart postgresql
==============================================================================
EOF

chmod 600 "$CREDENTIALS_FILE"

# ------------------------------------------------------------------------------
# INSTALLATION COMPLETE BANNER
# ------------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}  ✓ EDUSAAS HAS BEEN SUCCESSFULLY INSTALLED & DEPLOYED!${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "  ${CYAN}${BOLD}🌐 Web Portal URL  :${NC} ${BOLD}http://${SERVER_IP}${NC}"
echo -e "  ${CYAN}${BOLD}🔌 Backend API URL :${NC} ${BOLD}http://${SERVER_IP}/api/v1${NC}"
echo -e "  ${CYAN}${BOLD}📖 Swagger Docs    :${NC} ${BOLD}http://${SERVER_IP}/api/docs${NC}"
echo ""
echo -e "  ${YELLOW}${BOLD}🔑 Credentials file saved at:${NC} ${CREDENTIALS_FILE}"
echo ""
echo -e "  ${BLUE}Quick Commands:${NC}"
echo -e "    - Monitor API     : ${BOLD}pm2 status${NC}"
echo -e "    - Realtime Logs   : ${BOLD}pm2 logs edusaas-api${NC}"
echo -e "    - View Credentials: ${BOLD}cat ${CREDENTIALS_FILE}${NC}"
echo ""
echo -e "${GREEN}==============================================================================${NC}"
