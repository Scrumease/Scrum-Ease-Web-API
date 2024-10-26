import { Module } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { RoleController } from '../controllers/role.controller';
import { RoleSchema } from 'src/schemas/role';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from './shared.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }]), SharedModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
