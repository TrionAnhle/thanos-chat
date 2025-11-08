// sockets/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from './dtos/events';
import * as jwt from 'jsonwebtoken';
import { WsJwtGuard } from 'src/common/guards/ws/ws-jwt.guard';
import { ChatService } from './chat.service';
import { WsSendMessageDto } from './dtos/ws-send-message.dto';
import { ChatType } from './dtos/mesaage-type';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
  transports: ['websocket'],
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const user = this.ensureAuthenticated(client);
    const userRoom = ChatType.USER + user.id;
    await this.chatService.join(client, userRoom);
  }

  async handleDisconnect(client: Socket) {
    await this.chatService.leaveAll(client);
  }

  @SubscribeMessage(ChatEvents.JOIN)
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const room = ChatType.GROUP + payload.roomId;
    await this.chatService.join(client, room);
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async onSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WsSendMessageDto,
  ) {
    const msg = await this.chatService.createMessage({
      roomId: dto.roomId,
      authorId: client.data.user.id,
      content: dto.content,
    });
    const roomChannel = dto.type + dto.roomId;
    this.io.to(roomChannel).emit(ChatEvents.NEW_MESSAGE, dto.content);
  }

  private ensureAuthenticated(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers['authorization']
        ?.toString()
        ?.replace(/^Bearer /, '');
    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id?: string;
        username?: string;
      };
      const id = payload.id;
      if (!id) {
        throw new WsException('Unauthorized');
      }
      client.data = {
        ...client.data,
        user: { id, username: payload.username },
      };
      return client.data.user;
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}
