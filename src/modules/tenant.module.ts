import { Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TenantController } from '../controllers/tenant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantSchema } from 'src/schemas/tenant';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Tenant', schema: TenantSchema }]),
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
