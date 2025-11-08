import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // Chat manager
  async createMessage(input: {
    roomId: string;
    authorId: string;
    content: string;
  }) {
    return this.prisma.message.create({
      data: {
        content: input.content,
        senderId: input.authorId,
        chatRoomId: input.roomId,
      },
    });
  }

  // Room manager
  async join(client: Socket, roomId: string) {
    await client.join(roomId);
  }

  async leave(client: Socket, roomId: string) {
    await client.leave(roomId);
  }

  async leaveAll(client: Socket) {
    for (const room of client.rooms) {
      if (room !== client.id) await client.leave(room);
    }
  }
}
