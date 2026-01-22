import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { GrammarRequest } from './entities/grammar-request.entity';
import { BotUser } from '../bot/entities/bot-user.entity';
import { KoreanBotUser } from '../korean-bot/entities/korean-bot-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GrammarRequest, BotUser, KoreanBotUser])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
