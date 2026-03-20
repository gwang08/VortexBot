import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Standalone client - used before NestJS DI boots (Telegraf middleware registration)
// Prisma 7: requires driver adapter for PostgreSQL
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Telegraf session middleware backed by PostgreSQL via Prisma.
 * Replaces telegraf-session-local. Key format: "{chatId}:{chatId}".
 */
export function prismaSessionMiddleware() {
  return async (ctx: any, next: () => Promise<void>) => {
    const chatId = ctx.chat?.id ?? ctx.from?.id;
    if (!chatId) return next();

    const key = `${chatId}:${chatId}`;

    // Load session from DB
    const record = await prisma.session.findUnique({ where: { id: key } });
    ctx.session = record?.data ?? {};

    await next();

    // Persist session back to DB
    await prisma.session.upsert({
      where: { id: key },
      update: { data: ctx.session as any },
      create: { id: key, data: ctx.session as any },
    });
  };
}
