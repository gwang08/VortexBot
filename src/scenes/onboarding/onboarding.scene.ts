import { Injectable, Logger } from '@nestjs/common';
import { Scene, SceneEnter, On, Action, Command } from 'nestjs-telegraf';
import type { BotContext } from '../../common/interfaces/session.interface';
import { CALLBACKS } from '../../common/constants';
import {
  capitalSelectionKeyboard,
  mainMenuRetailKeyboard,
  mainMenuSemiKeyboard,
  mainMenuVipKeyboard,
} from '../../common/keyboards';
import { GeminiService } from '../../gemini/gemini.service';
import { AdminService } from '../../admin/admin.service';
import { BotService } from '../../bot/bot.service';
import { PrismaService } from '../../prisma/prisma.service';

@Scene('onboarding')
export class OnboardingScene {
  private readonly logger = new Logger(OnboardingScene.name);

  constructor(
    private geminiService: GeminiService,
    private adminService: AdminService,
    private botService: BotService,
    private prisma: PrismaService,
  ) {}

  @Command('start')
  async onRestart(ctx: BotContext) {
    await ctx.scene.leave();
    ctx.session.capitalRange = undefined;
    ctx.session.selectedFlow = undefined;
    ctx.session.email = undefined;
    ctx.session.awaitingEmail = false;
    ctx.session.awaitingAccount = false;
    ctx.session.currentStep = undefined;
    ctx.session.tier = undefined;
    await ctx.scene.enter('onboarding');
  }

  @SceneEnter()
  async onEnter(ctx: BotContext) {
    ctx.session.currentStep = 'onboarding:capital_selection';
    const displayName = this.botService.getDisplayName(ctx);
    const text = `Welcome to BMR Scalper Gold AI System, ${displayName}!\n\nHow much capital do you plan to start with?`;
    await ctx.reply(text, capitalSelectionKeyboard());
  }

  // Capital selection handlers
  @Action(CALLBACKS.capital100_500)
  async onCapital100(ctx: BotContext) { await this.handleCapitalSelection(ctx, '100-500', 'retail'); }

  @Action(CALLBACKS.capital500_2000)
  async onCapital500(ctx: BotContext) { await this.handleCapitalSelection(ctx, '500-2000', 'retail'); }

  @Action(CALLBACKS.capital2000_5000)
  async onCapital2000(ctx: BotContext) { await this.handleCapitalSelection(ctx, '2000-5000', 'semi'); }

  @Action(CALLBACKS.capital5000_10000)
  async onCapital5000(ctx: BotContext) { await this.handleCapitalSelection(ctx, '5000-10000', 'vip'); }

  @Action(CALLBACKS.capital10000plus)
  async onCapital10000(ctx: BotContext) { await this.handleCapitalSelection(ctx, '10000+', 'vip'); }

  private async handleCapitalSelection(ctx: BotContext, capitalRange: string, tier: string) {
    await ctx.answerCbQuery();

    const isVip = tier === 'vip';
    const userId = BigInt(ctx.from!.id);

    await this.prisma.user.update({
      where: { id: userId },
      data: { capitalRange, tier, isVip, status: 'new' },
    }).catch((e) => this.logger.warn(`User update failed: ${e.message}`));

    ctx.session.capitalRange = capitalRange;
    ctx.session.tier = tier;
    ctx.session.isVip = isVip;
    ctx.session.currentStep = 'onboarding:main_menu';

    await this.sendTierMessage(ctx, tier);
  }

  private async sendTierMessage(ctx: BotContext, tier: string) {
    if (tier === 'retail') {
      const text = `Great choice!\n\n3 simple steps to get started:\n1. Create account\n2. Deposit\n3. Enable copy trading\n\nNo trading experience needed. Start from $100.\n\nSo what services you wanna do with us?`;
      await ctx.reply(text, mainMenuRetailKeyboard());
    } else if (tier === 'semi') {
      const text = `You qualify for priority setup.\n\n✔ Guided account configuration\n✔ Risk optimization for your capital\n✔ Direct support access\n\nLet's get you started.`;
      await ctx.reply(text, mainMenuSemiKeyboard());
    } else {
      const text = `🔥 VIP Access Unlocked\n\nYou will receive:\n✔ Personalized risk setup\n✔ Capital protection strategy\n✔ Priority 1-on-1 support\n\n👉 Contact now: @Vitaperry`;
      await ctx.reply(text, mainMenuVipKeyboard());
    }
  }

  @Action(CALLBACKS.copytrading)
  async onCopyTrading(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.selectedFlow = 'copytrading';
    await this.prisma.user.update({
      where: { id: BigInt(ctx.from!.id) },
      data: { flow: 'copytrading' },
    }).catch((e) => this.logger.warn(`User update failed: ${e.message}`));
    await ctx.scene.enter('copytrading');
  }

  @Action(CALLBACKS.signals)
  async onSignals(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.selectedFlow = 'signals';
    await this.prisma.user.update({
      where: { id: BigInt(ctx.from!.id) },
      data: { flow: 'signals' },
    }).catch((e) => this.logger.warn(`User update failed: ${e.message}`));
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

  @On('text')
  async onText(ctx: BotContext) {
    const message = (ctx.message as any)?.text;
    if (!message || !ctx.from) return;

    // User in AI chat mode
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

    // User typed free text at button step -> forward to admin
    const displayName = this.botService.getDisplayName(ctx);
    await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
    await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
  }
}
