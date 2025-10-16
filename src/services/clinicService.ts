import { Clinic } from '../types/clinic';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://65.2.172.252:3002';
const API_ENDPOINT = `${API_BASE_URL}/api`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const clinicService = {
  async fetchAllClinics(): Promise<Clinic[]> {
    try {
      const response = await fetch(`${API_ENDPOINT}/clinics`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clinics');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  },

  async fetchClinicById(id: number): Promise<Clinic> {
    try {
      const response = await fetch(`${API_ENDPOINT}/clinics/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clinic');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching clinic:', error);
      throw error;
    }
  },
};
