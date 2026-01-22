# Korean Talim AI Bot - Server Deployment

## Server: Ubuntu 24.04
## Domain: karean-ai.bekmuhammad.uz
## IP: 173.249.32.6

---

## 1. Serverga SSH orqali ulaning

```bash
ssh root@173.249.32.6
# yoki
ssh your_user@173.249.32.6
```

---

## 2. Loyihani klonlash

```bash
# Loyiha papkasini yarating
cd /var/www
mkdir -p korean-talim-ai
cd korean-talim-ai

# GitHub'dan klonlash
git clone https://github.com/Bekmuhammad-Devoloper/karean-talim-ai-bot.git .
```

---

## 3. Node.js va PM2 o'rnatish (agar yo'q bo'lsa)

```bash
# Node.js 20.x o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 global o'rnatish
sudo npm install -g pm2
```

---

## 4. Backend sozlash

```bash
cd /var/www/korean-talim-ai/backend

# Dependencylarni o'rnatish
npm install

# .env fayl yaratish
nano .env
```

### Backend .env fayl:

```env
# Server
PORT=3002
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

# Gemini AI (bir nechta kalit)
GEMINI_API_KEY_1=your_gemini_key_1
GEMINI_API_KEY_2=your_gemini_key_2
GEMINI_API_KEY_3=your_gemini_key_3
GEMINI_API_KEY_4=your_gemini_key_4

# AssemblyAI (audio uchun)
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

```bash
# Build qilish
npm run build
```

---

## 5. Frontend sozlash

```bash
cd /var/www/korean-talim-ai/frontend

# Dependencylarni o'rnatish
npm install

# .env.local fayl yaratish
nano .env.local
```

### Frontend .env.local fayl:

```env
NEXT_PUBLIC_API_URL=https://karean-ai.bekmuhammad.uz
```

```bash
# Build qilish
npm run build
```

---

## 6. PM2 bilan ishga tushirish

```bash
cd /var/www/korean-talim-ai

# PM2 ecosystem fayl yaratish
nano ecosystem.config.js
```

### ecosystem.config.js:

```javascript
module.exports = {
  apps: [
    {
      name: 'korean-talim-backend',
      cwd: '/var/www/korean-talim-ai/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
    {
      name: 'korean-talim-frontend',
      cwd: '/var/www/korean-talim-ai/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },
  ],
};
```

```bash
# PM2 bilan ishga tushirish
pm2 start ecosystem.config.js

# PM2 ni systemd bilan bog'lash
pm2 startup
pm2 save

# Holatni tekshirish
pm2 status
pm2 logs korean-talim-backend
pm2 logs korean-talim-frontend
```

---

## 7. Nginx sozlash

```bash
sudo nano /etc/nginx/sites-available/karean-ai
```

### Nginx konfiguratsiya:

```nginx
server {
    listen 80;
    server_name karean-ai.bekmuhammad.uz;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/karean-ai /etc/nginx/sites-enabled/

# Nginx konfiguratsiyani tekshirish
sudo nginx -t

# Nginx qayta yuklash
sudo systemctl reload nginx
```

---

## 8. SSL sertifikati (Let's Encrypt)

```bash
# Certbot o'rnatish
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikati olish
sudo certbot --nginx -d karean-ai.bekmuhammad.uz

# Auto-renewal tekshirish
sudo certbot renew --dry-run
```

---

## 9. Yangilash (Update)

```bash
cd /var/www/korean-talim-ai

# Yangi kodni olish
git pull origin main

# Backend yangilash
cd backend
npm install
npm run build

# Frontend yangilash
cd ../frontend
npm install
npm run build

# PM2 qayta yuklash
pm2 restart korean-talim-backend korean-talim-frontend
```

---

## 10. Foydali buyruqlar

```bash
# PM2 holatini ko'rish
pm2 status

# Loglarni ko'rish
pm2 logs korean-talim-backend --lines 100
pm2 logs korean-talim-frontend --lines 100

# Qayta ishga tushirish
pm2 restart korean-talim-backend
pm2 restart korean-talim-frontend

# To'xtatish
pm2 stop korean-talim-backend
pm2 stop korean-talim-frontend

# O'chirish
pm2 delete korean-talim-backend korean-talim-frontend
```

---

## Muhim eslatmalar:

1. **Port**: Backend 3002, Frontend 3003 portlarida ishlaydi (boshqa projectlarga zid kelmasin)
2. **Database**: SQLite ishlatiladi, alohida DB server kerak emas
3. **Bot Token**: Telegram bot tokeni .env faylda bo'lishi kerak
4. **API Keys**: OpenAI, Gemini, AssemblyAI kalitlari kerak

---

## Muammolarni hal qilish:

### Bot ishlamayapti:
```bash
pm2 logs korean-talim-backend --lines 50
# KOREAN_BOT_TOKEN to'g'riligini tekshiring
```

### Frontend 502 xatosi:
```bash
pm2 status
pm2 restart korean-talim-frontend
```

### Nginx xatosi:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```
