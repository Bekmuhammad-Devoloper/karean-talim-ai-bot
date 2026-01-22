#!/bin/bash

# Korean Talim AI Bot - Server Setup Script
# Ubuntu 24.04 | Domain: karean-ai.bekmuhammad.uz

set -e

echo "=========================================="
echo "  Korean Talim AI Bot - Server Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
APP_DIR="/var/www/korean-talim-ai"
BACKEND_PORT=3002
FRONTEND_PORT=3003
DOMAIN="karean-ai.bekmuhammad.uz"

# Update system
echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt update && apt upgrade -y

# Install Node.js 20.x
echo -e "${YELLOW}[2/8] Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}Node.js version: $(node -v)${NC}"
echo -e "${GREEN}NPM version: $(npm -v)${NC}"

# Install PM2 globally
echo -e "${YELLOW}[3/8] Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${YELLOW}[4/8] Installing Nginx...${NC}"
apt install -y nginx

# Create app directory
echo -e "${YELLOW}[5/8] Setting up application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo -e "${YELLOW}[6/8] Cloning repository...${NC}"
if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/Bekmuhammad-Devoloper/karean-talim-ai-bot.git .
fi

# Setup Backend
echo -e "${YELLOW}[7/8] Setting up Backend...${NC}"
cd $APP_DIR/backend
npm install

# Create backend .env if not exists
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Server
PORT=$BACKEND_PORT
NODE_ENV=production

# Database
DATABASE_PATH=./database.sqlite

# JWT
JWT_SECRET=korean_talim_super_secret_key_2026

# Telegram Bot
KOREAN_BOT_TOKEN=8342415639:AAEMk7e4oTZHKjyPpRAvjo4ftvnsqJWxbrI
KOREAN_BOT_ADMIN_IDS=YOUR_TELEGRAM_ID

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Gemini AI
GEMINI_API_KEY_1=your_gemini_key_1
GEMINI_API_KEY_2=your_gemini_key_2
GEMINI_API_KEY_3=your_gemini_key_3
GEMINI_API_KEY_4=your_gemini_key_4

# AssemblyAI
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
EOF
    echo -e "${YELLOW}Backend .env file created. Please edit with your API keys!${NC}"
fi

npm run build

# Setup Frontend
echo -e "${YELLOW}[8/8] Setting up Frontend...${NC}"
cd $APP_DIR/frontend
npm install

# Create frontend .env.local if not exists
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN
EOF
fi

npm run build

# Setup Nginx
echo -e "${YELLOW}Setting up Nginx...${NC}"
cat > /etc/nginx/sites-available/karean-ai << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
    }

    location /auth {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/karean-ai /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Start PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 startup
pm2 save

echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "  Domain: $DOMAIN"
echo "  Backend Port: $BACKEND_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo ""
echo "  Next steps:"
echo "  1. Edit /var/www/korean-talim-ai/backend/.env with your API keys"
echo "  2. Run: sudo certbot --nginx -d $DOMAIN"
echo "  3. Restart: pm2 restart all"
echo ""
echo "==========================================${NC}"
