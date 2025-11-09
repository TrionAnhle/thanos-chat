import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}
