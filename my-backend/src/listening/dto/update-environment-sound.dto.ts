import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEnvironmentSoundDto {
  @ApiPropertyOptional({ description: 'Tên tạp âm', example: 'Quán cafe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'URL file âm thanh', example: '/audios/cafe.mp4' })
  @IsString()
  @IsOptional()
  audio_url?: string;

  @ApiPropertyOptional({ description: 'Phân loại', example: 'Trong nhà' })
  @IsString()
  @IsOptional()
  category?: string;
}
