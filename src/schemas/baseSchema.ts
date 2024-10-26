import { Type } from '@nestjs/common';
import { Prop, SchemaFactory, SchemaOptions } from '@nestjs/mongoose';

export abstract class BaseSchema {
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export function createSchema<T extends BaseSchema>(model: Type<T>, options?: SchemaOptions) {
  const schema = SchemaFactory.createForClass(model);
  setUpUpdateHook(schema);
  return schema;
}

function setUpUpdateHook(schema: any) {
  schema.pre('save', function(next) {
    if (this.isModified()) {
      this.updatedAt = new Date();
    }
    next();
  });

  schema.pre(['findOneAndUpdate', 'updateMany', 'updateOne', 'update'], function(next) {
    this.set({ updatedAt: new Date() });
    next();
  });
}