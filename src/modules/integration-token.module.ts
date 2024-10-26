import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from './shared.module';
import { IntegrationTokenService } from 'src/services/integration-token.service';
import { IntegrationToken, IntegrationTokenSchema } from 'src/schemas/IntegrationToken';
import { IntegrationTokenController } from 'src/controllers/integration-token.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: IntegrationToken.name, schema: IntegrationTokenSchema }]), SharedModule],
  controllers: [IntegrationTokenController],
  providers: [IntegrationTokenService],
  exports: [IntegrationTokenService],
})
export class IntegrationTokenModule {}
