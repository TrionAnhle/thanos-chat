import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { RedisIoAdapter } from './common/adapter/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis(
    process.env.REDIS_HOST || 'redis',
    +(process.env.REDIS_PORT || 6379),
  );
  app.useWebSocketAdapter(redisAdapter);

  await app.listen(3000);
}
bootstrap();
