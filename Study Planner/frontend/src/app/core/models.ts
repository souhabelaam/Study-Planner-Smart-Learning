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
  subject: Subject | null;
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

export interface ProductivityReport {
  mostActiveHour: number;
  consistencyScore: number;
  productivityScore: number;
  suggestions: string[];
}
