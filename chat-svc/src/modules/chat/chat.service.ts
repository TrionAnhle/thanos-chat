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
            $or: [{ $eq: [{ $toString: '$senderId' }, userId] }],
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
    const missingRoomIds = [
      ...new Set(
        [...roomMap.values()]
          .filter((room) => room.type === ChatType.USER)
          .flatMap((room) =>
            room.participantIds.filter((participant) => participant !== userId),
          ),
      ),
    ];
    const userMap = await this.getUserMap(missingRoomIds);

    return latestMessages.map((msg) => {
      const room = roomMap.get(msg.chatRoomId);
      const resolvedRoom = this.resolveChatRoom(room, userMap, userId);
      return {
        ...msg,
        chatRoom: resolvedRoom ? this.stripParticipantIds(resolvedRoom) : null,
      };
    });
  }

  private async getRoomMap(roomIds: string[]) {
    const uniqueIds = [...new Set(roomIds)];
    if (!uniqueIds.length) {
      return new Map<string, ChatRoomInfo>();
    }

    const rooms = await this.prisma.chatRoom.findMany({
      where: { id: { in: uniqueIds } },
    });

    return new Map<string, ChatRoomInfo>(
      rooms.map((room) => [
        room.id,
        {
          type: room.type as ChatType,
          id: room.id,
          name: room.name,
          username: null,
          participantIds: room.participantIds,
        },
      ]),
    );
  }

  private async getUserMap(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    if (!uniqueIds.length) return new Map<string, ChatRoomInfo>();

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
    });

    return new Map<string, ChatRoomInfo>(
      users.map((user) => [
        user.id,
        {
          type: ChatType.USER,
          id: user.id,
          name: user.name ?? user.username,
          username: user.username,
          participantIds: [],
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

  private resolveChatRoom(
    room: ChatRoomInfo | undefined,
    userMap: Map<string, ChatRoomInfo>,
    userId: string,
  ): ChatRoomInfo | null {
    if (!room) return null;
    if (room.type !== ChatType.USER) return room;

    const otherUserId = room.participantIds.find(
      (participant) => participant !== userId,
    );
    const userInfo = otherUserId ? userMap.get(otherUserId) : undefined;

    return userInfo
      ? { ...userInfo, id: room.id, participantIds: room.participantIds }
      : room;
  }

  private stripParticipantIds(room: ChatRoomInfo): PublicChatRoomInfo {
    const { participantIds: _omit, ...rest } = room;
    return rest;
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
  chatRoom: PublicChatRoomInfo | null;
};

type ChatRoomInfo = {
  type: ChatType;
  id: string;
  name: string;
  username: string | null;
  participantIds: string[];
};

type PublicChatRoomInfo = Omit<ChatRoomInfo, 'participantIds'>;
