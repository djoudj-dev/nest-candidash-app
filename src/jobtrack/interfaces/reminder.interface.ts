export interface Reminder {
  id: string;
  jobTrackId: string;
  frequency: number;
  nextReminderAt: Date;
  lastSentAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderCreateData {
  frequency: number;
  nextReminderAt: string;
  isActive?: boolean;
}

export interface ReminderUpdateData {
  frequency?: number;
  nextReminderAt?: string;
  isActive?: boolean;
}
