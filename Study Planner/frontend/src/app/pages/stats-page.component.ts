import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { ProductivityReport } from '../core/models';
import { Chart } from 'chart.js/auto';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-stats-page',
  templateUrl: './stats-page.component.html'
})
export class StatsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('dailyCanvas') dailyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyCanvas') weeklyCanvas?: ElementRef<HTMLCanvasElement>;

  daily: Record<string, number> = {};
  weekly: Record<string, number> = {};
  report: ProductivityReport | null = null;
  loading = true;

  private dailyChart?: Chart;
  private weeklyChart?: Chart;
  private viewReady = false;
  private dataReady = false;

  ngOnInit(): void {
    forkJoin({
      daily: this.api.getDailyStats(),
      weekly: this.api.getWeeklyStats(),
      report: this.api.getAiReport().pipe(catchError(() => of(null)))
    }).subscribe(({ daily, weekly, report }) => {
      this.daily = daily;
      this.weekly = weekly;
      this.report = report;
      this.loading = false;
      this.dataReady = true;
      this.cdr.detectChanges();
      if (this.viewReady) {
        this.renderCharts();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
    this.weeklyChart?.destroy();
  }

  private renderCharts(): void {
    if (!this.dailyCanvas || !this.weeklyCanvas) return;

    this.dailyChart?.destroy();
    this.weeklyChart?.destroy();

    const dailyLabels = Object.keys(this.daily);
    const dailyValues = Object.values(this.daily);
    const weeklyLabels = Object.keys(this.weekly);
    const weeklyValues = Object.values(this.weekly);

    this.dailyChart = new Chart(this.dailyCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: dailyLabels,
        datasets: [
          {
            label: 'Minutes',
            data: dailyValues,
            backgroundColor: 'rgba(93,214,192,0.6)',
            borderColor: 'rgba(93,214,192,1)',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
      }
    });

    this.weeklyChart = new Chart(this.weeklyCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: weeklyLabels,
        datasets: [
          {
            label: 'Minutes',
            data: weeklyValues,
            backgroundColor: 'rgba(108,99,255,0.15)',
            borderColor: 'rgba(108,99,255,1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: 'rgba(108,99,255,1)',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
      }
    });

    this.cdr.detectChanges();
  }
}

