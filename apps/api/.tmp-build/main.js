"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const logging_1 = require("./common/logging");
async function bootstrap() {
    const logger = new logging_1.LoggerService();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger,
    });
    app.setGlobalPrefix("api");
    app.enableCors({
        origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("NexusOps Control Center API")
        .setDescription("Enterprise operations and compliance orchestration platform")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const port = process.env["PORT"] || 3001;
    await app.listen(port);
    logger.log(`API running on http://localhost:${port}`, 'Bootstrap');
    logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
    logger.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map