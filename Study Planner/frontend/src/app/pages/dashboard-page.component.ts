import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, skip } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { Chart } from 'chart.js/auto';
import { ProductivityReport } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html'
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('dailyCanvas') dailyCanvas?: ElementRef<HTMLCanvasElement>;

  subjectCount = 0;
  sessionCount = 0;
  score = 0;
  report: ProductivityReport | null = null;
  loading = true;
  private dailyChart?: Chart;
  private pendingDaily: Record<string, number> | null = null;

  ngOnInit(): void {
    this.loadDashboard();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1)
      )
      .subscribe(() => this.loadDashboard());
  }

  ngAfterViewInit(): void {
    if (this.pendingDaily) {
      this.renderDailyChart(this.pendingDaily);
    }
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.api.getDashboardOverview().subscribe((overview) => {
      this.loading = false;
      if (!overview) {
        this.cdr.detectChanges();
        return;
      }

      this.subjectCount = overview.subjectCount;
      this.sessionCount = overview.sessionCount;
      this.score = Math.round(overview.productivityScore * 10) / 10;
      this.report = {
        mostActiveHour: overview.mostActiveHour,
        consistencyScore: overview.consistencyScore,
        productivityScore: overview.productivityScore,
        suggestions: overview.suggestions ?? []
      };
      this.pendingDaily = overview.dailyStats ?? {};
      this.renderDailyChart(this.pendingDaily);
      this.cdr.detectChanges();
    });
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
