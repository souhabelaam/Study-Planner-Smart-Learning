import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.component.html'
})
export class HomePageComponent {
  protected readonly auth = inject(AuthService);

  protected readonly features = [
    {
      icon: '🔥',
      title: 'Séries & objectifs',
      desc: 'Suivez vos jours consécutifs et atteignez votre quota quotidien personnalisé.',
      tab: 'streaks'
    },
    {
      icon: '⏱️',
      title: 'Focus Pomodoro',
      desc: 'Sessions de concentration chronométrées avec enregistrement automatique.',
      tab: 'focus'
    },
    {
      icon: '🧠',
      title: 'Plan hebdo IA',
      desc: 'Planning adaptatif basé sur vos matières les moins travaillées.',
      tab: 'planner'
    },
    {
      icon: '📊',
      title: 'Heatmap d\'activité',
      desc: 'Visualisez 12 semaines d\'effort comme sur GitHub.',
      tab: 'heatmap'
    },
    {
      icon: '🏆',
      title: 'Badges & gamification',
      desc: 'Débloquez des récompenses en progressant dans vos études.',
      tab: 'badges'
    },
    {
      icon: '❓',
      title: 'Quiz intelligent',
      desc: 'Testez vos connaissances par matière avec feedback instantané.',
      tab: 'quiz'
    }
  ];
}
