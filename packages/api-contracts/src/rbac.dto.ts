export interface CreateRoleRequestDto {
  name: string;
  slug: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePermissionsRequestDto {
  permissionIds: string[];
}

export interface PermissionCatalogItem {
  id: string;
  module: string;
  action: string;
  description?: string | null;
}

export interface RoleDetailResponseData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  isSystem: boolean;
  description?: string | null;
  permissions: PermissionCatalogItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
