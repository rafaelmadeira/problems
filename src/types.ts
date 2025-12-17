export interface FocusSessionRecord {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface Problem {
  id: string;
  name: string;
  notes: string;
  dueDate: string | null;
  priority: 'today' | 'this_week' | 'later' | 'recurring' | 'someday';
  status: 'to_solve' | 'solving' | 'blocked' | 'solved' | 'ongoing';
  subproblems: Problem[];
  completed: boolean;
  completedAt?: number | null;
  estimatedDuration?: number; // in milliseconds
  totalTime?: number;
  sessions?: FocusSessionRecord[];
  todayOrder?: number;
}

export interface List {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  dueDate?: string; // Is this used? List usually doesn't have due date but keeping it safe
  totalTime?: number; // Total time spent in milliseconds
  problems: Problem[];
}

export interface AppSettings {
  layout: 'one-column' | 'two-columns';
}

export interface AppState {
  lists: List[];
  settings: AppSettings;
}
