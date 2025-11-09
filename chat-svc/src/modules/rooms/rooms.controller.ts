import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt/jwt-auth.guard';
import { JoinRoomDto } from './dto/join-room.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // Manage room
  @Post()
  create(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomsService.create(req.user.id, createRoomDto);
  }

  @Get()
  search(@Query('name') name: string) {
    return this.roomsService.search(name);
  }

  @Post('join')
  join(@Body() joinRoomDto: JoinRoomDto, @Request() req) {
    return this.roomsService.join(req.user.id, joinRoomDto);
  }
}
