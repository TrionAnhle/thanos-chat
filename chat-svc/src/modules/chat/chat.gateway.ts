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
import { UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from './dtos/events';
import * as jwt from 'jsonwebtoken';
import { WsJwtGuard } from 'src/common/guards/ws/ws-jwt.guard';
import { ChatService } from './chat.service';
import { WsSendMessageDto } from './dtos/ws-send-message.dto';
import { ChatType } from './dtos/type';
import { SocketExceptionFilter } from 'src/common/filter/ws-exception.filter';
import { MessageType } from './dtos/message-type';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
  transports: ['websocket'],
})
@UseGuards(WsJwtGuard)
@UseFilters(SocketExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const user = this.ensureAuthenticated(client);
      const userRoom = ChatType.USER + user.id;
      await this.chatService.join(client, userRoom);
    } catch (error) {
      this.handleWsError(client, error);
    }
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
    const sendMsg = {
      id: msg.id,
      authorId: msg.senderId,
      type: MessageType.MESSAGE,
      username: client.data.user.username,
      name: client.data.user.name,
      content: msg.content,
      timestamp: msg.createdAt,
    };
    this.io.to(roomChannel).emit(ChatEvents.NEW_MESSAGE, sendMsg);
  }

  async onNotify(
    roomId: string,
    msg: {
      senderId: string;
      type: MessageType;
      username: string;
      content: string;
    },
  ) {
    const roomChannel = ChatType.GROUP + roomId;
    const sendMsg = {
      authorId: msg.senderId,
      type: msg.type,
      username: msg.username,
      content: msg.content,
    };
    this.io.to(roomChannel).emit(ChatEvents.NEW_MESSAGE, sendMsg);
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
      const payload = jwt.verify(token, process.env.JWT_SECRET) as {
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

  private handleWsError(client: Socket, error: unknown) {
    if (!(error instanceof WsException)) throw error;

    const payload = error.getError();
    const message =
      typeof payload === 'string'
        ? payload
        : ((payload as Record<string, any>)?.message ?? 'Unexpected error');

    client.emit(ChatEvents.ERROR, {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
    client.disconnect(true);
  }
}
