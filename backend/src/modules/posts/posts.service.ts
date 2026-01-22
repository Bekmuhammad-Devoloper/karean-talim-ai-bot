import { Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { BotService } from '../bot/bot.service';
import { KoreanBotService } from '../korean-bot/korean-bot.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @Inject(forwardRef(() => BotService))
    private botService: BotService,
    @Inject(forwardRef(() => KoreanBotService))
    private koreanBotService: KoreanBotService,
  ) {}

  onModuleInit() {
    console.log('[PostsService] Initialized - Scheduled posts cron job active');
  }

  async create(data: Partial<Post>): Promise<Post> {
    console.log('[PostsService] Creating post with data:', JSON.stringify(data));
    try {
      const post = this.postRepository.create(data);
      const saved = await this.postRepository.save(post);
      console.log('[PostsService] Post saved:', JSON.stringify(saved));
      return saved;
    } catch (error: any) {
      console.error('[PostsService] Create error:', error.message);
      throw error;
    }
  }

  async findAll(): Promise<Post[]> {
    console.log('[PostsService] Finding all posts');
    try {
      const posts = await this.postRepository.find({
        order: { createdAt: 'DESC' },
      });
      console.log('[PostsService] Found', posts.length, 'posts');
      return posts;
    } catch (error: any) {
      console.error('[PostsService] FindAll error:', error.message);
      throw error;
    }
  }

  async findById(id: number): Promise<Post | null> {
    console.log('[PostsService] Finding post by ID:', id);
    return this.postRepository.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Post>): Promise<Post | null> {
    console.log('[PostsService] Updating post', id, 'with data:', JSON.stringify(data));
    try {
      await this.postRepository.update(id, data);
      const updated = await this.findById(id);
      console.log('[PostsService] Post updated:', JSON.stringify(updated));
      return updated;
    } catch (error: any) {
      console.error('[PostsService] Update error:', error.message);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    console.log('[PostsService] Deleting post', id);
    await this.postRepository.delete(id);
  }

  async sendPost(id: number, channelId: string): Promise<Post | null> {
    console.log('[PostsService] Sending post', id, 'to channel', channelId);
    const post = await this.findById(id);
    if (!post) {
      console.log('[PostsService] Post not found');
      return null;
    }

    try {
      let result: any;

      if (post.type === 'photo' && post.mediaUrl) {
        console.log('[PostsService] Sending photo to channel');
        result = await this.botService.sendPhotoToChannel(
          channelId,
          post.mediaUrl,
          post.content,
        );
      } else {
        console.log('[PostsService] Sending text to channel');
        result = await this.botService.sendMessageToChannel(
          channelId,
          post.content,
          { parse_mode: 'HTML' },
        );
      }

      post.status = 'sent';
      post.sentAt = new Date();
      post.channelId = channelId;
      post.messageId = String(result.message_id);
      await this.postRepository.save(post);
      console.log('[PostsService] Post sent successfully, message_id:', result.message_id);

      return post;
    } catch (error: any) {
      console.error('[PostsService] Send error:', error.message);
      post.status = 'failed';
      await this.postRepository.save(post);
      throw error;
    }
  }

  async broadcastPost(id: number): Promise<{ sent: number; failed: number; post: Post | null }> {
    console.log('[PostsService] Broadcasting post', id, 'to all Korean bot users');
    const post = await this.findById(id);
    if (!post) {
      console.log('[PostsService] Post not found for broadcast');
      return { sent: 0, failed: 0, post: null };
    }

    try {
      // Inline keyboard agar button mavjud bo'lsa
      const keyboard = (post.buttonText && post.buttonUrl) ? {
        inline_keyboard: [[{ text: post.buttonText, url: post.buttonUrl }]]
      } : undefined;

      // Media URL yoki path
      const mediaSource = post.mediaPath || post.mediaUrl;

      let result: { sent: number; failed: number };

      // Korean bot orqali yuborish
      if (post.type === 'video' && mediaSource) {
        console.log('[PostsService] Broadcasting video to Korean bot users');
        result = await this.koreanBotService.broadcastVideo(mediaSource, post.content, keyboard);
      } else if (post.type === 'photo' && mediaSource) {
        console.log('[PostsService] Broadcasting photo to Korean bot users');
        result = await this.koreanBotService.broadcastPhoto(mediaSource, post.content, keyboard);
      } else {
        console.log('[PostsService] Broadcasting text to Korean bot users');
        result = await this.koreanBotService.broadcastMessage(post.content, keyboard);
      }

      post.status = 'sent';
      post.sentAt = new Date();
      await this.postRepository.save(post);
      
      console.log('[PostsService] Broadcast completed:', result);
      return { ...result, post };
    } catch (error: any) {
      console.error('[PostsService] Broadcast error:', error.message);
      post.status = 'failed';
      await this.postRepository.save(post);
      throw error;
    }
  }

  async schedulePost(id: number, scheduledAt: Date, broadcastToUsers: boolean = false): Promise<Post | null> {
    console.log('[PostsService] Scheduling post', id, 'for', scheduledAt, 'broadcast:', broadcastToUsers);
    const post = await this.findById(id);
    if (!post) {
      console.log('[PostsService] Post not found for scheduling');
      return null;
    }

    post.scheduledAt = scheduledAt;
    post.status = 'scheduled';
    (post as any).broadcastToUsers = broadcastToUsers;
    await this.postRepository.save(post);
    
    console.log('[PostsService] Post scheduled successfully');
    return post;
  }

  // Check every minute for scheduled posts
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPosts() {
    const now = new Date();
    console.log('[PostsService] Checking scheduled posts at', now.toISOString());
    
    try {
      const scheduledPosts = await this.postRepository.find({
        where: {
          status: 'scheduled',
          scheduledAt: LessThanOrEqual(now),
        },
      });

      if (scheduledPosts.length === 0) {
        return;
      }

      console.log('[PostsService] Found', scheduledPosts.length, 'posts to send');

      for (const post of scheduledPosts) {
        try {
          console.log('[PostsService] Processing scheduled post', post.id);
          
          // Check if it should be broadcast to users
          if ((post as any).broadcastToUsers) {
            await this.broadcastPost(post.id);
          } else if (post.channelId) {
            await this.sendPost(post.id, post.channelId);
          } else {
            // Broadcast to all users by default if no channel specified
            await this.broadcastPost(post.id);
          }
        } catch (error: any) {
          console.error('[PostsService] Failed to send scheduled post', post.id, ':', error.message);
        }
      }
    } catch (error: any) {
      console.error('[PostsService] Scheduled posts check error:', error.message);
    }
  }

  async getStats(): Promise<any> {
    const total = await this.postRepository.count();
    const sent = await this.postRepository.count({ where: { status: 'sent' } });
    const draft = await this.postRepository.count({ where: { status: 'draft' } });
    const failed = await this.postRepository.count({ where: { status: 'failed' } });
    const scheduled = await this.postRepository.count({ where: { status: 'scheduled' } });

    return { total, sent, draft, failed, scheduled };
  }
}
