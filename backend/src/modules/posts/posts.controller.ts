import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, SendPostDto } from './dto/post.dto';

@ApiTags('Posts')
@Controller('api/posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll() {
    console.log('=== POSTS: GET ALL ===');
    const posts = await this.postsService.findAll();
    console.log('Posts count:', posts.length);
    return posts;
  }

  @Get('stats')
  async getStats() {
    console.log('=== POSTS: GET STATS ===');
    return this.postsService.getStats();
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    console.log('=== POSTS: GET BY ID ===', id);
    return this.postsService.findById(id);
  }

  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    console.log('=== POSTS: CREATE ===');
    console.log('Request body:', JSON.stringify(createPostDto));
    try {
      const post = await this.postsService.create(createPostDto);
      console.log('Post created:', JSON.stringify(post));
      return post;
    } catch (error: any) {
      console.error('Post create error:', error.message);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto) {
    console.log('=== POSTS: UPDATE ===', id);
    console.log('Request body:', JSON.stringify(updatePostDto));
    try {
      const post = await this.postsService.update(id, updatePostDto);
      console.log('Post updated:', JSON.stringify(post));
      return post;
    } catch (error: any) {
      console.error('Post update error:', error.message);
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    console.log('=== POSTS: DELETE ===', id);
    await this.postsService.delete(id);
    console.log('Post deleted');
    return { success: true };
  }

  @Post(':id/send')
  async sendPost(@Param('id') id: number, @Body() sendPostDto: SendPostDto) {
    console.log('=== POSTS: SEND ===', id);
    console.log('Send to channel:', sendPostDto.channelId);
    try {
      const result = await this.postsService.sendPost(id, sendPostDto.channelId);
      console.log('Post sent result:', JSON.stringify(result));
      return result;
    } catch (error: any) {
      console.error('Post send error:', error.message);
      throw error;
    }
  }

  @Post(':id/broadcast')
  async broadcastPost(@Param('id') id: number) {
    console.log('=== POSTS: BROADCAST ===', id);
    try {
      const result = await this.postsService.broadcastPost(id);
      console.log('Broadcast result:', result);
      return result;
    } catch (error: any) {
      console.error('Broadcast error:', error.message);
      throw error;
    }
  }

  @Post(':id/schedule')
  async schedulePost(@Param('id') id: number, @Body() body: { scheduledAt: string; broadcastToUsers?: boolean }) {
    console.log('=== POSTS: SCHEDULE ===', id);
    console.log('Schedule at:', body.scheduledAt, 'Broadcast:', body.broadcastToUsers);
    try {
      const result = await this.postsService.schedulePost(id, new Date(body.scheduledAt), body.broadcastToUsers);
      console.log('Schedule result:', JSON.stringify(result));
      return result;
    } catch (error: any) {
      console.error('Schedule error:', error.message);
      throw error;
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/posts',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Faqat rasm (jpg, png, gif, webp) va video (mp4, webm) formatlar qabul qilinadi'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    console.log('=== POSTS: UPLOAD MEDIA ===');
    if (!file) {
      throw new BadRequestException('Fayl yuklanmadi');
    }
    console.log('Uploaded file:', file.filename, 'Size:', file.size, 'Type:', file.mimetype);
    
    const isVideo = file.mimetype.startsWith('video/');
    return {
      filename: file.filename,
      path: `/uploads/posts/${file.filename}`,
      type: isVideo ? 'video' : 'photo',
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
