import { Update, Start, Use, Ctx, Command } from 'nestjs-telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { BotService } from './bot.service';
import { AdminService } from '../admin/admin.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Update()
export class BotUpdate {
  private readonly botUsername: string;

  constructor(
    private botService: BotService,
    private adminService: AdminService,
    private googleSheetsService: GoogleSheetsService,
    private configService: ConfigService,
    private prisma: PrismaService,
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

    // Handle /start directly since next() may not work
    if (message.startsWith('/start')) {
      return this.onStart(ctx);
    }

    // Handle /newlink for admin
    if (message.startsWith('/newlink') && this.adminService.isAdmin(chatId)) {
      const args = message.split(' ').slice(1).join('_');
      if (!args) {
        ctx.session.awaitingLinkSource = true;
        await ctx.reply('📎 Enter a source name for the tracking link (e.g. forex_vn, gold_trading, fb_ads):');
        return;
      }
      const source = args.replace(/[^a-zA-Z0-9_-]/g, '');
      await this.createTrackingLink(ctx, source);
      return;
    }

    // Handle /checklinks for admin
    if (message.startsWith('/checklinks') && this.adminService.isAdmin(chatId)) {
      await this.showTrackingLinks(ctx);
      return;
    }

    // Other commands → pass through
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
      await this.createTrackingLink(ctx, source);
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

    // User is actively inputting text (email/profit) or in AI chat → let scene handle it
    if (ctx.session?.awaitingEmail || ctx.session?.awaitingProfitTarget || ctx.session?.inAiChat) {
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
    ctx.session.isVip = undefined;
    ctx.session.inAiChat = false;

    // Extract deep link source from /start ref_<source>
    const startPayload = (ctx.message as any)?.text?.split(' ')[1] ?? '';
    const source = startPayload.startsWith('ref_') ? startPayload.slice(4) : '';

    // Upsert User record in DB
    if (ctx.from) {
      await this.prisma.user.upsert({
        where: { id: BigInt(ctx.from.id) },
        update: { username: ctx.from.username, firstName: ctx.from.first_name },
        create: {
          id: BigInt(ctx.from.id),
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          source: source || null,
        },
      });
    }

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

  /** Create tracking link with duplicate check */
  private async createTrackingLink(ctx: BotContext, source: string): Promise<void> {
    if (await this.adminService.hasTrackingLink(source)) {
      const botInfo = await ctx.telegram.getMe();
      const link = `https://t.me/${botInfo.username}?start=ref_${source}`;
      await ctx.reply(`⚠️ Source "${source}" already exists!\n\n🔗 ${link}\n\nPlease use a different source name.`);
      return;
    }

    await this.adminService.saveTrackingLink(source);
    const botInfo = await ctx.telegram.getMe();
    const link = `https://t.me/${botInfo.username}?start=ref_${source}`;
    await ctx.reply(
      `✅ Tracking link created!\n\n🔗 ${link}\n\n📊 Source: ${source}\n\nShare this link with the ad channel.\nWhen users click it, the source will be tracked automatically.`,
    );
  }

  /** Show all created tracking links */
  private async showTrackingLinks(ctx: BotContext): Promise<void> {
    const links = await this.adminService.getTrackingLinks();
    if (links.length === 0) {
      await ctx.reply('📭 No tracking links created yet.\n\nUse /newlink <source> to create one.');
      return;
    }

    const botInfo = await ctx.telegram.getMe();
    const lines = links.map((l, i) => {
      const link = `https://t.me/${botInfo.username}?start=ref_${l.source}`;
      const date = new Date(l.createdAt).toLocaleDateString('en-US');
      return `${i + 1}. 📊 ${l.source}\n   🔗 ${link}\n   📅 ${date}`;
    });

    await ctx.reply(`📋 Tracking Links (${links.length}):\n\n${lines.join('\n\n')}`);
  }
}
