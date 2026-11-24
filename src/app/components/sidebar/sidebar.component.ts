import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { FinanceService } from '../../services/finance.service';
import { ActiveTab } from '../../models/invoice.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="w-full lg:w-72 bg-slate-900/95 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between shrink-0"
    >
      <div>
        <!-- Brand -->
        <div
          class="p-5 border-b border-slate-800 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-emerald-500/20"
            >
              F
            </div>
            <div>
              <h1 class="font-bold text-base text-white leading-tight">
                FinAgent <span class="text-emerald-400">AI</span>
              </h1>
              <p class="text-[11px] text-slate-400">
                Angular • Gemini 2.5 Flash
              </p>
            </div>
          </div>
          <span
            class="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
          >
            Pro
          </span>
        </div>

        <!-- Navegação -->
        <nav
          class="p-3 flex lg:flex-col gap-1.5 overflow-x-auto"
          aria-label="Navegação Principal"
        >
          <button
            type="button"
            (click)="selectTab('dashboard')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer"
            [class]="
              uiService.activeTab() === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            "
          >
            <svg
              class="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            (click)="selectTab('upload')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer"
            [class]="
              uiService.activeTab() === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            "
          >
            <svg
              class="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span>Anexar Fatura IA</span>
            <span
              class="ml-auto hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300"
              >IA</span
            >
          </button>

          <button
            type="button"
            (click)="selectTab('invoices')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer"
            [class]="
              uiService.activeTab() === 'invoices'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            "
          >
            <svg
              class="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span>Faturas & Cartões</span>
            <span
              class="ml-auto px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300"
              >{{ financeService.invoices().length }}</span
            >
          </button>

          <button
            type="button"
            (click)="selectTab('advisor')"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer"
            [class]="
              uiService.activeTab() === 'advisor'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            "
          >
            <svg
              class="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span>Consultor IA</span>
          </button>
        </nav>
      </div>

      <!-- Rodapé Sidebar: Backup & Reset -->
      <div
        class="hidden lg:block p-4 border-t border-slate-800 space-y-2.5 bg-slate-950/40"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
        >
          Dados & Backup Local
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            (click)="onExportBackup()"
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Exportar</span>
          </button>
          <label
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              class="hidden"
              (change)="onImportBackup($event)"
            />
          </label>
        </div>
        <button
          type="button"
          (click)="onClearAllData()"
          class="w-full px-3 py-2 rounded-xl border border-rose-900/30 hover:bg-rose-950/30 text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
        >
          Limpar Todas as Faturas
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly uiService = inject(UiService);
  readonly financeService = inject(FinanceService);

  selectTab(tab: ActiveTab): void {
    this.uiService.setActiveTab(tab);
  }

  onExportBackup(): void {
    this.financeService.exportBackupJson();
    this.uiService.showToast('Backup JSON exportado!', 'success');
  }

  async onImportBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const success = await this.financeService.importBackupJson(file);
    if (success) {
      this.uiService.showToast('Backup importado com sucesso!', 'success');
    } else {
      this.uiService.showToast('Erro ao importar arquivo JSON.', 'error');
    }
    input.value = '';
  }

  onClearAllData(): void {
    this.uiService.openConfirm({
      title: 'Limpar Todas as Faturas',
      message:
        'Tem certeza que deseja apagar todas as faturas cadastradas do LocalStorage? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        this.financeService.clearAllInvoices();
        this.uiService.showToast('Todas as faturas foram removidas.', 'info');
      },
    });
  }
}
