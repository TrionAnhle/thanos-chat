// common/guards/ws-jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const client: Socket = ctx.switchToWs().getClient();
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers['authorization']
        ?.toString()
        ?.replace(/^Bearer /, '');
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET,
      ) as jwt.JwtPayload & {
        id?: string;
        username?: string;
        name?: string;
      };
      const id = payload.id;
      if (!id) throw new UnauthorizedException('Invalid token');
      (client as any).data = {
        ...(client as any).data,
        user: { id, username: payload.username, name: payload.name },
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
