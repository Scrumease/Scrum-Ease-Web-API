import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { CreateRoleDto } from 'src/dtos/role/create-role.dto';
import { UpdateRoleDto } from 'src/dtos/role/update-role.dto';
import {
  PermissionsEnum,
  permissionTranslations,
} from 'src/enums/permissions.enum';
import { IRole } from 'src/schemas/interfaces/role.interface';
import { Role } from 'src/schemas/role';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async create(
    currentUser: jwtPayload,
    createRoleDto: CreateRoleDto,
  ): Promise<IRole> {
    const tenantId = currentUser.currentTenant.tenantId;
    const createdRole = new this.roleModel({
      permissions: createRoleDto.permissions,
      name: createRoleDto.name,
      tenantId: tenantId,
    });
    const role = await this.roleModel
      .findOne({ name: createRoleDto.name })
      .exec();
    if (role) {
      throw new NotFoundException('Cargo já cadastrado');
    }
    return (await createdRole.save()).toJSON();
  }

  async findAll(
    currentUser: jwtPayload,
    page: number,
    limit: number,
    search?: string,
  ): Promise<FindPaginated<IRole>> {
    const tenantId = currentUser.currentTenant.tenantId;
    let roles: IRole[];
    if (limit < 0) {
      roles = await this.roleModel
        .find({
          tenantId,
          name: { $regex: search || '', $options: 'i', $ne: 'Administrador' },
        })
        .exec();
    } else {
      roles = await this.roleModel
        .find({
          tenantId,
          name: { $regex: search || '', $options: 'i', $ne: 'Administrador' },
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    }

    const total = await this.roleModel
      .countDocuments({
        tenantId,
        name: { $regex: search || '', $options: 'i', $ne: 'Administrador' },
      })
      .exec();
    return {
      page,
      limit,
      total: total,
      data: roles,
    };
  }

  async findOne(id: string): Promise<IRole> {
    const role = await this.roleModel.findById(new Types.ObjectId(id)).exec();
    if (!role) {
      throw new NotFoundException('Cargo não encontrado');
    }
    return role;
  }

  async findByName(currentUser: jwtPayload, name: string): Promise<IRole> {
    const tenantId = currentUser.currentTenant.tenantId;
    const role = await this.roleModel
      .findOne({ name, tenantId: tenantId })
      .exec();
    if (!role) {
      throw new NotFoundException('Cargo não encontrado');
    }
    return role as IRole;
  }

  async findByNameWithTenant(name: string, tenantId: string): Promise<IRole> {
    const role = await this.roleModel
      .findOne({ name, tenantId: tenantId })
      .exec();
    if (!role) {
      throw new NotFoundException('Cargo não encontrado');
    }
    return role as IRole;
  }

  async update(id: string, dto: { permissions: string[] }): Promise<Role> {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, { permissions: dto.permissions }, { new: true })
      .exec();
    if (!updatedRole) {
      throw new NotFoundException('Cargo não encontrado');
    }
    return updatedRole;
  }

  async delete(id: string): Promise<Role> {
    const deletedRole = await this.roleModel.findByIdAndDelete(id).exec();
    if (!deletedRole) {
      throw new NotFoundException('Papel não encontrado');
    }
    return deletedRole;
  }

  //TODO: chamar o createRole
  async CreateAdminRole(tenantId: unknown): Promise<IRole> {
    const createdRole = new this.roleModel({
      name: 'Administrador',
      tenantId: tenantId,
      permissions: Object.values(PermissionsEnum),
    });

    await createdRole.save();
    return createdRole.toObject() as IRole;
  }

  async CreateUserRole(tenantId: unknown): Promise<IRole> {
    const createdRole = new this.roleModel({
      name: 'Usuário',
      tenantId: tenantId,
      permissions: [PermissionsEnum.VIEW_USER],
    });

    await createdRole.save();
    return createdRole.toObject() as IRole;
  }

  getPermissions(): Record<string, string> {
    return permissionTranslations;
  }
}
