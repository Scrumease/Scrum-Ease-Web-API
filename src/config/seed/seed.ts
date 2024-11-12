import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  NestFactory.createApplicationContext(SeedModule)
    .then((appContext) => {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error(
          'Seed não será executada: ambiente não é de desenvolvimento',
        );
      }
      const seeder = appContext.get(SeedService);
      seeder
        .seed()
        .then(() => {
          console.log('Seeding complete!');
        })
        .catch((error) => {
          console.log('Seeding failed!');
          throw error;
        })
        .finally(() => appContext.close());
    })
    .catch((error) => {
      throw error;
    });
}
bootstrap();
