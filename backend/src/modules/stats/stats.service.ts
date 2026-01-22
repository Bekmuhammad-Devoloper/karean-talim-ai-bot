import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { GrammarRequest } from './entities/grammar-request.entity';
import { BotUser } from '../bot/entities/bot-user.entity';
import { KoreanBotUser } from '../korean-bot/entities/korean-bot-user.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(GrammarRequest)
    private grammarRequestRepository: Repository<GrammarRequest>,
    @InjectRepository(BotUser)
    private botUserRepository: Repository<BotUser>,
    @InjectRepository(KoreanBotUser)
    private koreanBotUserRepository: Repository<KoreanBotUser>,
  ) {}

  // ==================== BEKMUHAMMAD FULL STATS (ALL IN ONE) ====================

  async getBekmuhammadFullStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ===== SUBSCRIBERS STATS =====
    const totalSubscribers = await this.botUserRepository.count();
    const activeToday = await this.botUserRepository.count({
      where: { lastActiveAt: MoreThanOrEqual(today) },
    });
    const newToday = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const subscribersThisWeek = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });
    const subscribersThisMonth = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(monthAgo) },
    });

    // ===== REQUESTS STATS =====
    const totalRequests = await this.grammarRequestRepository.count();
    const requestsToday = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const requestsLastHour = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(lastHour) },
    });
    const requestsLast24Hours = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(last24Hours) },
    });
    const requestsThisWeek = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });
    const requestsThisMonth = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(monthAgo) },
    });

    // Request type breakdown
    const textRequests = await this.grammarRequestRepository.count({ where: { type: 'text' } });
    const voiceRequests = await this.grammarRequestRepository.count({ where: { type: 'voice' } });
    const imageRequests = await this.grammarRequestRepository.count({ where: { type: 'image' } });

    // Top subscribers
    const topSubscribers = await this.botUserRepository.find({
      order: { totalRequests: 'DESC' },
      take: 10,
    });

    // Daily growth for last 7 days
    const dailyGrowth: Array<{ date: string; newSubscribers: number; requests: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const subscriberCount = await this.botUserRepository.count({
        where: { createdAt: MoreThanOrEqual(date) },
      });
      const requestCount = await this.grammarRequestRepository.count({
        where: { createdAt: MoreThanOrEqual(date) },
      });
      dailyGrowth.push({
        date: date.toISOString().split('T')[0],
        newSubscribers: subscriberCount,
        requests: requestCount,
      });
    }

    return {
      // ===== PROJECT INFO =====
      project: {
        name: 'Hilal AI Bot',
        description: 'O\'zbek tili grammatikasini tekshirish uchun sun\'iy intellekt yordamida ishlaydigan Telegram bot',
        version: '1.0.0',
        author: 'bekmuhammad',
        createdAt: '2025-01-01',
        status: 'active',
        platform: 'Telegram',
        language: 'O\'zbek tili',
        links: {
          telegram: 'https://t.me/hilal_ai_bot',
          github: 'https://github.com/bekmuhammad/hilal-ai-bot',
          website: 'https://hilal-ai.uz',
        },
      },

      // ===== REAL-TIME STATS =====
      realtime: {
        timestamp: now.toISOString(),
        serverStatus: 'online',
        responseTime: '< 2s',
        errorRate: '< 0.1%',
        uptime: '99.9%',
      },

      // ===== SUBSCRIBERS =====
      subscribers: {
        total: totalSubscribers,
        activeToday: activeToday,
        newToday: newToday,
        thisWeek: subscribersThisWeek,
        thisMonth: subscribersThisMonth,
        growthRate: totalSubscribers > 0 ? ((newToday / totalSubscribers) * 100).toFixed(2) + '%' : '0%',
        dailyAverage: (subscribersThisWeek / 7).toFixed(1),
        topSubscribers: topSubscribers.map(user => ({
          firstName: user.firstName || 'Anonim',
          username: user.username || null,
          totalRequests: user.totalRequests,
          joinedAt: user.createdAt,
        })),
      },

      // ===== REQUESTS =====
      requests: {
        total: totalRequests,
        today: requestsToday,
        lastHour: requestsLastHour,
        last24Hours: requestsLast24Hours,
        thisWeek: requestsThisWeek,
        thisMonth: requestsThisMonth,
        breakdown: {
          text: textRequests,
          voice: voiceRequests,
          image: imageRequests,
        },
      },

      // ===== DAILY ANALYTICS =====
      dailyAnalytics: dailyGrowth,

      // ===== GOALS =====
      goals: {
        mission: 'O\'zbek tili grammatikasini yaxshilash va o\'zbek tilida to\'g\'ri yozishni ommalashtirish',
        vision: 'O\'zbek tili grammatikasini tekshirishda #1 AI yechim bo\'lish',
        milestones: [
          {
            id: 1,
            title: '10,000 obunachilar',
            description: '10,000 faol foydalanuvchiga yetish',
            target: 10000,
            current: totalSubscribers,
            progress: Math.min((totalSubscribers / 10000) * 100, 100).toFixed(1) + '%',
            status: totalSubscribers >= 10000 ? 'completed' : 'in_progress',
            deadline: '2026-06-01',
          },
          {
            id: 2,
            title: '100,000 so\'rovlar',
            description: '100,000 grammatika tekshiruv so\'rovlarini qayta ishlash',
            target: 100000,
            current: totalRequests,
            progress: Math.min((totalRequests / 100000) * 100, 100).toFixed(1) + '%',
            status: totalRequests >= 100000 ? 'completed' : 'in_progress',
            deadline: '2026-12-31',
          },
          {
            id: 3,
            title: 'Ovozli xabarlar',
            description: 'Speech-to-text orqali ovozli xabarlarni qayta ishlash',
            progress: '100%',
            status: 'completed',
          },
          {
            id: 4,
            title: 'Rasm/screenshot',
            description: 'OCR orqali rasmlardan matn ajratish va tekshirish',
            progress: '100%',
            status: 'completed',
          },
          {
            id: 5,
            title: 'Ko\'p tilli',
            description: 'O\'zbek, Rus, Ingliz tillarini qo\'llab-quvvatlash',
            progress: '100%',
            status: 'completed',
          },
          {
            id: 6,
            title: 'Mobile App',
            description: 'iOS va Android uchun mobil ilova yaratish',
            progress: '0%',
            status: 'planned',
            deadline: '2027-01-01',
          },
        ],
        achievements: [
          { title: 'Birinchi 1000 foydalanuvchi', achievedAt: '2025-02-15', icon: '🎉' },
          { title: 'AI integratsiya', achievedAt: '2025-01-15', icon: '🤖' },
          { title: 'Ovozli xabarlar', achievedAt: '2025-03-01', icon: '🎤' },
        ],
      },

      // ===== FEATURES =====
      features: {
        active: [
          { id: 1, name: 'Grammatika tekshiruvi', icon: '✏️', status: 'active' },
          { id: 2, name: 'Matn tuzatish', icon: '✅', status: 'active' },
          { id: 3, name: 'Ovozli xabarlar', icon: '🎤', status: 'active' },
          { id: 4, name: 'Rasm OCR', icon: '📷', status: 'active' },
          { id: 5, name: 'Video xabarlar', icon: '🎬', status: 'active' },
        ],
        planned: [
          { id: 6, name: 'Mobil ilova', icon: '📱', expectedDate: '2027-01-01' },
          { id: 7, name: 'API integratsiya', icon: '🔗', expectedDate: '2026-06-01' },
          { id: 8, name: 'Browser extension', icon: '🌐', expectedDate: '2026-09-01' },
        ],
        stats: {
          totalFeatures: 8,
          activeFeatures: 5,
          plannedFeatures: 3,
          completionRate: '62.5%',
        },
      },

      // ===== TECHNOLOGIES =====
      technologies: {
        backend: [
          { name: 'Node.js', version: '20.x', icon: 'nodejs' },
          { name: 'NestJS', version: '10.x', icon: 'nestjs' },
          { name: 'TypeScript', version: '5.x', icon: 'typescript' },
          { name: 'PostgreSQL', version: '15.x', icon: 'postgresql' },
          { name: 'TypeORM', version: '0.3.x', icon: 'database' },
        ],
        ai: [
          { name: 'Google Gemini AI', version: '1.5 Flash', icon: 'gemini' },
          { name: 'Google Cloud Speech-to-Text', version: 'v1', icon: 'google-cloud' },
          { name: 'Tesseract OCR', version: '5.x', icon: 'ocr' },
        ],
        frontend: [
          { name: 'Next.js', version: '14.x', icon: 'nextjs' },
          { name: 'React', version: '18.x', icon: 'react' },
          { name: 'TailwindCSS', version: '3.x', icon: 'tailwindcss' },
        ],
        infrastructure: [
          { name: 'Docker', version: '24.x', icon: 'docker' },
          { name: 'Telegraf', version: '4.x', icon: 'telegram' },
        ],
      },
    };
  }

  // ==================== EXISTING METHODS ====================

  async getProjectInfo(): Promise<any> {
    const totalUsers = await this.botUserRepository.count();
    const totalRequests = await this.grammarRequestRepository.count();

    return {
      name: 'Hilal AI Bot',
      description: 'O\'zbek tili grammatikasini tekshirish uchun sun\'iy intellekt yordamida ishlaydigan Telegram bot',
      version: '1.0.0',
      author: 'bekmuhammad',
      createdAt: '2025-01-01',
      status: 'active',
      platform: 'Telegram',
      language: 'O\'zbek tili',
      stats: {
        totalSubscribers: totalUsers,
        totalRequests: totalRequests,
        uptime: '99.9%',
      },
      links: {
        telegram: 'https://t.me/hilal_ai_bot',
        github: 'https://github.com/bekmuhammad/hilal-ai-bot',
        website: 'https://hilal-ai.uz',
      },
    };
  }

  async getRealtimeStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalSubscribers = await this.botUserRepository.count();
    const activeToday = await this.botUserRepository.count({
      where: { lastActiveAt: MoreThanOrEqual(today) },
    });
    const newToday = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });

    const requestsToday = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const requestsLastHour = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(lastHour) },
    });
    const requestsLast24Hours = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(last24Hours) },
    });

    // Request type breakdown today
    const textRequestsToday = await this.grammarRequestRepository.count({
      where: { type: 'text', createdAt: MoreThanOrEqual(today) },
    });
    const voiceRequestsToday = await this.grammarRequestRepository.count({
      where: { type: 'voice', createdAt: MoreThanOrEqual(today) },
    });
    const imageRequestsToday = await this.grammarRequestRepository.count({
      where: { type: 'image', createdAt: MoreThanOrEqual(today) },
    });

    return {
      timestamp: now.toISOString(),
      subscribers: {
        total: totalSubscribers,
        activeToday: activeToday,
        newToday: newToday,
        growthRate: totalSubscribers > 0 ? ((newToday / totalSubscribers) * 100).toFixed(2) + '%' : '0%',
      },
      requests: {
        today: requestsToday,
        lastHour: requestsLastHour,
        last24Hours: requestsLast24Hours,
        breakdown: {
          text: textRequestsToday,
          voice: voiceRequestsToday,
          image: imageRequestsToday,
        },
      },
      performance: {
        serverStatus: 'online',
        responseTime: '< 2s',
        errorRate: '< 0.1%',
      },
    };
  }

  async getSubscriberStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalSubscribers = await this.botUserRepository.count();
    const subscribersToday = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const subscribersThisWeek = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });
    const subscribersThisMonth = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(monthAgo) },
    });

    // Top active subscribers
    const topSubscribers = await this.botUserRepository.find({
      order: { totalRequests: 'DESC' },
      take: 10,
    });

    // Daily growth for last 7 days
    const dailyGrowth: Array<{ date: string; newSubscribers: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const count = await this.botUserRepository.count({
        where: { createdAt: MoreThanOrEqual(date) },
      });
      dailyGrowth.push({
        date: date.toISOString().split('T')[0],
        newSubscribers: count,
      });
    }

    return {
      overview: {
        total: totalSubscribers,
        today: subscribersToday,
        thisWeek: subscribersThisWeek,
        thisMonth: subscribersThisMonth,
      },
      growth: {
        dailyAverage: (subscribersThisWeek / 7).toFixed(1),
        weeklyGrowth: subscribersThisWeek,
        monthlyGrowth: subscribersThisMonth,
      },
      topSubscribers: topSubscribers.map(user => ({
        firstName: user.firstName || 'Anonim',
        totalRequests: user.totalRequests,
        joinedAt: user.createdAt,
      })),
      dailyGrowth: dailyGrowth,
    };
  }

  async getProjectGoals(): Promise<any> {
    const totalSubscribers = await this.botUserRepository.count();
    const totalRequests = await this.grammarRequestRepository.count();

    return {
      mission: 'O\'zbek tili grammatikasini yaxshilash va o\'zbek tilida to\'g\'ri yozishni ommalashtirish',
      vision: 'O\'zbek tili grammatikasini tekshirishda #1 AI yechim bo\'lish',
      goals: [
        {
          id: 1,
          title: '10,000 obunachilar',
          description: '10,000 faol foydalanuvchiga yetish',
          target: 10000,
          current: totalSubscribers,
          progress: Math.min((totalSubscribers / 10000) * 100, 100).toFixed(1) + '%',
          status: totalSubscribers >= 10000 ? 'completed' : 'in_progress',
          deadline: '2026-06-01',
        },
        {
          id: 2,
          title: '100,000 so\'rovlar',
          description: '100,000 grammatika tekshiruv so\'rovlarini qayta ishlash',
          target: 100000,
          current: totalRequests,
          progress: Math.min((totalRequests / 100000) * 100, 100).toFixed(1) + '%',
          status: totalRequests >= 100000 ? 'completed' : 'in_progress',
          deadline: '2026-12-31',
        },
        {
          id: 3,
          title: 'Ovozli xabarlar qo\'llab-quvvatlash',
          description: 'Speech-to-text orqali ovozli xabarlarni qayta ishlash',
          target: 1,
          current: 1,
          progress: '100%',
          status: 'completed',
          deadline: '2025-03-01',
        },
        {
          id: 4,
          title: 'Rasm/screenshot qo\'llab-quvvatlash',
          description: 'OCR orqali rasmlardan matn ajratish va tekshirish',
          target: 1,
          current: 1,
          progress: '100%',
          status: 'completed',
          deadline: '2025-04-01',
        },
        {
          id: 5,
          title: 'Ko\'p tilli qo\'llab-quvvatlash',
          description: 'O\'zbek, Rus, Ingliz tillarini qo\'llab-quvvatlash',
          target: 3,
          current: 3,
          progress: '100%',
          status: 'completed',
          deadline: '2025-05-01',
        },
        {
          id: 6,
          title: 'Mobile App',
          description: 'iOS va Android uchun mobil ilova yaratish',
          target: 2,
          current: 0,
          progress: '0%',
          status: 'planned',
          deadline: '2027-01-01',
        },
      ],
      achievements: [
        {
          title: 'Birinchi 1000 foydalanuvchi',
          description: '1000 faol foydalanuvchiga yetdik',
          achievedAt: '2025-02-15',
          icon: '🎉',
        },
        {
          title: 'AI integratsiya',
          description: 'Gemini AI bilan integratsiya qilindi',
          achievedAt: '2025-01-15',
          icon: '🤖',
        },
        {
          title: 'Ovozli xabarlar',
          description: 'Speech-to-text xususiyati qo\'shildi',
          achievedAt: '2025-03-01',
          icon: '🎤',
        },
      ],
    };
  }

  async getProjectFeatures(): Promise<any> {
    return {
      core: [
        {
          id: 1,
          name: 'Grammatika tekshiruvi',
          description: 'O\'zbek tili grammatikasini AI yordamida avtomatik tekshirish',
          status: 'active',
          icon: '✏️',
        },
        {
          id: 2,
          name: 'Matn tuzatish',
          description: 'Xatolarni avtomatik tuzatish va tavsiyalar berish',
          status: 'active',
          icon: '✅',
        },
        {
          id: 3,
          name: 'Ovozli xabarlar',
          description: 'Ovozli xabarlarni matnga aylantirish va tekshirish',
          status: 'active',
          icon: '🎤',
        },
        {
          id: 4,
          name: 'Rasm OCR',
          description: 'Rasmlardan matn ajratish va tekshirish',
          status: 'active',
          icon: '📷',
        },
        {
          id: 5,
          name: 'Video xabarlar',
          description: 'Video va video note xabarlardan ovozni ajratib tekshirish',
          status: 'active',
          icon: '🎬',
        },
      ],
      planned: [
        {
          id: 6,
          name: 'Mobil ilova',
          description: 'iOS va Android uchun native mobil ilova',
          status: 'planned',
          expectedDate: '2027-01-01',
          icon: '📱',
        },
        {
          id: 7,
          name: 'API integratsiya',
          description: 'Boshqa ilovalar uchun ochiq API',
          status: 'planned',
          expectedDate: '2026-06-01',
          icon: '🔗',
        },
        {
          id: 8,
          name: 'Browser extension',
          description: 'Chrome va Firefox uchun kengaytma',
          status: 'planned',
          expectedDate: '2026-09-01',
          icon: '🌐',
        },
      ],
      statistics: {
        totalFeatures: 8,
        activeFeatures: 5,
        plannedFeatures: 3,
        completionRate: '62.5%',
      },
    };
  }

  async getTechnologies(): Promise<any> {
    return {
      backend: [
        {
          name: 'Node.js',
          version: '20.x',
          description: 'JavaScript runtime',
          icon: 'nodejs',
        },
        {
          name: 'NestJS',
          version: '10.x',
          description: 'Progressive Node.js framework',
          icon: 'nestjs',
        },
        {
          name: 'TypeScript',
          version: '5.x',
          description: 'Typed JavaScript',
          icon: 'typescript',
        },
        {
          name: 'PostgreSQL',
          version: '15.x',
          description: 'Relational database',
          icon: 'postgresql',
        },
        {
          name: 'TypeORM',
          version: '0.3.x',
          description: 'ORM for TypeScript',
          icon: 'database',
        },
      ],
      ai: [
        {
          name: 'Google Gemini AI',
          version: '1.5 Flash',
          description: 'Grammatika tekshiruvi uchun asosiy AI model',
          icon: 'gemini',
        },
        {
          name: 'Google Cloud Speech-to-Text',
          version: 'v1',
          description: 'Ovozni matnga aylantirish',
          icon: 'google-cloud',
        },
        {
          name: 'Tesseract OCR',
          version: '5.x',
          description: 'Rasmlardan matn ajratish',
          icon: 'ocr',
        },
      ],
      frontend: [
        {
          name: 'Next.js',
          version: '14.x',
          description: 'React framework',
          icon: 'nextjs',
        },
        {
          name: 'React',
          version: '18.x',
          description: 'UI library',
          icon: 'react',
        },
        {
          name: 'TailwindCSS',
          version: '3.x',
          description: 'Utility-first CSS',
          icon: 'tailwindcss',
        },
      ],
      infrastructure: [
        {
          name: 'Docker',
          version: '24.x',
          description: 'Konteynerizatsiya',
          icon: 'docker',
        },
        {
          name: 'Telegraf',
          version: '4.x',
          description: 'Telegram Bot Framework',
          icon: 'telegram',
        },
      ],
    };
  }

  // ==================== EXISTING METHODS ====================

  async saveGrammarRequest(data: Partial<GrammarRequest>): Promise<GrammarRequest> {
    const request = this.grammarRequestRepository.create(data);
    return this.grammarRequestRepository.save(request);
  }

  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Users stats
    const totalUsers = await this.botUserRepository.count();
    const usersToday = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const usersThisWeek = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });
    const usersThisMonth = await this.botUserRepository.count({
      where: { createdAt: MoreThanOrEqual(monthAgo) },
    });

    // Requests stats
    const totalRequests = await this.grammarRequestRepository.count();
    const requestsToday = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const requestsThisWeek = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });
    const requestsThisMonth = await this.grammarRequestRepository.count({
      where: { createdAt: MoreThanOrEqual(monthAgo) },
    });

    // Request types
    const textRequests = await this.grammarRequestRepository.count({
      where: { type: 'text' },
    });
    const voiceRequests = await this.grammarRequestRepository.count({
      where: { type: 'voice' },
    });
    const imageRequests = await this.grammarRequestRepository.count({
      where: { type: 'image' },
    });

    // Average errors
    const avgErrorsResult = await this.grammarRequestRepository
      .createQueryBuilder('request')
      .select('AVG(request.errorsCount)', 'avgErrors')
      .getRawOne();

    // Average processing time
    const avgTimeResult = await this.grammarRequestRepository
      .createQueryBuilder('request')
      .select('AVG(request.processingTime)', 'avgTime')
      .getRawOne();

    return {
      users: {
        total: totalUsers,
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
      },
      requests: {
        total: totalRequests,
        today: requestsToday,
        thisWeek: requestsThisWeek,
        thisMonth: requestsThisMonth,
      },
      types: {
        text: textRequests,
        voice: voiceRequests,
        image: imageRequests,
      },
      averages: {
        errorsPerRequest: parseFloat(avgErrorsResult?.avgErrors || 0).toFixed(2),
        processingTimeMs: parseFloat(avgTimeResult?.avgTime || 0).toFixed(0),
      },
    };
  }

  async getRecentRequests(limit: number = 20): Promise<GrammarRequest[]> {
    return this.grammarRequestRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTopUsers(limit: number = 10): Promise<BotUser[]> {
    return this.botUserRepository.find({
      order: { totalRequests: 'DESC' },
      take: limit,
    });
  }

  async getDailyStats(days: number = 7): Promise<Array<{date: string; requests: number; users: number}>> {
    const result: Array<{date: string; requests: number; users: number}> = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const requests = await this.grammarRequestRepository.count({
        where: {
          createdAt: MoreThanOrEqual(date),
        },
      });

      const users = await this.botUserRepository.count({
        where: {
          createdAt: MoreThanOrEqual(date),
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        requests,
        users,
      });
    }

    return result.reverse();
  }

  async logRequest(data: {
    telegramId: string;
    type: 'text' | 'voice' | 'image' | 'video' | 'video_note' | 'audio';
    originalText: string;
    correctedText: string;
    errorsCount: number;
    processingTime: number;
  }): Promise<GrammarRequest> {
    // Map new types to existing types for stats
    const typeMap: Record<string, 'text' | 'voice' | 'image'> = {
      text: 'text',
      voice: 'voice',
      image: 'image',
      video: 'voice',
      video_note: 'voice',
      audio: 'voice',
    };

    return this.saveGrammarRequest({
      telegramId: data.telegramId,
      type: typeMap[data.type] || 'text',
      originalText: data.originalText,
      correctedText: data.correctedText,
      errorsCount: data.errorsCount,
      processingTime: data.processingTime,
    });
  }

  // ==================== KOREAN BOT STATS ====================

  async getKoreanDashboardStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalUsers = await this.koreanBotUserRepository.count();
    const activeToday = await this.koreanBotUserRepository.count({
      where: { lastActiveAt: MoreThanOrEqual(today) },
    });
    const newToday = await this.koreanBotUserRepository.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });
    const newThisWeek = await this.koreanBotUserRepository.count({
      where: { createdAt: MoreThanOrEqual(weekAgo) },
    });
    const newThisMonth = await this.koreanBotUserRepository.count({
      where: { createdAt: MoreThanOrEqual(monthAgo) },
    });

    // Get total requests from users
    const usersWithRequests = await this.koreanBotUserRepository.find();
    const totalTextRequests = usersWithRequests.reduce((sum, user) => sum + user.textRequests, 0);
    const totalVoiceRequests = usersWithRequests.reduce((sum, user) => sum + user.voiceRequests, 0);
    const totalImageRequests = usersWithRequests.reduce((sum, user) => sum + user.imageRequests, 0);
    const totalRequests = totalTextRequests + totalVoiceRequests + totalImageRequests;

    return {
      bot: {
        name: 'Korean Ta\'lim AI',
        language: 'Korean (한국어)',
        telegram: '@koreantalimaibot',
        status: 'active',
      },
      users: {
        total: totalUsers,
        activeToday,
        newToday,
        newThisWeek,
        newThisMonth,
      },
      requests: {
        total: totalRequests,
        text: totalTextRequests,
        voice: totalVoiceRequests,
        image: totalImageRequests,
      },
      timestamp: now.toISOString(),
    };
  }

  async getKoreanTopUsers(limit: number = 10): Promise<any> {
    const topUsers = await this.koreanBotUserRepository.find({
      order: { totalRequests: 'DESC' },
      take: limit,
    });

    return topUsers.map(user => ({
      id: user.id,
      firstName: user.firstName || 'Anonim',
      lastName: user.lastName || '',
      username: user.username,
      totalRequests: user.totalRequests,
      textRequests: user.textRequests,
      voiceRequests: user.voiceRequests,
      imageRequests: user.imageRequests,
      joinedAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    }));
  }
}
