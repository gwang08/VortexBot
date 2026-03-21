import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { PrismaService } from '../prisma/prisma.service';
import { MAX_FOLLOWUP_COUNT, VIP_MAX_FOLLOWUP_COUNT } from '../common/constants';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly adminChatId: string;

  constructor(
    @InjectBot() private bot: Telegraf<BotContext>,
    private configService: ConfigService,
    private googleSheetsService: GoogleSheetsService,
    private prisma: PrismaService,
  ) {
    this.adminChatId = this.configService.get<string>('ADMIN_CHAT_ID') ?? '';
  }

  /** Check if source already exists */
  async hasTrackingLink(source: string): Promise<boolean> {
    const link = await this.prisma.trackingLink.findUnique({ where: { source } });
    return link !== null;
  }

  /** Save a new tracking link */
  async saveTrackingLink(source: string): Promise<void> {
    await this.prisma.trackingLink.create({ data: { source } });
  }

  /** Get all tracking links ordered by newest first */
  async getTrackingLinks(): Promise<{ source: string; createdAt: string }[]> {
    const links = await this.prisma.trackingLink.findMany({ orderBy: { createdAt: 'desc' } });
    return links.map((l) => ({ source: l.source, createdAt: l.createdAt.toISOString() }));
  }

  /** Check if a message is from the admin */
  isAdmin(chatId: number): boolean {
    return String(chatId) === this.adminChatId;
  }

  /** Forward user message to admin for live chat */
  async forwardUserMessage(userId: number, username: string, text: string): Promise<void> {
    const displayName = username ? `@${username}` : `ID:${userId}`;
    const message = `💬 Message from ${displayName} (ID: ${userId}):\n\n"${text}"\n\n↩️ Reply this message to respond.`;

    try {
      await this.bot.telegram.sendMessage(this.adminChatId, message);
    } catch (error) {
      this.logger.error('Failed to forward user message to admin', error);
    }
  }

  /** Send admin reply back to user */
  async sendReplyToUser(userId: number, text: string): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(userId, text);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send reply to user ${userId}`, error);
      return false;
    }
  }

  /** Extract userId from forwarded message text */
  extractUserIdFromMessage(text: string): number | null {
    const match =
      text.match(/\(ID:\s*(\d+)\)/) ||
      text.match(/User ID:\s*(\d+)/) ||
      text.match(/ID:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  async notifyAdmin(userId: number, username?: string, firstName?: string): Promise<void> {
    const displayName = username ? `@${username}` : firstName || `ID:${userId}`;
    const message = `🔔 New contact request!\n\nFrom: ${displayName}\nUser ID: ${userId}\n\nPlease reach out to them directly.`;

    try {
      await this.bot.telegram.sendMessage(this.adminChatId, message);
      this.logger.log(`Admin notified about user ${displayName}`);
    } catch (error) {
      this.logger.error('Failed to notify admin', error);
    }

    await this.googleSheetsService.appendRow({
      userId,
      username: username || firstName,
      flow: 'General',
      action: 'Contact',
    });
  }

  async notifyAdminEmail(userId: number, username: string, email: string, flow: string): Promise<void> {
    const displayName = username ? `@${username}` : `ID:${userId}`;
    const message = `📧 Email received!\n\nFrom: ${displayName}\nFlow: ${flow}\nEmail: ${email}`;

    try {
      await this.bot.telegram.sendMessage(this.adminChatId, message);
    } catch (error) {
      this.logger.error('Failed to notify admin about email', error);
    }

    await this.googleSheetsService.appendRow({
      userId,
      username,
      email,
      flow,
      action: 'Email',
    });
  }

  /** Notify admin when user submits trading account */
  async notifyAccountSubmitted(userId: number, username: string | undefined, account: string): Promise<void> {
    const displayName = username ? `@${username}` : `ID:${userId}`;
    const text = `🏦 Account Submitted\n\nUser: ${displayName} (ID: ${userId})\nAccount: ${account}\n\nVerify with: /verify ${account}`;

    try {
      await this.bot.telegram.sendMessage(this.adminChatId, text);
    } catch (error) {
      this.logger.error('Failed to notify admin about account submission', error);
    }
  }

  /** Notify admin when user claims deposit */
  async notifyDepositClaimed(userId: number, username: string | undefined, account: string | null | undefined): Promise<void> {
    const displayName = username ? `@${username}` : `ID:${userId}`;
    const text = `💰 Deposit Claimed\n\nUser: ${displayName} (ID: ${userId})\nAccount: ${account || 'N/A'}\n\nCheck on IB portal.`;

    try {
      await this.bot.telegram.sendMessage(this.adminChatId, text);
    } catch (error) {
      this.logger.error('Failed to notify admin about deposit claim', error);
    }
  }

  /** /help - show all admin commands */
  async sendHelpMessage(ctx: BotContext): Promise<void> {
    const text = `📋 Admin Commands:\n
/help        – Show this help message
/newlink     – Create tracking link: /newlink <source>
/checklinks  – List all tracking links
/status      – View user info: /status <telegram_id>
/stats       – User statistics by source & status
/verify      – Verify trading account: /verify <account_number>

💬 Reply to user messages to chat directly`;

    await ctx.reply(text);
  }

  /** /status <tg_id> - show user details */
  async sendUserStatus(ctx: BotContext, tgId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(tgId) },
      });

      if (!user) {
        await ctx.reply(`User ${tgId} not found.`);
        return;
      }

      const maxFollowUp = user.isVip ? VIP_MAX_FOLLOWUP_COUNT : MAX_FOLLOWUP_COUNT;
      const text = `👤 User: ${user.firstName || 'N/A'} (@${user.username || 'N/A'})
🆔 ID: ${user.id}
📊 Tier: ${user.tier}
📌 Status: ${user.status}
💰 Capital: ${user.capitalRange || 'N/A'}
🏦 Account: ${user.tradingAccount || 'N/A'}
✅ Verified: ${user.accountVerified ? 'Yes' : 'No'}
📂 Flow: ${user.flow || 'N/A'}
🔔 Follow-ups: ${user.followUpCount}/${maxFollowUp}
🔗 Source: ${user.source || 'direct'}
📅 Joined: ${user.createdAt.toISOString().split('T')[0]}
📝 Last step: ${user.lastStep || 'N/A'}`;

      await ctx.reply(text);
    } catch (error) {
      await ctx.reply(`Error looking up user: ${tgId}`);
    }
  }

  /** /stats - aggregate user statistics */
  async sendStats(ctx: BotContext): Promise<void> {
    const statusCounts = await this.prisma.user.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const sourceCounts = await this.prisma.user.groupBy({
      by: ['source'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const tierCounts = await this.prisma.user.groupBy({
      by: ['tier'],
      _count: { id: true },
    });

    const total = await this.prisma.user.count();

    let text = `📊 Stats (Total: ${total} users)\n\n`;

    text += `── By Status ──\n`;
    for (const s of statusCounts) {
      text += `${s.status}: ${s._count.id}\n`;
    }

    text += `\n── By Tier ──\n`;
    for (const t of tierCounts) {
      text += `${t.tier}: ${t._count.id}\n`;
    }

    text += `\n── Top Sources ──\n`;
    for (const s of sourceCounts) {
      text += `${s.source || 'direct'}: ${s._count.id}\n`;
    }

    await ctx.reply(text);
  }

  /** /verify <account> - mark account as verified and notify user */
  async verifyAccount(ctx: BotContext, account: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { tradingAccount: account },
    });

    if (!user) {
      await ctx.reply(`No user found with account ${account}.`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { accountVerified: true, lastStep: 'account_verified' },
    });

    await ctx.reply(`✅ Account ${account} verified for user ${user.firstName || user.username || user.id}.`);

    // Notify user
    try {
      await this.bot.telegram.sendMessage(
        user.id.toString(),
        '✅ Your trading account has been verified! You can now proceed with deposits.',
      );
    } catch (e: any) {
      this.logger.error(`Failed to notify user ${user.id}: ${e.message}`);
    }
  }
}
