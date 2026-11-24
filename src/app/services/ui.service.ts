import { Injectable, signal } from '@angular/core';
import {
  ActiveTab,
  ConfirmDialog,
  Invoice,
  ToastMessage,
} from '../models/invoice.model';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  readonly activeTab = signal<ActiveTab>('dashboard');
  readonly selectedInvoice = signal<Invoice | null>(null);
  readonly toastMessage = signal<ToastMessage | null>(null);
  readonly confirmDialog = signal<ConfirmDialog | null>(null);

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  openInvoiceModal(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
  }

  closeInvoiceModal(): void {
    this.selectedInvoice.set(null);
  }

  showToast(
    text: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 3800
  ): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastMessage.set({ text, type });
    this.toastTimeoutId = setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, duration);
  }

  openConfirm(dialog: ConfirmDialog): void {
    this.confirmDialog.set(dialog);
  }

  cancelConfirm(): void {
    this.confirmDialog.set(null);
  }

  executeConfirm(): void {
    const dialog = this.confirmDialog();
    if (dialog) {
      dialog.onConfirm();
      this.confirmDialog.set(null);
    }
  }
}
