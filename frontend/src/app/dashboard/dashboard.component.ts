import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { DashboardService } from '../core/services/dashboard.service';
import { DashboardSummary, ChartData } from '../core/models/dashboard.models';
import { DestroyableComponent } from '../core/base/destroyable.base';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  summary:        DashboardSummary | null = null;
  summaryLoading  = true;
  summaryError    = '';
  chartLoading    = true;
  chartError      = '';

  summaryPeriod: 'month' | 'year' = 'month';
  showSummaryDropdown = false;

  availableYears: number[] = [];
  selectedYear:   number   = new Date().getFullYear();
  selectedMonth:  number   = new Date().getMonth() + 1;
  showYearDropdown  = false;
  showMonthDropdown = false;

  readonly monthNames = MONTH_NAMES;
  private chart: Chart | null = null;

  constructor(private dashSvc: DashboardService, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.loadSummary();
    this.loadYears();
  }

  // ngOnDestroy comes from DestroyableComponent, but we also destroy the chart
  override ngOnDestroy(): void {
    this.chart?.destroy();
    super.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    this.loadChart();
  }

  loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError   = '';
    this.dashSvc.getSummary(this.summaryPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  s => { this.summary = s; this.summaryLoading = false; },
        error: (err: { error?: { message?: string } }) => {
          this.summaryLoading = false;
          this.summaryError   = err?.error?.message ?? 'Failed to load summary.';
        }
      });
  }

  setSummaryPeriod(p: 'month' | 'year'): void {
    this.summaryPeriod       = p;
    this.showSummaryDropdown = false;
    this.loadSummary();
  }

  get summaryPeriodLabel(): string { return this.summaryPeriod === 'month' ? 'Month' : 'Year'; }
  get deltaLabel():         string { return this.summaryPeriod === 'month' ? 'than last month' : 'than last year'; }

  formatDelta(n: number): string        { return n >= 0 ? `+${n.toLocaleString()}` : `${n.toLocaleString()}`; }
  isDeltaPositive(n: number): boolean   { return n >= 0; }

  loadYears(): void {
    this.dashSvc.getAvailableYears()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: y => {
          this.availableYears = y.years;
          if (!this.availableYears.includes(this.selectedYear))
            this.selectedYear = this.availableYears.at(-1) ?? new Date().getFullYear();
        },
        error: (err: { error?: { message?: string } }) =>
          console.error('Failed to load years:', err?.error?.message ?? err)
      });
  }

  loadChart(): void {
    this.chartLoading = true;
    this.chartError   = '';
    this.dashSvc.getChart(this.selectedYear, this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.chartLoading = false;
          this.cdr.detectChanges();
          this.renderChart(data);
        },
        error: (err: { error?: { message?: string } }) => {
          this.chartLoading = false;
          this.chartError   = err?.error?.message ?? 'Failed to load chart data.';
        }
      });
  }

  setYear(y: number): void  { this.selectedYear = y; this.showYearDropdown = false; this.loadChart(); }
  setMonth(m: number): void { this.selectedMonth = m; this.showMonthDropdown = false; this.loadChart(); }

  get selectedMonthName(): string { return MONTH_NAMES[this.selectedMonth - 1]; }

  private renderChart(data: ChartData): void {
    if (!this.chartCanvas?.nativeElement) return;
    this.chart?.destroy();

    const ctx     = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels  = data.points.map(p => p.label);
    const income  = data.points.map(p => p.income);
    const expense = data.points.map(p => p.expense);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income', data: income,
            borderColor: '#5a7030', backgroundColor: 'rgba(90,112,48,0.08)',
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, tension: 0.45, fill: true
          },
          {
            label: 'Expense', data: expense,
            borderColor: '#e8720c', backgroundColor: 'rgba(232,114,12,0.06)',
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, tension: 0.45, fill: true
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff', titleColor: '#333', bodyColor: '#555',
            borderColor: '#e0e8c8', borderWidth: 1, padding: 10,
              callbacks: { label: ctx => ` ${ctx.dataset.label}: Rs ${(ctx.parsed.y ?? 0).toLocaleString()}` }
          }
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false },
              ticks: { color: '#999', font: { family: 'Nunito', size: 12, weight: 600 } }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.06)' }, border: { display: false },
            ticks: {
                color: '#999', font: { family: 'Nunito', size: 12, weight: 600 },
              callback: v => `Rs ${Number(v).toLocaleString()}`
            }
          }
        }
      }
    });
  }

  closeDropdowns(): void {
    this.showSummaryDropdown = false;
    this.showYearDropdown    = false;
    this.showMonthDropdown   = false;
  }
}
