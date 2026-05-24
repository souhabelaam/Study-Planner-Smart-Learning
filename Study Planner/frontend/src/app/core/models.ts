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

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  goalProgressPercent: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface WeeklyPlanDay {
  dayLabel: string;
  date: string;
  focusSubjects: string[];
  recommendedMinutes: number;
  tip: string;
}

export interface WeeklyPlanResponse {
  summary: string;
  days: WeeklyPlanDay[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResponse {
  subjectName: string;
  questions: QuizQuestion[];
  aiPowered: boolean;
}

export interface StudentNote {
  id: number;
  subjectId?: number | null;
  subjectName?: string | null;
  title: string;
  content?: string | null;
  grade?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentNoteRequest {
  title: string;
  content?: string;
  subjectId?: number | null;
  grade?: number | null;
}

export interface Advertisement {
  id: number;
  title: string;
  description: string;
  linkUrl?: string | null;
  imageUrl?: string | null;
  audience: string;
  active: boolean;
}

export interface GameScore {
  id: number;
  username: string;
  score: number;
  moves: number;
  durationSeconds: number;
  playedAt?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
  sessionCount: number;
  noteCount: number;
}

export interface AdminOverview {
  totalUsers: number;
  totalStudents: number;
  totalSessions: number;
  activeAds: number;
  averageGrade: number;
}
