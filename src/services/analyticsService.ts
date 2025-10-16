const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://65.2.172.252:3002';
const API_ENDPOINT = `${API_BASE_URL}/api`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export interface AnalyticsOverview {
  totalUsers: number;
  approvedDoctors: number;
  totalClinics: number;
  applicationStatusBreakdown: {
    new: number;
    'in-process': number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface DoctorStatusDistribution {
  active: number;
  resigned: number;
}

export const analyticsService = {
  async fetchOverview(): Promise<AnalyticsOverview> {
    try {
      const response = await fetch(`${API_ENDPOINT}/analytics/overview`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics overview');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw error;
    }
  },

  async fetchClinicsGrowth(): Promise<MonthlyData[]> {
    try {
      const response = await fetch(`${API_ENDPOINT}/analytics/clinics-growth`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clinics growth data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching clinics growth:', error);
      throw error;
    }
  },

  async fetchApplicationsTrend(): Promise<MonthlyData[]> {
    try {
      const response = await fetch(`${API_ENDPOINT}/analytics/applications-trend`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications trend data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching applications trend:', error);
      throw error;
    }
  },

  async fetchDoctorStatusDistribution(): Promise<DoctorStatusDistribution> {
    try {
      const response = await fetch(`${API_ENDPOINT}/analytics/doctor-status-distribution`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctor status distribution');
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching doctor status distribution:', error);
      throw error;
    }
  },
};
