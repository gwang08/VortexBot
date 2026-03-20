import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';
import { ScenesModule } from './scenes/scenes.module';
import { GeminiModule } from './gemini/gemini.module';
import { AdminModule } from './admin/admin.module';
import { FollowUpModule } from './follow-up/follow-up.module';
import { PrismaModule } from './prisma/prisma.module';
import { prismaSessionMiddleware } from './prisma/prisma-session-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN')!,
        middlewares: [prismaSessionMiddleware()],
        launchOptions: {
          dropPendingUpdates: true,
          polling: { timeout: 5 },
        },
      }),
    }),
    BotModule,
    ScenesModule,
    GeminiModule,
    AdminModule,
    FollowUpModule,
  ],
})
export class AppModule {}
