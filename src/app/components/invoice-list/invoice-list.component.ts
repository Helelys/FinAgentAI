import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { UiService } from '../../services/ui.service';
import { Invoice, InvoiceStatusFilter } from '../../models/invoice.model';
import {
  formatBRL,
  formatDateBR,
  formatMonthLabel,
} from '../../utils/formatters';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <!-- Barra de Filtros -->
      <div
        class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="setFilter('all')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            [class]="
              financeService.invoiceStatusFilter() === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
          >
            Todas ({{ financeService.invoices().length }})
          </button>
          <button
            type="button"
            (click)="setFilter('pending')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            [class]="
              financeService.invoiceStatusFilter() === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
          >
            Pendentes
          </button>
          <button
            type="button"
            (click)="setFilter('paid')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            [class]="
              financeService.invoiceStatusFilter() === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            "
          >
            Pagas
          </button>
        </div>

        <input
          type="text"
          [value]="financeService.invoiceSearchQuery()"
          (input)="onSearchChange($event)"
          placeholder="Filtrar por cartão ou item..."
          class="w-full sm:w-64 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none px-3.5 py-2 text-xs text-white"
        />
      </div>

      <!-- Lista de Faturas -->
      <div
        class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400"
              >
                <th class="py-3.5 px-4">Cartão / Conta</th>
                <th class="py-3.5 px-4">Referência</th>
                <th class="py-3.5 px-4">Vencimento</th>
                <th class="py-3.5 px-4">Itens</th>
                <th class="py-3.5 px-4 text-right">Valor Total</th>
                <th class="py-3.5 px-4 text-center">Status</th>
                <th class="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 text-sm">
              @for (inv of financeService.filteredInvoices(); track inv.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3.5 px-4 font-bold text-white">
                    {{ inv.cardName }}
                  </td>
                  <td class="py-3.5 px-4 text-xs text-slate-300">
                    {{ formatMonth(inv.referenceMonth) }}
                  </td>
                  <td class="py-3.5 px-4 text-xs text-slate-300">
                    {{ formatDate(inv.dueDate) }}
                  </td>
                  <td class="py-3.5 px-4 text-xs text-slate-400">
                    {{ inv.items.length }} itens
                  </td>
                  <td
                    class="py-3.5 px-4 text-right font-extrabold text-white"
                  >
                    {{ formatCurrency(inv.totalAmount) }}
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      (click)="onToggleStatus(inv.id)"
                      class="px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
                      [class]="
                        inv.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      "
                    >
                      {{ inv.status === 'paid' ? 'Paga' : 'Pendente' }}
                    </button>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="inline-flex items-center gap-2">
                      <button
                        type="button"
                        (click)="uiService.openInvoiceModal(inv)"
                        class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        (click)="onRequestDelete(inv)"
                        class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-medium text-rose-400 transition cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    colspan="7"
                    class="py-8 text-center text-sm text-slate-400"
                  >
                    Nenhuma fatura encontrada com os filtros atuais.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class InvoiceListComponent {
  readonly financeService = inject(FinanceService);
  readonly uiService = inject(UiService);

  setFilter(filter: InvoiceStatusFilter): void {
    this.financeService.setInvoiceStatusFilter(filter);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.financeService.setInvoiceSearchQuery(input.value);
  }

  formatCurrency(value: number): string {
    return formatBRL(value);
  }

  formatDate(date: string): string {
    return formatDateBR(date);
  }

  formatMonth(month: string): string {
    return formatMonthLabel(month);
  }

  onToggleStatus(id: string): void {
    this.financeService.toggleInvoiceStatus(id);
    this.uiService.showToast('Status da fatura atualizado!', 'success');
  }

  onRequestDelete(inv: Invoice): void {
    this.uiService.openConfirm({
      title: 'Excluir Fatura',
      message: `Deseja realmente excluir a fatura "${inv.cardName}" (${formatBRL(inv.totalAmount)})?`,
      onConfirm: () => {
        this.financeService.deleteInvoice(inv.id);
        this.uiService.showToast('Fatura removida com sucesso.', 'info');
      },
    });
  }
}
