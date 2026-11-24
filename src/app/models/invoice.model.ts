export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  currentInstallment: number;
  totalInstallments: number;
  recurring: boolean;
}

export interface Invoice {
  id: string;
  cardName: string;
  dueDate: string; // YYYY-MM-DD
  referenceMonth: string; // YYYY-MM
  totalAmount: number;
  status: 'paid' | 'pending';
  items: InvoiceItem[];
  createdAt: string;
}

export interface MonthlyProjection {
  monthKey: string; // YYYY-MM
  label: string;
  isCurrent: boolean;
  actualOrCommitted: number;
  futureInstallments: number;
  recurringExpenses: number;
  total: number;
}

export interface FutureInstallmentRadar {
  id: string;
  cardName: string;
  description: string;
  category: string;
  monthlyAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  remainingMonths: number;
  remainingTotal: number;
  isRecurring: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface DistributionSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmDialog {
  title: string;
  message: string;
  onConfirm: () => void;
}

export type ActiveTab = 'dashboard' | 'upload' | 'invoices' | 'advisor';
export type InvoiceStatusFilter = 'all' | 'paid' | 'pending';
export type DistributionMode = 'category' | 'card';
