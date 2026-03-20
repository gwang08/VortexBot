import { Scene, SceneEnter, Action, On, Command } from 'nestjs-telegraf';
import type { BotContext } from '../../common/interfaces/session.interface';
import {
  CALLBACKS,
  ACCOUNT_CREATION_TEXT,
  IB_CODE,
  DEPOSIT_VIDEO_GUIDE_TEXT,
} from '../../common/constants';
import {
  ctStep1Keyboard,
  ctIbKeyboard,
  ctStep2Keyboard,
  ctStep3Keyboard,
  ctStep4Keyboard,
} from '../../common/keyboards';
import {
  ctIbMobileMedia,
  ctIbWebMedia,
  ctStep2Media,
  ctStep3Media,
  ctStep4Media,
  ctFinalMedia,
} from '../../common/media';
import { AdminService } from '../../admin/admin.service';
import { BotService } from '../../bot/bot.service';

@Scene('copytrading')
export class CopyTradingScene {
  constructor(
    private adminService: AdminService,
    private botService: BotService,
  ) {}

  // Allow switching to Signals from old button clicks
  @Action(CALLBACKS.signals)
  async onSwitchToSignals(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.selectedFlow = 'signals';
    await ctx.scene.enter('signals');
  }

  // Allow switching to CopyTrading (re-enter from old buttons)
  @Action(CALLBACKS.copytrading)
  async onSwitchToCopyTrading(ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('copytrading');
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
    ctx.session.currentStep = 'copytrading:step1';
    ctx.session.awaitingEmail = false;

    await this.botService.sendWithKeyboard(ctx, `STEP 1:\n\n${ACCOUNT_CREATION_TEXT}`, ctStep1Keyboard());
  }

  @Action(CALLBACKS.alreadyHavePuPrime)
  async onAlreadyHavePuPrime(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.currentStep = 'copytrading:ib_transfer';
    ctx.session.awaitingEmail = true;

    try {
      await this.botService.sendMediaGroup(ctx, ctIbMobileMedia());
    } catch {
      await ctx.reply('⚡️ STEP TO TRANSFER SUPPORT CODE IN MOBILE\n(Please check the guide images)');
    }

    try {
      await this.botService.sendMediaGroup(ctx, ctIbWebMedia());
    } catch {
      await ctx.reply('⚡️ STEP TO TRANSFER SUPPORT CODE IN WEB\n(Please check the guide images)');
    }

    await this.botService.sendWithKeyboard(ctx, `My IB Code: ${IB_CODE}\n\nAfter transfer code done, send me your email you use for create account so I can push it for you thanks`, ctIbKeyboard());
  }

  @Action(CALLBACKS.ctNextStep2)
  async onStep2(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.currentStep = 'copytrading:step2';

    try {
      await this.botService.sendMediaGroup(ctx, ctStep2Media());
    } catch {
      await ctx.reply('(Guide images for Step 2)');
    }

    await this.botService.sendWithKeyboard(ctx, `STEP 2:\n\n2.1 Download PU PRIME App\n\n2.2 Open the PU Prime app and log in. Select "Account ID" to view existing accounts.\n\n2.3 Select "New Live Account" → Platform: "Copy Trading", Type: "Standard", Currency: "USD" → Accept terms → Submit.\n\n2.4 Select "Agree" and contact Support to expedite approval. Confirmation email within one business day.\n\nAre you ready for next step?`, ctStep2Keyboard());
  }

  @Action(CALLBACKS.ctNextStep3)
  async onStep3(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.currentStep = 'copytrading:step3';

    try {
      await this.botService.sendMediaGroup(ctx, ctStep3Media());
    } catch {
      await ctx.reply('(Guide images for Step 3)');
    }

    await this.botService.sendWithKeyboard(ctx, `STEP 3:\n\nTransfer Funds to Copy Trading Account\n\nAfter your Copy Trading account is approved, go to your Live account and transfer funds to the Copy Trading account.\n\n${DEPOSIT_VIDEO_GUIDE_TEXT}\n\nAre you ready for next step?`, ctStep3Keyboard());
  }

  @Action(CALLBACKS.ctNextStep4)
  async onStep4(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.currentStep = 'copytrading:step4';

    try {
      await this.botService.sendMediaGroup(ctx, ctStep4Media());
    } catch {
      await ctx.reply('(Guide images for Step 4)');
    }

    await this.botService.sendWithKeyboard(ctx, `STEP 4:\n\nYou will see Master "Red Bull X" & "BMR Scalper" in Top Highest Annual Return. Select "View" to see details.\n\nReturn YTD: 213753%\nCopiers: 1859\nProfit Sharing: 30%\n\nAre you ready for the final step?`, ctStep4Keyboard());
  }

  @Action(CALLBACKS.ctFinalStep)
  async onFinalStep(ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.currentStep = 'copytrading:final';

    try {
      await this.botService.sendMediaGroup(ctx, ctFinalMedia());
    } catch {
      await ctx.reply('(Guide images for Final Step)');
    }

    await ctx.reply(`FINAL STEP:\n\nConfigure and Start Copying\n\nCopy Mode: "Equivalent Used Margin"\nInvestment: Enter your amount\nRisk Management: 95% (recommended)\nLot Rounding: OFF\n\nClick Submit to start copy trading.\n\n🎉 Congratulations! You're all set. If you need any help, feel free to contact our admin.`, { link_preview_options: { is_disabled: true } });
  }

  @Action(CALLBACKS.contactAdmin)
  async onContactAdmin(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.adminService.notifyAdmin(ctx.from!.id, ctx.from?.username, ctx.from?.first_name);
    await ctx.reply("Thanks! An admin has been notified. We'll get back to you here.");
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
          'CopyTrading IB Transfer',
        );

        await ctx.reply(`✅ Thank you! Email received: ${email}\n\nWe'll process your IB transfer shortly. An admin will reach out to you if needed.`);
        return;
      }
    }

    // User typed free text at button step → forward to admin
    const displayName = this.botService.getDisplayName(ctx);
    await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
    await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
  }
}
