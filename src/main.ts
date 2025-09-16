import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration du cookie parser pour lire les cookies HttpOnly
  app.use(cookieParser());

  // Configuration CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:4200',
      'https://candidash.djoudj.dev',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Configuration globale des pipes de validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration du préfixe global des routes
  app.setGlobalPrefix('api/v1');

  // Configuration de Swagger
  const config = new DocumentBuilder()
    .setTitle('Candidash API')
    .setDescription(
      "API REST pour l'application Candidash de gestion des candidats",
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(`Application running on port ${process.env.PORT ?? 3000}`);
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
