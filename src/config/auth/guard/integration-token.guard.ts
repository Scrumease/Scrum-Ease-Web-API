import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntegrationToken } from 'src/schemas/IntegrationToken';

@Injectable()
export class IntegrationTokenGuard implements CanActivate {
  constructor(
    @InjectModel(IntegrationToken.name)
    private readonly integrationTokenModel: Model<IntegrationToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const integrationToken = await this.integrationTokenModel.findOne({ token });

    if (!integrationToken) {
      throw new UnauthorizedException('Invalid token');
    }

    if (integrationToken.isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if(!integrationToken.applicationName || !integrationToken.requestIp) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
