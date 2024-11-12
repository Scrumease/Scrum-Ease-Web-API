import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user';
import { Tenant, TenantSchema } from 'src/schemas/tenant';
import { Daily, DailySchema } from 'src/schemas/daily';
import { Form, FormSchema } from 'src/schemas/forms';
import { Project, ProjectSchema } from 'src/schemas/project';
import { Role, RoleSchema } from 'src/schemas/role';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Daily.name, schema: DailySchema },
      { name: Form.name, schema: FormSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
