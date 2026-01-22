import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelDto {
  @ApiProperty({ example: '-1001234567890' })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({ example: 'my_channel' })
  @IsString()
  @IsNotEmpty()
  channelUsername: string;

  @ApiProperty({ example: 'My Channel' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export class UpdateChannelDto {
  @ApiProperty({ example: '-1001234567890' })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiProperty({ example: 'my_channel' })
  @IsString()
  @IsOptional()
  channelUsername?: string;

  @ApiProperty({ example: 'My Channel' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
