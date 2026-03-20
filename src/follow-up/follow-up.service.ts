import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';

interface FollowUpEntry {
  userId: number;
  startedAt: string;
  sent6h: boolean;
  sent24h: boolean;
}

const FILE_PATH = path.join(process.cwd(), 'follow-ups.json');
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class FollowUpService implements OnModuleInit {
  private readonly logger = new Logger(FollowUpService.name);

  constructor(@InjectBot() private readonly bot: Telegraf) {}

  onModuleInit() {
    setInterval(() => this.processFollowUps(), CHECK_INTERVAL_MS);
    this.logger.log('Follow-up scheduler started (5-min interval)');
  }

  addUser(userId: number): void {
    const entries = this.readEntries();
    const exists = entries.some((e) => e.userId === userId);
    if (exists) return;

    entries.push({ userId, startedAt: new Date().toISOString(), sent6h: false, sent24h: false });
    this.writeEntries(entries);
    this.logger.log(`Added user ${userId} to follow-up queue`);
  }

  async processFollowUps(): Promise<void> {
    let entries = this.readEntries();
    const now = Date.now();
    let changed = false;

    for (const entry of entries) {
      const elapsed = now - new Date(entry.startedAt).getTime();

      if (!entry.sent6h && elapsed >= SIX_HOURS_MS) {
        await this.send6hMessage(entry.userId);
        entry.sent6h = true;
        changed = true;
      }

      if (!entry.sent24h && elapsed >= TWENTY_FOUR_HOURS_MS) {
        await this.send24hMessage(entry.userId);
        entry.sent24h = true;
        changed = true;
      }
    }

    if (changed) {
      // Remove completed entries
      entries = entries.filter((e) => !(e.sent6h && e.sent24h));
      this.writeEntries(entries);
    }
  }

  private async send6hMessage(userId: number): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(
        userId,
        '⏰ Our system currently has great trades running! You can start with just $100 to test it out.',
      );
    } catch (error) {
      this.logger.error(`Failed to send 6h message to ${userId}`, error);
    }
  }

  private async send24hMessage(userId: number): Promise<void> {
    try {
      const pct = (Math.random() * 3 + 2).toFixed(1);
      await this.bot.telegram.sendMessage(
        userId,
        `📊 Today the system gained +${pct}%! If you had started yesterday, you'd already be in profit.`,
      );
    } catch (error) {
      this.logger.error(`Failed to send 24h message to ${userId}`, error);
    }
  }

  private readEntries(): FollowUpEntry[] {
    try {
      if (!fs.existsSync(FILE_PATH)) return [];
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      return JSON.parse(raw) as FollowUpEntry[];
    } catch {
      return [];
    }
  }

  private writeEntries(entries: FollowUpEntry[]): void {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to write follow-ups.json', error);
    }
  }
}
