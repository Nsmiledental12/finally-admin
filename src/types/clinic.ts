export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface Clinic {
  id: number;
  doctor_id: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  business_hours: string | BusinessHours | null;
  created_at: string;
  updated_at: string;
}
