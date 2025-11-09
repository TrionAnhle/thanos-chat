import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { DomainException } from 'src/common/filter/domain.exception';
import { DomainCode } from 'src/common/filter/domain.code';
import { ChatGateway } from '../chat/chat.gateway';
import { MessageType } from '../chat/dtos/message-type';

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

    return await this.prisma.chatRoom.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      select: { id: true, name: true, description: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async join(userId: string, req: JoinRoomDto) {
    const room = await this.findRoom(req.roomId);
    const user = await this.findUser(userId);
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
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        description: true,
        participantIds: true,
      },
    });

    if (!room) {
      throw new DomainException(DomainCode.ROOM_NOT_FOUND);
    }
    return room;
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
      content: user.username + ' vừa tham gia nhóm',
    });
  }
}
