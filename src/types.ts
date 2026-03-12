export interface Program {
  id: number;
  name: string;
  end_date: string;
  created_at: string;
}

export interface Topic {
  id: number;
  program_id: number;
  name: string;
}

export interface Trainee {
  id: number;
  program_id: number;
  name: string;
  email: string;
}

export interface Grade {
  id: number;
  trainee_id: number;
  topic_id: number;
  score: number;
  status: 'pass' | 'fail';
  trainee_name?: string;
  topic_name?: string;
}

export interface TraineeReport {
  trainee: Trainee;
  stats: {
    totalTopics: number;
    evaluated: number;
    passed: number;
    failed: number;
    incomplete: number;
  };
  details: (Grade & { topic_name: string })[];
}
