import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { ChatWidgetComponent } from './chat/chat-widget.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatWidgetComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected chatOpen = false;
  protected chatUnread = 0;

  protected logout(): void {
    this.chatOpen = false;
    this.chatUnread = 0;
    this.authService.logout();
  }

  constructor() {
    this.themeService.init();
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.chatUnread = 0;
    }
  }

  protected onAssistantMessage(): void {
    if (!this.chatOpen) {
      this.chatUnread += 1;
    }
  }
}
