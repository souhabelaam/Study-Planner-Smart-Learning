import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { ProductivityReport } from '../core/models';
import { Chart } from 'chart.js/auto';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-stats-page',
  templateUrl: './stats-page.component.html'
})
export class StatsPageComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);

  @ViewChild('dailyCanvas') dailyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyCanvas') weeklyCanvas?: ElementRef<HTMLCanvasElement>;

  daily: Record<string, number> = {};
  weekly: Record<string, number> = {};
  report: ProductivityReport | null = null;
  private dailyChart?: Chart;
  private weeklyChart?: Chart;

  constructor() {
    forkJoin({
      daily: this.api.getDailyStats(),
      weekly: this.api.getWeeklyStats(),
      report: this.api.getAiReport()
    }).subscribe(({ daily, weekly, report }) => {
      this.daily = daily;
      this.weekly = weekly;
      this.report = report;
      this.renderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
    this.weeklyChart?.destroy();
  }

  private renderCharts(): void {
    if (!this.dailyCanvas || !this.weeklyCanvas) {
      return;
    }

    this.dailyChart?.destroy();
    this.weeklyChart?.destroy();

    this.dailyChart = new Chart(this.dailyCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(this.daily),
        datasets: [
          {
            label: 'Minutes',
            data: Object.values(this.daily),
            backgroundColor: 'rgba(93,214,192,0.6)',
            borderColor: 'rgba(93,214,192,1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });

    this.weeklyChart = new Chart(this.weeklyCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: Object.keys(this.weekly),
        datasets: [
          {
            label: 'Minutes',
            data: Object.values(this.weekly),
            backgroundColor: 'rgba(108,99,255,0.15)',
            borderColor: 'rgba(108,99,255,1)',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
