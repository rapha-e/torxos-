import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("TorxOSBootstrap");
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Prefixo Global da API
  app.setGlobalPrefix("api/v1");

  // Habilita CORS para o Frontend Next.js
  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // Validação Global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Documentação OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle("TorxOS — Business Operating Platform API")
    .setDescription(
      "Documentação oficial da API RESTful do TorxOS (Multi-Tenant B2B SaaS). TorxOS OS, TorxOS Finance, TorxOS Stock e TorxOS AI Mentor.",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");

  logger.log(`🚀 TorxOS API rodando com sucesso na porta: http://localhost:${port}/api/v1`);
  logger.log(`📚 Documentação Swagger interativa: http://localhost:${port}/api/docs`);
}

bootstrap();
