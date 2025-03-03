import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from 'src/controllers/auth.controller';
import { UserSchema } from 'src/schemas/user';
import { AuthService } from 'src/services/auth.service';
import { UserModule } from './user.module';
import { LocalStrategy } from 'src/config/auth/strategy/local.strategy';
import { JwtStrategy } from 'src/config/auth/strategy/jwt.strategy';
import { SessionSchema } from 'src/schemas/session';
import { InviteModule } from './invite.module';
import { MailModule } from './mail.module';
import { Tenant, TenantSchema } from 'src/schemas/tenant';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '60m' },
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Session', schema: SessionSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    InviteModule,
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
