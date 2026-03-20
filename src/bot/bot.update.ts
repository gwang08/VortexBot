import { Update, Start, Use, Ctx, Command } from 'nestjs-telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { BotService } from './bot.service';
import { AdminService } from '../admin/admin.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { ConfigService } from '@nestjs/config';

@Update()
export class BotUpdate {
  private readonly botUsername: string;

  constructor(
    private botService: BotService,
    private adminService: AdminService,
    private googleSheetsService: GoogleSheetsService,
    private configService: ConfigService,
  ) {
    this.botUsername = '';
  }

  /**
   * Middleware runs BEFORE scenes - intercepts admin replies
   * and user free-text messages before scene handlers catch them.
   */
  @Use()
  async middleware(@Ctx() ctx: BotContext, next: () => Promise<void>) {
    const message = (ctx.message as any)?.text;
    const chatId = ctx.chat?.id;

    const callNext = typeof next === 'function' ? next : () => Promise.resolve();

    // Only intercept text messages
    if (!message || !chatId) {
      return callNext();
    }

    // Let /start and other commands pass through
    if (message.startsWith('/')) {
      return callNext();
    }

    // Admin typing source name for /newlink
    if (this.adminService.isAdmin(chatId) && ctx.session?.awaitingLinkSource) {
      ctx.session.awaitingLinkSource = false;
      const source = message.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!source) {
        await ctx.reply('⚠️ Invalid source name. Use only letters, numbers, _ and -');
        return;
      }
      await this.sendTrackingLink(ctx, source);
      return;
    }

    // Admin replying to a forwarded user message
    if (this.adminService.isAdmin(chatId)) {
      const replyTo = (ctx.message as any)?.reply_to_message?.text;
      if (!replyTo) {
        await ctx.reply('↩️ Reply to a user message to respond.');
        return;
      }

      const userId = this.adminService.extractUserIdFromMessage(replyTo);
      if (!userId) {
        await ctx.reply('⚠️ Could not find user ID in the replied message.');
        return;
      }

      const sent = await this.adminService.sendReplyToUser(userId, message);
      await ctx.reply(sent ? '✅ Sent.' : '❌ Failed to send.');
      return;
    }

    // User replying to a bot message → forward to admin as live chat
    const replyToBot = (ctx.message as any)?.reply_to_message;
    if (replyToBot && replyToBot.from?.is_bot) {
      const displayName = this.botService.getDisplayName(ctx);
      await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
      await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
      return;
    }

    // User is actively inputting text (email/profit) → let scene handle it
    if (ctx.session?.awaitingEmail || ctx.session?.awaitingProfitTarget) {
      return callNext();
    }

    // All other free-text (in scene or not) → forward to admin
    const displayName = this.botService.getDisplayName(ctx);
    await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
    await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    try {
      await ctx.scene.leave();
    } catch {}

    ctx.session.profitTarget = undefined;
    ctx.session.selectedFlow = undefined;
    ctx.session.email = undefined;
    ctx.session.awaitingEmail = false;
    ctx.session.awaitingProfitTarget = false;
    ctx.session.currentStep = undefined;

    // Extract deep link source from /start ref_<source>
    const startPayload = (ctx.message as any)?.text?.split(' ')[1] ?? '';
    const source = startPayload.startsWith('ref_') ? startPayload.slice(4) : '';

    if (source) {
      const displayName = this.botService.getDisplayName(ctx);
      await this.googleSheetsService.appendRow({
        userId: ctx.from!.id,
        username: displayName,
        flow: 'General',
        action: 'Start',
        source,
      });
    }

    await ctx.scene.enter('onboarding');
  }

  /** Admin command to generate tracking links */
  @Command('newlink')
  async onNewLink(@Ctx() ctx: BotContext) {
    const chatId = ctx.chat?.id;
    if (!chatId || !this.adminService.isAdmin(chatId)) return;

    const args = (ctx.message as any)?.text?.split(' ').slice(1).join('_');

    if (!args) {
      ctx.session.awaitingLinkSource = true;
      await ctx.reply('📎 Enter a source name for the tracking link (e.g. forex_vn, gold_trading, fb_ads):');
      return;
    }

    const source = args.replace(/[^a-zA-Z0-9_-]/g, '');
    await this.sendTrackingLink(ctx, source);
  }

  /** Generate and send the tracking link to admin */
  private async sendTrackingLink(ctx: BotContext, source: string): Promise<void> {
    const botInfo = await ctx.telegram.getMe();
    const link = `https://t.me/${botInfo.username}?start=ref_${source}`;
    await ctx.reply(
      `✅ Tracking link created!\n\n🔗 ${link}\n\n📊 Source: ${source}\n\nShare this link with the ad channel.\nWhen users click it, the source will be tracked automatically.`,
    );
  }
}
