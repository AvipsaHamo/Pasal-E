// src/app/dashboard/dashboard.component.ts
import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../core/services/dashboard.service';
import { DashboardSummary, ChartData } from '../core/models/dashboard.models';
import { Chart, registerables, TooltipItem } from 'chart.js';

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
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  summary: DashboardSummary | null = null;
  summaryLoading = true;
  chartLoading   = true;

  // Summary period
  summaryPeriod: 'month' | 'year' = 'month';
  showSummaryDropdown = false;

  // Chart filters
  availableYears: number[]  = [];
  selectedYear:   number    = new Date().getFullYear();
  selectedMonth:  number    = new Date().getMonth() + 1;
  showYearDropdown   = false;
  showMonthDropdown  = false;

  readonly monthNames = MONTH_NAMES;
  private chart: Chart | null = null;

  constructor(
    private dashSvc: DashboardService,
    private cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadYears();
  }

  ngAfterViewInit(): void {
    this.loadChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  loadSummary(): void {
    this.summaryLoading = true;
    this.dashSvc.getSummary(this.summaryPeriod).subscribe({
      next:  s => { this.summary = s; this.summaryLoading = false; },
      error: () => { this.summaryLoading = false; }
    });
  }

  setSummaryPeriod(p: 'month' | 'year'): void {
    this.summaryPeriod    = p;
    this.showSummaryDropdown = false;
    this.loadSummary();
  }

  get summaryPeriodLabel(): string {
    return this.summaryPeriod === 'month' ? 'Month' : 'Year';
  }

  get deltaLabel(): string {
    return this.summaryPeriod === 'month' ? 'than last month' : 'than last year';
  }

  formatDelta(n: number): string {
    return n >= 0 ? `+${n.toLocaleString()}` : `${n.toLocaleString()}`;
  }

  isDeltaPositive(n: number): boolean { return n >= 0; }

  // ── Chart ────────────────────────────────────────────────────────────────
  loadYears(): void {
    this.dashSvc.getAvailableYears().subscribe({
      next: y => {
        this.availableYears = y.years;
        if (!this.availableYears.includes(this.selectedYear)) {
          this.selectedYear = this.availableYears[this.availableYears.length - 1] ?? new Date().getFullYear();
        }
      }
    });
  }

  loadChart(): void {
    this.chartLoading = true;
    this.dashSvc.getChart(this.selectedYear, this.selectedMonth).subscribe({
      next: data => {
        this.chartLoading = false;
        this.cdr.detectChanges();
        this.renderChart(data);
      },
      error: () => { this.chartLoading = false; }
    });
  }

  setYear(y: number): void {
    this.selectedYear   = y;
    this.showYearDropdown = false;
    this.loadChart();
  }

  setMonth(m: number): void {
    this.selectedMonth    = m;
    this.showMonthDropdown = false;
    this.loadChart();
  }

  get selectedMonthName(): string { return MONTH_NAMES[this.selectedMonth - 1]; }

  private renderChart(data: ChartData): void {
    if (!this.chartCanvas) return;
    this.chart?.destroy();

    const ctx    = this.chartCanvas.nativeElement.getContext('2d')!;
    const labels = data.points.map(p => p.label);
    const income  = data.points.map(p => p.income);
    const expense = data.points.map(p => p.expense);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label:           'Income',
            data:            income,
            borderColor:     '#5a7030',
            backgroundColor: 'rgba(90, 112, 48, 0.08)',
            borderWidth:     2.5,
            pointRadius:     0,
            pointHoverRadius: 5,
            tension:         0.45,
            fill:            true
          },
          {
            label:           'Expense',
            data:            expense,
            borderColor:     '#e8720c',
            backgroundColor: 'rgba(232, 114, 12, 0.06)',
            borderWidth:     2.5,
            pointRadius:     0,
            pointHoverRadius: 5,
            tension:         0.45,
            fill:            true
          }
        ]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false }, // custom legend in HTML
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor:      '#333',
            bodyColor:       '#555',
            borderColor:     '#e0e8c8',
            borderWidth:     1,
            padding:         10,
            callbacks: {
              label: (ctx: TooltipItem<'line'>) => ` ${ctx.dataset.label}: Rs ${(ctx.parsed.y ?? 0).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid:  { display: false },
            ticks: { color: '#999', font: { family: 'Nunito', size: 12, weight: 600 } },
            border: { display: false }
          },
          y: {
            grid:  { color: 'rgba(0,0,0,0.06)', lineWidth: 1 },
            ticks: {
              color: '#999',
              font:  { family: 'Nunito', size: 12, weight: 600 },
              callback: (v: string | number) => `Rs ${Number(v).toLocaleString()}`
            },
            border: { display: false }
          }
        }
      }
    });
  }

  // Close dropdowns on outside click
  closeDropdowns(): void {
    this.showSummaryDropdown = false;
    this.showYearDropdown    = false;
    this.showMonthDropdown   = false;
  }
}
