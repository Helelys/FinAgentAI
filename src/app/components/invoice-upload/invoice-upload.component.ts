import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { UiService } from '../../services/ui.service';
import {
  AVAILABLE_GEMINI_MODELS,
  GeminiService,
} from '../../services/gemini.service';
import { Invoice, InvoiceItem } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Coluna Esquerda: Upload / Texto / Extração IA -->
      <div class="lg:col-span-5 space-y-4">
        <div
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-bold text-white">
              1. Enviar Fatura ou Extrato
            </h3>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="showApiKeyModal.set(!showApiKeyModal())"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                [class]="
                  geminiService.apiKey()
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
                "
              >
                <span>🔑</span>
                <span>{{
                  geminiService.apiKey()
                    ? 'API Key Salva'
                    : 'Configurar Chave API'
                }}</span>
              </button>
              <button
                type="button"
                (click)="fillExampleInvoice()"
                class="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
              >
                Exemplo
              </button>
            </div>
          </div>

          <!-- Banner se a chave não estiver configurada -->
          @if (!geminiService.apiKey() && !showApiKeyModal()) {
            <div
              class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">⚠️</span>
                <span
                  >Chave Gemini não configurada. Insira sua chave para ativar a
                  IA.</span
                >
              </div>
              <button
                type="button"
                (click)="showApiKeyModal.set(true)"
                class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30 transition cursor-pointer shrink-0"
              >
                Inserir Chave
              </button>
            </div>
          }

          <!-- Caixa de Configuração da Chave API -->
          @if (showApiKeyModal()) {
            <div
              class="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2.5 text-xs"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-white flex items-center gap-1.5">
                  <span>🔑 Chave Gemini API (Google AI Studio)</span>
                </span>
                <button
                  type="button"
                  (click)="showApiKeyModal.set(false)"
                  class="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <input
                type="password"
                [value]="geminiService.apiKey()"
                (input)="onApiKeyChange($event)"
                placeholder="Cole sua API Key do Google AI Studio (AIzaSy...)"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-400">Modelo:</span>
                  <select
                    [value]="geminiService.selectedModel()"
                    (change)="onModelChange($event)"
                    class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
                  >
                    @for (m of availableModels; track m) {
                      <option [value]="m">{{ m }}</option>
                    }
                  </select>
                </div>
                <button
                  type="button"
                  (click)="showApiKeyModal.set(false)"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          }

          <!-- Dropzone Arquivo (Imagem ou PDF) -->
          <label
            (dragover)="onDragOver($event)"
            (dragleave)="isDragging.set(false)"
            (drop)="onDropFile($event)"
            class="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition text-center"
            [class]="
              isDragging()
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-slate-700 hover:border-indigo-500 bg-slate-950/50'
            "
          >
            <svg
              class="w-9 h-9 text-indigo-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span class="text-sm font-semibold text-slate-200">
              Arraste JPG, PNG ou PDF da fatura
            </span>
            <span class="text-xs text-slate-400 mt-1">
              ou clique para selecionar do dispositivo
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf,.csv,.txt"
              class="hidden"
              (change)="onFileSelected($event)"
            />
          </label>

          @if (uploadedFileName()) {
            <div
              class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs"
            >
              <span class="text-emerald-300 font-medium truncate">
                Arquivo anexado: {{ uploadedFileName() }}
              </span>
              <button
                type="button"
                (click)="clearUploadedFile()"
                class="text-rose-400 hover:text-rose-300 font-bold ml-2 cursor-pointer"
              >
                Remover
              </button>
            </div>
          }

          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">
              Ou cole o texto / CSV da fatura abaixo:
            </label>
            <textarea
              rows="6"
              [value]="rawInvoiceText()"
              (input)="onRawTextChange($event)"
              placeholder="Ex: Fatura Nubank - Vencimento 10/12/2026 - Total R$ 1.850,00&#10;15/11 Notebook Dell (Parcela 3/10) - R$ 450,00&#10;18/11 Supermercado Extra - R$ 380,50..."
              class="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none p-3 text-xs text-slate-200 placeholder-slate-600"
            ></textarea>
          </div>

          <button
            type="button"
            [disabled]="isExtracting()"
            (click)="extractInvoiceWithGemini()"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            @if (isExtracting()) {
              <span
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              <span>Agente IA Analisando Fatura...</span>
            } @else {
              <span>Extrair Dados com Gemini AI</span>
            }
          </button>
        </div>
      </div>

      <!-- Coluna Direita: Formulário Reativo de Revisão & Confirmação -->
      <div class="lg:col-span-7">
        <form
          [formGroup]="reviewForm"
          (ngSubmit)="saveReviewedInvoice()"
          class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-5"
        >
          <div
            class="flex items-center justify-between border-b border-slate-800 pb-3"
          >
            <div>
              <h3 class="text-base font-bold text-white">
                2. Revisão & Lançamento Estruturado
              </h3>
              <p class="text-xs text-slate-400">
                Confira ou edite os campos extraídos antes de salvar no painel
              </p>
            </div>
            <button
              type="button"
              (click)="resetReviewForm()"
              class="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Limpar Campos
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1"
                >Cartão / Banco *</label
              >
              <input
                type="text"
                formControlName="cardName"
                placeholder="Ex: Nubank Ultravioleta"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1"
                >Data de Vencimento *</label
              >
              <input
                type="date"
                formControlName="dueDate"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1"
                >Valor Total da Fatura (R$) *</label
              >
              <input
                type="number"
                step="0.01"
                formControlName="totalAmount"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 text-sm font-bold text-emerald-400"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1"
                >Status Inicial</label
              >
              <select
                formControlName="status"
                class="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 text-sm text-white"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Paga</option>
              </select>
            </div>
          </div>

          <!-- Lista de Itens / Parcelas -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Itens & Parcelas ({{ itemsFormArray.length }})
              </span>
              <button
                type="button"
                (click)="addFormItem()"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 transition cursor-pointer"
              >
                + Adicionar Item
              </button>
            </div>

            <div
              formArrayName="items"
              class="space-y-2.5 max-h-80 overflow-y-auto pr-1"
            >
              @for (
                itemCtrl of itemsFormArray.controls;
                track $index;
                let i = $index
              ) {
                <div
                  [formGroupName]="i"
                  class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  <div class="sm:col-span-4">
                    <input
                      type="text"
                      formControlName="description"
                      placeholder="Descrição"
                      class="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div class="sm:col-span-3">
                    <select
                      formControlName="category"
                      class="w-full rounded-lg bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      @for (cat of categoriesList; track cat) {
                        <option [value]="cat">{{ cat }}</option>
                      }
                    </select>
                  </div>

                  <div class="sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      formControlName="amount"
                      placeholder="Valor"
                      class="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div
                    class="sm:col-span-2 flex items-center gap-1"
                    title="Parcela Atual / Total"
                  >
                    <input
                      type="number"
                      min="1"
                      formControlName="currentInstallment"
                      class="w-11 rounded-lg bg-slate-900 border border-slate-800 px-1.5 py-1.5 text-xs text-center text-white"
                    />
                    <span class="text-slate-500 text-xs">/</span>
                    <input
                      type="number"
                      min="1"
                      formControlName="totalInstallments"
                      class="w-11 rounded-lg bg-slate-900 border border-slate-800 px-1.5 py-1.5 text-xs text-center text-white"
                    />
                  </div>

                  <div
                    class="sm:col-span-1 flex items-center justify-end gap-1.5"
                  >
                    <label
                      class="flex items-center gap-1 text-[10px] text-cyan-400 cursor-pointer"
                      title="Gasto Fixo Recorrente"
                    >
                      <input
                        type="checkbox"
                        formControlName="recurring"
                        class="rounded bg-slate-900 border-slate-700 text-cyan-500"
                      />
                      <span class="sm:hidden">Fixo</span>
                    </label>
                    <button
                      type="button"
                      (click)="removeFormItem(i)"
                      class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 text-xs cursor-pointer"
                      title="Remover item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="submit"
              [disabled]="reviewForm.invalid"
              class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              Confirmar e Salvar Fatura
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class InvoiceUploadComponent {
  private readonly fb = inject(FormBuilder);
  readonly financeService = inject(FinanceService);
  readonly uiService = inject(UiService);
  readonly geminiService = inject(GeminiService);

  readonly categoriesList = this.financeService.categoriesList;
  readonly availableModels = AVAILABLE_GEMINI_MODELS;

  // Estado Modal API Key
  readonly showApiKeyModal = signal<boolean>(false);

  // Estado Upload
  readonly isDragging = signal<boolean>(false);
  readonly isExtracting = signal<boolean>(false);
  readonly uploadedFileName = signal<string>('');
  readonly uploadedFileBase64 = signal<string>('');
  readonly uploadedFileMime = signal<string>('');
  readonly rawInvoiceText = signal<string>('');

  // Formulário Reativo
  readonly reviewForm: FormGroup = this.fb.group({
    cardName: ['', Validators.required],
    dueDate: [`${this.financeService.selectedMonth()}-15`, Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    status: ['pending', Validators.required],
    items: this.fb.array([]),
  });

  get itemsFormArray(): FormArray {
    return this.reviewForm.get('items') as FormArray;
  }

  constructor() {
    this.addFormItem();
  }

  onApiKeyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.geminiService.setApiKey(value);
  }

  onModelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.geminiService.setModel(value);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processSelectedFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processSelectedFile(file);
  }

  private processSelectedFile(file: File): void {
    this.uploadedFileName.set(file.name);

    let mime = file.type || '';
    const lowerName = file.name.toLowerCase();
    if (!mime || mime === 'application/octet-stream') {
      if (lowerName.endsWith('.pdf')) {
        mime = 'application/pdf';
      } else if (lowerName.endsWith('.png')) {
        mime = 'image/png';
      } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
        mime = 'image/jpeg';
      } else if (lowerName.endsWith('.webp')) {
        mime = 'image/webp';
      }
    }
    this.uploadedFileMime.set(mime || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'));

    if (
      file.type === 'text/plain' ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.txt')
    ) {
      const reader = new FileReader();
      reader.onload = () => {
        this.rawInvoiceText.set(String(reader.result ?? ''));
        this.uploadedFileBase64.set('');
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (dataUrl.includes('data:application/pdf')) {
        this.uploadedFileMime.set('application/pdf');
      }
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      this.uploadedFileBase64.set(base64);
    };
    reader.readAsDataURL(file);
  }

  clearUploadedFile(): void {
    this.uploadedFileName.set('');
    this.uploadedFileBase64.set('');
    this.uploadedFileMime.set('');
  }

  onRawTextChange(event: Event): void {
    this.rawInvoiceText.set((event.target as HTMLTextAreaElement).value);
  }

  fillExampleInvoice(): void {
    this.clearUploadedFile();
    this.rawInvoiceText.set(
      `FATURA CARTÃO INTER BLACK - NOVEMBRO 2026
Titular: Cliente FinAgent
Vencimento: 2026-11-22
Valor Total da Fatura: R$ 2.349,80

Lançamentos:
- 02/11 Smart TV LG OLED 55" (Parcela 3/8) - R$ 549,90
- 05/11 Supermercado Pão de Açúcar - R$ 684,50
- 08/11 Cadeira Ergonômica Escritório (Parcela 2/6) - R$ 320,00
- 11/11 Academia SmartFit (Mensalidade Recorrente) - R$ 139,90
- 14/11 Passagem Aérea LATAM (Parcela 1/4) - R$ 485,00
- 17/11 Farmácia Drogasil - R$ 170,50`
    );
    this.uiService.showToast(
      'Texto de fatura de exemplo preenchido! Clique em "Extrair Dados com Gemini AI".',
      'info'
    );
  }

  addFormItem(preset?: Partial<InvoiceItem>): void {
    this.itemsFormArray.push(
      this.fb.group({
        description: [preset?.description ?? '', Validators.required],
        category: [preset?.category ?? 'Outros', Validators.required],
        amount: [
          preset?.amount ?? 0,
          [Validators.required, Validators.min(0.01)],
        ],
        currentInstallment: [
          preset?.currentInstallment ?? 1,
          Validators.min(1),
        ],
        totalInstallments: [preset?.totalInstallments ?? 1, Validators.min(1)],
        recurring: [preset?.recurring ?? false],
      })
    );
  }

  removeFormItem(index: number): void {
    this.itemsFormArray.removeAt(index);
  }

  resetReviewForm(): void {
    this.reviewForm.reset({
      cardName: '',
      dueDate: `${this.financeService.selectedMonth()}-15`,
      totalAmount: 0,
      status: 'pending',
    });
    this.itemsFormArray.clear();
    this.addFormItem();
  }

  async extractInvoiceWithGemini(): Promise<void> {
    const text = this.rawInvoiceText().trim();
    const fileB64 = this.uploadedFileBase64();
    const fileMime = this.uploadedFileMime();

    if (!text && !fileB64) {
      this.uiService.showToast(
        'Anexe uma imagem/PDF ou cole o texto da fatura primeiro.',
        'error'
      );
      return;
    }

    if (!this.geminiService.apiKey()) {
      this.showApiKeyModal.set(true);
      this.uiService.showToast(
        'Chave da API Gemini não configurada! Insira sua chave acima.',
        'error'
      );
      return;
    }

    this.isExtracting.set(true);

    try {
      const parsed = await this.geminiService.extractInvoiceData(
        text,
        fileB64,
        fileMime,
        this.categoriesList
      );

      this.reviewForm.patchValue({
        cardName: parsed.cardName || 'Cartão Importado',
        dueDate: parsed.dueDate || `${this.financeService.selectedMonth()}-15`,
        totalAmount: Number(parsed.totalAmount || 0),
        status: 'pending',
      });

      this.itemsFormArray.clear();
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        for (const item of parsed.items) {
          this.addFormItem({
            description: item.description ?? 'Compra',
            category: this.categoriesList.includes(item.category ?? '')
              ? item.category
              : 'Outros',
            amount: Number(item.amount ?? 0),
            currentInstallment: Number(item.currentInstallment ?? 1),
            totalInstallments: Number(item.totalInstallments ?? 1),
            recurring: Boolean(item.recurring),
          });
        }
      } else {
        this.addFormItem();
      }

      this.uiService.showToast(
        'Fatura extraída com sucesso pela IA! Revise os itens ao lado e salve.',
        'success'
      );
    } catch (err: any) {
      if (err?.message === 'CHAVE_NAO_CONFIGURADA') {
        this.showApiKeyModal.set(true);
        this.uiService.showToast(
          'Insira sua chave da API Gemini para utilizar a IA.',
          'error'
        );
      } else if (err?.message === 'CHAVE_INVALIDA') {
        this.showApiKeyModal.set(true);
        this.uiService.showToast(
          'Chave Gemini inválida! Verifique no Google AI Studio.',
          'error'
        );
      } else if (text.includes('INTER BLACK')) {
        this.applyLocalExampleFallback();
        this.uiService.showToast(
          'Dados preenchidos (modo local). Revise e salve!',
          'info'
        );
      } else {
        this.uiService.showToast(
          err?.message ||
            'Não foi possível conectar à API Gemini. Verifique a chave ou preencha manualmente.',
          'error'
        );
      }
    } finally {
      this.isExtracting.set(false);
    }
  }

  private applyLocalExampleFallback(): void {
    this.reviewForm.patchValue({
      cardName: 'Inter Black',
      dueDate: '2026-11-22',
      totalAmount: 2349.8,
      status: 'pending',
    });
    this.itemsFormArray.clear();
    this.addFormItem({
      description: 'Smart TV LG OLED 55"',
      category: 'Eletrônicos',
      amount: 549.9,
      currentInstallment: 3,
      totalInstallments: 8,
      recurring: false,
    });
    this.addFormItem({
      description: 'Supermercado Pão de Açúcar',
      category: 'Alimentação',
      amount: 684.5,
      currentInstallment: 1,
      totalInstallments: 1,
      recurring: false,
    });
    this.addFormItem({
      description: 'Cadeira Ergonômica Escritório',
      category: 'Moradia',
      amount: 320.0,
      currentInstallment: 2,
      totalInstallments: 6,
      recurring: false,
    });
    this.addFormItem({
      description: 'Academia SmartFit',
      category: 'Saúde',
      amount: 139.9,
      currentInstallment: 1,
      totalInstallments: 1,
      recurring: true,
    });
    this.addFormItem({
      description: 'Passagem Aérea LATAM',
      category: 'Lazer',
      amount: 485.0,
      currentInstallment: 1,
      totalInstallments: 4,
      recurring: false,
    });
    this.addFormItem({
      description: 'Farmácia Drogasil',
      category: 'Saúde',
      amount: 170.5,
      currentInstallment: 1,
      totalInstallments: 1,
      recurring: false,
    });
  }

  saveReviewedInvoice(): void {
    if (this.reviewForm.invalid) {
      this.uiService.showToast(
        'Preencha os campos obrigatórios da fatura.',
        'error'
      );
      return;
    }

    const raw = this.reviewForm.getRawValue();
    const dueDate: string = raw.dueDate;
    const referenceMonth = dueDate.slice(0, 7);

    const items: InvoiceItem[] = (raw.items ?? []).map(
      (it: Record<string, unknown>, idx: number) => ({
        id: `item_${Date.now()}_${idx}`,
        description: String(it['description'] || 'Lançamento'),
        category: String(it['category'] || 'Outros'),
        amount: Number(it['amount'] || 0),
        currentInstallment: Number(it['currentInstallment'] || 1),
        totalInstallments: Number(it['totalInstallments'] || 1),
        recurring: Boolean(it['recurring']),
      })
    );

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      cardName: String(raw.cardName).trim(),
      dueDate,
      referenceMonth,
      totalAmount: Number(raw.totalAmount),
      status: raw.status === 'paid' ? 'paid' : 'pending',
      items,
      createdAt: new Date().toISOString(),
    };

    this.financeService.addInvoice(newInvoice);
    this.resetReviewForm();
    this.clearUploadedFile();
    this.rawInvoiceText.set('');
    this.uiService.setActiveTab('dashboard');
    this.uiService.showToast(
      `Fatura "${newInvoice.cardName}" salva e projetada no Dashboard!`,
      'success'
    );
  }
}
