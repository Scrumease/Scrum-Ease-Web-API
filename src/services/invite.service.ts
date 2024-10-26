import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Invite, InviteDocument } from 'src/schemas/invite';
import { UserService } from './user.service';
import { IRole } from 'src/schemas/interfaces/role.interface';

@Injectable()
export class InviteService {
  private readonly saltRounds = 10;

  constructor(
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    private readonly userService: UserService,
  ) {}

  async generateInvite(email: string, tenantId: string, role: IRole): Promise<string> {
    const validity = new Date();
    validity.setDate(validity.getDate() + 1); // 1 day validity

    const user = await this.userService.findByEmailAndTenant(email, tenantId);
    if (user) {
      throw new ConflictException('User already exists on that tenant');
    }

    const userAlreadyRegistedOnSystem = await this.userService.findByEmail(email); 

    const invite = new this.inviteModel({ email, validity, tenantId, roleId: role._id, newUser: !userAlreadyRegistedOnSystem });
    await invite.save();
    
    const tokenData = `${invite._id}-${email}-${tenantId}-${validity.toISOString()}`;
    const hashedToken = await bcrypt.hash(tokenData, this.saltRounds);

    return hashedToken;
  }

  async verifyInviteToken(
    token: string,
    email: string,
    tenantId: string,
  ): Promise<{valid: boolean, newUser: boolean}> {
    const invite = await this.inviteModel.findOne({
      email,
      tenantId,
      validity: { $gte: new Date() },
    });

    if (!invite) {
      throw new Error('Invalid or expired token');
    }

    const user = await this.userService.findByEmailAndTenant(email, tenantId);

    if (user) {
      throw new Error('User already exists on that tenant');
    }

    const response = {
      valid: await this.verifyTokenData(token, email, tenantId, invite.validity),
      newUser: invite.newUser,
    }
    return response;
  }

  private async verifyTokenData(
    token: string,
    email: string,
    tenantId: string,
    validity: Date,
  ): Promise<boolean> {
    const tokenData = `${email}-${tenantId}-${validity.toISOString()}`;
    return await bcrypt.compare(tokenData, token);
  }
}
