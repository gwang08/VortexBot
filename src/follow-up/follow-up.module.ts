import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { FollowUpService } from './follow-up.service';

@Module({
  imports: [TelegrafModule],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
