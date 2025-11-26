import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { DomainException } from 'src/common/filter/domain.exception';
import { DomainCode } from 'src/common/filter/domain.code';
import { ChatGateway } from '../chat/chat.gateway';
import { MessageType } from '../chat/dtos/message-type';
import { ChatType } from '../chat/dtos/type';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(ownerId: string, req: CreateRoomDto) {
    const participantIds = [ownerId];
    // Create new room
    const room = await this.prisma.chatRoom.create({
      data: {
        name: req.name,
        description: req.description,
        ownerId,
        participantIds: [ownerId],
        type: ChatType.GROUP,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Sync roomId to user
    await Promise.all(
      participantIds.map((participantId) =>
        this.prisma.user.update({
          where: { id: participantId },
          data: {
            chatRoomIds: {
              push: room.id,
            },
          },
        }),
      ),
    );

    return room;
  }

  async search(name: string) {
    if (!name?.trim()) return [];

    // find all room by name or user by name and username
    const [rooms, users] = await Promise.all([
      this.prisma.chatRoom.findMany({
        where: {
          name: { contains: name, mode: 'insensitive' },
          type: ChatType.GROUP,
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: name, mode: 'insensitive' } },
            { username: { contains: name, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Mapping data
    return {
      rooms: rooms.map(({ id, name, description }) => ({
        id,
        name,
        description,
        type: ChatType.GROUP as const,
      })),
      users: users.map(({ id, name, username }) => ({
        id,
        name,
        description: username,
        type: ChatType.USER as const,
      })),
    };
  }

  async join(userId: string, req: JoinRoomDto) {
    let room = await this.findRoom(req.roomId);
    const user = await this.findUser(userId);

    if (!room) {
      if (ChatType.GROUP === req.type) {
        throw new DomainException(DomainCode.ROOM_NOT_FOUND);
      } else {
        room = await this.prisma.chatRoom.create({
          data: {
            name: userId + '/' + req.roomId,
            description: 'Direct message group',
            participantIds: [userId, req.roomId],
            ownerId: userId,
            type: ChatType.USER,
          },
        });
      }
    }

    const alreadyInRoom = room.participantIds?.includes(userId);
    if (!alreadyInRoom) {
      await this.handleJoinRoom(room, user);
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
    };
  }

  async findRoom(roomId: string) {
    return await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        description: true,
        participantIds: true,
      },
    });
  }

  async findUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true },
    });

    if (!user) {
      throw new DomainException(DomainCode.USER_NOT_FOUND);
    }
    return user;
  }

  private async handleJoinRoom(
    room: { id: string },
    user: { id: string; name?: string | null; username?: string | null },
  ) {
    await this.prisma.chatRoom.update({
      where: { id: room.id },
      data: {
        participantIds: {
          push: user.id,
        },
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        chatRoomIds: {
          push: room.id,
        },
      },
    });

    this.chatGateway.onNotify(room.id, {
      senderId: user.id,
      type: MessageType.NOTIFY,
      username: user.username,
      content: user.username + ' have joined',
    });
  }

  async getMessages(roomId: string, timestamp: string, limit: number) {
    const parsedTimestamp = new Date(timestamp);
    if (!timestamp || Number.isNaN(parsedTimestamp.getTime())) {
      throw new DomainException(
        DomainCode.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
        {
          timestamp,
        },
      );
    }

    const take = Math.min(Math.max(limit || 0, 1), 50);

    const messages = await this.prisma.message.findMany({
      where: {
        createdAt: { lt: parsedTimestamp },
        OR: [{ chatRoomId: roomId }],
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      authorId: msg.senderId,
      type: MessageType.MESSAGE,
      username: msg.sender?.username,
      name: msg.sender?.name ?? msg.sender?.username ?? null,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));
  }
}
