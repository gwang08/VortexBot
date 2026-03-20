import { Scene, SceneEnter, On, Action, Command } from 'nestjs-telegraf';
import type { BotContext } from '../../common/interfaces/session.interface';
import { CALLBACKS } from '../../common/constants';
import { mainMenuVipKeyboard, mainMenuStandardKeyboard } from '../../common/keyboards';
import { GeminiService } from '../../gemini/gemini.service';
import { AdminService } from '../../admin/admin.service';
import { BotService } from '../../bot/bot.service';
import { FollowUpService } from '../../follow-up/follow-up.service';
import { PrismaService } from '../../prisma/prisma.service';

@Scene('onboarding')
export class OnboardingScene {
  constructor(
    private geminiService: GeminiService,
    private adminService: AdminService,
    private botService: BotService,
    private followUpService: FollowUpService,
    private prisma: PrismaService,
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

    await ctx.reply('Hello first of all, how much profit you wanna generate each month with BMR AI Trading? (In dollars)');
  }

  @On('text')
  async onText(ctx: BotContext) {
    const message = (ctx.message as any)?.text;
    if (!message) return;

    if (ctx.session.awaitingProfitTarget) {
      const amount = parseFloat(message.replace(/[^0-9.]/g, ''));

      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Please enter a valid dollar amount (e.g. 1000, 5000)');
        return;
      }

      ctx.session.profitTarget = amount;
      ctx.session.awaitingProfitTarget = false;
      ctx.session.currentStep = 'onboarding:main_menu';

      // Calculate deposit and determine VIP status (deposit >= $5k)
      const minDeposit = Math.round(amount / 0.8);
      ctx.session.isVip = minDeposit >= 5000;

      const recommendation = await this.geminiService.generateDepositRecommendation(
        amount,
        this.botService.getDisplayName(ctx),
        ctx.session.isVip,
      );
      const keyboard = ctx.session.isVip ? mainMenuVipKeyboard() : mainMenuStandardKeyboard();
      await this.botService.sendWithKeyboard(ctx, recommendation, keyboard);

      // Persist profitTarget and isVip to User record
      if (ctx.from) {
        await this.prisma.user.update({
          where: { id: BigInt(ctx.from.id) },
          data: { profitTarget: amount, isVip: ctx.session.isVip ?? false },
        }).catch(() => {
          // User may not exist yet (e.g. session resumed without /start)
        });
      }

      if (!ctx.session.isVip) {
        await this.followUpService.addUser(ctx.from!.id);
      }
      return;
    }

    // User in AI chat mode → respond with Gemini
    if (ctx.session.inAiChat) {
      if (message === '/human') {
        ctx.session.inAiChat = false;
        await this.adminService.notifyAdmin(ctx.from!.id, ctx.from?.username, ctx.from?.first_name);
        await ctx.reply("✅ You've been connected to a human agent. We'll get back to you shortly!");
        return;
      }
      const response = await this.geminiService.chatSupport(message, this.botService.getDisplayName(ctx));
      await ctx.reply(response);
      return;
    }

    // User typed free text at button step → forward to admin
    const displayName = this.botService.getDisplayName(ctx);
    await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
    await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
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
    await this.adminService.notifyAdmin(ctx.from!.id, ctx.from?.username, ctx.from?.first_name);
    await ctx.reply("Thanks! An admin has been notified. We'll get back to you here.");
  }

  @Action(CALLBACKS.vipSupport)
  async onVipSupport(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.adminService.notifyAdmin(ctx.from!.id, ctx.from?.username, ctx.from?.first_name);
    await ctx.reply(
      '💎 VIP Support\n\nYou\'ve been assigned a dedicated account manager.\n\n👤 Contact: @Vitaperry for personalized 1-on-1 assistance!',
    );
  }

  @Action(CALLBACKS.aiSupport)
  async onAiSupport(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.inAiChat = true;
    await ctx.reply(
      '💬 AI Support\n\nHi! I\'m BMR Trading\'s AI assistant. Ask me anything about:\n\n• CopyTrading & Signals\n• PU Prime account setup\n• Deposits & withdrawals\n• Trading basics\n\nType /human anytime to talk to a real person.',
    );
  }
}
