export interface Doctor {
  id: number;
  full_name: string;
  email: string;
  country_code: string;
  mobile_number: string;
  license_number: string;
  specialization: string;
  years_of_experience: number;
  clinic_address: string;
  status: 'new' | 'in-process' | 'pending' | 'approved' | 'rejected' | 'resigned';
  created_at: string;
  updated_at: string;
}

export interface ManagedDoctor {
  id: string;
  name: string;
  specialization: string;
  status: 'active' | 'resigned';
  dateJoined: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  experience?: string;
  clinicAddress?: string;
}

export interface Application {
  id: string;
  doctorName: string;
  specialization: string;
  dateOfApplication: string;
  status: 'new' | 'in-process' | 'pending' | 'approved' | 'rejected';
  email: string;
  experience: string;
  countryCode?: string;
  mobileNumber?: string;
  licenseNumber?: string;
  clinicAddress?: string;
}
