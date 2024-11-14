import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from 'src/dtos/user/create-user.dto';
import { UpdateUserDto } from 'src/dtos/user/update-user.dto';
import { User } from 'src/schemas/user';
import * as bcrypt from 'bcrypt';
import { IUser } from 'src/schemas/interfaces/user.interface';
import { RegisterAdminDto } from 'src/dtos/auth/register-admin.dto';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from 'src/dtos/tenant/create-tenant.dto';
import { RoleService } from './role.service';
import { Role } from 'src/schemas/role';
import { Tenant } from 'src/schemas/tenant';
import { RegisterUserDto } from 'src/dtos/auth/register-user.dto';
import { IRole } from 'src/schemas/interfaces/role.interface';
import { jwtPayload } from 'src/config/auth/strategy/jwt.strategy';
import { FindPaginated } from 'src/dtos/common/findPaginatel.interface';
import { Invite } from 'src/schemas/invite';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Invite') private readonly inviteModel: Model<Invite>,
    private tenantService: TenantService,
    private roleService: RoleService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findAll(
    currentUser: jwtPayload,
    page: number,
    limit: number,
    search?: string,
  ): Promise<FindPaginated<IUser>> {
    const tenantId = currentUser.currentTenant.tenantId;
    let users = [];

    if (limit < 0) {
      users = await this.userModel
        .find({
          'tenantRoles.tenant': tenantId,
          name: { $regex: search || '', $options: 'i' },
        })
        .populate({
          path: 'tenantRoles.role',
          model: Role.name,
        })
        .populate({
          path: 'tenantRoles.tenant',
          model: Tenant.name,
        })
        .exec();
    } else {
      users = await this.userModel
        .find({
          'tenantRoles.tenant': tenantId,
          name: { $regex: search || '', $options: 'i' },
          _id: { $ne: currentUser.userId },
        })
        .populate({
          path: 'tenantRoles.role',
          model: Role.name,
        })
        .populate({
          path: 'tenantRoles.tenant',
          model: Tenant.name,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    }

    const data = users.map((user) => {
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword as IUser;
    });

    const total = await this.userModel.countDocuments({
      'tenantRoles.tenant': tenantId,
      name: { $regex: search || '', $options: 'i' },
      _id: { $ne: currentUser.userId },
    });

    return {
      page,
      limit,
      total: total,
      data,
    };
  }

  async findOne(id: string): Promise<IUser> {
    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(id) })
      .populate({
        path: 'tenantRoles.role',
        model: Role.name,
      })
      .populate({
        path: 'tenantRoles.tenant',
        model: Tenant.name,
      })
      .exec();
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    delete user.password;
    return user.toObject() as IUser;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email })
      .populate('tenantRoles.role')
      .exec();
    if (!user) {
      return null;
    }
    delete user.password;
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto = {
        ...updateUserDto,
        password: await bcrypt.hash(updateUserDto.password, 10),
      };
    }
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .populate('roles')
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return updatedUser;
  }

  async delete(id: string): Promise<User> {
    const deletedUser = await this.userModel
      .findByIdAndDelete(id)
      .populate('roles')
      .exec();
    if (!deletedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return deletedUser;
  }

  async createAdmin(dto: RegisterAdminDto): Promise<IUser> {
    const createTenantDto: CreateTenantDto = {
      name: dto.tenantName,
      identifier: dto.tenantIdentifier,
    };
    const user = await this.userModel.findOne({ email: dto.adminEmail });
    if (user) {
      throw new UnprocessableEntityException('Usuário já cadastrado');
    }

    const createdTenant = await this.tenantService.create(createTenantDto);
    const adminRole = await this.roleService.CreateAdminRole(createdTenant._id);
    await this.roleService.CreateUserRole(createdTenant._id);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const createdUser = new this.userModel({
      password: hashedPassword,
      tenantRoles: [
        {
          tenant: createdTenant._id,
          role: adminRole._id,
        },
      ],
      name: dto.adminName,
      email: dto.adminEmail,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      timezone: dto.timezone,
    });

    await createdUser.save();

    createdTenant.adminId = createdUser._id;
    await createdTenant.save();

    createdUser.password = undefined;
    return createdUser.toObject() as IUser;
  }

  async findByEmailAndTenant(
    email: string,
    tenantId: string,
  ): Promise<User | null> {
    const existingUser = await this.userModel.findOne({
      email,
      'tenantRoles.tenant': tenantId,
    });
    return existingUser;
  }

  async registerByInvite(
    dto: RegisterUserDto,
    tenantId: string,
  ): Promise<IUser> {
    const tenant = await this.tenantService.findOne(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    const user = await this.userModel.findOne({
      email: dto.email,
      'tenantRoles.tenant': tenantId,
    });
    if (user) {
      throw new UnprocessableEntityException('User already exists');
    }

    const invite = await this.inviteModel
      .findOne({
        email: dto.email,
        tenantId: tenantId,
      })
      .sort('createdAt')
      .populate('roleId')
      .exec();

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const createdUser = new this.userModel({
      password: hashedPassword,
      tenantRoles: [
        {
          tenant: tenantId,
          role: invite.roleId._id,
        },
      ],
      name: dto.name,
      email: dto.email,
      country: dto.country,
      state: dto.state,
      city: dto.city,
      timezone: dto.timezone,
    });

    await createdUser.save();
    createdUser.password = undefined;
    return createdUser.toObject() as IUser;
  }

  async addOrganizationByInvite(email: string, tenantId: string) {
    const tenant = await this.tenantService.findOne(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const user = await this.userModel.findOne({
      email,
      tenantRoles: {
        $elemMatch: {
          tenant: tenantId,
        },
      },
    });
    if (user) {
      throw new UnprocessableEntityException('User already exists');
    }

    const invite = await this.inviteModel
      .findOne({
        email,
        tenantId,
      })
      .sort('createdAt')
      .populate('roleId')
      .exec();

    const u = await this.userModel.findOne({
      email,
    });

    u.tenantRoles.push({
      tenant: new Types.ObjectId(tenantId),
      role: invite.roleId._id,
    });

    await u.save();
    u.password = undefined;
    return u.toObject() as IUser;
  }
}
