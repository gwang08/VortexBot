import { Update, Start, On, Ctx } from 'nestjs-telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { BotService } from './bot.service';
import { AdminService } from '../admin/admin.service';

@Update()
export class BotUpdate {
  constructor(
    private botService: BotService,
    private adminService: AdminService,
  ) {}

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

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = (ctx.message as any)?.text;
    if (!message) return;

    const chatId = ctx.chat?.id;
    if (!chatId) return;

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

    // User sending message → forward to admin
    const displayName = this.botService.getDisplayName(ctx);
    await this.adminService.forwardUserMessage(ctx.from!.id, displayName, message);
    await ctx.reply('✅ Your message has been sent to admin. Please wait for a response!');
  }
}
