import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Bot runs via long polling, no HTTP server needed
  // but keep it for health checks
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
