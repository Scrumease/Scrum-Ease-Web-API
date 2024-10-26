import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { IntegrationToken } from 'src/schemas/IntegrationToken';

@Injectable()
export class IntegrationTokenService {
  constructor(
    @InjectModel(IntegrationToken.name)
    private readonly integrationTokenModel: Model<IntegrationToken>,
  ) {}

  async generateIntegrationToken(userId: string): Promise<string> {
    const integrationToken = await this.integrationTokenModel.findOne({
      userId,
      isRevoked: false,
      applicationName: null,
      requestIp: null,
    });

    if (integrationToken) {
      return integrationToken.token;
    }
    const token = randomBytes(32).toString('hex');

    const newToken = new this.integrationTokenModel({
      token,
      userId,
      isRevoked: false,
    });

    await newToken.save();

    return token;
  }

  async revokeIntegrationToken(token: string): Promise<void> {
    await this.integrationTokenModel
        .findOneAndUpdate({ token }, { isRevoked: true })
        .exec();
  }

  async linkUser(token: string, dto:{applicationName: string, requestIp: string}): Promise<void> {
    const integrationToken = await this.integrationTokenModel.findOne({ token });
    if (!integrationToken) {
      throw new Error('Invalid token');
    }

    if (integrationToken.isRevoked) {
      throw new Error('Token has been revoked');
    }

    if(integrationToken.applicationName || integrationToken.requestIp) {
      throw new Error('Invalid token');
    }

    integrationToken.applicationName = dto.applicationName;
    integrationToken.requestIp = dto.requestIp;
    await integrationToken.save();
  }
}
