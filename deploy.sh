#!/bin/bash

# ===========================================
# Hilal AI Bot - Server Deployment Script
# ===========================================
# Server: Contabo VPS
# Domain: hilal-ai.uz
# ===========================================

set -e

echo "🚀 Hilal AI Bot - Deployment Script"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DOMAIN="hilal-ai.uz"
API_DOMAIN="api.hilal-ai.uz"
PROJECT_DIR="/root/hilal-aibot"
REPO_URL="https://github.com/your-username/hilal-aibot.git"

# Step 1: Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Step 4: Install Git
echo -e "${YELLOW}📂 Installing Git...${NC}"
apt install -y git

# Step 5: Clone or pull repository
echo -e "${YELLOW}📥 Setting up project...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    git pull origin main
    echo -e "${GREEN}✅ Project updated${NC}"
else
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
    echo -e "${GREEN}✅ Project cloned${NC}"
fi

# Step 6: Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p $PROJECT_DIR/nginx/ssl
mkdir -p $PROJECT_DIR/certbot/conf
mkdir -p $PROJECT_DIR/certbot/www
mkdir -p $PROJECT_DIR/backend/data
mkdir -p $PROJECT_DIR/backend/uploads

# Step 7: Setup environment file
echo -e "${YELLOW}⚙️ Setting up environment...${NC}"
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cp $PROJECT_DIR/.env.example $PROJECT_DIR/.env
    echo -e "${RED}⚠️ Please edit .env file with your credentials!${NC}"
    echo -e "${RED}   nano $PROJECT_DIR/.env${NC}"
fi

# Step 8: Get SSL certificates
echo -e "${YELLOW}🔐 Getting SSL certificates...${NC}"
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    # First, start nginx without SSL for certbot challenge
    docker run -d --name temp-nginx \
        -p 80:80 \
        -v $PROJECT_DIR/certbot/www:/var/www/certbot \
        nginx:alpine

    # Get certificates
    docker run --rm \
        -v $PROJECT_DIR/certbot/conf:/etc/letsencrypt \
        -v $PROJECT_DIR/certbot/www:/var/www/certbot \
        certbot/certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d $API_DOMAIN \
        --email sxkhaydarov@gmail.com \
        --agree-tos \
        --no-eff-email

    # Stop temp nginx
    docker stop temp-nginx && docker rm temp-nginx
    
    echo -e "${GREEN}✅ SSL certificates obtained${NC}"
else
    echo -e "${GREEN}✅ SSL certificates already exist${NC}"
fi

# Step 9: Build and start containers
echo -e "${YELLOW}🏗️ Building and starting containers...${NC}"
cd $PROJECT_DIR
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Step 10: Check status
echo -e "${YELLOW}📊 Checking container status...${NC}"
docker-compose ps

# Step 11: Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "🌐 Website: https://$DOMAIN"
echo -e "🔧 API: https://$API_DOMAIN"
echo -e "📚 API Docs: https://$API_DOMAIN/api/docs"
echo -e "📊 Bekmuhammad API: https://$API_DOMAIN/api/stats/bekmuhammad"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo -e "   View logs: docker-compose logs -f"
echo -e "   Restart: docker-compose restart"
echo -e "   Stop: docker-compose down"
echo -e "   Rebuild: docker-compose up -d --build"
