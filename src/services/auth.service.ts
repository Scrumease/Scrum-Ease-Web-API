import { jwtPayload } from './../config/auth/strategy/jwt.strategy';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user';
import { IUser } from 'src/schemas/interfaces/user.interface';
import { IRole } from 'src/schemas/interfaces/role.interface';
import { SessionDocument } from 'src/schemas/session';
import { MailService } from './mail.service';
import { Tenant, TenantDocument } from 'src/schemas/tenant';
import * as crypto from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    @InjectModel('Session')
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Tenant.name)
    private readonly tenantDocument: Model<TenantDocument>,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: IUser, currentTenantId?: string): Promise<any> {
    let currentTenantRole = user.tenantRoles[0];
    if (currentTenantId) {
      currentTenantRole = user.tenantRoles.find(
        (tr) => tr.tenant._id.toString() === currentTenantId,
      );
    }

    if (!currentTenantRole) {
      throw new ForbiddenException('No role found for the specified tenant.');
    }
    const { createdAt, updatedAt, ...role } = currentTenantRole.role as IRole;
    const payload = {
      email: user.email,
      sub: user._id,
      name: user.name,
      currentTenant: {
        tenantId: currentTenantRole.tenant._id,
        role: currentTenantRole.role,
      },
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.createSession(user._id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const session = await this.sessionModel.findOne({ userId, refreshToken });
    if (!session) {
      throw new ForbiddenException('Invalid refresh token');
    }
    session.deleteOne();
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    const decoded = this.jwtService.verify(refreshToken) as {
      sub: string;
      email: string;
      name: string;
      currentTenant: {
        tenantId: string;
        role: string;
      };
    };

    const session = await this.sessionModel.findOne({
      userId: decoded.sub,
      refreshToken,
    });
    if (!session) {
      throw new ForbiddenException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new ForbiddenException('Refresh token expired');
    }

    let tenant = await this.tenantDocument
      .findById(decoded.currentTenant.tenantId)
      .exec();

    if (!tenant) {
      const user = await this.userModel
        .findOne({ _id: decoded.sub })
        .populate({
          path: 'tenantRoles.role',
          model: 'Role',
        })
        .populate({
          path: 'tenantRoles.tenant',
          model: 'Tenant',
        })
        .exec();

      let currentTenantRole = user.tenantRoles[0];

      decoded.currentTenant = {
        tenantId: currentTenantRole.tenant._id.toString(),
        role: currentTenantRole.role.toString(),
      };
    }

    const payload = {
      email: decoded.email,
      sub: decoded.sub,
      name: decoded.name,
      currentTenant: decoded.currentTenant,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date();
    session.expiresAt.setDate(session.expiresAt.getDate() + 7);

    await session.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async findByEmail(email: string): Promise<IUser> {
    const user = await this.userModel
      .findOne({ email })
      .populate({
        path: 'tenantRoles.role',
        model: 'Role',
      })
      .populate({
        path: 'tenantRoles.tenant',
        model: 'Tenant',
      })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user.toObject() as IUser;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const validity = new Date();
    validity.setDate(validity.getDate() + 1);

    const token = this.generateForgetPasswordToken(email, validity);
    const changeUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}&email=${email}&validity=${validity.toISOString()}`;

    this.mailService.sendEmail(email, 'Reset your password', 'reset_password', {
      changeUrl,
      email,
    });
  }

  async resetPassword(
    token: string,
    password: string,
    email: string,
    validity: string,
  ): Promise<void> {
    const { isValid } = this.validateForgetPasswordToken(
      token,
      email,
      validity,
    );
    if (!isValid) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
    userId: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Senha inválida');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  private async createSession(
    userId: unknown,
    refreshToken: string,
  ): Promise<SessionDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = new this.sessionModel({
      userId,
      refreshToken,
      expiresAt,
    });

    return session.save();
  }

  generateForgetPasswordToken(email: string, validity: Date) {
    const tokenData = `${email}-${validity.toISOString()}`;
    const hmac = crypto
      .createHmac('sha256', process.env.FORGET_PASSWORD_SECRET_KEY)
      .update(tokenData)
      .digest('hex');
    return `${tokenData}.${hmac}`;
  }

  validateForgetPasswordToken(token: string, email: string, validity: string) {
    const validityDate = new Date(validity);
    const generatedToken = this.generateForgetPasswordToken(
      email,
      validityDate,
    );

    if (new Date() > validityDate) {
      return { isValid: false, message: 'Token expirado.' };
    }

    if (`${generatedToken}` != token) {
      return { isValid: false, message: 'Token inválido.' };
    }

    return { isValid: true };
  }
}
