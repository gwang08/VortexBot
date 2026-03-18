import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LocalSession = require('telegraf-session-local');
import { BotModule } from './bot/bot.module';
import { ScenesModule } from './scenes/scenes.module';
import { GeminiModule } from './gemini/gemini.module';
import { AdminModule } from './admin/admin.module';

const localSession = new LocalSession({
  database: 'sessions.json',
  property: 'session',
  storage: LocalSession.storageFileAsync,
  format: {
    serialize: (obj: any) => JSON.stringify(obj, null, 2),
    deserialize: (str: string) => JSON.parse(str),
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN')!,
        middlewares: [localSession.middleware()],
      }),
    }),
    BotModule,
    ScenesModule,
    GeminiModule,
    AdminModule,
  ],
})
export class AppModule {}
