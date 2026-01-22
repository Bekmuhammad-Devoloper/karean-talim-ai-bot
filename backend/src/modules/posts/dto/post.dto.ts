import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Post content here...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'text' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ example: 'Batafsil' })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiProperty({ example: 'https://example.com/link' })
  @IsString()
  @IsOptional()
  buttonUrl?: string;
}

export class UpdatePostDto {
  @ApiProperty({ example: 'Updated post content...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 'photo' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ example: 'Batafsil' })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiProperty({ example: 'https://example.com/link' })
  @IsString()
  @IsOptional()
  buttonUrl?: string;
}

export class SendPostDto {
  @ApiProperty({ example: '-1001234567890' })
  @IsString()
  @IsNotEmpty()
  channelId: string;
}
