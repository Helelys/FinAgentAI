import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (uiService.toastMessage(); as toast) {
      <div
        class="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300"
        [class]="
          toast.type === 'error'
            ? 'bg-rose-950/95 border-rose-700 text-rose-100'
            : toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-700 text-emerald-100'
              : 'bg-slate-900/95 border-indigo-500/50 text-slate-100'
        "
      >
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          [class]="
            toast.type === 'error'
              ? 'bg-rose-400'
              : toast.type === 'success'
                ? 'bg-emerald-400'
                : 'bg-indigo-400'
          "
        ></span>
        <span class="text-sm font-medium">{{ toast.text }}</span>
      </div>
    }
  `,
})
export class ToastComponent {
  readonly uiService = inject(UiService);
}
