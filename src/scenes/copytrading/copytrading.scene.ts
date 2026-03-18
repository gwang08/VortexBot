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
import { GeminiService } from '../../gemini/gemini.service';
import { AdminService } from '../../admin/admin.service';
import { BotService } from '../../bot/bot.service';

@Scene('copytrading')
export class CopyTradingScene {
  constructor(
    private geminiService: GeminiService,
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

    const text = await this.geminiService.generateResponse({
      currentStep: 'CopyTrading Step 1 - Create PuPrime Account',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: `First STEP:\n\n${ACCOUNT_CREATION_TEXT}`,
    });
    await this.botService.sendWithKeyboard(ctx, text, ctStep1Keyboard());
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

    const text = await this.geminiService.generateResponse({
      currentStep: 'CopyTrading - IB Transfer, asking for email',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: `My IB Code: ${IB_CODE}\n\nAfter transfer code done, send me your email you use for create account so I can push it for you thanks`,
    });
    await this.botService.sendWithKeyboard(ctx, text, ctIbKeyboard());
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

    const text = await this.geminiService.generateResponse({
      currentStep: 'CopyTrading Step 2 - Open Copy Trading Account',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: `Next STEP 2:\n\n2.1 Download PU PRIME App\n\n2.2 Open the PU Prime app and log in to your account. Then select "Account ID" to view your existing accounts.\n\n2.3 Select "New Live Account" → Platform: "Copy Trading", Account Type: "Standard", Currency: "USD" → Accept terms → Submit.\n\n2.4 After submitting, select "Agree" and contact Support to expedite the approval. You'll get a confirmation email within one business day.\n\nAre you ready for next step?`,
    });
    await this.botService.sendWithKeyboard(ctx, text, ctStep2Keyboard());
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

    const text = await this.geminiService.generateResponse({
      currentStep: 'CopyTrading Step 3 - Transfer Funds',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: `Next STEP 3:\n\nTransfer Funds to Copy Trading Account\n\nAfter your Copy Trading account is approved, go to your Live account with available balance and transfer funds to the new Copy Trading account to start copy trading.\n\n${DEPOSIT_VIDEO_GUIDE_TEXT}\n\nAre you ready for next step?`,
    });
    await this.botService.sendWithKeyboard(ctx, text, ctStep3Keyboard());
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

    const text = await this.geminiService.generateResponse({
      currentStep: 'CopyTrading Step 4 - Find Master Traders',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: `You will see Master "Red Bull X" & master "BMR Scalper xxx" in the Top Highest annual return. Select "View" to see details and start copying.\n\nReview details: Return YTD (213753%), Copiers (1859), Profit Sharing (30%).\n\nAre you ready for next step?`,
    });
    await this.botService.sendWithKeyboard(ctx, text, ctStep4Keyboard());
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

    const text = await this.geminiService.generateResponse({
      currentStep: 'CopyTrading Final Step - Configure Copy Settings',
      userName: this.botService.getDisplayName(ctx),
      profitTarget: ctx.session.profitTarget,
      templateText: `FINAL STEP:\n\nConfigure and Start Copying\n\nSelect Copy Mode as "Equivalent Used Margin", enter your investment amount, set Risk Management at 95% as recommended by the master, turn off Lot Rounding, and click Submit to start copy trading.\n\n🎉 Congratulations! You're all set. If you need any help, feel free to contact our admin.`,
    });
    await ctx.reply(text, { link_preview_options: { is_disabled: true } });
  }

  @Action(CALLBACKS.contactAdmin)
  async onContactAdmin(ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.adminService.notifyAdmin(ctx.from!.id, ctx.from?.username, ctx.from?.first_name);

    const text = await this.geminiService.generateResponse({
      currentStep: 'Contact admin from CopyTrading flow',
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
          'CopyTrading IB Transfer',
        );

        const text = await this.geminiService.generateResponse({
          currentStep: 'Email received in CopyTrading IB flow',
          userName: this.botService.getDisplayName(ctx),
          templateText: `✅ Thank you for receiving your email: ${email}\n\nWe'll process your IB transfer shortly. An admin will reach out to you if needed.`,
        });
        await ctx.reply(text);
        return;
      }
    }

    const actions =
      ctx.session.currentStep === 'copytrading:step1'
        ? ['Already have Pu Prime', 'Next Step 2', 'Contact Admin']
        : ['Use the buttons above to continue'];

    const response = await this.geminiService.handleFreeText({
      userMessage: message,
      currentStep: ctx.session.currentStep || 'CopyTrading flow',
      userName: this.botService.getDisplayName(ctx),
      availableActions: actions,
    });
    await ctx.reply(response);
  }
}
