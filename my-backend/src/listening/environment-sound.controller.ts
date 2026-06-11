import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { EnvironmentSound, EnvironmentSoundDocument } from './schemas/environment-sound.schema';
import { CreateEnvironmentSoundDto } from './dto/create-environment-sound.dto';
import { UpdateEnvironmentSoundDto } from './dto/update-environment-sound.dto';
import { JwtAuthGuard } from '../login/guards/jwt-auth.guard.js';
import { RolesGuard } from '../login/guards/roles.guard.js';
import { Roles } from '../login/decorators/roles.decorator.js';

@ApiTags('Environment Sounds')
@Controller('environment-sounds')
export class EnvironmentSoundController {
  constructor(
    @InjectModel(EnvironmentSound.name) private envSoundModel: Model<EnvironmentSoundDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách âm thanh môi trường' })
  @ApiOkResponse({ description: 'Danh sách tạp âm' })
  async findAll() {
    const sounds = await this.envSoundModel.find().sort({ createdAt: -1 }).exec();
    return {
      data: sounds.map(sound => ({
        id: sound._id,
        name: sound.name,
        audio_url: sound.audio_url,
        category: sound.category || 'Khác',
        createdAt: (sound as any).createdAt,
        updatedAt: (sound as any).updatedAt,
      }))
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('access_token')
  @HttpCode(201)
  @ApiOperation({ summary: '[ADMIN] Thêm tạp âm mới' })
  @ApiCreatedResponse({ description: 'Tạp âm đã được tạo' })
  async create(@Body() createDto: CreateEnvironmentSoundDto) {
    const sound = new this.envSoundModel(createDto);
    const saved = await sound.save();
    return {
      id: saved._id,
      name: saved.name,
      audio_url: saved.audio_url,
      category: saved.category || 'Khác',
      createdAt: (saved as any).createdAt,
      updatedAt: (saved as any).updatedAt,
    };
  }

  @Post('upload-audio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: '[ADMIN] Upload file âm thanh tạp âm' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/audios',
        filename: (req, file, cb) => {
          let decodedName = file.originalname;
          try {
            decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          } catch (e) {}
          const extension = extname(decodedName).toLowerCase();
          let baseName = decodedName.substring(0, decodedName.length - extension.length);
          baseName = baseName.replace(/[^a-zA-Z0-9\u0080-\uFFFF_-]/g, '_');
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${baseName}-${uniqueSuffix}${extension}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedExt = ['.mp3', '.wav', '.m4a', '.mp4'];
        const allowedMime = [
          'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
          'audio/mp4', 'audio/x-m4a', 'video/mp4',
        ];
        const extension = extname(file.originalname).toLowerCase();
        if (!allowedExt.includes(extension) || !allowedMime.includes(file.mimetype)) {
          return cb(new BadRequestException('Only mp3/wav/m4a/mp4 files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { audioUrl: `/audios/${file.filename}` };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: '[ADMIN] Cập nhật tạp âm' })
  @ApiParam({ name: 'id', description: 'ID tạp âm' })
  @ApiOkResponse({ description: 'Tạp âm đã được cập nhật' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tạp âm' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateEnvironmentSoundDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid ID');

    const sound = await this.envSoundModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!sound) throw new NotFoundException('Không tìm thấy tạp âm');

    return {
      id: sound._id,
      name: sound.name,
      audio_url: sound.audio_url,
      category: sound.category || 'Khác',
      createdAt: (sound as any).createdAt,
      updatedAt: (sound as any).updatedAt,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: '[ADMIN] Xóa tạp âm' })
  @ApiParam({ name: 'id', description: 'ID tạp âm' })
  @ApiOkResponse({ description: 'Tạp âm đã được xóa' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tạp âm' })
  async remove(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid ID');

    const sound = await this.envSoundModel.findById(id).exec();
    if (!sound) throw new NotFoundException('Không tìm thấy tạp âm');

    // Try to delete the associated audio file
    if (sound.audio_url && sound.audio_url.startsWith('/audios/')) {
      const fileName = sound.audio_url.replace('/audios/', '');
      const filePath = join(process.cwd(), 'public', 'audios', fileName);
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (e) {
        console.warn(`Failed to delete audio file: ${filePath}`, e);
      }
    }

    await this.envSoundModel.findByIdAndDelete(id).exec();
    return { success: true, message: `Đã xóa tạp âm "${sound.name}"` };
  }
}
