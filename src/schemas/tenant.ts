import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema, createSchema } from './baseSchema';
import { ApiProperty } from '@nestjs/swagger';

export type TenantDocument = HydratedDocument<Tenant>;

// TODO: salvar dono da organização
@Schema()
export class Tenant extends BaseSchema {
  @ApiProperty()
  @Prop({ unique: true })
  name: string;

  @ApiProperty()
  @Prop({ unique: true })
  identifier: string;

  @ApiProperty()
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Tenant', required: false })
  adminId: Types.ObjectId;
}

export const TenantSchema = createSchema(Tenant);
