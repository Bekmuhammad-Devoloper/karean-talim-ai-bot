import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { BotUser } from './entities/bot-user.entity';
import { GrammarModule } from '../grammar/grammar.module';
import { ChannelsModule } from '../channels/channels.module';
import { StatsModule } from '../stats/stats.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BotUser]),
    GrammarModule,
    ChannelsModule,
    StatsModule,
    AuthModule,
  ],
  providers: [BotUpdate, BotService],
  exports: [BotService],
})
export class BotModule {}
