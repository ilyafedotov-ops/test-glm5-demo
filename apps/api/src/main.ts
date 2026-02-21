import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggerService } from "./common/logging";

async function bootstrap() {
  // Create logger instance
  const logger = new LoggerService();

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle("NexusOps Control Center API")
    .setDescription("Enterprise operations and compliance orchestration platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env["PORT"] || 3001;
  await app.listen(port);
  
  logger.log(`API running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`, 'Bootstrap');
}

bootstrap();
