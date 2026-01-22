import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  mediaPath: string; // Local file path for uploaded media

  @Column({ default: 'text' })
  type: string; // text, photo, video, document

  @Column({ nullable: true })
  buttonText: string; // Button text

  @Column({ nullable: true })
  buttonUrl: string; // Button URL

  @Column({ nullable: true })
  channelId: string;

  @Column({ nullable: true })
  messageId: string;

  @Column({ default: 'draft' })
  status: string; // draft, sent, failed, scheduled

  @Column({ type: 'datetime', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;

  @Column({ default: false })
  broadcastToUsers: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
