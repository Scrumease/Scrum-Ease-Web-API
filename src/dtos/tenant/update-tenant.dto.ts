import { CreateTenantDto } from './create-tenant.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
