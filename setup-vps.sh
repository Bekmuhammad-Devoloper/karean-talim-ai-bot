#!/bin/bash

# ===========================================
# Hilal AI Bot - Ubuntu 24.04 VPS Setup
# Server: 138.249.7.238
# Domain: hilal_ai.bekmuhammad.uz
# ===========================================

set -e

echo "🚀 Hilal AI Bot - VPS Setup"
echo "============================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Update system
echo -e "${YELLOW}📦 Updating system...${NC}"
apt update && apt upgrade -y

# 2. Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 3. Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 4. Install Git & other tools
echo -e "${YELLOW}📦 Installing tools...${NC}"
apt install -y git curl wget unzip

# 5. Setup firewall
echo -e "${YELLOW}🔥 Setting up firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable

# 6. Create directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p /root/hilal-aibot/{backend,frontend,nginx/ssl,certbot/conf,certbot/www}
mkdir -p /root/hilal-aibot/backend/{data,uploads}

echo -e "${GREEN}✅ VPS setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Upload project files to /root/hilal-aibot/"
echo "2. Create .env file"
echo "3. Run: docker-compose up -d --build"
