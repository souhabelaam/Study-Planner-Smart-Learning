import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { InnovationService } from '../core/innovation.service';
import {
  Badge,
  QuizQuestion,
  QuizResponse,
  StreakResponse,
  Subject,
  WeeklyPlanResponse
} from '../core/models';

type LabTab = 'streaks' | 'focus' | 'planner' | 'heatmap' | 'badges' | 'quiz';

@Component({
  standalone: true,
  selector: 'app-lab-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './lab-page.component.html'
})
export class LabPageComponent implements OnInit, OnDestroy {
  private readonly innovation = inject(InnovationService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly tabs: { id: LabTab; label: string; icon: string }[] = [
    { id: 'streaks', label: 'Séries', icon: '🔥' },
    { id: 'focus', label: 'Focus', icon: '⏱️' },
    { id: 'planner', label: 'Plan IA', icon: '🧠' },
    { id: 'heatmap', label: 'Heatmap', icon: '📊' },
    { id: 'badges', label: 'Badges', icon: '🏆' },
    { id: 'quiz', label: 'Quiz', icon: '❓' }
  ];

  activeTab: LabTab = 'streaks';

  streaks: StreakResponse | null = null;
  goalInput = 60;
  heatmap: Record<string, number> = {};
  badges: Badge[] = [];
  plan: WeeklyPlanResponse | null = null;
  subjects: Subject[] = [];

  focusMinutes = 25;
  focusSeconds = 0;
  focusRunning = false;
  focusSubjectId: number | null = null;
  focusMessage = '';

  quizSubjectId: number | null = null;
  quiz: QuizResponse | null = null;
  quizIndex = 0;
  quizSelected: number | null = null;
  quizScore = 0;
  quizFinished = false;

  private focusInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as LabTab | null;
      if (tab && this.tabs.some((t) => t.id === tab)) {
        this.activeTab = tab;
      }
      this.loadTabData();
    });
    this.api.getSubjects().subscribe((s) => {
      this.subjects = s;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopFocusTimer();
  }

  protected setTab(tab: LabTab): void {
    this.activeTab = tab;
    this.loadTabData();
  }

  protected saveGoal(): void {
    this.innovation.updateGoal(this.goalInput).subscribe((s) => {
      if (s) {
        this.streaks = s;
        this.cdr.detectChanges();
      }
    });
  }

  protected heatLevel(minutes: number): string {
    if (minutes <= 0) return 'lvl-0';
    if (minutes < 30) return 'lvl-1';
    if (minutes < 60) return 'lvl-2';
    if (minutes < 120) return 'lvl-3';
    return 'lvl-4';
  }

  protected heatmapWeeks(): { date: string; minutes: number }[][] {
    const entries = Object.entries(this.heatmap).map(([date, minutes]) => ({ date, minutes }));
    const weeks: { date: string; minutes: number }[][] = [];
    let current: { date: string; minutes: number }[] = [];
    entries.forEach((entry, i) => {
      current.push(entry);
      if (current.length === 7 || i === entries.length - 1) {
        weeks.push(current);
        current = [];
      }
    });
    return weeks;
  }

  protected toggleFocus(): void {
    if (this.focusRunning) {
      this.stopFocusTimer();
      return;
    }
    if (!this.focusSubjectId) {
      this.focusMessage = 'Choisissez une matière avant de démarrer.';
      return;
    }
    this.focusMessage = '';
    this.focusRunning = true;
    this.focusInterval = setInterval(() => {
      if (this.focusSeconds === 0) {
        if (this.focusMinutes === 0) {
          this.completeFocusSession();
          this.cdr.detectChanges();
          return;
        }
        this.focusMinutes--;
        this.focusSeconds = 59;
      } else {
        this.focusSeconds--;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  protected resetFocus(): void {
    this.stopFocusTimer();
    this.focusMinutes = 25;
    this.focusSeconds = 0;
    this.focusMessage = '';
    this.cdr.detectChanges();
  }

  protected generateQuiz(): void {
    if (!this.quizSubjectId) return;
    this.quiz = null;
    this.quizIndex = 0;
    this.quizSelected = null;
    this.quizScore = 0;
    this.quizFinished = false;
    this.innovation.generateQuiz(this.quizSubjectId, 5).subscribe((q) => {
      this.quiz = q;
      this.cdr.detectChanges();
    });
  }

  protected submitQuizAnswer(): void {
    if (!this.quiz || this.quizSelected === null) return;
    const current = this.quiz.questions[this.quizIndex];
    if (this.quizSelected === current.correctIndex) {
      this.quizScore++;
    }
    if (this.quizIndex >= this.quiz.questions.length - 1) {
      this.quizFinished = true;
      return;
    }
    this.quizIndex++;
    this.quizSelected = null;
  }

  protected currentQuestion(): QuizQuestion | null {
    return this.quiz?.questions[this.quizIndex] ?? null;
  }

  protected badgeProgress(b: Badge): number {
    return Math.min(100, Math.round((b.progress / Math.max(b.target, 1)) * 100));
  }

  protected formatFocus(): string {
    const m = String(this.focusMinutes).padStart(2, '0');
    const s = String(this.focusSeconds).padStart(2, '0');
    return `${m}:${s}`;
  }

  protected selectQuizOption(index: number): void {
    this.quizSelected = index;
  }

  private loadTabData(): void {
    switch (this.activeTab) {
      case 'streaks':
        this.innovation.getStreaks().subscribe((s) => {
          this.streaks = s;
          if (s) this.goalInput = s.dailyGoalMinutes;
          this.cdr.detectChanges();
        });
        break;
      case 'planner':
        this.innovation.getWeeklyPlan().subscribe((p) => {
          this.plan = p;
          this.cdr.detectChanges();
        });
        break;
      case 'heatmap':
        this.innovation.getHeatmap(12).subscribe((h) => {
          this.heatmap = h;
          this.cdr.detectChanges();
        });
        break;
      case 'badges':
        this.innovation.getBadges().subscribe((b) => {
          this.badges = b;
          this.cdr.detectChanges();
        });
        break;
    }
  }

  private stopFocusTimer(): void {
    this.focusRunning = false;
    if (this.focusInterval) {
      clearInterval(this.focusInterval);
      this.focusInterval = undefined;
    }
  }

  private completeFocusSession(): void {
    this.stopFocusTimer();
    const subjectId = this.focusSubjectId;
    if (!subjectId) return;

    const now = new Date();
    this.api
      .createSession({
        subjectId,
        durationMinutes: 25,
        date: now.toISOString().slice(0, 10),
        startHour: now.getHours(),
        startMinute: now.getMinutes()
      })
      .subscribe({
        next: () => {
          this.focusMessage = 'Session Pomodoro enregistrée (+25 min) !';
          this.resetFocus();
          this.innovation.getStreaks().subscribe((s) => {
            this.streaks = s;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.focusMessage = 'Impossible d\'enregistrer la session.';
          this.cdr.detectChanges();
        }
      });
  }
}
