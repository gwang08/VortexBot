import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { BotContext } from '../common/interfaces/session.interface';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly adminChatId: string;

  constructor(
    @InjectBot() private bot: Telegraf<BotContext>,
    private configService: ConfigService,
    private googleSheetsService: GoogleSheetsService,
  ) {
    this.adminChatId = this.configService.get<string>('ADMIN_CHAT_ID') ?? '';
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

  /** Extract userId from forwarded message text - matches "(ID: xxx)", "User ID: xxx", or "ID:xxx" */
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
}
