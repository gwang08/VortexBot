import { Scene, SceneEnter, Action, On, Command } from 'nestjs-telegraf';
import type { BotContext } from '../../common/interfaces/session.interface';
import {
  CALLBACKS,
  ACCOUNT_CREATION_TEXT,
  DEPOSIT_VIDEO_GUIDE_TEXT,
} from '../../common/constants';
import { sigStep1Keyboard, sigStep2Keyboard } from '../../common/keyboards';
import { GeminiService } from '../../gemini/gemini.service';
import { AdminService } from '../../admin/admin.service';
import { BotService } from '../../bot/bot.service';

@Scene('signals')
export class SignalsScene {
  constructor(
    private geminiService: GeminiService,
    private adminService: AdminService,
    private botService: BotService,
  ) {}

  // Allow switching to CopyTrading from old button clicks
  @Action(CALLBACKS.copytrading)
  async onSwitchToCopyTrading(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.selectedFlow = 'copytrading';
    await ctx.scene.enter('copytrading');
  }

  // Allow switching to Signals (re-enter from old buttons)
  @Action(CALLBACKS.signals)
  async onSwitchToSignals(ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('signals');
  }

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
    ctx.session.currentStep = 'signals:step1';
    ctx.session.awaitingEmail = false;

    const text = await this.geminiService.generateResponse({
      currentStep: 'Signals Step 1 - Create PuPrime Account',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: ACCOUNT_CREATION_TEXT,
    });
    await this.botService.sendWithKeyboard(ctx, text, sigStep1Keyboard());
  }

  @Action(CALLBACKS.sigCreatedAccount)
  async onCreatedAccount(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.showDepositStep(ctx);
  }

  @Action(CALLBACKS.sigAlreadyHaveAccount)
  async onAlreadyHaveAccount(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.showDepositStep(ctx);
  }

  private async showDepositStep(ctx: BotContext) {
    ctx.session.currentStep = 'signals:step2_deposit';

    const text = await this.geminiService.generateResponse({
      currentStep: 'Signals Step 2 - Deposit Funds',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: 'Deposit the funds you wanna Trade (min 300u to join our community)',
    });
    await this.botService.sendWithKeyboard(ctx, text, sigStep2Keyboard());
  }

  @Action(CALLBACKS.sigVideoGuide)
  async onVideoGuide(ctx: BotContext) {
    await ctx.answerCbQuery();

    const text = await this.geminiService.generateResponse({
      currentStep: 'Signals - Deposit Video Guide',
      userName: this.botService.getDisplayName(ctx),
      templateText: DEPOSIT_VIDEO_GUIDE_TEXT,
    });
    await this.botService.sendWithKeyboard(ctx, text, sigStep2Keyboard());
  }

  @Action(CALLBACKS.sigDepositedDone)
  async onDepositedDone(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.currentStep = 'signals:step3_email';
    ctx.session.awaitingEmail = true;

    const text = await this.geminiService.generateResponse({
      currentStep: 'Signals Step 3 - Collect Email',
      userName: this.botService.getDisplayName(ctx),
      templateText: 'Pls send me the email you use for create account, so I can check your account status',
    });
    await ctx.reply(text);
  }

  @Action(CALLBACKS.contactAdmin)
  async onContactAdmin(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.adminService.notifyAdmin(ctx.from!.id, ctx.from?.username, ctx.from?.first_name);

    const text = await this.geminiService.generateResponse({
      currentStep: 'Contact admin from Signals flow',
      userName: this.botService.getDisplayName(ctx),
      templateText: "Thanks! An admin has been notified. We'll get back to you here.",
    });
    await ctx.reply(text);
  }

  @On('text')
  async onText(ctx: BotContext) {
    const message = (ctx.message as any)?.text;
    if (!message) return;

    if (ctx.session.awaitingEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailMatch = message.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);

      if (emailMatch && emailRegex.test(emailMatch[0])) {
        const email = emailMatch[0];
        ctx.session.email = email;
        ctx.session.awaitingEmail = false;

        await this.adminService.notifyAdminEmail(
          ctx.from!.id,
          ctx.from?.username || ctx.from?.first_name || '',
          email,
          'Signals',
        );

        const text = await this.geminiService.generateResponse({
          currentStep: 'Signals - Email received',
          userName: this.botService.getDisplayName(ctx),
          templateText: `✅ Thank you for receiving your email: ${email}`,
        });
        await ctx.reply(text);
        return;
      }

      const response = await this.geminiService.handleFreeText({
        userMessage: message,
        currentStep: 'Waiting for email address',
        userName: this.botService.getDisplayName(ctx),
        availableActions: ['Type your email address (e.g. name@example.com)'],
      });
      await ctx.reply(response);
      return;
    }

    // User typed free text at button step → forward to admin
    const displayName = this.botService.getDisplayName(ctx);
    await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
    await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
  }
}
