import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { BotUser } from './entities/bot-user.entity';

@Injectable()
export class BotService {
  constructor(
    @InjectRepository(BotUser)
    private botUserRepository: Repository<BotUser>,
    private configService: ConfigService,
    @InjectBot() private bot: Telegraf<Context>,
  ) {}

  async getOrCreateUser(telegramUser: any): Promise<BotUser> {
    const telegramId = String(telegramUser.id);
    
    try {
      let user = await this.botUserRepository.findOne({
        where: { telegramId },
      });

      if (!user) {
        // Try to insert, if fails due to race condition, fetch existing
        try {
          user = this.botUserRepository.create({
            telegramId,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            language: 'uz',
          });
          await this.botUserRepository.save(user);
        } catch (error) {
          // Race condition - user was created by another request
          user = await this.botUserRepository.findOne({
            where: { telegramId },
          });
          if (!user) throw error; // If still not found, throw original error
        }
      }

      // Update last active and user info
      user.lastActiveAt = new Date();
      user.username = telegramUser.username;
      user.firstName = telegramUser.first_name;
      user.lastName = telegramUser.last_name;
      await this.botUserRepository.save(user);

      return user;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      // Return a minimal user object to prevent bot crash
      const existingUser = await this.botUserRepository.findOne({
        where: { telegramId },
      });
      if (existingUser) return existingUser;
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

  async setUserLanguage(telegramId: string, language: string): Promise<void> {
    await this.botUserRepository.update(
      { telegramId },
      { language },
    );
  }

  async getUserLanguage(telegramId: string): Promise<string> {
    const user = await this.botUserRepository.findOne({
      where: { telegramId },
    });
    return user?.language || 'uz';
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

  async sendMessageToChannel(channelId: string, text: string, options?: any): Promise<any> {
    try {
      return await this.bot.telegram.sendMessage(channelId, text, options);
    } catch (error) {
      console.error('Send message to channel error:', error);
      throw error;
    }
  }

  async sendPhotoToChannel(channelId: string, photo: string, caption?: string): Promise<any> {
    try {
      return await this.bot.telegram.sendPhoto(channelId, photo, { caption });
    } catch (error) {
      console.error('Send photo to channel error:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<BotUser[]> {
    return this.botUserRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getUsersCount(): Promise<number> {
    return this.botUserRepository.count();
  }

  async getActiveUsersCount(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.botUserRepository.count({
      where: {
        lastActiveAt: {
          $gte: date,
        } as any,
      },
    });
  }

  async broadcastMessage(text: string, keyboard?: any): Promise<{ sent: number; failed: number }> {
    const users = await this.botUserRepository.find({ where: { isBlocked: false } });
    let sent = 0;
    let failed = 0;

    console.log('[BotService] Broadcasting message to', users.length, 'users');

    for (const user of users) {
      try {
        await this.bot.telegram.sendMessage(user.telegramId, text, { 
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        sent++;
        // Rate limiting - wait 50ms between messages
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        failed++;
        console.error(`[BotService] Failed to send to ${user.telegramId}:`, error.message);
        // Mark user as blocked if they blocked the bot
        if (error.message?.includes('blocked') || error.code === 403) {
          user.isBlocked = true;
          await this.botUserRepository.save(user);
        }
      }
    }

    console.log('[BotService] Broadcast completed: sent', sent, 'failed', failed);
    return { sent, failed };
  }

  async broadcastPhoto(photo: string, caption?: string, keyboard?: any): Promise<{ sent: number; failed: number }> {
    const users = await this.botUserRepository.find({ where: { isBlocked: false } });
    let sent = 0;
    let failed = 0;

    console.log('[BotService] Broadcasting photo to', users.length, 'users');

    for (const user of users) {
      try {
        await this.bot.telegram.sendPhoto(user.telegramId, photo, { 
          caption, 
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        sent++;
        // Rate limiting - wait 50ms between messages
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        failed++;
        console.error(`[BotService] Failed to send photo to ${user.telegramId}:`, error.message);
        // Mark user as blocked if they blocked the bot
        if (error.message?.includes('blocked') || error.code === 403) {
          user.isBlocked = true;
          await this.botUserRepository.save(user);
        }
      }
    }

    console.log('[BotService] Photo broadcast completed: sent', sent, 'failed', failed);
    return { sent, failed };
  }

  async broadcastVideo(video: string, caption?: string, keyboard?: any): Promise<{ sent: number; failed: number }> {
    const users = await this.botUserRepository.find({ where: { isBlocked: false } });
    let sent = 0;
    let failed = 0;

    console.log('[BotService] Broadcasting video to', users.length, 'users');

    for (const user of users) {
      try {
        await this.bot.telegram.sendVideo(user.telegramId, video, { 
          caption, 
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        sent++;
        // Rate limiting - wait 100ms for videos (larger files)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        failed++;
        console.error(`[BotService] Failed to send video to ${user.telegramId}:`, error.message);
        // Mark user as blocked if they blocked the bot
        if (error.message?.includes('blocked') || error.code === 403) {
          user.isBlocked = true;
          await this.botUserRepository.save(user);
        }
      }
    }

    console.log('[BotService] Video broadcast completed: sent', sent, 'failed', failed);
    return { sent, failed };
  }
}
