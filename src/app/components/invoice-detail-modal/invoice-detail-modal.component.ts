import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { FinanceService } from '../../services/finance.service';
import { Invoice } from '../../models/invoice.model';
import {
  formatBRL,
  formatDateBR,
  formatMonthLabel,
} from '../../utils/formatters';

@Component({
  selector: 'app-invoice-detail-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (uiService.selectedInvoice(); as inv) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
        (click)="uiService.closeInvoiceModal()"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div
            class="p-5 border-b border-slate-800 flex items-center justify-between"
          >
            <div>
              <div class="flex items-center gap-2.5">
                <h3 class="text-lg font-bold text-white">{{ inv.cardName }}</h3>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  [class]="
                    inv.status === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  "
                >
                  {{ inv.status === 'paid' ? 'Paga' : 'Pendente' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Referência: {{ formatMonth(inv.referenceMonth) }} •
                Vencimento: {{ formatDate(inv.dueDate) }}
              </p>
            </div>
            <button
              type="button"
              (click)="uiService.closeInvoiceModal()"
              class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Content -->
          <div class="p-5 overflow-y-auto flex-1 space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span class="text-xs text-slate-400 block">Valor Total</span>
                <span class="text-lg font-bold text-emerald-400">{{
                  formatCurrency(inv.totalAmount)
                }}</span>
              </div>
              <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span class="text-xs text-slate-400 block">Lançamentos</span>
                <span class="text-lg font-bold text-white"
                  >{{ inv.items.length }} itens</span
                >
              </div>
              <div
                class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1"
              >
                <span class="text-xs text-slate-400 block">Parcelados/Fixos</span>
                <span class="text-lg font-bold text-indigo-400">
                  {{ countProjected(inv) }} ativos
                </span>
              </div>
            </div>

            <div>
              <h4
                class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5"
              >
                Itens da Fatura
              </h4>
              <div
                class="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden"
              >
                @for (item of inv.items; track item.id) {
                  <div
                    class="p-3.5 bg-slate-950/40 flex items-center justify-between gap-3"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-100 truncate">
                        {{ item.description }}
                      </p>
                      <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          class="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                        >
                          {{ item.category }}
                        </span>
                        @if (item.totalInstallments > 1) {
                          <span
                            class="text-[11px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium"
                          >
                            Parcela {{ item.currentInstallment }}/{{
                              item.totalInstallments
                            }}
                          </span>
                        }
                        @if (item.recurring) {
                          <span
                            class="text-[11px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium"
                          >
                            Recorrente
                          </span>
                        }
                      </div>
                    </div>
                    <span class="text-sm font-bold text-white shrink-0">
                      {{ formatCurrency(item.amount) }}
                    </span>
                  </div>
                } @empty {
                  <div class="p-4 text-sm text-slate-400 text-center">
                    Nenhum item detalhado nesta fatura.
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div
            class="p-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-slate-950/50 rounded-b-2xl"
          >
            <button
              type="button"
              (click)="onDeleteInvoice(inv)"
              class="px-4 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
            >
              Excluir Fatura
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="onToggleStatus(inv.id)"
                class="px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                [class]="
                  inv.status === 'paid'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                "
              >
                {{
                  inv.status === 'paid'
                    ? 'Marcar como Pendente'
                    : 'Marcar como Paga'
                }}
              </button>
              <button
                type="button"
                (click)="uiService.closeInvoiceModal()"
                class="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class InvoiceDetailModalComponent {
  readonly uiService = inject(UiService);
  readonly financeService = inject(FinanceService);

  formatCurrency(value: number): string {
    return formatBRL(value);
  }

  formatDate(date: string): string {
    return formatDateBR(date);
  }

  formatMonth(month: string): string {
    return formatMonthLabel(month);
  }

  countProjected(inv: Invoice): number {
    return inv.items.filter((i) => i.recurring || i.totalInstallments > 1)
      .length;
  }

  onToggleStatus(id: string): void {
    const updated = this.financeService.toggleInvoiceStatus(id);
    if (updated) {
      this.uiService.openInvoiceModal(updated);
    }
    this.uiService.showToast('Status da fatura atualizado!', 'success');
  }

  onDeleteInvoice(inv: Invoice): void {
    this.uiService.openConfirm({
      title: 'Excluir Fatura',
      message: `Deseja realmente excluir a fatura "${inv.cardName}" (${formatBRL(inv.totalAmount)})?`,
      onConfirm: () => {
        this.financeService.deleteInvoice(inv.id);
        this.uiService.closeInvoiceModal();
        this.uiService.showToast('Fatura removida com sucesso.', 'info');
      },
    });
  }
}
