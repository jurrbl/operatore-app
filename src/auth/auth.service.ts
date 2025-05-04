declare var gapi: any;

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { tap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: any = null;
  private perizie: any = null;
  isBrowser: boolean;
  private readonly api = environment.apiUrl;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    const savedUser = localStorage.getItem('user');
    try {
      this.user = savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.warn('⚠️ Errore parsing user:', err);
      localStorage.removeItem('user');
    }

    const savedPerizie = localStorage.getItem('perizie');
    try {
      this.perizie = savedPerizie ? JSON.parse(savedPerizie) : null;
    } catch (err) {
      console.warn('⚠️ Errore parsing perizie:', err);
      localStorage.removeItem('perizie');
    }
  }

  public setUser(user: any): void {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  public checkGoogleSession() {
    return this.http.get<any>(`${this.api}/auth/me`, { withCredentials: true });
  }

  public fetchPerizieTotali(): Observable<{ perizie: any[], nPerizie: number }> {
    return this.http.get<{ perizie: any[], nPerizie: number }>(`${this.api}/operator/perizie`, { withCredentials: true });
  }

  public fetchUtentiCompleti() {
    return this.http.get<any[]>(`${this.api}/operator/users`, { withCredentials: true });
  }

  public getUser(): any {
    if (!this.user) {
      const savedUser = localStorage.getItem('user');
      try {
        this.user = savedUser ? JSON.parse(savedUser) : null;
      } catch (err) {
        localStorage.removeItem('user');
        this.user = null;
      }
    }
    return this.user;
  }

  public getUsername(): string {
    return this.user?.username || this.user?.googleUsername || '';
  }

  public setPerizie(perizie: any): void {
    this.perizie = perizie;
    localStorage.setItem('perizie', JSON.stringify(perizie));
  }

  public getPerizie(): any[] {
    if (!this.perizie) {
      const savedPerizie = localStorage.getItem('perizie');
      try {
        this.perizie = savedPerizie ? JSON.parse(savedPerizie) : [];
      } catch (err) {
        localStorage.removeItem('perizie');
        this.perizie = [];
      }
    }
    return this.perizie;
  }

  public isLoggedIn(): boolean {
    return !!this.user;
  }

  public register(user: { username: string; email: string; password: string }) {
    return this.http.post(`${this.api}/auth/register`, user, { withCredentials: true });
  }

  public login(user: { email: string; password: string }) {
    return this.http.post(`${this.api}/auth/login`, user, { withCredentials: true });
  }

  public getMe() {
    return this.http.get(`${this.api}/auth/me`, { withCredentials: true });
  }

  public fetchPerizie() {
    return this.http.get(`${this.api}/operator/perizie`, { withCredentials: true });
  }

  public fetchPerizieAdmin(): Observable<{ perizie: any[], nPerizie: number }> {
    return this.http.get<{ perizie: any[], nPerizie: number }>(`${this.api}/admin/all-perizie`, { withCredentials: true });
  }

  public updatePerizia(id: string, data: any) {
    return this.http.put(`${this.api}/admin/perizie/${id}`, data, { withCredentials: true });
  }

  public forgotPassword(email: string) {
    return this.http.post(`${this.api}/auth/forgot-password`, { email }, { withCredentials: true });
  }

  public resetPassword(data: {
    token: string;
    email: string;
    nuovaPassword: string;
  }) {
    return this.http.post(`${this.api}/auth/reset-password`, data, { withCredentials: true });
  }

  public logout(): Observable<any> {
    // Prima pulisco subito il locale
    this.user = null;
    this.perizie = null;
    localStorage.removeItem('user');
    localStorage.removeItem('perizie');  
    // Poi chiamo il server per cancellare il cookie
    return this.http.get(`${this.api}/auth/logout`, { withCredentials: true }).pipe(
      tap(() => {
        console.log('✅ Logout completato anche lato server.');
      })
    );
  }
  public checkSession(): Observable<any> {
    return this.http.get(`${this.api}/auth/me`, { withCredentials: true });
  }
  public getAllUsers(): any[] {
    const saved = localStorage.getItem('utenti');
    return saved ? JSON.parse(saved) : [];
  }

  public fetchUtenti(): void {
    this.http.get<any[]>(`${this.api}/admin/users`, { withCredentials: true }).subscribe({
      next: (utenti) => {
        localStorage.setItem('utenti', JSON.stringify(utenti));
      },
      error: (err) => {
        console.error('❌ Errore nel caricamento utenti:', err);
      }
    });
  }

  public getUtenti(): any[] {
    const saved = localStorage.getItem('utenti');
    return saved ? JSON.parse(saved) : [];
  }

  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('perizie');
    window.location.href = '/login';
  }

  private cleanLocalData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('perizie');
    window.location.href = '/login';
  }
}
