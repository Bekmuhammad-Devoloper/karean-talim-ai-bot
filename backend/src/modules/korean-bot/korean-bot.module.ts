import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KoreanBotUpdate } from './korean-bot.update';
import { KoreanBotService } from './korean-bot.service';
import { KoreanBotUser } from './entities/korean-bot-user.entity';
import { GrammarModule } from '../grammar/grammar.module';
import { ChannelsModule } from '../channels/channels.module';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([KoreanBotUser]),
    GrammarModule,
    ChannelsModule,
    StatsModule,
  ],
  providers: [KoreanBotUpdate, KoreanBotService],
  exports: [KoreanBotService],
})
export class KoreanBotModule {}
