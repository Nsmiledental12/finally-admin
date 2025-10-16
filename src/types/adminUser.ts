export enum AdminRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator'
}

export enum AdminStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: AdminRole;
  status: AdminStatus;
  phone?: string;
  department?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: AdminRole;
  status: AdminStatus;
  phone?: string;
  department?: string;
  created_by?: number;
}

export interface UpdateAdminUserRequest {
  email?: string;
  full_name?: string;
  role?: AdminRole;
  status?: AdminStatus;
  phone?: string;
  department?: string;
}
