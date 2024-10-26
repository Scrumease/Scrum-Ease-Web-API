import { Module } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schemas/user';
import { RoleSchema } from 'src/schemas/role';
import { TenantService } from 'src/services/tenant.service';
import { TenantSchema } from 'src/schemas/tenant';
import { InviteSchema } from 'src/schemas/invite';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Tenant', schema: TenantSchema },
      { name: 'Invite', schema: InviteSchema },
    ]),
  ],
  providers: [UserService, RoleService, TenantService],
  exports: [UserService, RoleService],
})
export class SharedModule {}
