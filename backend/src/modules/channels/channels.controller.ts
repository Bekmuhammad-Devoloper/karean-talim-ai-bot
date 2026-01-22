import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';

@ApiTags('Channels')
@Controller('api/channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async findAll() {
    console.log('=== CHANNELS: GET ALL ===');
    const channels = await this.channelsService.findAll();
    console.log('Channels count:', channels.length);
    return channels;
  }

  @Get('info')
  async getChannelInfo(@Query('username') username: string) {
    console.log('=== CHANNELS: GET INFO ===', username);
    if (!username) {
      return { error: 'Username required' };
    }
    const info = await this.channelsService.getChannelInfo(username);
    console.log('Channel info:', info);
    return info || { error: 'Channel not found' };
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    console.log('=== CHANNELS: GET BY ID ===', id);
    return this.channelsService.findById(id);
  }

  @Post()
  async create(@Body() createChannelDto: CreateChannelDto) {
    console.log('=== CHANNELS: CREATE ===');
    console.log('Request body:', createChannelDto);
    try {
      const channel = await this.channelsService.create(createChannelDto);
      console.log('Channel created:', channel);
      return channel;
    } catch (error: any) {
      console.error('Channel create error:', error.message);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateChannelDto: UpdateChannelDto) {
    console.log('=== CHANNELS: UPDATE ===', id);
    console.log('Request body:', updateChannelDto);
    try {
      const channel = await this.channelsService.update(id, updateChannelDto);
      console.log('Channel updated:', channel);
      return channel;
    } catch (error: any) {
      console.error('Channel update error:', error.message);
      throw error;
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    console.log('=== CHANNELS: DELETE ===', id);
    await this.channelsService.delete(id);
    console.log('Channel deleted');
    return { success: true };
  }

  @Post(':id/toggle-mandatory')
  async toggleMandatory(@Param('id') id: number) {
    console.log('=== CHANNELS: TOGGLE MANDATORY ===', id);
    return this.channelsService.toggleMandatory(id);
  }

  @Post(':id/toggle-active')
  async toggleActive(@Param('id') id: number) {
    console.log('=== CHANNELS: TOGGLE ACTIVE ===', id);
    return this.channelsService.toggleActive(id);
  }
}
