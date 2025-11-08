import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninAuthDto } from './dto/signin.dto';
import { SignupAuthDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  async signin(@Body() req: SigninAuthDto) {
    return this.authService.signin(req);
  }

  @Post('signup')
  async login(@Body() req: SignupAuthDto) {
    return this.authService.signup(req);
  }
}
