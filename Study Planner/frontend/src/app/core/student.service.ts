import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Advertisement, GameScore, StudentNote, StudentNoteRequest } from './models';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);

  getNotes(): Observable<StudentNote[]> {
    return this.http.get<StudentNote[]>('/api/notes').pipe(catchError(() => of([])));
  }

  createNote(payload: StudentNoteRequest): Observable<StudentNote | null> {
    return this.http.post<StudentNote>('/api/notes', payload).pipe(catchError(() => of(null)));
  }

  updateNote(id: number, payload: StudentNoteRequest): Observable<StudentNote | null> {
    return this.http.put<StudentNote>(`/api/notes/${id}`, payload).pipe(catchError(() => of(null)));
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`);
  }

  getActiveAds(): Observable<Advertisement[]> {
    return this.http.get<Advertisement[]>('/api/ads/active').pipe(catchError(() => of([])));
  }

  saveGameScore(score: number, moves: number, durationSeconds: number): Observable<GameScore | null> {
    return this.http
      .post<GameScore>('/api/game/score', { score, moves, durationSeconds })
      .pipe(catchError(() => of(null)));
  }

  getLeaderboard(): Observable<GameScore[]> {
    return this.http.get<GameScore[]>('/api/game/leaderboard').pipe(catchError(() => of([])));
  }

  getMyBestScore(): Observable<GameScore | null> {
    return this.http
      .get<GameScore>('/api/game/my-best', { observe: 'response' })
      .pipe(
        map((res) => (res.status === 204 ? null : res.body)),
        catchError(() => of(null))
      );
  }
}
