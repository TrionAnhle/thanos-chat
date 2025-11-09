import { IsString, MinLength } from 'class-validator';
import { ChatType } from './type';
export class WsSendMessageDto {
  @IsString() type: ChatType;
  @IsString() roomId: string;
  @IsString() @MinLength(1) content: string;
}
