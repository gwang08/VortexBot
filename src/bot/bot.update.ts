import { Update, Start, On, Ctx, Command } from 'nestjs-telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { GeminiService } from '../gemini/gemini.service';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  constructor(
    private geminiService: GeminiService,
    private botService: BotService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    // Leave current scene if any
    try {
      await ctx.scene.leave();
    } catch {}

    // Reset session
    ctx.session.profitTarget = undefined;
    ctx.session.selectedFlow = undefined;
    ctx.session.email = undefined;
    ctx.session.awaitingEmail = false;
    ctx.session.awaitingProfitTarget = false;
    ctx.session.currentStep = undefined;

    await ctx.scene.enter('onboarding');
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = (ctx.message as any)?.text;
    if (!message) return;

    const response = await this.geminiService.handleFreeText({
      userMessage: message,
      currentStep: 'No active flow - user should /start',
      userName: this.botService.getDisplayName(ctx),
      availableActions: ['Type /start to begin'],
    });
    await ctx.reply(response);
  }
}
