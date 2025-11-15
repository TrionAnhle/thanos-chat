import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { DomainException } from 'src/common/filter/domain.exception';
import { DomainCode } from 'src/common/filter/domain.code';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async getChatRecent(id: string) {
    return await this.chatService.findLatestMessages(id);
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
