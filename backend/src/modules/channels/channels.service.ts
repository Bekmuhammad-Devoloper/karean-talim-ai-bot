import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { Channel } from './entities/channel.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectBot() private bot: Telegraf<Context>,
  ) {}

  // Telegram dan kanal ma'lumotlarini olish
  async getChannelInfo(channelUsername: string): Promise<{ title: string; photoUrl: string | null; channelId: string } | null> {
    try {
      const username = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
      console.log('[ChannelsService] Getting channel info for:', username);
      
      const chat = await this.bot.telegram.getChat(username);
      console.log('[ChannelsService] Chat info:', JSON.stringify(chat));
      
      let photoUrl: string | null = null;
      
      // Kanal rasmini olish
      if ('photo' in chat && chat.photo) {
        try {
          const file = await this.bot.telegram.getFile(chat.photo.big_file_id);
          photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
          console.log('[ChannelsService] Channel photo URL:', photoUrl);
        } catch (photoError) {
          console.log('[ChannelsService] Could not get photo:', photoError);
        }
      }
      
      return {
        title: 'title' in chat ? chat.title || '' : '',
        photoUrl,
        channelId: String(chat.id),
      };
    } catch (error: any) {
      console.error('[ChannelsService] Get channel info error:', error.message);
      return null;
    }
  }

  async create(data: Partial<Channel>): Promise<Channel> {
    console.log('[ChannelsService] Creating channel with data:', JSON.stringify(data));
    try {
      // Agar photoUrl yoki title bo'lmasa, Telegram dan olishga harakat qilamiz
      if (data.channelUsername && (!data.photoUrl || !data.title)) {
        const channelInfo = await this.getChannelInfo(data.channelUsername);
        if (channelInfo) {
          if (!data.title) data.title = channelInfo.title;
          if (!data.photoUrl) data.photoUrl = channelInfo.photoUrl || undefined;
          if (!data.channelId || data.channelId.startsWith('@')) data.channelId = channelInfo.channelId;
        }
      }
      
      const channel = this.channelRepository.create(data);
      console.log('[ChannelsService] Channel entity created:', JSON.stringify(channel));
      const saved = await this.channelRepository.save(channel);
      console.log('[ChannelsService] Channel saved to DB:', JSON.stringify(saved));
      return saved;
    } catch (error: any) {
      console.error('[ChannelsService] Create error:', error.message);
      console.error('[ChannelsService] Error stack:', error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Channel[]> {
    console.log('[ChannelsService] Finding all channels');
    try {
      const channels = await this.channelRepository.find({
        order: { createdAt: 'DESC' },
      });
      console.log('[ChannelsService] Found', channels.length, 'channels');
      return channels;
    } catch (error: any) {
      console.error('[ChannelsService] FindAll error:', error.message);
      throw error;
    }
  }

  async findById(id: number): Promise<Channel | null> {
    console.log('[ChannelsService] Finding channel by ID:', id);
    return this.channelRepository.findOne({ where: { id } });
  }

  async getMandatoryChannels(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { isMandatory: true, isActive: true },
    });
  }

  async update(id: number, data: Partial<Channel>): Promise<Channel | null> {
    console.log('[ChannelsService] Updating channel', id, 'with data:', JSON.stringify(data));
    try {
      await this.channelRepository.update(id, data);
      const updated = await this.findById(id);
      console.log('[ChannelsService] Channel updated:', JSON.stringify(updated));
      return updated;
    } catch (error: any) {
      console.error('[ChannelsService] Update error:', error.message);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    console.log('[ChannelsService] Deleting channel', id);
    await this.channelRepository.delete(id);
  }

  async toggleMandatory(id: number): Promise<Channel | null> {
    const channel = await this.findById(id);
    if (channel) {
      channel.isMandatory = !channel.isMandatory;
      await this.channelRepository.save(channel);
      console.log('[ChannelsService] Toggled mandatory for channel', id, ':', channel.isMandatory);
    }
    return channel;
  }

  async toggleActive(id: number): Promise<Channel | null> {
    const channel = await this.findById(id);
    if (channel) {
      channel.isActive = !channel.isActive;
      await this.channelRepository.save(channel);
      console.log('[ChannelsService] Toggled active for channel', id, ':', channel.isActive);
    }
    return channel;
  }
}
