import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  providers: [BotUpdate, BotService],
  exports: [BotService],
})
export class BotModule {}
