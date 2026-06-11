import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnvironmentSoundDto {
  @ApiProperty({ description: 'Tên tạp âm', example: 'Quán cafe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL file âm thanh', example: '/audios/cafe.mp4' })
  @IsString()
  @IsNotEmpty()
  audio_url: string;

  @ApiPropertyOptional({ description: 'Phân loại', example: 'Trong nhà' })
  @IsString()
  @IsOptional()
  category?: string;
}
