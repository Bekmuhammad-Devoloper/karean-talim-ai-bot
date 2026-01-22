import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// Telegram login kodlarini faylda saqlash (cluster mode uchun)
const CODES_FILE = path.join(process.cwd(), 'telegram-codes.json');

function loadCodes(): Map<string, { telegramId: string; expiresAt: string }> {
  try {
    if (fs.existsSync(CODES_FILE)) {
      const data = JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.error('Error loading codes:', e);
  }
  return new Map();
}

function saveCodes(codes: Map<string, { telegramId: string; expiresAt: string }>) {
  try {
    const obj = Object.fromEntries(codes);
    fs.writeFileSync(CODES_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error('Error saving codes:', e);
  }
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    console.log('validateUser called with username:', username);
    const user = await this.usersService.findByUsername(username);
    console.log('User found:', user ? 'yes' : 'no');
    
    if (user) {
      const isPasswordValid = await this.usersService.validatePassword(user, password);
      console.log('Password valid:', isPasswordValid);
      
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(username: string, password: string) {
    console.log('Login attempt for:', username);
    const user = await this.validateUser(username, password);
    console.log('Validated user:', user ? user.username : 'null');
    
    if (!user) {
      console.log('Login failed: Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);
    console.log('Login successful, JWT token generated');
    
    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  // Telegram orqali login uchun kod yaratish
  generateTelegramLoginCode(telegramId: string): string {
    // 6 raqamli kod
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 5 daqiqa amal qiladi
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // Fayldan yuklash, qo'shish va saqlash
    const codes = loadCodes();
    codes.set(code, { telegramId, expiresAt });
    saveCodes(codes);
    
    console.log('Generated code:', code, 'for telegramId:', telegramId);
    
    // Eskilarini tozalash
    this.cleanupExpiredCodes();
    
    return code;
  }

  // Telegram kodi bilan login
  async loginWithTelegramCode(code: string) {
    // Fayldan kodlarni yuklash
    const codes = loadCodes();
    const data = codes.get(code);
    
    console.log('Checking code:', code, '| Found:', !!data);
    
    if (!data) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    
    const expiresAt = new Date(data.expiresAt);
    if (new Date() > expiresAt) {
      codes.delete(code);
      saveCodes(codes);
      throw new UnauthorizedException('Code expired');
    }
    
    // Admin ID larni tekshirish - process.env dan ham o'qiymiz
    const adminIdsEnv = process.env.ADMIN_IDS || this.configService.get('ADMIN_IDS') || '';
    const adminIds = adminIdsEnv.split(',').map(id => id.trim());
    console.log('Auth ADMIN_IDS:', adminIdsEnv, '| Telegram ID:', data.telegramId, '| Is Admin:', adminIds.includes(data.telegramId));
    
    if (!adminIds.includes(data.telegramId)) {
      throw new UnauthorizedException('Not authorized as admin');
    }
    
    // Kodni o'chirish (bir martalik)
    codes.delete(code);
    saveCodes(codes);
    
    // Token yaratish
    const payload = { 
      sub: data.telegramId, 
      username: `telegram_${data.telegramId}`, 
      role: 'admin',
      isTelegramAuth: true,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: data.telegramId,
        username: `Admin (Telegram)`,
        role: 'admin',
      },
    };
  }

  private cleanupExpiredCodes() {
    const now = new Date();
    const codes = loadCodes();
    let changed = false;
    for (const [code, data] of codes.entries()) {
      if (now > new Date(data.expiresAt)) {
        codes.delete(code);
        changed = true;
      }
    }
    if (changed) {
      saveCodes(codes);
    }
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
