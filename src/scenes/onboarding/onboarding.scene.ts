import { Scene, SceneEnter, On, Action, Command } from 'nestjs-telegraf';
import type { BotContext } from '../../common/interfaces/session.interface';
import { CALLBACKS } from '../../common/constants';
import { mainMenuKeyboard } from '../../common/keyboards';
import { GeminiService } from '../../gemini/gemini.service';
import { AdminService } from '../../admin/admin.service';
import { BotService } from '../../bot/bot.service';

@Scene('onboarding')
export class OnboardingScene {
  constructor(
    private geminiService: GeminiService,
    private adminService: AdminService,
    private botService: BotService,
  ) {}

  @Command('start')
  async onRestart(ctx: BotContext) {
    await ctx.scene.leave();
    ctx.session.profitTarget = undefined;
    ctx.session.selectedFlow = undefined;
    ctx.session.email = undefined;
    ctx.session.awaitingEmail = false;
    ctx.session.awaitingProfitTarget = false;
    ctx.session.currentStep = undefined;
    await ctx.scene.enter('onboarding');
  }

  @SceneEnter()
  async onEnter(ctx: BotContext) {
    ctx.session.awaitingProfitTarget = true;
    ctx.session.currentStep = 'onboarding:profit_question';

    const text = await this.geminiService.generateResponse({
      currentStep: 'Welcome - asking profit target',
      userName: this.botService.getDisplayName(ctx),
      templateText:
        'Hello first of all, how much profit you wanna generate each month with BMR AI Trading ? (In dollars)',
    });
    await ctx.reply(text);
  }

  @On('text')
  async onText(ctx: BotContext) {
    const message = (ctx.message as any)?.text;
    if (!message) return;

    if (ctx.session.awaitingProfitTarget) {
      const amount = parseFloat(message.replace(/[^0-9.]/g, ''));

      if (isNaN(amount) || amount <= 0) {
        const response = await this.geminiService.handleFreeText({
          userMessage: message,
          currentStep: 'Waiting for profit target amount',
          userName: this.botService.getDisplayName(ctx),
          availableActions: ['Type a dollar amount (e.g. 1000, 5000)'],
        });
        await ctx.reply(response);
        return;
      }

      ctx.session.profitTarget = amount;
      ctx.session.awaitingProfitTarget = false;
      ctx.session.currentStep = 'onboarding:main_menu';

      const recommendation = await this.geminiService.generateDepositRecommendation(
        amount,
        this.botService.getDisplayName(ctx),
      );
      await this.botService.sendWithKeyboard(ctx, recommendation, mainMenuKeyboard());
      return;
    }

    const response = await this.geminiService.handleFreeText({
      userMessage: message,
      currentStep: 'Main menu - choosing between CopyTrading, Signals, or Contact Admin',
      userName: this.botService.getDisplayName(ctx),
      availableActions: ['CopyTrading', 'Signals', 'Contact Admin'],
    });
    await ctx.reply(response);
  }

  @Action(CALLBACKS.copytrading)
  async onCopyTrading(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.selectedFlow = 'copytrading';
    await ctx.scene.enter('copytrading');
  }

  @Action(CALLBACKS.signals)
  async onSignals(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.selectedFlow = 'signals';
    await ctx.scene.enter('signals');
  }

  @Action(CALLBACKS.contactAdmin)
  async onContactAdmin(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.adminService.notifyAdmin(
      ctx.from!.id,
      ctx.from?.username,
      ctx.from?.first_name,
    );

    const text = await this.geminiService.generateResponse({
      currentStep: 'Contact admin confirmation',
      userName: this.botService.getDisplayName(ctx),
      templateText: "Thanks! An admin has been notified. We'll get back to you here.",
    });
    await ctx.reply(text);
  }
}
