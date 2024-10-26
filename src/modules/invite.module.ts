import { Module } from '@nestjs/common';
import { InviteService } from '../services/invite.service';
import { Invite, InviteSchema } from 'src/schemas/invite';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]), UserModule],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
