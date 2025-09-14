import { JobTrack } from './jobtrack.interface';
import { Reminder } from './reminder.interface';

export interface AuthenticatedUser {
  user: {
    sub: string;
  };
}

export interface JobTrackWithReminder {
  jobTrack: JobTrack;
  reminder: Reminder;
}

export interface JobTrackWithOptionalReminder {
  jobTrack: JobTrack;
  reminder: Reminder | null;
}

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
