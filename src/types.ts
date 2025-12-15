export interface Problem {
  id: string;
  name: string;
  notes: string;
  dueDate: string | null;
  subproblems: Problem[];
  completed: boolean;
}

export interface List {
  id: string;
  name: string;
  description: string;
  problems: Problem[];
}

export interface AppState {
  lists: List[];
}
