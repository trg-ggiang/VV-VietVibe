import { TranscriptLineDto } from '../transcript-line.dto';
export declare class UpdateListeningDto {
    learningUnitId?: string;
    titleVi?: string;
    titleJa?: string;
    audioUrl?: string;
    audioMode?: 'split' | 'timed';
    durationSeconds?: number;
    description?: string;
    transcriptLines?: TranscriptLineDto[];
    ambientSoundIds?: string[];
}
