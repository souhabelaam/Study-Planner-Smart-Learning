import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly localChatUrl = '/api/chat';

  send(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.localChatUrl, { message } satisfies ChatRequest);
  }

  private sendWithLocalFallback(message: string): Observable<ChatResponse> {
    const text = message.trim().toLowerCase();
    let reply = 'I am here to help. Ask me for study tips, a quick plan, or focus advice.';

    if (text.includes('how are you') || text.includes('how are u')) {
      reply = 'I am doing great and ready to help you study. How is your day going?';
    } else if (text === 'hi' || text === 'hello' || text === 'hey' || text.startsWith('hi ') || text.startsWith('hello ') || text.startsWith('hey ')) {
      reply = 'Hi! I am your IA Helper. I can help with study tips, planning, focus, and revision strategies.';
    } else if (text.includes('who are you') || text.includes('what are you')) {
      reply = 'I am your IA Helper for Study Planner. I can guide your schedule, focus sessions, and learning habits.';
    } else if (text.includes('tip') || text.includes('advice') || text.includes('suggest')) {
      reply = [
        'Here are 3 quick study tips:',
        '- Use 50/10 focus blocks (50 min study, 10 min break).',
        '- Start each session with one clear goal.',
        '- End by writing a 2-line recap of what you learned.'
      ].join('\n');
    } else if (text.includes('plan') || text.includes('schedule')) {
      reply = [
        'Try this simple plan for today:',
        '- 1 hard subject block first',
        '- 1 medium subject block after a short break',
        '- 1 review block at the end'
      ].join('\n');
    } else if (text.includes('focus') || text.includes('procrast')) {
      reply = 'Start with a 5-minute task right now, put your phone away, and set a timer. Momentum beats motivation.';
    } else if (text.includes('thanks') || text.includes('thank you')) {
      reply = 'You are welcome. Keep going, you are doing great.';
    } else if (text.includes('bye') || text.includes('good night')) {
      reply = 'See you soon. I will be here when you want to study again.';
    } else {
      reply = [
        'Good question. I can help you right away with one of these:',
        '- Build a study plan for today',
        '- Improve focus and stop procrastination',
        '- Give revision tips for your next exam'
      ].join('\n');
    }

    return of({ reply });
  }
}

