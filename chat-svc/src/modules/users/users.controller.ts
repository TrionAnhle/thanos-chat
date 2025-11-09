import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';

import { JwtAuthGuard } from 'src/common/guards/jwt/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    // req.user is populated by the JwtStrategy
    return this.usersService.findOne(req.user.id);
  }
}
