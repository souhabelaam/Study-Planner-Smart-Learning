import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { StudentService } from './core/student.service';
import { ChatWidgetComponent } from './chat/chat-widget.component';
import { AdBannerComponent } from './components/ad-banner.component';
import { Advertisement } from './core/models';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatWidgetComponent, AdBannerComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

  protected chatOpen = false;
  protected chatUnread = 0;
  protected readonly studentAds = signal<Advertisement[]>([]);
  protected showStudentLayout = false;

  private readonly studentRoutes = ['/dashboard', '/lab', '/notes', '/game', '/subjects', '/sessions', '/stats'];

  constructor() {
    this.themeService.init();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateStudentLayout();
      this.loadAdsIfStudent();
    });
    this.updateStudentLayout();
    this.loadAdsIfStudent();
  }

  protected logout(): void {
    this.chatOpen = false;
    this.chatUnread = 0;
    this.studentAds.set([]);
    this.authService.logout();
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) this.chatUnread = 0;
  }

  protected onAssistantMessage(): void {
    if (!this.chatOpen) this.chatUnread += 1;
  }

  private updateStudentLayout(): void {
    const url = this.router.url.split('?')[0];
    this.showStudentLayout = this.authService.isStudent() && this.studentRoutes.some((r) => url.startsWith(r));
  }

  private loadAdsIfStudent(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isStudent()) {
      this.studentAds.set([]);
      return;
    }
    this.studentService.getActiveAds().subscribe((ads) => this.studentAds.set(ads));
  }
}
