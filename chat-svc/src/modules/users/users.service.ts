import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { DomainException } from 'src/common/filter/domain.exception';
import { DomainCode } from 'src/common/filter/domain.code';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        chatRoomIds: [],
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new DomainException(
        DomainCode.USER_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }

    const roomIds = user.chatRoomIds ?? [];
    const rooms = roomIds.length
      ? await this.prisma.chatRoom.findMany({
          where: { id: { in: roomIds } },
          select: {
            id: true,
            name: true,
            description: true,
          },
        })
      : [];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      rooms,
    };
  }

  findOneByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }
}
