import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (uiService.confirmDialog(); as dialog) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
        >
          <h3 class="text-lg font-bold text-white mb-2">{{ dialog.title }}</h3>
          <p class="text-sm text-slate-400 mb-6">{{ dialog.message }}</p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="uiService.cancelConfirm()"
              class="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="uiService.executeConfirm()"
              class="px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly uiService = inject(UiService);
}
