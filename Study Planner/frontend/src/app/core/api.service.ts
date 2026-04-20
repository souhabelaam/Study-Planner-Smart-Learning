import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductivityReport, StudySession, StudySessionDto, Subject } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>('/api/subjects');
  }

  createSubject(name: string): Observable<Subject> {
    return this.http.post<Subject>('/api/subjects', { name });
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`/api/subjects/${id}`);
  }

  getSessions(): Observable<StudySession[]> {
    return this.http.get<StudySession[]>('/api/sessions');
  }

  createSession(payload: StudySessionDto): Observable<StudySession> {
    return this.http.post<StudySession>('/api/sessions', payload);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`/api/sessions/${id}`);
  }

  getDailyStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>('/api/stats/daily');
  }

  getWeeklyStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>('/api/stats/weekly');
  }

  getAiReport(): Observable<ProductivityReport> {
    return this.http.get<ProductivityReport>('/api/stats/ai-report');
  }
}
