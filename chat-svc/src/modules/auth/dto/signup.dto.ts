import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignupAuthDto {
  @IsEmail() email: string;
  @IsNotEmpty() name: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() username: string;
}
