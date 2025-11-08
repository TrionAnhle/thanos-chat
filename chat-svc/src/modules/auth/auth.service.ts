import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupAuthDto } from './dto/signup.dto';
import { SigninAuthDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signin(req: SigninAuthDto) {
    const user = await this.usersService.findOneByUsername(req.username);
    if (!user || !(await bcrypt.compare(req.password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(req: SignupAuthDto) {
    const existingUser = await this.usersService.findOneByUsername(
      req.username,
    );
    if (existingUser) {
      throw new Error('Username already exists');
    }
    const user = await this.usersService.create(req);
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
