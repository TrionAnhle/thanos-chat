import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ChatModule } from './modules/chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
  imports: [PrismaModule, UsersModule, ChatModule, AuthModule, RoomsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
