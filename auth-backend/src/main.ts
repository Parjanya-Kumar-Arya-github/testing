import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './globalfilter/allexception.filter';
import { ValidationPipe } from '@nestjs/common';
import { AppLoggerService } from './logging/logging.service';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  if (process.env.NODE_ENV === 'production') {
    logger.setLogLevels(['log', 'warn', 'error']);
  } else {
    logger.setLogLevels(['log', 'warn', 'error', 'debug', 'verbose']);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8000',
      'https://localhost',
      'https://10.17.7.16'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser());

  //Global exception filter resolved from DI
  app.useGlobalFilters(app.get(AllExceptionsFilter));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.logWithContext('Bootstrap', `Server started on port ${port}`);
}

bootstrap();
