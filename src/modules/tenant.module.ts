import { Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TenantController } from '../controllers/tenant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from 'src/schemas/tenant';
import { User, UserSchema } from 'src/schemas/user';
import { Project, ProjectSchema } from 'src/schemas/project';
import { AuthService } from 'src/services/auth.service';
import { AuthModule } from './auth.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionSchema } from 'src/schemas/session';
import { RoleModule } from './role.module';
import { MailModule } from './mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: 'Session', schema: SessionSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '60m' },
    }),
    RoleModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
