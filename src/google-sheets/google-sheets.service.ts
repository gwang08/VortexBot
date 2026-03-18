import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const clientEmail = this.configService.get<string>('GOOGLE_SHEETS_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_SHEETS_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID') ?? '';

    if (!clientEmail || !privateKey || !this.spreadsheetId) {
      this.logger.warn('Google Sheets not configured — logging to sheet disabled');
      return;
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.logger.log('Google Sheets service initialized');
  }

  /** Append a contact/email row to the first sheet */
  async appendRow(data: {
    userId: number;
    username?: string;
    email?: string;
    flow: string;
    action: 'Contact' | 'Email';
  }): Promise<void> {
    if (!this.sheets) return;

    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const displayName = data.username ? `@${data.username}` : `ID:${data.userId}`;

    const row = [timestamp, String(data.userId), displayName, data.email ?? '', data.flow, data.action];

    try {
      // Get the first sheet name dynamically
      const sheetMeta = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: 'sheets.properties.title',
      });
      const sheetName = sheetMeta.data.sheets?.[0]?.properties?.title ?? 'Sheet1';

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `'${sheetName}'!A:F`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
      this.logger.log(`Row appended: ${data.action} from ${displayName}`);
    } catch (error) {
      this.logger.error('Failed to append row to Google Sheets', error);
    }
  }
}
