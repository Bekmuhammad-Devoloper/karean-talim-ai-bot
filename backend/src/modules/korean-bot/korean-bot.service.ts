import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Context, Telegraf } from 'telegraf';
import { KoreanBotUser } from './entities/korean-bot-user.entity';

@Injectable()
export class KoreanBotService {
  private bot: Telegraf<Context>;

  constructor(
    @InjectRepository(KoreanBotUser)
    private botUserRepository: Repository<KoreanBotUser>,
    private configService: ConfigService,
  ) {
    // Korean bot uchun alohida Telegraf instance
    const token = this.configService.get('KOREAN_BOT_TOKEN');
    if (token) {
      this.bot = new Telegraf(token);
    }
  }

  getBot(): Telegraf<Context> {
    return this.bot;
  }

  async getOrCreateUser(telegramUser: any): Promise<KoreanBotUser> {
    const telegramId = String(telegramUser.id);
    
    try {
      // Avval mavjud userni qidirish
      let user = await this.botUserRepository.findOne({
        where: { telegramId },
      });

      if (user) {
        // User mavjud - yangilash
        user.lastActiveAt = new Date();
        user.username = telegramUser.username;
        user.firstName = telegramUser.first_name;
        user.lastName = telegramUser.last_name;
        await this.botUserRepository.save(user);
        return user;
      }

      // Yangi user yaratish
      const newUser = new KoreanBotUser();
      newUser.telegramId = telegramId;
      newUser.username = telegramUser.username;
      newUser.firstName = telegramUser.first_name;
      newUser.lastName = telegramUser.last_name;
      newUser.language = 'ko';
      newUser.lastActiveAt = new Date();
      
      await this.botUserRepository.save(newUser);
      return newUser;
    } catch (error: any) {
      // UNIQUE constraint xatosi bo'lsa, qayta qidirish
      if (error.code === 'SQLITE_CONSTRAINT') {
        const existingUser = await this.botUserRepository.findOne({
          where: { telegramId },
        });
        if (existingUser) {
          existingUser.lastActiveAt = new Date();
          await this.botUserRepository.save(existingUser);
          return existingUser;
        }
      }
      console.error('Error in getOrCreateUser (Korean):', error);
      throw error;
    }
  }

  async incrementRequestCount(telegramId: string, type: 'text' | 'voice' | 'image'): Promise<void> {
    const user = await this.botUserRepository.findOne({
      where: { telegramId },
    });

    if (user) {
      user.totalRequests++;
      if (type === 'text') user.textRequests++;
      if (type === 'voice') user.voiceRequests++;
      if (type === 'image') user.imageRequests++;
      await this.botUserRepository.save(user);
    }
  }

  async checkChannelMembership(userId: number, channelId: string): Promise<boolean> {
    try {
      const member = await this.bot.telegram.getChatMember(channelId, userId);
      return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
      console.error('Channel membership check error:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<KoreanBotUser[]> {
    return this.botUserRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getUsersCount(): Promise<number> {
    return this.botUserRepository.count();
  }

  async broadcastMessage(text: string, keyboard?: any): Promise<{ sent: number; failed: number }> {
    const users = await this.botUserRepository.find({ where: { isBlocked: false } });
    let sent = 0;
    let failed = 0;

    console.log('[KoreanBotService] Broadcasting message to', users.length, 'users');

    for (const user of users) {
      try {
        await this.bot.telegram.sendMessage(user.telegramId, text, { 
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        sent++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        failed++;
        console.error(`[KoreanBotService] Failed to send to ${user.telegramId}:`, error.message);
        if (error.message?.includes('blocked') || error.code === 403) {
          user.isBlocked = true;
          await this.botUserRepository.save(user);
        }
      }
    }

    console.log('[KoreanBotService] Broadcast completed: sent', sent, 'failed', failed);
    return { sent, failed };
  }

  async broadcastPhoto(photo: string, caption?: string, keyboard?: any): Promise<{ sent: number; failed: number }> {
    const users = await this.botUserRepository.find({ where: { isBlocked: false } });
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await this.bot.telegram.sendPhoto(user.telegramId, photo, { 
          caption, 
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        sent++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        failed++;
        if (error.message?.includes('blocked') || error.code === 403) {
          user.isBlocked = true;
          await this.botUserRepository.save(user);
        }
      }
    }

    return { sent, failed };
  }
}
