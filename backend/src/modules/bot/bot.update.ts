import { Update, Ctx, Start, Help, On, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { GrammarService } from '../grammar/grammar.service';
import { SpeechToTextService } from '../grammar/speech-to-text.service';
import { OcrService } from '../grammar/ocr.service';
import { GeminiService } from '../grammar/gemini.service';
import { OpenAIService } from '../grammar/openai.service';
import { ChannelsService } from '../channels/channels.service';
import { StatsService } from '../stats/stats.service';
import { AuthService } from '../auth/auth.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { t } from './i18n';
import { OnModuleInit } from '@nestjs/common';

@Update()
export class BotUpdate implements OnModuleInit {
  constructor(
    private botService: BotService,
    private grammarService: GrammarService,
    private speechToTextService: SpeechToTextService,
    private ocrService: OcrService,
    private geminiService: GeminiService,
    private openaiService: OpenAIService,
    private channelsService: ChannelsService,
    private statsService: StatsService,
    private authService: AuthService,
    private configService: ConfigService,
    @InjectBot() private bot: Telegraf<Context>,
  ) {}

  async onModuleInit() {
    try {
      console.log('[TurkishBot] Starting bot...');
      await this.bot.launch();
      console.log('[TurkishBot] Bot started successfully!');
    } catch (error: any) {
      console.error('[TurkishBot] Failed to start bot:', error.message);
      console.log('[TurkishBot] Please check BOT_TOKEN in .env file');
    }
  }

  private isAdmin(userId: number): boolean {
    // To'g'ridan-to'g'ri process.env dan o'qiymiz
    const adminIdsEnv: string = process.env.ADMIN_IDS || this.configService.get('ADMIN_IDS') || '';
    const adminIds = adminIdsEnv.split(',').map((id: string) => id.trim());
    console.log('ADMIN_IDS:', adminIdsEnv, '| User ID:', userId, '| Is Admin:', adminIds.includes(String(userId)));
    return adminIds.includes(String(userId));
  }

  @Command('admin')
  async onAdmin(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    

    // Check if user is admin
    if (!this.isAdmin(user.id)) {
      await ctx.reply('⛔ Sizda admin huquqlari yo\'q / You are not an admin');
      return;
    }

    const adminPanelUrl = this.configService.get('ADMIN_PANEL_URL', 'http://localhost:3001');
    
    // Generate auto-login code for admin
    const loginCode = await this.authService.generateTelegramLoginCode(String(user.id));
    const autoLoginUrl = `${adminPanelUrl}/telegram-login?code=${loginCode}`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🖥 Admin Panelga Kirish', url: autoLoginUrl },
        ],
        [
          { text: '📊 Statistika', callback_data: 'admin_stats' },
          { text: '👥 Foydalanuvchilar', callback_data: 'admin_users' },
        ],
        [
          { text: '📢 Xabar yuborish', callback_data: 'admin_broadcast' },
        ],
      ],
    };

    const stats = await this.statsService.getDashboardStats();
    
    const message = `
🔐 *Admin Panel*

📊 *Statistika:*
👥 Jami foydalanuvchilar: ${stats.totalUsers}
📝 Jami so'rovlar: ${stats.totalRequests}
📅 Bugun: ${stats.todayRequests}

🔗 Admin panelga kirish uchun pastdagi tugmani bosing.
⏱ Link 5 daqiqa amal qiladi.
`;

    await ctx.replyWithMarkdown(message, { reply_markup: keyboard });
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    await this.botService.getOrCreateUser(user);
    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    await ctx.replyWithMarkdown(t('welcome', user.first_name));
  }

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    
    await ctx.replyWithMarkdown(t('help'));
  }

  @Command('stats')
  async onStats(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    
    const botUser = await this.botService.getOrCreateUser(user);

    const statsData = {
      totalRequests: botUser.totalRequests,
      textRequests: botUser.textRequests,
      voiceRequests: botUser.voiceRequests,
      imageRequests: botUser.imageRequests,
      createdAt: botUser.createdAt.toLocaleDateString('tr-TR'),
    };

    await ctx.replyWithMarkdown(t('stats', statsData));
  }

  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery?.data;
    const user = ctx.from;

    if (!data || !user) return;

    // Ensure user exists in database
    await this.botService.getOrCreateUser(user);

    if (data === 'check_subscription') {
      
      const isSubscribed = await this.checkMandatoryChannel(ctx, true);
      if (isSubscribed) {
        await ctx.answerCbQuery(t('subscriptionConfirmed'));
        await this.onStart(ctx);
      } else {
        await ctx.answerCbQuery(t('notSubscribed'), { show_alert: true });
      }
    }

    // Admin callbacks
    if (data.startsWith('admin_') && this.isAdmin(user.id)) {
      if (data === 'admin_stats') {
        const stats = await this.statsService.getDashboardStats();
        const message = `
📊 *Batafsil Statistika*

👥 Jami foydalanuvchilar: ${stats.totalUsers}
📝 Jami so'rovlar: ${stats.totalRequests}

📅 *Bugungi statistika:*
• So'rovlar: ${stats.todayRequests}

📈 *So'rov turlari:*
• Matn: ${stats.textRequests || 0}
• Ovoz: ${stats.voiceRequests || 0}
• Rasm: ${stats.imageRequests || 0}
`;
        await ctx.answerCbQuery();
        await ctx.reply(message, { parse_mode: 'Markdown' });
      }

      if (data === 'admin_users') {
        const topUsers = await this.statsService.getTopUsers(10);
        let message = '👥 *Top 10 Foydalanuvchilar:*\n\n';
        topUsers.forEach((u: any, i: number) => {
          message += `${i + 1}. ${u.firstName || 'User'} - ${u.totalRequests} so'rov\n`;
        });
        await ctx.answerCbQuery();
        await ctx.reply(message, { parse_mode: 'Markdown' });
      }

      if (data === 'admin_broadcast') {
        await ctx.answerCbQuery();
        await ctx.reply('📢 Xabar yuborish uchun admin paneldan foydalaning:\n\n' + 
          this.configService.get('ADMIN_PANEL_URL', 'http://localhost:3001') + '/dashboard/posts');
      }
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const message = ctx.message as any;
    const user = ctx.from;
    const text = message?.text;

    if (!user || !text || text.startsWith('/')) return;

    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    const processingMsg = await ctx.reply(t('processing'));

    try {
      const startTime = Date.now();
      
      // Grammatik tekshiruv FAQAT turkcha uchun ishlaydi
      const grammarLang = 'tr';
      
      // GPT-4o birinchi, keyin Gemini, keyin GrammarService fallback
      let result;
      let usedModel = 'unknown';
      
      // 1. GPT-4o (primary)
      if (this.openaiService.isAvailable()) {
        try {
          console.log('[Bot] Using GPT-4o for grammar check...');
          result = await this.openaiService.correctGrammar(text, grammarLang);
          usedModel = 'GPT-4o';
        } catch (openaiError: any) {
          console.log('[Bot] GPT-4o failed:', openaiError.message);
        }
      }
      
      // 2. Gemini (fallback)
      if (!result) {
        try {
          console.log('[Bot] Falling back to Gemini...');
          result = await this.geminiService.correctGrammar(text, grammarLang);
          usedModel = 'Gemini';
        } catch (geminiError: any) {
          console.log('[Bot] Gemini failed:', geminiError.message);
        }
      }
      
      // 3. GrammarService (last fallback)
      if (!result) {
        console.log('[Bot] Falling back to GrammarService...');
        result = await this.grammarService.correctGrammar(text, grammarLang);
        usedModel = 'Basic';
      }
      
      console.log('[Bot] Grammar check completed using:', usedModel);

      await this.botService.incrementRequestCount(String(user.id), 'text');

      // Log request
      await this.statsService.logRequest({
        telegramId: String(user.id),
        type: 'text',
        originalText: text,
        correctedText: result.correctedText,
        errorsCount: result.errorsCount,
        processingTime: Date.now() - startTime,
      });

      // Delete processing message
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}

      const resultData = {
        hasErrors: result.errorsCount > 0,
        errorsCount: result.errorsCount,
        original: text,
        corrected: result.correctedText,
      };

      await ctx.replyWithMarkdown(t('result', resultData));
    } catch (error) {
      console.error('Text processing error:', error);
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}
      await ctx.reply(t('errorProcessing'));
    }
  }

  @On('voice')
  async onVoice(@Ctx() ctx: Context) {
    const message = ctx.message as any;
    const user = ctx.from;
    const voice = message?.voice;

    if (!user || !voice) return;

    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    const processingMsg = await ctx.reply(t('processingVoice'));

    try {
      const startTime = Date.now();
      
      // Get file
      const fileLink = await ctx.telegram.getFileLink(voice.file_id);
      
      // Grammatik tekshiruv FAQAT turkcha uchun
      const grammarLang = 'tr';
      
      // OpenAI Whisper - eng aniq ovozni matnga o'tkazuvchi
      let text = '';
      let usedTranscriber = '';
      
      if (this.openaiService.isAvailable()) {
        try {
          console.log('[Bot] Using OpenAI Whisper for voice transcription...');
          text = await this.openaiService.transcribeAudioFromUrl(fileLink.href, grammarLang);
          usedTranscriber = 'Whisper';
        } catch (e: any) {
          console.log('[Bot] OpenAI Whisper failed:', e.message);
        }
      }
      
      // Fallback: SpeechToTextService
      if (!text) {
        console.log('[Bot] Falling back to SpeechToTextService...');
        text = await this.speechToTextService.transcribe(fileLink.href, grammarLang);
        usedTranscriber = 'SpeechToText';
      }
      
      console.log('[Bot] Voice transcription completed using:', usedTranscriber, '- Text:', text?.substring(0, 50) + '...');

      if (!text) {
        await ctx.deleteMessage(processingMsg.message_id);
        await ctx.reply(t('errorVoice'));
        return;
      }

      // GPT-4o birinchi, keyin Gemini, keyin GrammarService fallback
      let result;
      
      if (this.openaiService.isAvailable()) {
        try {
          result = await this.openaiService.correctGrammar(text, grammarLang);
        } catch (e) {
          console.log('[Bot] GPT-4o failed for voice');
        }
      }
      
      if (!result) {
        try {
          result = await this.geminiService.correctGrammar(text, grammarLang);
        } catch (e) {
          console.log('[Bot] Gemini failed for voice');
        }
      }
      
      if (!result) {
        result = await this.grammarService.correctGrammar(text, grammarLang);
      }

      await this.botService.incrementRequestCount(String(user.id), 'voice');

      await this.statsService.logRequest({
        telegramId: String(user.id),
        type: 'voice',
        originalText: text,
        correctedText: result.correctedText,
        errorsCount: result.errorsCount,
        processingTime: Date.now() - startTime,
      });

      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}

      const resultData = {
        hasErrors: result.errorsCount > 0,
        errorsCount: result.errorsCount,
        original: text,
        corrected: result.correctedText,
      };

      await ctx.replyWithMarkdown(t('result', resultData));
    } catch (error) {
      console.error('Voice processing error:', error);
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}
      await ctx.reply(t('errorVoice'));
    }
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    const message = ctx.message as any;
    const user = ctx.from;
    const photos = message?.photo;

    if (!user || !photos || photos.length === 0) return;

    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    const processingMsg = await ctx.reply(t('processingImage'));

    try {
      const startTime = Date.now();
      
      // Grammatik tekshiruv FAQAT turkcha uchun
      const grammarLang = 'tr';
      
      // Get largest photo
      const photo = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const imageUrl = fileLink.href;

      let result;
      let text = '';

      // GPT-4o Vision - rasmni to'g'ridan-to'g'ri o'qiydi (qo'lyozma ham!)
      if (this.openaiService.isAvailable()) {
        try {
          console.log('[Bot] Using GPT-4o Vision for image analysis...');
          result = await this.openaiService.analyzeImage(imageUrl, grammarLang);
          text = result.originalText;
        } catch (e: any) {
          console.log('[Bot] GPT-4o Vision failed:', e.message);
        }
      }

      // Fallback: OCR + Gemini/Grammar
      if (!result || !text) {
        console.log('[Bot] Falling back to OCR...');
        const filePath = await this.ocrService.downloadImage(imageUrl);
        try {
          text = await this.ocrService.extractText(filePath, grammarLang);
          
          if (text && text.trim().length > 0) {
            // GPT-4o yoki Gemini bilan tekshirish
            if (this.openaiService.isAvailable()) {
              try {
                result = await this.openaiService.correctGrammar(text, grammarLang);
              } catch (e) {}
            }
            if (!result) {
              try {
                result = await this.geminiService.correctGrammar(text, grammarLang);
              } catch (e) {}
            }
            if (!result) {
              result = await this.grammarService.correctGrammar(text, grammarLang);
            }
          }
        } finally {
          this.ocrService.cleanup(filePath);
        }
      }

      if (!text || text.trim().length === 0) {
        await ctx.deleteMessage(processingMsg.message_id);
        await ctx.reply(t('errorNoText'));
        return;
      }

      await this.botService.incrementRequestCount(String(user.id), 'image');

      await this.statsService.logRequest({
        telegramId: String(user.id),
        type: 'image',
        originalText: text,
        correctedText: result?.correctedText || text,
        errorsCount: result?.errorsCount || 0,
        processingTime: Date.now() - startTime,
      });

      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}

      const resultData = {
        hasErrors: (result?.errorsCount || 0) > 0,
        errorsCount: result?.errorsCount || 0,
        original: text,
        corrected: result?.correctedText || text,
      };

      await ctx.replyWithMarkdown(t('result', resultData));
    } catch (error) {
      console.error('Image processing error:', error);
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}
      await ctx.reply(t('errorImage'));
    }
  }

  @On('video')
  async onVideo(@Ctx() ctx: Context) {
    const message = ctx.message as any;
    const user = ctx.from;
    const video = message?.video;

    if (!user || !video) return;

    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    const processingMsg = await ctx.reply(t('processingVideo'));

    try {
      const startTime = Date.now();
      
      // Get file
      const fileLink = await ctx.telegram.getFileLink(video.file_id);
      
      // SpeechToTextService orqali video dan matnga
      const text = await this.speechToTextService.transcribeVideo(fileLink.href, 'tr');

      if (!text) {
        await ctx.deleteMessage(processingMsg.message_id);
        await ctx.reply(t('errorVideo'));
        return;
      }

      // Gemini orqali grammatik tekshirish, fallback GrammarService
      let result;
      try {
        result = await this.geminiService.correctGrammar(text, 'tr');
      } catch (geminiError) {
        console.log('Gemini failed for video, using GrammarService fallback');
        result = await this.grammarService.correctGrammar(text, 'tr');
      }

      await this.botService.incrementRequestCount(String(user.id), 'voice');

      await this.statsService.logRequest({
        telegramId: String(user.id),
        type: 'video',
        originalText: text,
        correctedText: result.correctedText,
        errorsCount: result.errorsCount,
        processingTime: Date.now() - startTime,
      });

      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}

      const resultData = {
        hasErrors: result.errorsCount > 0,
        errorsCount: result.errorsCount,
        original: text,
        corrected: result.correctedText,
      };

      await ctx.replyWithMarkdown(t('result', resultData));
    } catch (error) {
      console.error('Video processing error:', error);
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}
      await ctx.reply(t('errorVideo'));
    }
  }

  @On('video_note')
  async onVideoNote(@Ctx() ctx: Context) {
    const message = ctx.message as any;
    const user = ctx.from;
    const videoNote = message?.video_note;

    if (!user || !videoNote) return;

    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    const processingMsg = await ctx.reply(t('processingVideo'));

    try {
      const startTime = Date.now();
      
      // Get file
      const fileLink = await ctx.telegram.getFileLink(videoNote.file_id);
      
      // SpeechToTextService orqali video_note dan matnga
      const text = await this.speechToTextService.transcribeVideo(fileLink.href, 'tr');

      if (!text) {
        await ctx.deleteMessage(processingMsg.message_id);
        await ctx.reply(t('errorVideo'));
        return;
      }

      // Gemini orqali grammatik tekshirish, fallback GrammarService
      let result;
      try {
        result = await this.geminiService.correctGrammar(text, 'tr');
      } catch (geminiError) {
        console.log('Gemini failed for video_note, using GrammarService fallback');
        result = await this.grammarService.correctGrammar(text, 'tr');
      }

      await this.botService.incrementRequestCount(String(user.id), 'voice');

      await this.statsService.logRequest({
        telegramId: String(user.id),
        type: 'video_note',
        originalText: text,
        correctedText: result.correctedText,
        errorsCount: result.errorsCount,
        processingTime: Date.now() - startTime,
      });

      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}

      const resultData = {
        hasErrors: result.errorsCount > 0,
        errorsCount: result.errorsCount,
        original: text,
        corrected: result.correctedText,
      };

      await ctx.replyWithMarkdown(t('result', resultData));
    } catch (error) {
      console.error('Video note processing error:', error);
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}
      await ctx.reply(t('errorVideo'));
    }
  }

  @On('audio')
  async onAudio(@Ctx() ctx: Context) {
    const message = ctx.message as any;
    const user = ctx.from;
    const audio = message?.audio;

    if (!user || !audio) return;

    

    // Check mandatory channel subscription
    const isSubscribed = await this.checkMandatoryChannel(ctx);
    if (!isSubscribed) return;

    const processingMsg = await ctx.reply(t('processingVoice'));

    try {
      const startTime = Date.now();
      
      // Get file
      const fileLink = await ctx.telegram.getFileLink(audio.file_id);
      
      // SpeechToTextService orqali speech-to-text
      const text = await this.speechToTextService.transcribe(fileLink.href, 'tr');

      if (!text) {
        await ctx.deleteMessage(processingMsg.message_id);
        await ctx.reply(t('errorVoice'));
        return;
      }

      // Gemini orqali grammatik tekshirish, fallback GrammarService
      let result;
      try {
        result = await this.geminiService.correctGrammar(text, 'tr');
      } catch (geminiError) {
        console.log('Gemini failed for audio, using GrammarService fallback');
        result = await this.grammarService.correctGrammar(text, 'tr');
      }

      await this.botService.incrementRequestCount(String(user.id), 'voice');

      await this.statsService.logRequest({
        telegramId: String(user.id),
        type: 'audio',
        originalText: text,
        correctedText: result.correctedText,
        errorsCount: result.errorsCount,
        processingTime: Date.now() - startTime,
      });

      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}

      const resultData = {
        hasErrors: result.errorsCount > 0,
        errorsCount: result.errorsCount,
        original: text,
        corrected: result.correctedText,
      };

      await ctx.replyWithMarkdown(t('result', resultData));
    } catch (error) {
      console.error('Audio processing error:', error);
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch {}
      await ctx.reply(t('errorVoice'));
    }
  }

  private async checkMandatoryChannel(ctx: Context, skipMessage: boolean = false): Promise<boolean> {
    const user = ctx.from;
    if (!user) return false;

    const mandatoryChannels = await this.channelsService.getMandatoryChannels();
    if (mandatoryChannels.length === 0) return true;

    for (const channel of mandatoryChannels) {
      const isMember = await this.botService.checkChannelMembership(user.id, channel.channelId);
      if (!isMember) {
        if (!skipMessage) {
          const keyboard = {
            inline_keyboard: [
              ...mandatoryChannels.map(ch => ([
                { text: `📢 ${ch.title}`, url: `https://t.me/${ch.channelUsername}` }
              ])),
              [{ text: t('checkSubscription'), callback_data: 'check_subscription' }],
            ],
          };

          await ctx.reply(t('subscribeFirst'), { reply_markup: keyboard });
        }
        return false;
      }
    }

    return true;
  }

  @Command('adminstats')
  async onAdminStats(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    

    if (!this.isAdmin(user.id)) {
      await ctx.reply(t('adminOnly'));
      return;
    }

    const stats = await this.statsService.getDashboardStats();
    await ctx.replyWithMarkdown(t('adminStats', stats));
  }

  @Command('channels')
  async onChannels(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    

    if (!this.isAdmin(user.id)) {
      await ctx.reply(t('adminOnly'));
      return;
    }

    const channels = await this.channelsService.getMandatoryChannels();
    
    if (channels.length === 0) {
      await ctx.reply(t('noChannels'));
      return;
    }

    let message = '📢 *Channels:*\n\n';
    channels.forEach((ch, i) => {
      message += `${i + 1}. ${ch.title}\n   ID: \`${ch.channelId}\`\n   @${ch.channelUsername}\n\n`;
    });

    await ctx.replyWithMarkdown(message);
  }

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    const user = ctx.from;
    const message = ctx.message as any;
    if (!user) return;

    

    if (!this.isAdmin(user.id)) {
      await ctx.reply(t('adminOnly'));
      return;
    }

    const text = message?.text?.replace('/broadcast', '').trim();
    if (!text) {
      await ctx.reply(t('broadcastNoText'));
      return;
    }

    await ctx.reply(t('broadcastSending'));
    
    const result = await this.botService.broadcastMessage(text);
    
    await ctx.reply(t('broadcastResult', result.sent, result.failed));
  }

  @Command('logincode')
  async onLoginCode(@Ctx() ctx: Context) {
    const user = ctx.from;
    if (!user) return;

    if (!this.isAdmin(user.id)) {
      await ctx.reply(t('adminOnly'));
      return;
    }

    // Login kodi yaratish
    const code = this.authService.generateTelegramLoginCode(String(user.id));

    const message = `🔐 *Admin Panel Giriş Kodu*\n\n📱 Kod: \`${code}\`\n\n⏰ Kod 5 dakika geçerli.\n\n🌐 Panele gidin: http://localhost:3001\n\n"Telegram ile giriş" butonuna tıklayın ve kodu girin.`;

    await ctx.replyWithMarkdown(message);
  }
}
