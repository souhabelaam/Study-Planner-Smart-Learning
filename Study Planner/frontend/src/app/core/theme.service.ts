import { Injectable } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'study-planner-theme';

  init(): void {
    const saved = this.getSavedTheme();
    const initial: Theme =
      saved ??
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(initial);
  }

  toggle(): Theme {
    const next: Theme = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    return next;
  }

  getTheme(): Theme {
    return document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light';
  }

  private getSavedTheme(): Theme | null {
    const v = localStorage.getItem(this.storageKey);
    return v === 'dark' || v === 'light' ? v : null;
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme;
    localStorage.setItem(this.storageKey, theme);
  }
}
