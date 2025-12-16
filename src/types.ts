export interface Problem {
  id: string;
  name: string;
  notes: string;
  dueDate: string | null;
  priority: 'today' | 'this_week' | 'later' | 'someday';
  status: 'to_solve' | 'solving' | 'blocked' | 'solved';
  subproblems: Problem[];
  completed: boolean;
}

export interface List {
  id: string;
  name: string;
  dueDate?: string;
  totalTime?: number; // Total time spent in milliseconds
  subproblems: Problem[];
}

export interface AppState {
  lists: List[];
}
