import { Update, Start, Use, Ctx } from 'nestjs-telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { BotService } from './bot.service';
import { AdminService } from '../admin/admin.service';

@Update()
export class BotUpdate {
  constructor(
    private botService: BotService,
    private adminService: AdminService,
  ) {}

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

    await ctx.scene.enter('onboarding');
  }
}
