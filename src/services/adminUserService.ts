import { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from '../types/adminUser';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://65.2.172.252:3002';
const API_ENDPOINT = `${API_BASE_URL}/api`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const fetchAdminUsers = async (filters?: {
  role?: string;
  status?: string;
  search?: string;
}): Promise<AdminUser[]> => {
  try {
    const params = new URLSearchParams();

    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINT}/admin-users?${queryString}` : `${API_ENDPOINT}/admin-users`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to fetch admin users');
    }
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
};

export const fetchAdminUserById = async (id: number): Promise<AdminUser> => {
  try {
    const response = await fetch(`${API_ENDPOINT}/admin-users/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to fetch admin user');
    }
  } catch (error) {
    console.error('Error fetching admin user:', error);
    throw error;
  }
};

export const createAdminUser = async (data: CreateAdminUserRequest): Promise<AdminUser> => {
  try {
    const response = await fetch(`${API_ENDPOINT}/admin-users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to create admin user');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

export const updateAdminUser = async (id: number, data: UpdateAdminUserRequest): Promise<AdminUser> => {
  try {
    const response = await fetch(`${API_ENDPOINT}/admin-users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to update admin user');
    }
  } catch (error) {
    console.error('Error updating admin user:', error);
    throw error;
  }
};

export const deleteAdminUser = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_ENDPOINT}/admin-users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete admin user');
    }
  } catch (error) {
    console.error('Error deleting admin user:', error);
    throw error;
  }
};
