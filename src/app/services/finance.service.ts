import {
  computed,
  effect,
  Injectable,
  signal,
} from '@angular/core';
import {
  DistributionMode,
  DistributionSlice,
  FutureInstallmentRadar,
  Invoice,
  InvoiceStatusFilter,
  MonthlyProjection,
} from '../models/invoice.model';
import { addMonths, formatShortMonth, monthDiff } from '../utils/formatters';

const STORAGE_KEY = 'finagent_ai_invoices_v2';
const MONTH_STORAGE_KEY = 'finagent_ai_selected_month_v2';

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  readonly categoriesList = [
    'Alimentação',
    'Eletrônicos',
    'Moradia',
    'Transporte',
    'Saúde',
    'Assinaturas',
    'Educação',
    'Lazer',
    'Vestuário',
    'Outros',
  ];

  readonly quickPrompts = [
    'Onde estou gastando mais dinheiro?',
    'Quanto vou pagar de parcelas nos próximos 3 meses?',
    'Quais parcelas terminam logo e vão aliviar meu orçamento?',
    'Me dê um plano prático para reduzir 15% dos meus gastos.',
  ];

  // Estado Principal carregado exclusivamente do LocalStorage
  readonly selectedMonth = signal<string>(this.loadInitialSelectedMonth());
  readonly invoices = signal<Invoice[]>(this.loadInitialInvoices());
  readonly distributionMode = signal<DistributionMode>('category');
  readonly invoiceStatusFilter = signal<InvoiceStatusFilter>('all');
  readonly invoiceSearchQuery = signal<string>('');

  constructor() {
    // Sincroniza automaticamente com o LocalStorage sempre que houver alteração
    effect(() => {
      this.saveToStorage(this.invoices());
    });

    effect(() => {
      this.saveSelectedMonthToStorage(this.selectedMonth());
    });
  }

  // =========================================================================
  // PERSISTÊNCIA EM LOCALSTORAGE
  // =========================================================================

  private loadInitialInvoices(): Invoice[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar faturas do LocalStorage:', err);
    }
    return [];
  }

  private loadInitialSelectedMonth(): string {
    try {
      const saved = localStorage.getItem(MONTH_STORAGE_KEY);
      if (saved && /^\d{4}-\d{2}$/.test(saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private saveToStorage(invoices: Invoice[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (err) {
      console.error('Falha ao salvar no LocalStorage:', err);
    }
  }

  private saveSelectedMonthToStorage(month: string): void {
    try {
      localStorage.setItem(MONTH_STORAGE_KEY, month);
    } catch (err) {
      console.error('Falha ao salvar mês no LocalStorage:', err);
    }
  }

  // =========================================================================
  // COMPUTED SIGNALS (DASHBOARD, PROJEÇÕES 6 MESES & RADAR)
  // =========================================================================

  readonly currentMonthInvoices = computed(() => {
    const targetMonth = this.selectedMonth();
    return this.invoices().filter((inv) => inv.referenceMonth === targetMonth);
  });

  readonly currentMonthTotal = computed(() =>
    this.currentMonthInvoices().reduce((sum, inv) => sum + inv.totalAmount, 0)
  );

  readonly pendingMonthTotal = computed(() =>
    this.currentMonthInvoices()
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
  );

  readonly pendingInvoicesCount = computed(
    () =>
      this.currentMonthInvoices().filter((inv) => inv.status === 'pending')
        .length
  );

  readonly sixMonthProjections = computed<MonthlyProjection[]>(() => {
    const baseMonth = this.selectedMonth();
    const allInvoices = this.invoices();
    const result: MonthlyProjection[] = [];

    for (let offset = 0; offset < 6; offset++) {
      const monthKey = addMonths(baseMonth, offset);
      const isCurrent = offset === 0;

      // Faturas já lançadas explicitamente neste mês
      const monthInvoices = allInvoices.filter(
        (inv) => inv.referenceMonth === monthKey
      );
      const explicitTotal = monthInvoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      );

      let futureInstallments = 0;
      let recurringExpenses = 0;

      if (!isCurrent) {
        // Projeta parcelas e recorrências a partir das faturas de meses anteriores
        for (const inv of allInvoices) {
          const diff = monthDiff(inv.referenceMonth, monthKey);
          if (diff <= 0) continue;

          // Evita duplicar se já existe fatura lançada para o mesmo cartão no mês futuro
          const alreadyHasCardInTargetMonth = monthInvoices.some(
            (mInv) =>
              mInv.cardName.trim().toLowerCase() ===
              inv.cardName.trim().toLowerCase()
          );
          if (alreadyHasCardInTargetMonth) continue;

          for (const item of inv.items) {
            if (item.recurring) {
              recurringExpenses += item.amount;
            } else if (
              item.totalInstallments > 1 &&
              item.currentInstallment + diff <= item.totalInstallments
            ) {
              futureInstallments += item.amount;
            }
          }
        }
      }

      const total = explicitTotal + futureInstallments + recurringExpenses;
      result.push({
        monthKey,
        label: formatShortMonth(monthKey),
        isCurrent,
        actualOrCommitted: explicitTotal,
        futureInstallments,
        recurringExpenses,
        total,
      });
    }

    return result;
  });

  readonly nextMonthProjectedTotal = computed(() => {
    const proj = this.sixMonthProjections();
    return proj.length > 1 ? proj[1].total : 0;
  });

  readonly sixMonthsCommittedTotal = computed(() =>
    this.sixMonthProjections().reduce((sum, m) => sum + m.total, 0)
  );

  readonly futureInstallmentsRadar = computed<FutureInstallmentRadar[]>(() => {
    const baseMonth = this.selectedMonth();
    const list: FutureInstallmentRadar[] = [];
    const seenKeys = new Set<string>();

    // Ordena da mais recente para a mais antiga para pegar a parcela mais atualizada
    const sorted = [...this.invoices()].sort((a, b) =>
      b.referenceMonth.localeCompare(a.referenceMonth)
    );

    for (const inv of sorted) {
      if (inv.referenceMonth > baseMonth) continue;
      const diff = monthDiff(inv.referenceMonth, baseMonth);

      for (const item of inv.items) {
        const key = `${inv.cardName.toLowerCase()}-${item.description.toLowerCase()}`;
        if (seenKeys.has(key)) continue;

        if (item.recurring) {
          seenKeys.add(key);
          list.push({
            id: item.id,
            cardName: inv.cardName,
            description: item.description,
            category: item.category,
            monthlyAmount: item.amount,
            currentInstallment: 1,
            totalInstallments: 1,
            remainingMonths: 99,
            remainingTotal: item.amount * 6,
            isRecurring: true,
          });
        } else if (item.totalInstallments > 1) {
          const adjustedCurrent = item.currentInstallment + diff;
          if (adjustedCurrent <= item.totalInstallments) {
            seenKeys.add(key);
            const remainingMonths = item.totalInstallments - adjustedCurrent;
            list.push({
              id: item.id,
              cardName: inv.cardName,
              description: item.description,
              category: item.category,
              monthlyAmount: item.amount,
              currentInstallment: adjustedCurrent,
              totalInstallments: item.totalInstallments,
              remainingMonths,
              remainingTotal: remainingMonths * item.amount,
              isRecurring: false,
            });
          }
        }
      }
    }

    return list.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  });

  readonly distributionSlices = computed<DistributionSlice[]>(() => {
    const mode = this.distributionMode();
    const map = new Map<string, number>();

    for (const inv of this.currentMonthInvoices()) {
      if (mode === 'card') {
        map.set(inv.cardName, (map.get(inv.cardName) ?? 0) + inv.totalAmount);
      } else {
        if (inv.items.length > 0) {
          for (const item of inv.items) {
            map.set(
              item.category,
              (map.get(item.category) ?? 0) + item.amount
            );
          }
        } else {
          map.set('Outros', (map.get('Outros') ?? 0) + inv.totalAmount);
        }
      }
    }

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    if (total <= 0) return [];

    const palette = [
      '#6366f1',
      '#10b981',
      '#06b6d4',
      '#f59e0b',
      '#ec4899',
      '#8b5cf6',
      '#f43f5e',
    ];

    const circumference = 2 * Math.PI * 38; // r = 38
    let accumulatedPercent = 0;

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], index) => {
        const fraction = value / total;
        const strokeLength = fraction * circumference;
        const dashOffset = -accumulatedPercent * circumference;
        accumulatedPercent += fraction;

        return {
          label,
          value,
          percent: Math.round(fraction * 100),
          color: palette[index % palette.length],
          dashArray: `${strokeLength} ${circumference}`,
          dashOffset,
        };
      });
  });

  readonly filteredInvoices = computed(() => {
    const status = this.invoiceStatusFilter();
    const query = this.invoiceSearchQuery().trim().toLowerCase();

    return [...this.invoices()]
      .filter((inv) => status === 'all' || inv.status === status)
      .filter(
        (inv) =>
          !query ||
          inv.cardName.toLowerCase().includes(query) ||
          inv.items.some((it) => it.description.toLowerCase().includes(query))
      )
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  });

  // =========================================================================
  // MUTAÇÕES & AÇÕES (COM PERSISTÊNCIA DIRETA)
  // =========================================================================

  setSelectedMonth(month: string): void {
    if (month) {
      this.selectedMonth.set(month);
      this.saveSelectedMonthToStorage(month);
    }
  }

  setDistributionMode(mode: DistributionMode): void {
    this.distributionMode.set(mode);
  }

  setInvoiceStatusFilter(filter: InvoiceStatusFilter): void {
    this.invoiceStatusFilter.set(filter);
  }

  setInvoiceSearchQuery(query: string): void {
    this.invoiceSearchQuery.set(query);
  }

  toggleInvoiceStatus(id: string): Invoice | null {
    this.invoices.update((list) => {
      const updated = list.map((inv) =>
        inv.id === id
          ? { ...inv, status: (inv.status === 'paid' ? 'pending' : 'paid') as 'paid' | 'pending' }
          : inv
      );
      this.saveToStorage(updated);
      return updated;
    });
    return this.invoices().find((i) => i.id === id) ?? null;
  }

  deleteInvoice(id: string): void {
    this.invoices.update((list) => {
      const updated = list.filter((i) => i.id !== id);
      this.saveToStorage(updated);
      return updated;
    });
  }

  addInvoice(newInvoice: Invoice): void {
    this.invoices.update((list) => {
      const updated = [newInvoice, ...list];
      this.saveToStorage(updated);
      return updated;
    });
    this.setSelectedMonth(newInvoice.referenceMonth);
  }

  clearAllInvoices(): void {
    this.invoices.set([]);
    this.saveToStorage([]);
  }

  exportBackupJson(): void {
    const blob = new Blob([JSON.stringify(this.invoices(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finagent-backup-${this.selectedMonth()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importBackupJson(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result ?? ''));
          if (Array.isArray(parsed)) {
            this.invoices.set(parsed);
            this.saveToStorage(parsed);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }
}
