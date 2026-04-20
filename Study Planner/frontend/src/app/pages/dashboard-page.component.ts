import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Chart } from 'chart.js/auto';
import { ProductivityReport } from '../core/models';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html'
})
export class DashboardPageComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);

  @ViewChild('dailyCanvas') dailyCanvas?: ElementRef<HTMLCanvasElement>;

  subjectCount = 0;
  sessionCount = 0;
  score = 0;
  report: ProductivityReport | null = null;
  private dailyChart?: Chart;

  constructor() {
    forkJoin({
      subjects: this.api.getSubjects(),
      sessions: this.api.getSessions(),
      report: this.api.getAiReport(),
      daily: this.api.getDailyStats()
    }).subscribe(({ subjects, sessions, report, daily }) => {
      this.subjectCount = subjects.length;
      this.sessionCount = sessions.length;
      this.score = report.productivityScore;
      this.report = report;
      this.renderDailyChart(daily);
    });
  }

  ngAfterViewInit(): void {
    // Chart rendering happens after API data arrives and canvas is available.
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
  }

  private renderDailyChart(daily: Record<string, number>): void {
    if (!this.dailyCanvas) {
      setTimeout(() => this.renderDailyChart(daily), 0);
      return;
    }

    this.dailyChart?.destroy();
    this.dailyChart = new Chart(this.dailyCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(daily),
        datasets: [
          {
            label: 'Minutes',
            data: Object.values(daily),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
