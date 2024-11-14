import { AuthService } from './auth.service';
import { jwtPayload } from './../config/auth/strategy/jwt.strategy';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SaveOptions, Types } from 'mongoose';
import { CreateTenantDto } from 'src/dtos/tenant/create-tenant.dto';
import { FindAllTenantsResponseDto } from 'src/dtos/tenant/find-all-response.dto';
import { ITenant } from 'src/schemas/interfaces/tenant.interface';
import { Project, ProjectDocument } from 'src/schemas/project';
import { Tenant, TenantDocument } from 'src/schemas/tenant';
import { User, UserDocument } from 'src/schemas/user';
import { IUser } from 'src/schemas/interfaces/user.interface';
import { Role, RoleDocument } from 'src/schemas/role';
import { RoleService } from './role.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private readonly userDocument: Model<UserDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly roleService: RoleService,
  ) {}

  async create(
    createTenantDto: CreateTenantDto,
    jwtPayload?: jwtPayload,
  ): Promise<ITenant> {
    const tenantExists = await this.tenantModel.findOne({
      identifier: createTenantDto.identifier,
    });
    if (tenantExists) {
      throw new UnprocessableEntityException(
        `Tenant with identifier "${createTenantDto.identifier}" already exists`,
      );
    }
    const createdTenant = new this.tenantModel({
      ...createTenantDto,
    });

    if (jwtPayload) {
      createdTenant.adminId = new Types.ObjectId(jwtPayload.userId);
    }

    const tenant = await createdTenant.save();

    if (jwtPayload) {
      const user = await this.userDocument.findById(jwtPayload.userId).exec();
      const adminRole = await this.roleService.CreateAdminRole(
        createdTenant._id,
      );
      await this.roleService.CreateUserRole(createdTenant._id);

      user.tenantRoles.push({
        tenant: tenant._id,
        role: new Types.ObjectId(adminRole._id.toString()),
      });
      await user.save();
    }
    return tenant as ITenant;
  }

  async findAll(jwtPayload: jwtPayload): Promise<FindAllTenantsResponseDto[]> {
    const user = await this.userDocument.findById(jwtPayload.userId).exec();
    const tenant = await user.populate('tenantRoles.tenant');
    return tenant.tenantRoles.map((tr) => {
      return {
        _id: tr.tenant._id.toString(),
        name: (tr.tenant as Tenant).name,
        isAdmin:
          (tr.tenant as Tenant).adminId.toString() === user._id.toString(),
      };
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return tenant;
  }

  async leave(id: string, jwtPayload: jwtPayload): Promise<IUser> {
    const user = await this.userDocument.findById(jwtPayload.userId).exec();
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    if (user.tenantRoles.length === 1) {
      throw new UnprocessableEntityException(
        'You cannot leave the last tenant',
      );
    }

    const projects = await this.projectModel
      .find({
        tenant: id,
        users: { $in: [new Types.ObjectId(jwtPayload.userId)] },
      })
      .exec();

    if (projects.length) {
      throw new UnprocessableEntityException(
        'You cannot leave the tenant because you are associated with projects',
      );
    }

    user.tenantRoles = user.tenantRoles.filter(
      (tr) => tr.tenant.toString() !== id,
    );
    await user.save();

    return user;
  }
}
