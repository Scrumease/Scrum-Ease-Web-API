import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SaveOptions } from 'mongoose';
import { CreateTenantDto } from 'src/dtos/tenant/create-tenant.dto';
import { UpdateTenantDto } from 'src/dtos/tenant/update-tenant.dto';
import { ITenant } from 'src/schemas/interfaces/tenant.interface';
import { Tenant } from 'src/schemas/tenant';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel('Tenant') private readonly tenantModel: Model<Tenant>,
  ) {}

  async create(
    createTenantDto: CreateTenantDto,
    options?: SaveOptions,
  ): Promise<ITenant> {
    const tenantExists = await this.tenantModel.findOne({
      identifier: createTenantDto.identifier,
    });
    if (tenantExists) {
      throw new UnprocessableEntityException(
        `Tenant with identifier "${createTenantDto.identifier}" already exists`,
      );
    }
    const createdTenant = new this.tenantModel(createTenantDto);
    const tenant = await createdTenant.save(options);
    return tenant as ITenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantModel.find().exec();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const existingTenant = await this.tenantModel
      .findByIdAndUpdate(id, updateTenantDto, { new: true })
      .exec();
    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return existingTenant;
  }
}
