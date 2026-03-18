import { Injectable, Logger } from '@nestjs/common';
import type { BotContext } from '../common/interfaces/session.interface';
import { InputMediaPhoto } from 'telegraf/types';
import * as fs from 'fs';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  async sendMediaGroup(ctx: BotContext, media: InputMediaPhoto[]): Promise<void> {
    const validMedia = media.filter((item) => {
      if (typeof item.media === 'object' && 'source' in item.media) {
        const exists = fs.existsSync(item.media.source as string);
        if (!exists) this.logger.warn(`Image not found: ${item.media.source}`);
        return exists;
      }
      return true;
    });

    if (validMedia.length === 0) {
      this.logger.warn('No valid images to send');
      return;
    }

    if (validMedia.length === 1) {
      const item = validMedia[0];
      const source =
        typeof item.media === 'object' && 'source' in item.media
          ? { source: item.media.source as string }
          : item.media;
      await ctx.sendPhoto(source, { caption: item.caption });
    } else {
      await ctx.sendMediaGroup(validMedia);
    }
  }

  async sendWithKeyboard(ctx: BotContext, text: string, keyboard: any): Promise<void> {
    await ctx.reply(text, {
      ...keyboard,
      link_preview_options: { is_disabled: true },
    });
  }

  getDisplayName(ctx: BotContext): string {
    return ctx.from?.username || ctx.from?.first_name || 'trader';
  }
}
