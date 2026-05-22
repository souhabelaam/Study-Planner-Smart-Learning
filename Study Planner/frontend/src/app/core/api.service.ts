import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import {
  DashboardOverview,
  ProductivityReport,
  StudySession,
  StudySessionDto,
  Subject
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private asArray<T>(source: Observable<unknown>): Observable<T[]> {
    return source.pipe(
      map((body) => (Array.isArray(body) ? body : []) as T[]),
      catchError(() => of([] as T[]))
    );
  }

  getSubjects(): Observable<Subject[]> {
    return this.asArray<Subject>(this.http.get('/api/subjects'));
  }

  createSubject(name: string): Observable<Subject> {
    return this.http.post<Subject>('/api/subjects', { name });
  }

  createSubjectsBulk(names: string[]): Observable<Subject[]> {
    return this.asArray<Subject>(this.http.post('/api/subjects/bulk', names));
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`/api/subjects/${id}`);
  }

  getSessions(): Observable<StudySession[]> {
    return this.asArray<StudySession>(this.http.get('/api/sessions'));
  }

  createSession(payload: StudySessionDto): Observable<StudySession> {
    return this.http.post<StudySession>('/api/sessions', payload);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`/api/sessions/${id}`);
  }

  getDashboardOverview(): Observable<DashboardOverview | null> {
    return this.http.get<DashboardOverview>('/api/stats/overview').pipe(catchError(() => of(null)));
  }

  getDailyStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>('/api/stats/daily').pipe(catchError(() => of({})));
  }

  getWeeklyStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>('/api/stats/weekly').pipe(catchError(() => of({})));
  }

  getAiReport(): Observable<ProductivityReport | null> {
    return this.http.get<ProductivityReport>('/api/stats/ai-report').pipe(catchError(() => of(null)));
  }
}
