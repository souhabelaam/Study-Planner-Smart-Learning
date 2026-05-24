import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { JwtResponse, LoginRequest, SignupRequest } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'study-planner-token';
  private readonly rolesKey = 'study-planner-roles';
  private readonly usernameKey = 'study-planner-username';

  login(payload: LoginRequest): Observable<JwtResponse> {
    const body = {
      username: payload.username.trim(),
      password: payload.password
    };
    return this.http.post<JwtResponse>('/api/auth/login', body).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  register(payload: SignupRequest): Observable<string> {
    return this.http.post('/api/auth/register', payload, { responseType: 'text' });
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  getRoles(): string[] {
    const raw = localStorage.getItem(this.rolesKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolesKey);
    localStorage.removeItem(this.usernameKey);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  isAdmin(): boolean {
    return this.getRoles().includes('ADMIN');
  }

  isStudent(): boolean {
    return this.getRoles().includes('USER');
  }

  homeRoute(): string {
    return this.isAdmin() ? '/admin' : '/dashboard';
  }

  private persistSession(res: JwtResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.usernameKey, res.username);
    localStorage.setItem(this.rolesKey, JSON.stringify(res.roles ?? []));
  }
}
