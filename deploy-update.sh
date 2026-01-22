#!/bin/bash

# Hilal AI Bot - Quick Deploy Update Script
# Serverda ishlatish: ./deploy-update.sh

set -e

echo "🚀 Hilal AI Bot - Deploy Update"
echo "================================"

cd /root/Hilal_aibot

# Git pull
echo "📥 Git pull..."
git pull origin main

# Backend build
echo "🔧 Backend build..."
cd backend
npm run build
cd ..

# Frontend build
echo "🎨 Frontend build..."
cd frontend
npm run build
cd ..

# Uploads papkasini yaratish
mkdir -p backend/uploads/posts

# Nginx config update
echo "🌐 Nginx config update..."
sudo cp nginx/nginx.conf /etc/nginx/sites-available/hilal-ai.bekmuhammad.uz
sudo nginx -t && sudo systemctl reload nginx

# PM2 restart
echo "🔄 PM2 restart..."
pm2 restart all

echo ""
echo "✅ Deploy completed!"
echo "🌐 Site: https://hilal-ai.bekmuhammad.uz"
pm2 status
