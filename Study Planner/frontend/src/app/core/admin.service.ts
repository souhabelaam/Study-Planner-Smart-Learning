import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { AdminOverview, AdminUser, Advertisement } from './models';

export interface AdRequest {
  title: string;
  description: string;
  linkUrl?: string;
  imageUrl?: string;
  audience?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<AdminOverview | null> {
    return this.http.get<AdminOverview>('/api/admin/overview').pipe(catchError(() => of(null)));
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>('/api/admin/users').pipe(catchError(() => of([])));
  }

  updateUser(id: number, payload: { username: string; email: string; roles: string[] }): Observable<any> {
    return this.http.put(`/api/admin/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }

  getAds(): Observable<Advertisement[]> {
    return this.http.get<Advertisement[]>('/api/admin/ads').pipe(catchError(() => of([])));
  }

  createAd(payload: AdRequest): Observable<Advertisement | null> {
    return this.http.post<Advertisement>('/api/admin/ads', payload).pipe(catchError(() => of(null)));
  }

  updateAd(id: number, payload: AdRequest): Observable<Advertisement | null> {
    return this.http.put<Advertisement>(`/api/admin/ads/${id}`, payload).pipe(catchError(() => of(null)));
  }

  deleteAd(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/ads/${id}`);
  }
}
