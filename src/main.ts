import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('Scrum Ease web API')
    .setDescription(
      'API para gerenciamento de sprints, tarefas e dailys usando Scrum',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
