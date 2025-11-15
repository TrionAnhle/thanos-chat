import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket } from 'socket.io';
import { ChatType } from './dtos/type';

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

  async findLatestMessages(userId: string): Promise<LatestMessage[]> {
    const pipeline: Prisma.InputJsonObject[] = [
      {
        $match: {
          $expr: {
            $or: [
              { $eq: [{ $toString: '$chatRoomId' }, userId] },
              { $eq: [{ $toString: '$senderId' }, userId] },
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$chatRoomId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          chatRoomId: { $toString: '$chatRoomId' },
          senderId: { $toString: '$senderId' },
          content: 1,
          createdAt: {
            $dateToString: {
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
              date: '$createdAt',
            },
          },
          updatedAt: {
            $dateToString: {
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
              date: '$updatedAt',
            },
          },
        },
      },
    ];

    const latestMessages = (await this.prisma.message.aggregateRaw({
      pipeline,
    })) as unknown as LatestMessageRaw[];

    if (!latestMessages.length) return [];

    const roomIds = latestMessages.map((msg) => msg.chatRoomId);
    const roomMap = await this.getRoomMap(roomIds);
    const missingRoomIds = roomIds.filter((id) => !roomMap.has(id));
    const userMap = await this.getUserMap(missingRoomIds);

    return latestMessages.map((msg) => ({
      ...msg,
      chatRoom:
        roomMap.get(msg.chatRoomId) ?? userMap.get(msg.chatRoomId) ?? null,
    }));
  }

  private async getRoomMap(roomIds: string[]) {
    const uniqueIds = [...new Set(roomIds)];
    if (!uniqueIds.length) {
      return new Map<string, ChatRoomInfo>();
    }

    const rooms = await this.prisma.chatRoom.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        name: true,
      },
    });

    return new Map<string, ChatRoomInfo>(
      rooms.map((room) => [
        room.id,
        {
          type: ChatType.GROUP,
          id: room.id,
          name: room.name,
          username: null,
        },
      ]),
    );
  }

  private async getUserMap(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    if (!uniqueIds.length) return new Map<string, ChatRoomInfo>();

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });

    return new Map<string, ChatRoomInfo>(
      users.map((user) => [
        user.id,
        {
          type: ChatType.USER,
          id: user.id,
          name: user.name ?? user.username,
          username: user.username,
        },
      ]),
    );
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

type LatestMessageRaw = {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type LatestMessage = LatestMessageRaw & {
  chatRoom: ChatRoomInfo | null;
};

type ChatRoomInfo = {
  type: ChatType;
  id: string;
  name: string;
  username: string;
};
