import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { PostsModule } from './modules/posts/posts.module';
import { StatsModule } from './modules/stats/stats.module';
import { BotModule } from './modules/bot/bot.module';
import { GrammarModule } from './modules/grammar/grammar.module';
import { KoreanBotModule } from './modules/korean-bot/korean-bot.module';

// Entities
import { User } from './modules/users/entities/user.entity';
import { Channel } from './modules/channels/entities/channel.entity';
import { Post } from './modules/posts/entities/post.entity';
import { BotUser } from './modules/bot/entities/bot-user.entity';
import { GrammarRequest } from './modules/stats/entities/grammar-request.entity';
import { KoreanBotUser } from './modules/korean-bot/entities/korean-bot-user.entity';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Schedule for cron jobs
    ScheduleModule.forRoot(),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DATABASE_PATH', './hilal_bot.db'),
        entities: [User, Channel, Post, BotUser, GrammarRequest, KoreanBotUser],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    
    // Telegram Bot (Turkish)
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('BOT_TOKEN') || 'invalid_token',
        launchOptions: false, // Don't auto-launch, we'll handle it manually
      }),
      inject: [ConfigService],
    }),
    
    // Static files for uploads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    
    // Feature Modules
    AuthModule,
    UsersModule,
    ChannelsModule,
    PostsModule,
    StatsModule,
    BotModule, // Turkish bot
    GrammarModule,
    KoreanBotModule,
  ],
})
export class AppModule {}
