import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Initialize Clerk with secret key
  const clerkSecretKey = configService.get('CLERK_SECRET_KEY');
  if (clerkSecretKey && clerkSecretKey !== 'secret') {
    createClerkClient({ secretKey: clerkSecretKey });
    console.log('Clerk initialized successfully');
  } else {
    console.warn('Clerk secret key not configured or using default value');
  }

 // Enable CORS
 app.enableCors({
  origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
  credentials: true,
});

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  // app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('AI Content Workflow API')
    .setDescription('API for managing AI-powered content creation and review workflow')
    .setVersion('1.0')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();