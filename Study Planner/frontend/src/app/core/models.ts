export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  username: string;
  roles: string[];
}

export interface Subject {
  id: number;
  name: string;
}

export interface StudySession {
  id: number;
  subjectId?: number;
  subjectName?: string;
  subject?: Subject | null;
  durationMinutes: number;
  date: string;
  startHour: number | null;
  startMinute: number | null;
}

export interface StudySessionDto {
  subjectId: number;
  durationMinutes: number;
  date: string;
  startHour: number;
  startMinute: number;
}

export interface DashboardOverview {
  subjectCount: number;
  sessionCount: number;
  productivityScore: number;
  consistencyScore: number;
  mostActiveHour: number;
  suggestions: string[];
  dailyStats: Record<string, number>;
}

export interface ProductivityReport {
  mostActiveHour: number;
  consistencyScore: number;
  productivityScore: number;
  suggestions: string[];
}
