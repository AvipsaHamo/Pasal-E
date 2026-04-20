// src/app/core/models/dashboard.models.ts

export interface DashboardSummary {
  revenue:        number;
  revenueDelta:   number;
  totalCustomers: number;
  customersDelta: number;
  totalOrders:    number;
  ordersDelta:    number;
  period:         string;
}

export interface ChartPoint {
  label:   string;
  income:  number;
  expense: number;
}

export interface ChartData {
  year:   number;
  month:  number;
  points: ChartPoint[];
}

export interface AvailableYears {
  years: number[];
}
