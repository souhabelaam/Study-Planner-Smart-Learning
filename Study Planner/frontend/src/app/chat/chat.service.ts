import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface ChatHistoryItemResponse {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly localChatUrl = '/api/chat';
  private historyCache$?: Observable<ChatHistoryItemResponse[]>;

  send(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.localChatUrl, { message } satisfies ChatRequest).pipe(
      tap(() => {
        // New message means server history changed.
        this.historyCache$ = undefined;
      })
    );
  }

  getHistory(): Observable<ChatHistoryItemResponse[]> {
    if (!this.historyCache$) {
      this.historyCache$ = this.http
        .get<ChatHistoryItemResponse[]>(`${this.localChatUrl}/history`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.historyCache$;
  }
}

