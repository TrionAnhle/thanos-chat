import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const datasourceUrl = process.env.DATABASE_URL;
    if (!datasourceUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    super({ datasourceUrl });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
