import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatEvents } from 'src/modules/chat/dtos/events';

@Catch(WsException)
export class SocketExceptionFilter implements WsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    const error = exception.getError();
    const message = typeof error === 'string' ? error : (error as any).message;

    client.emit(ChatEvents.ERROR, {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
