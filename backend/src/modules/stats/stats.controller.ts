import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // ==================== PUBLIC ENDPOINT (for bekmuhammad) ====================

  @Get('bekmuhammad')
  @ApiOperation({ summary: 'Bekmuhammad uchun to\'liq loyiha ma\'lumotlari' })
  @ApiResponse({ status: 200, description: 'Real-time statistika, obunachilar, maqsadlar va texnologiyalar' })
  async getBekmuhammadStats() {
    return this.statsService.getBekmuhammadFullStats();
  }

  // ==================== KOREAN BOT STATS ====================

  @Get('korean/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Korean Bot Dashboard statistikasi' })
  async getKoreanDashboardStats() {
    return this.statsService.getKoreanDashboardStats();
  }

  @Get('korean/top-users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Korean Bot Top foydalanuvchilar' })
  async getKoreanTopUsers(@Query('limit') limit?: number) {
    return this.statsService.getKoreanTopUsers(limit || 10);
  }

  // ==================== PROTECTED ENDPOINTS (admin only) ====================

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard statistikasi (admin)' })
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('recent-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oxirgi so\'rovlar (admin)' })
  async getRecentRequests(@Query('limit') limit?: number) {
    return this.statsService.getRecentRequests(limit || 20);
  }

  @Get('top-users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Top foydalanuvchilar (admin)' })
  async getTopUsers(@Query('limit') limit?: number) {
    return this.statsService.getTopUsers(limit || 10);
  }

  @Get('daily')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kunlik statistika (admin)' })
  async getDailyStats(@Query('days') days?: number) {
    return this.statsService.getDailyStats(days || 7);
  }
}
