import { IsString, MinLength } from 'class-validator';
export class WsSendMessageDto {
  @IsString() roomId: string;
  @IsString() file: string;
  @IsString() @MinLength(1) content: string;
}
