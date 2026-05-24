import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { Badge, QuizResponse, StreakResponse, WeeklyPlanResponse } from './models';

@Injectable({ providedIn: 'root' })
export class InnovationService {
  private readonly http = inject(HttpClient);

  getStreaks(): Observable<StreakResponse | null> {
    return this.http.get<StreakResponse>('/api/innovation/streaks').pipe(catchError(() => of(null)));
  }

  updateGoal(dailyGoalMinutes: number): Observable<StreakResponse | null> {
    return this.http
      .put<StreakResponse>('/api/innovation/goal', { dailyGoalMinutes })
      .pipe(catchError(() => of(null)));
  }

  getHeatmap(weeks = 12): Observable<Record<string, number>> {
    return this.http
      .get<Record<string, number>>(`/api/innovation/heatmap?weeks=${weeks}`)
      .pipe(catchError(() => of({})));
  }

  getBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>('/api/innovation/badges').pipe(catchError(() => of([])));
  }

  getWeeklyPlan(): Observable<WeeklyPlanResponse | null> {
    return this.http.get<WeeklyPlanResponse>('/api/innovation/weekly-plan').pipe(catchError(() => of(null)));
  }

  generateQuiz(subjectId: number, count = 5): Observable<QuizResponse | null> {
    return this.http
      .post<QuizResponse>('/api/innovation/quiz', { subjectId, count })
      .pipe(catchError(() => of(null)));
  }
}
