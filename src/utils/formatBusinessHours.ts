import { BusinessHours, DaySchedule } from '../types/clinic';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBREV: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatDaySchedule(schedule: DaySchedule): string {
  if (schedule.closed) {
    return 'Closed';
  }
  return `${formatTime(schedule.open)} - ${formatTime(schedule.close)}`;
}

export function formatBusinessHours(businessHours: string | BusinessHours | null | undefined): string {
  if (!businessHours) {
    return 'Not specified';
  }

  if (typeof businessHours === 'string') {
    return businessHours;
  }

  const schedules = new Map<string, string[]>();

  DAY_ORDER.forEach(day => {
    const schedule = businessHours[day as keyof BusinessHours];
    if (schedule) {
      const formatted = formatDaySchedule(schedule);
      const existing = schedules.get(formatted) || [];
      existing.push(day);
      schedules.set(formatted, existing);
    }
  });

  if (schedules.size === 0) {
    return 'Not specified';
  }

  const grouped: string[] = [];
  schedules.forEach((days, schedule) => {
    if (days.length === 1) {
      grouped.push(`${DAY_ABBREV[days[0]]}: ${schedule}`);
    } else {
      const consecutive = areConsecutive(days);
      if (consecutive && days.length > 2) {
        grouped.push(`${DAY_ABBREV[days[0]]}-${DAY_ABBREV[days[days.length - 1]]}: ${schedule}`);
      } else {
        grouped.push(`${days.map(d => DAY_ABBREV[d]).join(', ')}: ${schedule}`);
      }
    }
  });

  return grouped.join(' | ');
}

export function formatBusinessHoursDetailed(businessHours: string | BusinessHours | null | undefined): { day: string; schedule: string }[] {
  if (!businessHours) {
    return [];
  }

  if (typeof businessHours === 'string') {
    return [{ day: 'Hours', schedule: businessHours }];
  }

  const result: { day: string; schedule: string }[] = [];

  DAY_ORDER.forEach(day => {
    const schedule = businessHours[day as keyof BusinessHours];
    if (schedule) {
      result.push({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        schedule: formatDaySchedule(schedule)
      });
    }
  });

  return result.length > 0 ? result : [{ day: 'Hours', schedule: 'Not specified' }];
}

function areConsecutive(days: string[]): boolean {
  if (days.length < 2) return false;

  const indices = days.map(day => DAY_ORDER.indexOf(day));
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      return false;
    }
  }
  return true;
}
