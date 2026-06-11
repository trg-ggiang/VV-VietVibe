import { Model, Types } from 'mongoose';
import { EnvironmentSoundDocument } from './schemas/environment-sound.schema';
import { CreateEnvironmentSoundDto } from './dto/create-environment-sound.dto';
import { UpdateEnvironmentSoundDto } from './dto/update-environment-sound.dto';
export declare class EnvironmentSoundController {
    private envSoundModel;
    constructor(envSoundModel: Model<EnvironmentSoundDocument>);
    findAll(): Promise<{
        data: {
            id: Types.ObjectId;
            name: string;
            audio_url: string;
            category: string;
            createdAt: any;
            updatedAt: any;
        }[];
    }>;
    create(createDto: CreateEnvironmentSoundDto): Promise<{
        id: Types.ObjectId;
        name: string;
        audio_url: string;
        category: string;
        createdAt: any;
        updatedAt: any;
    }>;
    uploadAudio(file: Express.Multer.File): {
        audioUrl: string;
    };
    update(id: string, updateDto: UpdateEnvironmentSoundDto): Promise<{
        id: Types.ObjectId;
        name: string;
        audio_url: string;
        category: string;
        createdAt: any;
        updatedAt: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
