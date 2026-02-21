import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log queries in development
    if (process.env['NODE_ENV'] === 'development' || process.env['LOG_QUERIES'] === 'true') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (e: { timestamp: Date; query: string; params: string; duration: number; target: string }) => {
        this.logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
      });
    }

    // Log errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$on('error', (e: { timestamp: Date; message: string; target: string }) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    // Log warnings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$on('warn', (e: { timestamp: Date; message: string; target: string }) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
