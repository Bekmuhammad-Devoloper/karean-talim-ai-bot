# Hilal AI Bot - Contabo Server Deployment Guide

## 🖥️ Server Ma'lumotlari
- **Provider:** Contabo
- **Email:** sxkhaydarov@gmail.com
- **Password:** 1kOVnH98f (yoki 38cESJaPvfnEKsG6uBn5A0OM)

## 🌐 Domenlar
- **Website:** https://hilal-ai.uz
- **API:** https://api.hilal-ai.uz
- **Bekmuhammad API:** https://api.hilal-ai.uz/api/stats/bekmuhammad

---

## 📋 Qadamlar

### 1️⃣ Serverga ulanish

```bash
# SSH orqali ulanish (IP manzilni almashtirib qo'ying)
ssh root@YOUR_SERVER_IP
```

### 2️⃣ Loyihani yuklash

**Variant A: Git orqali (tavsiya etiladi)**
```bash
# Git o'rnatish
apt update && apt install -y git

# Loyihani clone qilish
cd /root
git clone https://github.com/your-username/hilal-aibot.git
cd hilal-aibot
```

**Variant B: SCP orqali (lokaldagi fayllarni yuklash)**
```powershell
# Windows PowerShell da (lokaldagi kompyuterda)
scp -r C:\Users\Onyx_PC\Desktop\hilal_aibot root@YOUR_SERVER_IP:/root/
```

### 3️⃣ Environment sozlash

```bash
cd /root/hilal-aibot

# .env faylini yaratish
cp .env.example .env

# .env faylini tahrirlash
nano .env
```

**.env fayliga quyidagilarni kiriting:**
```env
JWT_SECRET=your-very-long-random-secret-key-here
BOT_TOKEN=your-telegram-bot-token
GEMINI_API_KEYS=key1,key2,key3,key4
ADMIN_TELEGRAM_IDS=your-telegram-id
```

### 4️⃣ Deploy skriptini ishga tushirish

```bash
# Skriptga ruxsat berish
chmod +x deploy.sh

# Deploy qilish
./deploy.sh
```

### 5️⃣ Domen DNS sozlash

Domen provaydringizda quyidagi DNS yozuvlarini qo'shing:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 3600 |
| A | www | YOUR_SERVER_IP | 3600 |
| A | api | YOUR_SERVER_IP | 3600 |

### 6️⃣ SSL sertifikatni olish

```bash
cd /root/hilal-aibot

# Nginx va certbot uchun papkalar yaratish
mkdir -p nginx/ssl certbot/conf certbot/www

# Certbot bilan SSL olish
docker run --rm \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/certbot/www:/var/www/certbot \
    certbot/certbot certonly --standalone \
    -d hilal-ai.uz \
    -d www.hilal-ai.uz \
    -d api.hilal-ai.uz \
    --email sxkhaydarov@gmail.com \
    --agree-tos \
    --no-eff-email
```

### 7️⃣ Konteynerlarni qayta ishga tushirish

```bash
docker-compose down
docker-compose up -d --build
```

---

## 🔧 Foydali Buyruqlar

### Loglarni ko'rish
```bash
# Barcha loglar
docker-compose logs -f

# Backend loglari
docker-compose logs -f backend

# Frontend loglari
docker-compose logs -f frontend

# Nginx loglari
docker-compose logs -f nginx
```

### Konteynerlarni boshqarish
```bash
# Status
docker-compose ps

# Qayta ishga tushirish
docker-compose restart

# To'xtatish
docker-compose down

# Qayta build qilish
docker-compose up -d --build
```

### Database backup
```bash
# Backup olish
docker cp hilal-backend:/app/data/database.sqlite ./backup-$(date +%Y%m%d).sqlite

# Backupni tiklash
docker cp ./backup.sqlite hilal-backend:/app/data/database.sqlite
docker-compose restart backend
```

---

## 🚨 Muammolarni hal qilish

### Port band bo'lsa
```bash
# 80 va 443 portlarni kim ishlatayotganini ko'rish
lsof -i :80
lsof -i :443

# Processni to'xtatish
kill -9 <PID>
```

### SSL muammo
```bash
# Sertifikatlarni qayta olish
docker-compose down
docker run --rm \
    -p 80:80 \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    certbot/certbot certonly --standalone \
    -d hilal-ai.uz -d www.hilal-ai.uz -d api.hilal-ai.uz \
    --email sxkhaydarov@gmail.com --agree-tos --no-eff-email --force-renewal
docker-compose up -d
```

### Container ishlamasa
```bash
# Loglarni tekshirish
docker-compose logs backend
docker-compose logs frontend

# Container ichiga kirish
docker exec -it hilal-backend sh
docker exec -it hilal-frontend sh
```

---

## 📊 API Endpoints

### Public (Autentifikatsiyasiz)
| Endpoint | Method | Tavsif |
|----------|--------|--------|
| `/api/stats/bekmuhammad` | GET | To'liq loyiha statistikasi |

### Protected (JWT Token kerak)
| Endpoint | Method | Tavsif |
|----------|--------|--------|
| `/api/auth/login` | POST | Admin login |
| `/api/stats/dashboard` | GET | Dashboard statistikasi |
| `/api/users` | GET | Foydalanuvchilar ro'yxati |
| `/api/channels` | GET | Kanallar ro'yxati |
| `/api/posts` | GET | Postlar ro'yxati |

---

## 🎉 Tayyor!

Endi sizning loyihangiz Contabo serverda ishlaydi:
- 🌐 **Website:** https://hilal-ai.uz
- 🔧 **API:** https://api.hilal-ai.uz
- 📚 **Swagger:** https://api.hilal-ai.uz/api/docs
- 📊 **Bekmuhammad API:** https://api.hilal-ai.uz/api/stats/bekmuhammad
