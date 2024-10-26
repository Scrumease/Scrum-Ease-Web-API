import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsEnum } from 'src/enums/permissions.enum';
import { UserService } from 'src/services/user.service';
import { RoleDocument } from 'src/schemas/role';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<PermissionsEnum[]>(
      'permissions',
      context.getHandler(),
    );
    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.currentTenant) {
      throw new ForbiddenException('No tenant specified in token.');
    }

    const { tenantId, role } = user.currentTenant;

    try {
      const userFromDb = await this.userService.findOne(user.userId);
      const tenantRole = userFromDb.tenantRoles.find(
        (tr) => tr.tenant._id.toString() === tenantId && tr.role._id.toString() === role._id,
      );

      if (!tenantRole) {
        throw new ForbiddenException('No role found for the specified tenant.');
      }

      const userRole = tenantRole.role as RoleDocument;
      const userPermissions = userRole.permissions;

      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este recurso.',
        );
      }
    } catch (error) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return true;
  }
}
