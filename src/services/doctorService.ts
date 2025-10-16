import { Doctor, Application, ManagedDoctor } from '../types/doctor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://65.2.172.252:3002';
const API_ENDPOINT = `${API_BASE_URL}/api`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const doctorService = {
  async fetchAllDoctors(): Promise<Application[]> {
    try {
      const response = await fetch(`${API_ENDPOINT}/doctors`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data.map((doctor: Doctor) => this.mapDoctorToApplication(doctor));
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },

  async fetchDoctorById(id: string): Promise<Application> {
    try {
      const response = await fetch(`${API_ENDPOINT}/doctors/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctor');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return this.mapDoctorToApplication(result.data);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching doctor:', error);
      throw error;
    }
  },

  async fetchDoctorsByStatus(status: string): Promise<Application[]> {
    try {
      const response = await fetch(`${API_ENDPOINT}/doctors/status/${status}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors by status');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data.map((doctor: Doctor) => this.mapDoctorToApplication(doctor));
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching doctors by status:', error);
      throw error;
    }
  },

  async updateDoctorStatus(
    id: string,
    status: 'new' | 'in-process' | 'pending' | 'approved' | 'rejected',
    userRole: 'super_admin' | 'admin' | 'moderator'
  ): Promise<Application> {
    try {
      const response = await fetch(`${API_ENDPOINT}/doctors/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, userRole }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update doctor status');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return this.mapDoctorToApplication(result.data);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error updating doctor status:', error);
      throw error;
    }
  },

  mapDoctorToApplication(doctor: Doctor): Application {
    return {
      id: doctor.id.toString(),
      doctorName: doctor.full_name,
      specialization: doctor.specialization,
      dateOfApplication: doctor.created_at,
      status: doctor.status || 'new',
      email: doctor.email,
      experience: `${doctor.years_of_experience} years`,
      countryCode: doctor.country_code,
      mobileNumber: doctor.mobile_number,
      licenseNumber: doctor.license_number,
      clinicAddress: doctor.clinic_address,
    };
  },

  async fetchApprovedDoctors(): Promise<ManagedDoctor[]> {
    try {
      const response = await fetch(`${API_ENDPOINT}/doctors/approved/list`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approved doctors');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data.map((doctor: Doctor) => this.mapDoctorToManaged(doctor));
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching approved doctors:', error);
      throw error;
    }
  },

  async resignDoctor(id: string): Promise<ManagedDoctor> {
    try {
      const response = await fetch(`${API_ENDPOINT}/doctors/${id}/resign`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to resign doctor');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return this.mapDoctorToManaged(result.data);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error resigning doctor:', error);
      throw error;
    }
  },

  mapDoctorToManaged(doctor: Doctor): ManagedDoctor {
    return {
      id: doctor.id.toString(),
      name: doctor.full_name,
      specialization: doctor.specialization,
      status: doctor.status === 'resigned' ? 'resigned' : 'active',
      dateJoined: doctor.updated_at || doctor.created_at,
      email: doctor.email,
      phone: `${doctor.country_code} ${doctor.mobile_number}`,
      licenseNumber: doctor.license_number,
      experience: `${doctor.year_of_experience} years`,
      clinicAddress: doctor.clinic_address,
    };
  },
};
