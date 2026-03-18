import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [GoogleSheetsModule],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
