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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEnvironmentSoundDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateEnvironmentSoundDto {
    name;
    audio_url;
    category;
}
exports.UpdateEnvironmentSoundDto = UpdateEnvironmentSoundDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tên tạp âm', example: 'Quán cafe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEnvironmentSoundDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL file âm thanh', example: '/audios/cafe.mp4' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEnvironmentSoundDto.prototype, "audio_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Phân loại', example: 'Trong nhà' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEnvironmentSoundDto.prototype, "category", void 0);
//# sourceMappingURL=update-environment-sound.dto.js.map