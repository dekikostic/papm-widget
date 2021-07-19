import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config.js';

const CORS_ORIGINS = [
  'https://master-integration-t01.master.canary.eu10.projectorca.cloud',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: CORS_ORIGINS });

  await app.listen(process.env.PORT);
}

bootstrap();
