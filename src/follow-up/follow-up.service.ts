import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class FollowUpService implements OnModuleInit {
  private readonly logger = new Logger(FollowUpService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    setInterval(() => this.processFollowUps(), CHECK_INTERVAL_MS);
    this.logger.log('Follow-up scheduler started (5-min interval)');
  }

  async addUser(userId: number): Promise<void> {
    await this.prisma.followUp.upsert({
      where: { userId: BigInt(userId) },
      update: {},
      create: { userId: BigInt(userId), sent6h: false, sent24h: false },
    });
    this.logger.log(`Added user ${userId} to follow-up queue`);
  }

  async processFollowUps(): Promise<void> {
    const entries = await this.prisma.followUp.findMany({
      where: { OR: [{ sent6h: false }, { sent24h: false }] },
    });
    const now = Date.now();

    for (const entry of entries) {
      const elapsed = now - entry.startedAt.getTime();
      const updates: { sent6h?: boolean; sent24h?: boolean } = {};

      if (!entry.sent6h && elapsed >= SIX_HOURS_MS) {
        await this.send6hMessage(Number(entry.userId));
        updates.sent6h = true;
      }

      if (!entry.sent24h && elapsed >= TWENTY_FOUR_HOURS_MS) {
        await this.send24hMessage(Number(entry.userId));
        updates.sent24h = true;
      }

      if (Object.keys(updates).length > 0) {
        const updatedEntry = { ...entry, ...updates };
        if (updatedEntry.sent6h && updatedEntry.sent24h) {
          // Both sent - remove entry
          await this.prisma.followUp.delete({ where: { id: entry.id } });
        } else {
          await this.prisma.followUp.update({ where: { id: entry.id }, data: updates });
        }
      }
    }
  }

  private async send6hMessage(userId: number): Promise<void> {
    try {
      const pct = (Math.random() * 3 + 2).toFixed(1);
      await this.bot.telegram.sendMessage(
        userId,
        `📊 Bot made +${pct}% today\n\nYou haven't started yet.\n\n👉 Deposit now to join the profit`,
      );
    } catch (error) {
      this.logger.error(`Failed to send 6h message to ${userId}`, error);
    }
  }

  private async send24hMessage(userId: number): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(
        userId,
        `Most users already started.\n\nDon't miss the next trading session.\n\n👉 Start now`,
      );
    } catch (error) {
      this.logger.error(`Failed to send 24h message to ${userId}`, error);
    }
  }
}
