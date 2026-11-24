import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { GeminiService } from '../../services/gemini.service';
import { ChatMessage } from '../../models/invoice.model';
import {
  formatBRL,
  formatMonthLabel,
  getCurrentTime,
} from '../../utils/formatters';

@Component({
  selector: 'app-ai-advisor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-[70vh] min-h-[480px]"
    >
      <!-- Header Chat -->
      <div
        class="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 rounded-t-2xl"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-sm"
          >
            IA
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">
              Consultor Financeiro Gemini 2.5
            </h3>
            <p class="text-[11px] text-emerald-400">
              ● Contexto sincronizado com {{ financeService.invoices().length }}
              fatura(s) e projeção de 6 meses
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showApiKeyModal.set(!showApiKeyModal())"
            class="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 cursor-pointer"
            title="Configurar Chave da API Gemini"
          >
            🔑 API Key
          </button>
          <button
            type="button"
            (click)="clearChatHistory()"
            class="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/70 cursor-pointer"
          >
            Limpar Conversa
          </button>
        </div>
      </div>

      <!-- Configuração rápida de API Key (Opcional) -->
      @if (showApiKeyModal()) {
        <div
          class="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 text-xs"
        >
          <span class="text-slate-400 shrink-0">Chave Gemini:</span>
          <input
            type="password"
            [value]="geminiService.apiKey()"
            (input)="onApiKeyChange($event)"
            placeholder="Cole sua GEMINI_API_KEY aqui (opcional)"
            class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            (click)="showApiKeyModal.set(false)"
            class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 cursor-pointer"
          >
            Salvar
          </button>
        </div>
      }

      <!-- Mensagens -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        @for (msg of chatMessages(); track msg.id) {
          <div
            class="flex flex-col max-w-[85%] sm:max-w-[75%]"
            [class]="
              msg.role === 'user'
                ? 'ml-auto items-end'
                : 'mr-auto items-start'
            "
          >
            <div
              class="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
              [class]="
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-sm'
              "
            >
              {{ msg.text }}
            </div>
            <span class="text-[10px] text-slate-500 mt-1 px-1">
              {{ msg.timestamp }}
            </span>
          </div>
        }

        @if (isChatLoading()) {
          <div
            class="flex items-center gap-2 text-xs text-indigo-300 bg-slate-800/60 border border-slate-800 px-4 py-3 rounded-2xl w-fit"
          >
            <span
              class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
            ></span>
            <span
              class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style="animation-delay: 0.15s"
            ></span>
            <span
              class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style="animation-delay: 0.3s"
            ></span>
            <span class="ml-1">Analisando suas faturas...</span>
          </div>
        }
      </div>

      <!-- Sugestões Rápidas -->
      <div
        class="px-4 py-2.5 border-t border-slate-800/80 flex gap-2 overflow-x-auto bg-slate-950/30"
      >
        @for (prompt of quickPrompts; track prompt) {
          <button
            type="button"
            (click)="sendQuickPrompt(prompt)"
            [disabled]="isChatLoading()"
            class="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 whitespace-nowrap transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            {{ prompt }}
          </button>
        }
      </div>

      <!-- Input Envio -->
      <form
        (submit)="onSendChat($event)"
        class="p-3.5 border-t border-slate-800 flex items-center gap-2.5 bg-slate-950/60 rounded-b-2xl"
      >
        <input
          type="text"
          [value]="chatInput()"
          (input)="onChatInputChange($event)"
          placeholder="Pergunte sobre seus gastos, parcelas ou peça dicas para economizar..."
          class="flex-1 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none px-4 py-3 text-sm text-white placeholder-slate-500"
        />
        <button
          type="submit"
          [disabled]="isChatLoading() || !chatInput().trim()"
          class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm transition shrink-0 cursor-pointer"
        >
          Enviar
        </button>
      </form>
    </div>
  `,
})
export class AiAdvisorComponent {
  readonly financeService = inject(FinanceService);
  readonly geminiService = inject(GeminiService);

  readonly quickPrompts = this.financeService.quickPrompts;
  readonly showApiKeyModal = signal<boolean>(false);

  readonly chatMessages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Olá! Sou o FinAgent AI. Já analisei todas as suas faturas, cartões e parcelas futuras cadastradas. Como posso ajudar a organizar suas finanças hoje?',
      timestamp: getCurrentTime(),
    },
  ]);
  readonly chatInput = signal<string>('');
  readonly isChatLoading = signal<boolean>(false);

  onApiKeyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.geminiService.setApiKey(value);
  }

  onChatInputChange(event: Event): void {
    this.chatInput.set((event.target as HTMLInputElement).value);
  }

  sendQuickPrompt(prompt: string): void {
    this.chatInput.set(prompt);
    this.sendChatMessage();
  }

  onSendChat(event: Event): void {
    event.preventDefault();
    this.sendChatMessage();
  }

  clearChatHistory(): void {
    this.chatMessages.set([
      {
        id: `reset_${Date.now()}`,
        role: 'assistant',
        text: 'Histórico limpo! Estou pronto para analisar suas finanças novamente.',
        timestamp: getCurrentTime(),
      },
    ]);
  }

  async sendChatMessage(): Promise<void> {
    const question = this.chatInput().trim();
    if (!question || this.isChatLoading()) return;

    this.chatMessages.update((msgs) => [
      ...msgs,
      {
        id: `u_${Date.now()}`,
        role: 'user',
        text: question,
        timestamp: getCurrentTime(),
      },
    ]);
    this.chatInput.set('');
    this.isChatLoading.set(true);

    try {
      const contextSummary = {
        mesBaseSelecionado: this.financeService.selectedMonth(),
        resumoKPIs: {
          gastoMesAtual: this.financeService.currentMonthTotal(),
          pendenteMesAtual: this.financeService.pendingMonthTotal(),
          previsaoProximoMes: this.financeService.nextMonthProjectedTotal(),
          totalComprometido6Meses: this.financeService.sixMonthsCommittedTotal(),
        },
        projecao6Meses: this.financeService.sixMonthProjections(),
        radarParcelasERecorrentes: this.financeService.futureInstallmentsRadar(),
        faturasCadastradas: this.financeService.invoices().map((inv) => ({
          cartao: inv.cardName,
          vencimento: inv.dueDate,
          valorTotal: inv.totalAmount,
          status: inv.status,
          itens: inv.items,
        })),
      };

      const reply = await this.geminiService.sendAdvisorMessage(
        question,
        contextSummary
      );

      this.chatMessages.update((msgs) => [
        ...msgs,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: reply,
          timestamp: getCurrentTime(),
        },
      ]);
    } catch {
      const monthLabel = formatMonthLabel(this.financeService.selectedMonth());
      const currentTotal = formatBRL(this.financeService.currentMonthTotal());
      const nextTotal = formatBRL(this.financeService.nextMonthProjectedTotal());
      const sixMonthsTotal = formatBRL(
        this.financeService.sixMonthsCommittedTotal()
      );

      this.chatMessages.update((msgs) => [
        ...msgs,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: `Com base nos seus dados locais (${monthLabel}): seu gasto atual é de ${currentTotal}, com ${nextTotal} já previstos para o próximo mês e ${sixMonthsTotal} comprometidos nos próximos 6 meses. Verifique a chave da API Gemini (botão 🔑 API Key acima) para análises conversacionais completas.`,
          timestamp: getCurrentTime(),
        },
      ]);
    } finally {
      this.isChatLoading.set(false);
    }
  }
}
