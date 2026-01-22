import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Create default admin user if not exists
    const adminUsername = this.configService.get('ADMIN_USERNAME', 'admin');
    const adminPassword = this.configService.get('ADMIN_PASSWORD', 'admin123');
    
    const existingAdmin = await this.findByUsername(adminUsername);
    if (!existingAdmin) {
      await this.create({
        username: adminUsername,
        password: adminPassword,
        role: 'admin',
      });
      console.log('✅ Default admin user created');
    }
  }

  async create(data: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password || '', 10);
    const user = this.usersRepository.create({
      username: data.username,
      password: hashedPassword,
      role: data.role || 'admin',
    });
    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
