import { Module } from '@nestjs/common';
import { OnboardingScene } from './onboarding/onboarding.scene';
import { CopyTradingScene } from './copytrading/copytrading.scene';
import { SignalsScene } from './signals/signals.scene';
import { GeminiModule } from '../gemini/gemini.module';
import { AdminModule } from '../admin/admin.module';
import { BotService } from '../bot/bot.service';
import { FollowUpModule } from '../follow-up/follow-up.module';

@Module({
  imports: [GeminiModule, AdminModule, FollowUpModule],
  providers: [OnboardingScene, CopyTradingScene, SignalsScene, BotService],
})
export class ScenesModule {}
