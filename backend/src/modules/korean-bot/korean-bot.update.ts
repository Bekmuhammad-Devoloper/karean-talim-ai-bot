import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { KoreanBotService } from './korean-bot.service';
import { GrammarService } from '../grammar/grammar.service';
import { SpeechToTextService } from '../grammar/speech-to-text.service';
import { OcrService } from '../grammar/ocr.service';
import { GeminiService } from '../grammar/gemini.service';
import { OpenAIService } from '../grammar/openai.service';
import { ChannelsService } from '../channels/channels.service';
import { StatsService } from '../stats/stats.service';
import { t } from './i18n';

@Injectable()
export class KoreanBotUpdate implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<Context>;

  constructor(
    private koreanBotService: KoreanBotService,
    private grammarService: GrammarService,
    private speechToTextService: SpeechToTextService,
    private ocrService: OcrService,
    private geminiService: GeminiService,
    private openaiService: OpenAIService,
    private channelsService: ChannelsService,
    private statsService: StatsService,
    private configService: ConfigService,
  ) {
    const token = this.configService.get('KOREAN_BOT_TOKEN');
    if (token) {
      this.bot = new Telegraf(token);
      this.setupHandlers();
    }
  }

  async onModuleInit() {
    if (this.bot) {
      console.log('[KoreanBot] Starting bot...');
      this.bot.launch()
        .then(() => {
          console.log('[KoreanBot] Bot started successfully!');
        })
        .catch((error: any) => {
          console.error('[KoreanBot] Failed to start bot:', error.message);
          console.log('[KoreanBot] Please check KOREAN_BOT_TOKEN in .env file');
        });
    } else {
      console.log('[KoreanBot] No token provided, bot not started');
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
    }
  }

  private isAdmin(userId: number): boolean {
    const adminIdsEnv: string = process.env.KOREAN_BOT_ADMIN_IDS || process.env.ADMIN_IDS || this.configService.get('ADMIN_IDS') || '';
    const adminIds = adminIdsEnv.split(',').map((id: string) => id.trim());
    return adminIds.includes(String(userId));
  }

  private setupHandlers() {
    // /start command
    this.bot.start(async (ctx) => {
      const user = ctx.from;
      if (!user) return;

      await this.koreanBotService.getOrCreateUser(user);

      // Check mandatory channel subscription
      const isSubscribed = await this.checkMandatoryChannel(ctx);
      if (!isSubscribed) return;

      await ctx.replyWithMarkdown(t('welcome', user.first_name));
    });

    // /help command
    this.bot.help(async (ctx) => {
      await ctx.replyWithMarkdown(t('help'));
    });

    // /stats command
    this.bot.command('stats', async (ctx) => {
      const user = ctx.from;
      if (!user) return;

      const botUser = await this.koreanBotService.getOrCreateUser(user);

      const statsData = {
        totalRequests: botUser.totalRequests,
        textRequests: botUser.textRequests,
        voiceRequests: botUser.voiceRequests,
        imageRequests: botUser.imageRequests,
        createdAt: botUser.createdAt.toLocaleDateString('ko-KR'),
      };

      await ctx.replyWithMarkdown(t('stats', statsData));
    });

    // /admin command
    this.bot.command('admin', async (ctx) => {
      const user = ctx.from;
      if (!user) return;

      if (!this.isAdmin(user.id)) {
        await ctx.reply('⛔ 관리자 권한이 없습니다.');
        return;
      }

      const stats = await this.statsService.getKoreanDashboardStats();
      
      const message = `
🔐 *관리자 패널*

📊 *통계:*
👥 총 사용자: ${stats.users.total}
📝 총 요청: ${stats.requests.total}
📅 오늘: ${stats.users.activeToday}
`;

      await ctx.replyWithMarkdown(message);
    });

    // Text messages
    this.bot.on('text', async (ctx) => {
      const message = ctx.message;
      const user = ctx.from;
      const text = message?.text;

      if (!user || !text || text.startsWith('/')) return;

      // Check mandatory channel subscription
      const isSubscribed = await this.checkMandatoryChannel(ctx);
      if (!isSubscribed) return;

      const processingMsg = await ctx.reply(t('processing'));

      try {
        const startTime = Date.now();
        
        // Korean grammar check
        const grammarLang = 'ko';
        
        let result;
        let usedModel = 'unknown';
        
        // 1. GPT-4o (primary)
        if (this.openaiService.isAvailable()) {
          try {
            console.log('[KoreanBot] Using GPT-4o for grammar check...');
            result = await this.openaiService.correctGrammar(text, grammarLang);
            usedModel = 'GPT-4o';
          } catch (openaiError: any) {
            console.log('[KoreanBot] GPT-4o failed:', openaiError.message);
          }
        }
        
        // 2. Gemini (fallback)
        if (!result) {
          try {
            console.log('[KoreanBot] Falling back to Gemini...');
            result = await this.geminiService.correctGrammar(text, grammarLang);
            usedModel = 'Gemini';
          } catch (geminiError: any) {
            console.log('[KoreanBot] Gemini failed:', geminiError.message);
          }
        }
        
        // 3. GrammarService (last fallback)
        if (!result) {
          console.log('[KoreanBot] Falling back to GrammarService...');
          result = await this.grammarService.correctGrammar(text, grammarLang);
          usedModel = 'Basic';
        }
        
        console.log('[KoreanBot] Grammar check completed using:', usedModel);

        await this.koreanBotService.incrementRequestCount(String(user.id), 'text');

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
    });

    // Voice messages
    this.bot.on('voice', async (ctx) => {
      const message = ctx.message;
      const user = ctx.from;
      const voice = message?.voice;

      if (!user || !voice) return;

      // Check mandatory channel subscription
      const isSubscribed = await this.checkMandatoryChannel(ctx);
      if (!isSubscribed) return;

      const processingMsg = await ctx.reply(t('processingVoice'));

      try {
        const startTime = Date.now();
        
        const fileLink = await ctx.telegram.getFileLink(voice.file_id);
        const grammarLang = 'ko';
        
        let text = '';
        let usedTranscriber = '';
        
        if (this.openaiService.isAvailable()) {
          try {
            console.log('[KoreanBot] Using OpenAI Whisper for voice transcription...');
            text = await this.openaiService.transcribeAudioFromUrl(fileLink.href, grammarLang);
            usedTranscriber = 'Whisper';
          } catch (e: any) {
            console.log('[KoreanBot] OpenAI Whisper failed:', e.message);
          }
        }
        
        if (!text) {
          console.log('[KoreanBot] Falling back to SpeechToTextService...');
          text = await this.speechToTextService.transcribe(fileLink.href, grammarLang);
          usedTranscriber = 'SpeechToText';
        }
        
        console.log('[KoreanBot] Voice transcription completed using:', usedTranscriber);

        if (!text) {
          await ctx.deleteMessage(processingMsg.message_id);
          await ctx.reply(t('errorVoice'));
          return;
        }

        let result;
        
        if (this.openaiService.isAvailable()) {
          try {
            result = await this.openaiService.correctGrammar(text, grammarLang);
          } catch (e) {
            console.log('[KoreanBot] GPT-4o failed for voice');
          }
        }
        
        if (!result) {
          try {
            result = await this.geminiService.correctGrammar(text, grammarLang);
          } catch (e) {
            console.log('[KoreanBot] Gemini failed for voice');
          }
        }
        
        if (!result) {
          result = await this.grammarService.correctGrammar(text, grammarLang);
        }

        await this.koreanBotService.incrementRequestCount(String(user.id), 'voice');

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
    });

    // Audio files (mp3, etc.)
    this.bot.on('audio', async (ctx) => {
      const message = ctx.message;
      const user = ctx.from;
      const audio = message?.audio;

      if (!user || !audio) return;

      // Check mandatory channel subscription
      const isSubscribed = await this.checkMandatoryChannel(ctx);
      if (!isSubscribed) return;

      const processingMsg = await ctx.reply(t('processingVoice'));

      try {
        const startTime = Date.now();
        
        const fileLink = await ctx.telegram.getFileLink(audio.file_id);
        const grammarLang = 'ko';
        
        let text = '';
        let usedTranscriber = '';
        
        if (this.openaiService.isAvailable()) {
          try {
            console.log('[KoreanBot] Using OpenAI Whisper for audio file transcription...');
            text = await this.openaiService.transcribeAudioFromUrl(fileLink.href, grammarLang);
            usedTranscriber = 'Whisper';
          } catch (e: any) {
            console.log('[KoreanBot] OpenAI Whisper failed:', e.message);
          }
        }
        
        if (!text) {
          console.log('[KoreanBot] Falling back to SpeechToTextService...');
          text = await this.speechToTextService.transcribe(fileLink.href, grammarLang);
          usedTranscriber = 'SpeechToText';
        }
        
        console.log('[KoreanBot] Audio transcription completed using:', usedTranscriber);

        if (!text) {
          await ctx.deleteMessage(processingMsg.message_id);
          await ctx.reply(t('errorVoice'));
          return;
        }

        let result;
        
        if (this.openaiService.isAvailable()) {
          try {
            result = await this.openaiService.correctGrammar(text, grammarLang);
          } catch (e) {
            console.log('[KoreanBot] GPT-4o failed for audio');
          }
        }
        
        if (!result) {
          try {
            result = await this.geminiService.correctGrammar(text, grammarLang);
          } catch (e) {
            console.log('[KoreanBot] Gemini failed for audio');
          }
        }
        
        if (!result) {
          result = await this.grammarService.correctGrammar(text, grammarLang);
        }

        await this.koreanBotService.incrementRequestCount(String(user.id), 'voice');

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
        console.error('Audio processing error:', error);
        try {
          await ctx.deleteMessage(processingMsg.message_id);
        } catch {}
        await ctx.reply(t('errorVoice'));
      }
    });

    // Photo messages
    this.bot.on('photo', async (ctx) => {
      const message = ctx.message;
      const user = ctx.from;
      const photos = message?.photo;

      if (!user || !photos || photos.length === 0) return;

      // Check mandatory channel subscription
      const isSubscribed = await this.checkMandatoryChannel(ctx);
      if (!isSubscribed) return;

      const processingMsg = await ctx.reply(t('processingImage'));

      try {
        const startTime = Date.now();
        const grammarLang = 'ko';
        
        const photo = photos[photos.length - 1];
        const fileLink = await ctx.telegram.getFileLink(photo.file_id);
        const imageUrl = fileLink.href;

        let result;
        let text = '';

        // GPT-4o Vision
        if (this.openaiService.isAvailable()) {
          try {
            console.log('[KoreanBot] Using GPT-4o Vision for image analysis...');
            result = await this.openaiService.analyzeImage(imageUrl, grammarLang);
            text = result.originalText;
          } catch (e: any) {
            console.log('[KoreanBot] GPT-4o Vision failed:', e.message);
          }
        }

        // Fallback: OCR + Gemini/Grammar
        if (!result || !text) {
          console.log('[KoreanBot] Falling back to OCR...');
          const filePath = await this.ocrService.downloadImage(imageUrl);
          try {
            text = await this.ocrService.extractText(filePath, grammarLang);
            
            if (text && text.trim().length > 0) {
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

        await this.koreanBotService.incrementRequestCount(String(user.id), 'image');

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
    });

    // Callback queries
    this.bot.on('callback_query', async (ctx) => {
      const callbackQuery = ctx.callbackQuery as any;
      const data = callbackQuery?.data;
      const user = ctx.from;

      if (!data || !user) return;

      await this.koreanBotService.getOrCreateUser(user);

      if (data === 'check_subscription') {
        const isSubscribed = await this.checkMandatoryChannel(ctx, true);
        if (isSubscribed) {
          await ctx.answerCbQuery(t('subscriptionConfirmed'));
          await ctx.replyWithMarkdown(t('welcome', user.first_name));
        } else {
          await ctx.answerCbQuery(t('notSubscribed'), { show_alert: true });
        }
      }
    });
  }

  private async checkMandatoryChannel(ctx: Context, skipMessage: boolean = false): Promise<boolean> {
    const user = ctx.from;
    if (!user) return false;

    const mandatoryChannels = await this.channelsService.getMandatoryChannels();
    if (mandatoryChannels.length === 0) return true;

    for (const channel of mandatoryChannels) {
      const isMember = await this.koreanBotService.checkChannelMembership(user.id, channel.channelId);
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
}
