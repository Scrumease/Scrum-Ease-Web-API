import { FormPermissionsEnum } from './permissions.form.enum';
import { ProjectPermissionsEnum } from './permissions.project.enum';
import { RolePermissionsEnum } from './permissions.role.enum';
import { UserPermissionsEnum } from './permissions.user.enum';

export const PermissionsEnum = {
  ...UserPermissionsEnum,
  ...RolePermissionsEnum,
  ...FormPermissionsEnum,
  ...ProjectPermissionsEnum,
  INVITE_USERS: 'INVITE_USERS',
  VIEW_CONFIGS: 'VIEW_CONFIGS',
  INTEGRATE_ORGANIZATION: 'INTEGRATE_ORGANIZATION',
};
export type PermissionsEnum = typeof PermissionsEnum;

export const permissionTranslations: Record<string, string> = {
  [PermissionsEnum.CREATE_USER]: 'Criar Usuário',
  [PermissionsEnum.LIST_USERS]: 'Listar Usuários',
  [PermissionsEnum.VIEW_USER]: 'Visualizar Usuário',
  [PermissionsEnum.UPDATE_USER]: 'Atualizar Usuário',
  [PermissionsEnum.DELETE_USER]: 'Excluir Usuário',
  [PermissionsEnum.UPDATE_USER_ROLE]: 'Atualizar Cargo do Usuário',

  [PermissionsEnum.CREATE_ROLE]: 'Criar Cargo',
  [PermissionsEnum.VIEW_ROLE]: 'Visualizar Cargo',
  [PermissionsEnum.UPDATE_ROLE]: 'Atualizar Cargo',
  [PermissionsEnum.VIEW_PERMISSION]: 'Visualizar Permissão',

  [PermissionsEnum.VIEW_FORM]: 'Visualizar Formulário',
  [PermissionsEnum.CREATE_FORM]: 'Criar Formulário',
  [PermissionsEnum.UPDATE_FORM]: 'Atualizar Formulário',
  [PermissionsEnum.DELETE_FORM]: 'Excluir Formulário',

  [PermissionsEnum.VIEW_PROJECT]: 'Visualizar Projeto',
  [PermissionsEnum.CREATE_PROJECT]: 'Criar Projeto',
  [PermissionsEnum.UPDATE_PROJECT]: 'Atualizar Projeto',
  [PermissionsEnum.DELETE_PROJECT]: 'Excluir Projeto',

  [PermissionsEnum.INVITE_USERS]: 'Convidar Usuários',
  [PermissionsEnum.VIEW_CONFIGS]: 'Visualizar Configurações',
};
