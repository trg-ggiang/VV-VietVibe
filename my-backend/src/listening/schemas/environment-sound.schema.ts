import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EnvironmentSoundDocument = EnvironmentSound & Document;

@Schema({ timestamps: true })
export class EnvironmentSound {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  audio_url: string;

  @Prop({ default: 'Khác' })
  category: string;
}

export const EnvironmentSoundSchema = SchemaFactory.createForClass(EnvironmentSound);
