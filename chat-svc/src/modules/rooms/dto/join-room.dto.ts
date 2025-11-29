import { IsNotEmpty, IsString } from 'class-validator';
import { ChatType } from 'src/modules/chat/dtos/type';

export class JoinRoomDto {
  @IsNotEmpty() @IsString() id: string;
  @IsNotEmpty() @IsString() type: ChatType;
}
