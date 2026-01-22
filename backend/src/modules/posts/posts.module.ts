import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { BotModule } from '../bot/bot.module';
import { KoreanBotModule } from '../korean-bot/korean-bot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    forwardRef(() => BotModule),
    forwardRef(() => KoreanBotModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
