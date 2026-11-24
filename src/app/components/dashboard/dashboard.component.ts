import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { UiService } from '../../services/ui.service';
import { Invoice } from '../../models/invoice.model';
import {
  formatBRL,
  formatCompactBRL,
  formatDateBR,
  formatMonthLabel,
} from '../../utils/formatters';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- KPIs em Tempo Real -->
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">
              Gasto Total ({{ formatMonth(financeService.selectedMonth()) }})
            </span>
            <span
              class="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm font-bold"
            >
              R$
            </span>
          </div>
          <p class="text-2xl font-extrabold text-white">
            {{ formatCurrency(financeService.currentMonthTotal()) }}
          </p>
          <p class="text-xs text-slate-400 mt-1.5">
            {{ financeService.currentMonthInvoices().length }} fatura(s) neste
            mês
          </p>
        </div>

        <div
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400"
              >Faturas Pendentes</span
            >
            <span
              class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-bold"
            >
              !
            </span>
          </div>
          <p class="text-2xl font-extrabold text-amber-400">
            {{ formatCurrency(financeService.pendingMonthTotal()) }}
          </p>
          <p class="text-xs text-slate-400 mt-1.5">
            {{ financeService.pendingInvoicesCount() }} fatura(s) aguardando
            pagamento
          </p>
        </div>

        <div
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400"
              >Previsão Próximo Mês</span
            >
            <span
              class="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-sm font-bold"
            >
              →
            </span>
          </div>
          <p class="text-2xl font-extrabold text-cyan-400">
            {{ formatCurrency(financeService.nextMonthProjectedTotal()) }}
          </p>
          <p class="text-xs text-slate-400 mt-1.5">
            Parcelas futuras + contas recorrentes
          </p>
        </div>

        <div
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400"
              >Total Comprometido (6 Meses)</span
            >
            <span
              class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm font-bold"
            >
              6M
            </span>
          </div>
          <p class="text-2xl font-extrabold text-emerald-400">
            {{ formatCurrency(financeService.sixMonthsCommittedTotal()) }}
          </p>
          <p class="text-xs text-slate-400 mt-1.5">
            Projeção acumulada ({{
              formatMonth(financeService.selectedMonth())
            }}
            + 5m)
          </p>
        </div>
      </section>

      <!-- Gráficos: Barras 6 Meses + Rosca Distribuição -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Gráfico de Barras Empilhadas (6 Meses) -->
        <div
          class="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="text-base font-bold text-white">
                Gastos Reais vs. Projeção Futura (6 Meses)
              </h3>
              <p class="text-xs text-slate-400">
                Cálculo automático das parcelas restantes e despesas recorrentes
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <span class="flex items-center gap-1.5 text-slate-300">
                <span class="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span>
                Faturas/À Vista
              </span>
              <span class="flex items-center gap-1.5 text-slate-300">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                Parcelas Futuras
              </span>
              <span class="flex items-center gap-1.5 text-slate-300">
                <span class="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
                Recorrentes
              </span>
            </div>
          </div>

          <!-- Gráfico SVG Responsivo -->
          <div class="w-full pt-2">
            <div
              class="grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 pt-6 px-1 border-b border-slate-800"
            >
              @for (
                bar of financeService.sixMonthProjections();
                track bar.monthKey
              ) {
                <div
                  class="flex flex-col items-center h-full justify-end group relative"
                >
                  <!-- Tooltip no hover -->
                  <div
                    class="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-2 z-20 bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-xl text-[11px] whitespace-nowrap"
                  >
                    <p class="font-bold text-white">
                      {{ formatCurrency(bar.total) }}
                    </p>
                    @if (bar.actualOrCommitted > 0) {
                      <p class="text-indigo-300">
                        Fatura: {{ formatCurrency(bar.actualOrCommitted) }}
                      </p>
                    }
                    @if (bar.futureInstallments > 0) {
                      <p class="text-emerald-300">
                        Parcelas: {{ formatCurrency(bar.futureInstallments) }}
                      </p>
                    }
                    @if (bar.recurringExpenses > 0) {
                      <p class="text-cyan-300">
                        Fixos: {{ formatCurrency(bar.recurringExpenses) }}
                      </p>
                    }
                  </div>

                  <!-- Valor compacto acima da barra -->
                  <span
                    class="text-[10px] sm:text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    {{ formatCompact(bar.total) }}
                  </span>

                  <!-- Barra Empilhada -->
                  <div
                    class="w-full max-w-[44px] rounded-t-lg overflow-hidden flex flex-col-reverse bg-slate-800/40 transition-all duration-500"
                    [style.height.%]="getBarHeightPercent(bar.total)"
                  >
                    @if (bar.actualOrCommitted > 0) {
                      <div
                        class="w-full bg-indigo-500 transition-all duration-500"
                        [style.height.%]="
                          (bar.actualOrCommitted / (bar.total || 1)) * 100
                        "
                      ></div>
                    }
                    @if (bar.futureInstallments > 0) {
                      <div
                        class="w-full bg-emerald-500 transition-all duration-500"
                        [style.height.%]="
                          (bar.futureInstallments / (bar.total || 1)) * 100
                        "
                      ></div>
                    }
                    @if (bar.recurringExpenses > 0) {
                      <div
                        class="w-full bg-cyan-500 transition-all duration-500"
                        [style.height.%]="
                          (bar.recurringExpenses / (bar.total || 1)) * 100
                        "
                      ></div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Rótulos dos Meses -->
            <div class="grid grid-cols-6 gap-2 sm:gap-4 pt-2.5 text-center">
              @for (
                bar of financeService.sixMonthProjections();
                track bar.monthKey
              ) {
                <div>
                  <span
                    class="text-xs font-semibold block"
                    [class]="
                      bar.isCurrent ? 'text-indigo-400' : 'text-slate-400'
                    "
                  >
                    {{ bar.label }}
                  </span>
                  @if (bar.isCurrent) {
                    <span class="text-[10px] text-indigo-400/80 font-medium"
                      >Atual</span
                    >
                  } @else {
                    <span class="text-[10px] text-slate-500">Prev.</span>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Gráfico de Rosca (Distribuição por Categoria ou Cartão) -->
        <div
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between"
        >
          <div class="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 class="text-base font-bold text-white">Distribuição</h3>
              <p class="text-xs text-slate-400">
                {{ formatMonth(financeService.selectedMonth()) }}
              </p>
            </div>
            <div
              class="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs"
            >
              <button
                type="button"
                (click)="financeService.setDistributionMode('category')"
                class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                [class]="
                  financeService.distributionMode() === 'category'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                "
              >
                Categoria
              </button>
              <button
                type="button"
                (click)="financeService.setDistributionMode('card')"
                class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                [class]="
                  financeService.distributionMode() === 'card'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                "
              >
                Cartão
              </button>
            </div>
          </div>

          @if (financeService.distributionSlices().length > 0) {
            <div class="flex flex-col items-center my-auto">
              <!-- Rosca SVG -->
              <div class="relative w-44 h-44">
                <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                  @for (
                    slice of financeService.distributionSlices();
                    track slice.label
                  ) {
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      [attr.stroke]="slice.color"
                      stroke-width="14"
                      [attr.stroke-dasharray]="slice.dashArray"
                      [attr.stroke-dashoffset]="slice.dashOffset"
                      class="transition-all duration-500"
                    />
                  }
                </svg>
                <div
                  class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
                >
                  <span class="text-[10px] uppercase text-slate-400">Total</span>
                  <span class="text-sm font-extrabold text-white">
                    {{ formatCompact(financeService.currentMonthTotal()) }}
                  </span>
                </div>
              </div>

              <!-- Legenda -->
              <div class="w-full mt-4 space-y-2 max-h-36 overflow-y-auto">
                @for (
                  slice of financeService.distributionSlices();
                  track slice.label
                ) {
                  <div
                    class="flex items-center justify-between text-xs gap-2"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="w-2.5 h-2.5 rounded-full shrink-0"
                        [style.background-color]="slice.color"
                      ></span>
                      <span class="text-slate-300 truncate">{{
                        slice.label
                      }}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="font-semibold text-white">{{
                        formatCurrency(slice.value)
                      }}</span>
                      <span class="text-slate-500 w-9 text-right"
                        >{{ slice.percent }}%</span
                      >
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="my-auto py-10 text-center text-sm text-slate-400">
              Nenhuma fatura lançada neste mês.
            </div>
          }
        </div>
      </section>

      <!-- Cartões / Faturas do Mês Atual -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-bold text-white">
            Cartões & Faturas ({{ formatMonth(financeService.selectedMonth()) }})
          </h3>
          <button
            type="button"
            (click)="uiService.setActiveTab('invoices')"
            class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            Ver todas ({{ financeService.invoices().length }}) →
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (inv of financeService.currentMonthInvoices(); track inv.id) {
            <div
              class="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between gap-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span class="text-xs font-medium text-slate-400 block mb-0.5">
                    Vence em {{ formatDate(inv.dueDate) }}
                  </span>
                  <h4 class="text-base font-bold text-white">
                    {{ inv.cardName }}
                  </h4>
                </div>
                <button
                  type="button"
                  (click)="onToggleStatus(inv.id)"
                  class="px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
                  [class]="
                    inv.status === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                  "
                  title="Clique para alternar status"
                >
                  {{ inv.status === 'paid' ? '✓ Paga' : '⏳ Pendente' }}
                </button>
              </div>

              <div>
                <span class="text-xs text-slate-400">Valor da Fatura</span>
                <p class="text-2xl font-extrabold text-white">
                  {{ formatCurrency(inv.totalAmount) }}
                </p>
              </div>

              <div
                class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2"
              >
                <span class="text-xs text-slate-400">
                  {{ inv.items.length }} lançamento(s)
                </span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="uiService.openInvoiceModal(inv)"
                    class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    (click)="onRequestDelete(inv)"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 transition cursor-pointer"
                    title="Excluir fatura"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center"
            >
              <p class="text-sm text-slate-300 font-medium mb-2">
                Nenhuma fatura cadastrada para
                {{ formatMonth(financeService.selectedMonth()) }}.
              </p>
              <button
                type="button"
                (click)="uiService.setActiveTab('upload')"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition cursor-pointer"
              >
                Anexar Fatura com IA
              </button>
            </div>
          }
        </div>
      </section>

      <!-- Radar de Parcelas Futuras & Contas Recorrentes -->
      <section
        class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg"
      >
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">
              Radar de Parcelas Futuras & Contas Recorrentes
            </h3>
            <p class="text-xs text-slate-400">
              Compras parceladas e assinaturas que continuarão gerando cobranças
              nos próximos meses
            </p>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
          >
            {{ financeService.futureInstallmentsRadar().length }} compromissos
            ativos
          </span>
        </div>

        @if (financeService.futureInstallmentsRadar().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400"
                >
                  <th class="py-3 px-3">Descrição</th>
                  <th class="py-3 px-3">Cartão</th>
                  <th class="py-3 px-3">Categoria</th>
                  <th class="py-3 px-3">Progresso</th>
                  <th class="py-3 px-3 text-right">Valor Mensal</th>
                  <th class="py-3 px-3 text-right">Saldo Restante</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/70 text-sm">
                @for (
                  item of financeService.futureInstallmentsRadar();
                  track item.id
                ) {
                  <tr class="hover:bg-slate-800/30 transition">
                    <td class="py-3 px-3 font-medium text-white">
                      {{ item.description }}
                    </td>
                    <td class="py-3 px-3 text-xs text-slate-300">
                      {{ item.cardName }}
                    </td>
                    <td class="py-3 px-3">
                      <span
                        class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                        >{{ item.category }}</span
                      >
                    </td>
                    <td class="py-3 px-3">
                      @if (item.isRecurring) {
                        <span
                          class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium"
                        >
                          Mensal Fixo
                        </span>
                      } @else {
                        <span
                          class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                        >
                          {{ item.currentInstallment }}/{{
                            item.totalInstallments
                          }}
                          (faltam {{ item.remainingMonths }})
                        </span>
                      }
                    </td>
                    <td
                      class="py-3 px-3 text-right font-semibold text-white"
                    >
                      {{ formatCurrency(item.monthlyAmount) }}
                    </td>
                    <td
                      class="py-3 px-3 text-right font-bold text-amber-400"
                    >
                      {{
                        item.isRecurring
                          ? 'Contínuo'
                          : formatCurrency(item.remainingTotal)
                      }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-sm text-slate-400 py-4 text-center">
            Nenhuma parcela futura ou conta recorrente identificada.
          </p>
        }
      </section>
    </div>
  `,
})
export class DashboardComponent {
  readonly financeService = inject(FinanceService);
  readonly uiService = inject(UiService);

  formatCurrency(value: number): string {
    return formatBRL(value);
  }

  formatCompact(value: number): string {
    return formatCompactBRL(value);
  }

  formatDate(date: string): string {
    return formatDateBR(date);
  }

  formatMonth(month: string): string {
    return formatMonthLabel(month);
  }

  getBarHeightPercent(value: number): number {
    const max = Math.max(
      ...this.financeService.sixMonthProjections().map((p) => p.total),
      1
    );
    return Math.max(Math.round((value / max) * 100), value > 0 ? 8 : 2);
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
