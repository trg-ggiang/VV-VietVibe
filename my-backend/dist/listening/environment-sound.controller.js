"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentSoundController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const environment_sound_schema_1 = require("./schemas/environment-sound.schema");
const create_environment_sound_dto_1 = require("./dto/create-environment-sound.dto");
const update_environment_sound_dto_1 = require("./dto/update-environment-sound.dto");
const jwt_auth_guard_js_1 = require("../login/guards/jwt-auth.guard.js");
const roles_guard_js_1 = require("../login/guards/roles.guard.js");
const roles_decorator_js_1 = require("../login/decorators/roles.decorator.js");
let EnvironmentSoundController = class EnvironmentSoundController {
    envSoundModel;
    constructor(envSoundModel) {
        this.envSoundModel = envSoundModel;
    }
    async findAll() {
        const sounds = await this.envSoundModel.find().sort({ createdAt: -1 }).exec();
        return {
            data: sounds.map(sound => ({
                id: sound._id,
                name: sound.name,
                audio_url: sound.audio_url,
                category: sound.category || 'Khác',
                createdAt: sound.createdAt,
                updatedAt: sound.updatedAt,
            }))
        };
    }
    async create(createDto) {
        const sound = new this.envSoundModel(createDto);
        const saved = await sound.save();
        return {
            id: saved._id,
            name: saved.name,
            audio_url: saved.audio_url,
            category: saved.category || 'Khác',
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        };
    }
    uploadAudio(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return { audioUrl: `/audios/${file.filename}` };
    }
    async update(id, updateDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.NotFoundException('Invalid ID');
        const sound = await this.envSoundModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
        if (!sound)
            throw new common_1.NotFoundException('Không tìm thấy tạp âm');
        return {
            id: sound._id,
            name: sound.name,
            audio_url: sound.audio_url,
            category: sound.category || 'Khác',
            createdAt: sound.createdAt,
            updatedAt: sound.updatedAt,
        };
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id))
            throw new common_1.NotFoundException('Invalid ID');
        const sound = await this.envSoundModel.findById(id).exec();
        if (!sound)
            throw new common_1.NotFoundException('Không tìm thấy tạp âm');
        if (sound.audio_url && sound.audio_url.startsWith('/audios/')) {
            const fileName = sound.audio_url.replace('/audios/', '');
            const filePath = (0, path_1.join)(process.cwd(), 'public', 'audios', fileName);
            try {
                if ((0, fs_1.existsSync)(filePath)) {
                    (0, fs_1.unlinkSync)(filePath);
                }
            }
            catch (e) {
                console.warn(`Failed to delete audio file: ${filePath}`, e);
            }
        }
        await this.envSoundModel.findByIdAndDelete(id).exec();
        return { success: true, message: `Đã xóa tạp âm "${sound.name}"` };
    }
};
exports.EnvironmentSoundController = EnvironmentSoundController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách âm thanh môi trường' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Danh sách tạp âm' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EnvironmentSoundController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('access_token'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Thêm tạp âm mới' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Tạp âm đã được tạo' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_environment_sound_dto_1.CreateEnvironmentSoundDto]),
    __metadata("design:returntype", Promise)
], EnvironmentSoundController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload-audio'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Upload file âm thanh tạp âm' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './public/audios',
            filename: (req, file, cb) => {
                let decodedName = file.originalname;
                try {
                    decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                }
                catch (e) { }
                const extension = (0, path_1.extname)(decodedName).toLowerCase();
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
            const extension = (0, path_1.extname)(file.originalname).toLowerCase();
            if (!allowedExt.includes(extension) || !allowedMime.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException('Only mp3/wav/m4a/mp4 files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnvironmentSoundController.prototype, "uploadAudio", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Cập nhật tạp âm' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID tạp âm' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Tạp âm đã được cập nhật' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Không tìm thấy tạp âm' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_environment_sound_dto_1.UpdateEnvironmentSoundDto]),
    __metadata("design:returntype", Promise)
], EnvironmentSoundController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('access_token'),
    (0, swagger_1.ApiOperation)({ summary: '[ADMIN] Xóa tạp âm' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID tạp âm' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Tạp âm đã được xóa' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Không tìm thấy tạp âm' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EnvironmentSoundController.prototype, "remove", null);
exports.EnvironmentSoundController = EnvironmentSoundController = __decorate([
    (0, swagger_1.ApiTags)('Environment Sounds'),
    (0, common_1.Controller)('environment-sounds'),
    __param(0, (0, mongoose_1.InjectModel)(environment_sound_schema_1.EnvironmentSound.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EnvironmentSoundController);
//# sourceMappingURL=environment-sound.controller.js.map