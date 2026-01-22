import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('grammar_requests')
export class GrammarRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  telegramId: string;

  @Column({ default: 'text' })
  type: string; // text, voice, image

  @Column({ type: 'text' })
  originalText: string;

  @Column({ type: 'text' })
  correctedText: string;

  @Column({ default: 0 })
  errorsCount: number;

  @Column({ default: 0 })
  processingTime: number; // milliseconds

  @CreateDateColumn()
  createdAt: Date;
}
