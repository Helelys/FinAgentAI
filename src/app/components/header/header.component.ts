import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800/80"
    >
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-white">
          @switch (uiService.activeTab()) {
            @case ('dashboard') {
              Visão Geral & Projeção Financeira
            }
            @case ('upload') {
              Agente Extrator de Faturas (IA)
            }
            @case ('invoices') {
              Cartões & Faturas Cadastradas
            }
            @case ('advisor') {
              Consultor Financeiro Pessoal IA
            }
          }
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
          @switch (uiService.activeTab()) {
            @case ('dashboard') {
              Acompanhe seus gastos atuais e o impacto automático das
              parcelas nos próximos 6 meses.
            }
            @case ('upload') {
              Envie foto, PDF ou texto da fatura para o Gemini estruturar
              lançamentos e parcelas.
            }
            @case ('invoices') {
              Gerencie vencimentos, altere status de pagamento e inspecione
              cada cartão.
            }
            @case ('advisor') {
              Converse com a IA conectada em tempo real aos seus cartões e
              projeções.
            }
          }
        </p>
      </div>

      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <div
          class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2"
        >
          <span class="text-xs text-slate-400">Mês Base:</span>
          <input
            type="month"
            [value]="financeService.selectedMonth()"
            (change)="onMonthChange($event)"
            class="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
          />
        </div>

        <button
          type="button"
          (click)="uiService.setActiveTab('upload')"
          class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          + Nova Fatura
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly uiService = inject(UiService);
  readonly financeService = inject(FinanceService);

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.financeService.setSelectedMonth(value);
    }
  }
}
