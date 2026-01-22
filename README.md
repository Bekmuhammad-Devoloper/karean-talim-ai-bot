# Hilal AI Bot 🤖

Telegram grammatik xatolarni to'g'irlovchi bot - Admin Panel bilan.

## Xususiyatlari

### Bot (User)
- ✍️ **Matn tekshirish** - Yuborilgan matndagi grammatik xatolarni topib, to'g'rilaydi
- 🎤 **Ovozli xabar** - Voice xabarni matnga aylantirib, grammatik tekshiradi
- 🖼️ **Rasm** - Rasmdagi matnni OCR orqali o'qib, grammatik tekshiradi
- 🌐 **Ko'p tilli** - O'zbek, Rus, Ingliz, Turk tillarini qo'llab-quvvatlaydi
- 📢 **Majburiy obuna** - Kanalga obunani tekshiradi

### Admin Panel
- 📊 **Dashboard** - Umumiy statistika
- 📝 **Postlar** - Kanallarga post yaratish va yuborish
- 📢 **Kanallar** - Majburiy obuna kanallarini boshqarish
- 📈 **Statistika** - Batafsil statistik ma'lumotlar

## Texnologiyalar

### Backend
- **NestJS** - Node.js framework
- **TypeORM** - ORM (SQLite)
- **Telegraf** - Telegram Bot API
- **OpenAI** - GPT-4 (grammatika), Whisper (speech-to-text)
- **Tesseract.js** - OCR

### Frontend
- **Next.js 14** - React framework
- **TailwindCSS** - Styling
- **Chart.js** - Grafiklar
- **Zustand** - State management

## O'rnatish

### 1. Repository'ni klonlash
```bash
git clone <repo-url>
cd hilal_aibot
```

### 2. Backend sozlash
```bash
cd backend
npm install

# .env faylini yarating
cp .env.example .env

# .env faylini tahrirlang:
# - BOT_TOKEN - @BotFather dan oling
# - OPENAI_API_KEY - OpenAI API kaliti
# - ADMIN_IDS - Admin telegram ID lari
```

### 3. Frontend sozlash
```bash
cd frontend
npm install
```

### 4. Ishga tushirish

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## .env Sozlamalari

```env
# Telegram Bot
BOT_TOKEN=123456:ABC-DEF...        # @BotFather dan oling
ADMIN_IDS=123456789                # Telegram ID

# OpenAI
OPENAI_API_KEY=sk-...              # platform.openai.com dan

# Admin Panel
JWT_SECRET=your-secret-key         # Tasodifiy uzun string
ADMIN_USERNAME=admin               # Admin login
ADMIN_PASSWORD=admin123            # Admin parol

# Majburiy kanal (ixtiyoriy)
MANDATORY_CHANNEL_ID=-1001234567890
MANDATORY_CHANNEL_USERNAME=my_channel
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Profile

### Stats
- `GET /api/stats/dashboard` - Dashboard statistikasi
- `GET /api/stats/recent-requests` - So'nggi so'rovlar
- `GET /api/stats/top-users` - Top foydalanuvchilar
- `GET /api/stats/daily` - Kunlik statistika

### Channels
- `GET /api/channels` - Barcha kanallar
- `POST /api/channels` - Kanal qo'shish
- `PUT /api/channels/:id` - Kanalni tahrirlash
- `DELETE /api/channels/:id` - Kanalni o'chirish

### Posts
- `GET /api/posts` - Barcha postlar
- `POST /api/posts` - Post yaratish
- `POST /api/posts/:id/send` - Postni kanalga yuborish

## Bot Buyruqlari

- `/start` - Botni ishga tushirish
- `/help` - Yordam
- `/language` - Tilni o'zgartirish
- `/stats` - Shaxsiy statistika

## Loyiha Strukturasi

```
hilal_aibot/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Autentifikatsiya
│   │   │   ├── users/         # Admin users
│   │   │   ├── bot/           # Telegram bot
│   │   │   ├── grammar/       # Grammar, OCR, STT
│   │   │   ├── channels/      # Kanal boshqaruvi
│   │   │   ├── posts/         # Post yuborish
│   │   │   └── stats/         # Statistika
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   └── dashboard/
│   │   ├── lib/
│   │   └── store/
│   └── package.json
│
└── README.md
```

## Litsenziya

MIT

## Muallif

Hilal AI Bot Team
