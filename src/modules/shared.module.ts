import { Module } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user';
import { Role, RoleSchema } from 'src/schemas/role';
import { TenantService } from 'src/services/tenant.service';
import { Tenant, TenantSchema } from 'src/schemas/tenant';
import { Invite, InviteSchema } from 'src/schemas/invite';
import { Project, ProjectSchema } from 'src/schemas/project';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  providers: [UserService, RoleService, TenantService],
  exports: [UserService, RoleService],
})
export class SharedModule {}
