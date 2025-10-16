const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export interface SuperAdminProfile {
  id: number;
  email: string;
  full_name: string;
  last_login: string | null;
  created_at: string;
}

export interface UpdateProfileData {
  email?: string;
  full_name?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchSuperAdminProfile = async (): Promise<SuperAdminProfile> => {
  const response = await fetch(`${API_BASE_URL}/api/super-admins/profile/me`, {
    headers: getAuthHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }

  return data.data;
};

export const updateSuperAdminProfile = async (profileData: UpdateProfileData): Promise<SuperAdminProfile> => {
  const response = await fetch(`${API_BASE_URL}/api/super-admins/profile/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  return data.data;
};

export const changeSuperAdminPassword = async (passwordData: ChangePasswordData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/super-admins/profile/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(passwordData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to change password');
  }
};
