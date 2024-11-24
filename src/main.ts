import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RoleService } from './services/role.service';

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

  const roleService = app.get(RoleService);
  await roleService.updateAdminsRoles();

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
