import { Injectable, signal } from '@angular/core';
import { InvoiceItem } from '../models/invoice.model';

export const AVAILABLE_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.6-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
];

const API_KEY_STORAGE = 'finagent_gemini_api_key';
const MODEL_STORAGE = 'finagent_gemini_model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  readonly apiKey = signal<string>(this.loadApiKey());
  readonly selectedModel = signal<string>(this.loadSelectedModel());

  setApiKey(key: string): void {
    const trimmed = key.trim();
    this.apiKey.set(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(API_KEY_STORAGE, trimmed);
      } else {
        localStorage.removeItem(API_KEY_STORAGE);
      }
    } catch {
      // Ignore storage errors
    }
  }

  setModel(model: string): void {
    this.selectedModel.set(model);
    try {
      localStorage.setItem(MODEL_STORAGE, model);
    } catch {
      // Ignore storage errors
    }
  }

  private loadApiKey(): string {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  }

  private loadSelectedModel(): string {
    try {
      const saved = localStorage.getItem(MODEL_STORAGE);
      if (saved && AVAILABLE_GEMINI_MODELS.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'gemini-2.5-flash';
  }

  async extractInvoiceData(
    text: string,
    fileB64: string,
    fileMime: string,
    categoriesList: string[]
  ): Promise<{
    cardName?: string;
    dueDate?: string;
    totalAmount?: number;
    items?: Partial<InvoiceItem>[];
  }> {
    if (!this.apiKey()) {
      throw new Error('CHAVE_NAO_CONFIGURADA');
    }

    const parts: Array<Record<string, unknown>> = [
      {
        text: `Analise esta fatura de cartão de crédito ou conta a pagar e extraia os dados estruturados em JSON.
Regras:
1. Identifique o nome do cartão ou banco (cardName).
2. Identifique a data de vencimento no formato YYYY-MM-DD (se não houver ano explícito, assuma 2026).
3. Extraia o valor total (totalAmount).
4. Liste todos os itens/lançamentos com: description, amount, category (use uma destas: ${categoriesList.join(', ')}), currentInstallment (padrão 1), totalInstallments (padrão 1), e recurring (true se for assinatura ou conta fixa mensal).
${text ? `\nTexto da fatura:\n${text}` : ''}`,
      },
    ];

    if (fileB64 && fileMime) {
      parts.push({
        inlineData: {
          mimeType: fileMime,
          data: fileB64,
        },
      });
    }

    const payload = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            cardName: { type: 'STRING' },
            dueDate: { type: 'STRING' },
            totalAmount: { type: 'NUMBER' },
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  description: { type: 'STRING' },
                  amount: { type: 'NUMBER' },
                  category: { type: 'STRING' },
                  currentInstallment: { type: 'INTEGER' },
                  totalInstallments: { type: 'INTEGER' },
                  recurring: { type: 'BOOLEAN' },
                },
                required: [
                  'description',
                  'amount',
                  'category',
                  'currentInstallment',
                  'totalInstallments',
                  'recurring',
                ],
              },
            },
          },
          required: ['cardName', 'dueDate', 'totalAmount', 'items'],
        },
      },
    };

    const data = await this.callGeminiApiWithRetry(payload);
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJson) {
      throw new Error('Resposta vazia da API Gemini.');
    }

    return JSON.parse(rawJson);
  }

  async sendAdvisorMessage(
    question: string,
    contextSummary: Record<string, unknown>
  ): Promise<string> {
    if (!this.apiKey()) {
      throw new Error('CHAVE_NAO_CONFIGURADA');
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: question }],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: `Você é o FinAgent AI, um consultor financeiro pessoal brasileiro objetivo, empático e analítico.
Responda sempre em Português do Brasil, formatando valores em Reais (R$) e usando listas curtas quando útil.
Baseie suas respostas exclusivamente nos dados financeiros reais do usuário abaixo:
${JSON.stringify(contextSummary)}`,
          },
        ],
      },
    };

    const data = await this.callGeminiApiWithRetry(payload);
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error('Sem resposta da IA.');
    }

    return reply;
  }

  private async callGeminiApiWithRetry(
    payload: Record<string, unknown>,
    maxRetries = 2
  ): Promise<any> {
    const apiKey = this.apiKey();
    if (!apiKey) {
      throw new Error('CHAVE_NAO_CONFIGURADA');
    }

    const modelsToTry = [
      this.selectedModel(),
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ];
    // Remove duplicates preserving order
    const uniqueModels = Array.from(new Set(modelsToTry));

    let lastError: Error | null = null;

    for (const model of uniqueModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      let delay = 800;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            const errMsg = errData?.error?.message || `HTTP ${res.status}`;

            if (res.status === 400 && errMsg.includes('API_KEY_INVALID')) {
              throw new Error('CHAVE_INVALIDA');
            }

            if (res.status === 404) {
              // Model not found on this endpoint, try next model in fallback list
              throw new Error(`MODEL_NOT_FOUND: ${model}`);
            }

            throw new Error(`Erro Gemini (${res.status}): ${errMsg}`);
          }

          return await res.json();
        } catch (err: any) {
          lastError = err;
          if (
            err.message === 'CHAVE_INVALIDA' ||
            err.message?.startsWith('MODEL_NOT_FOUND')
          ) {
            break; // Don't retry same model if key is invalid or model not found
          }
          if (attempt === maxRetries) break;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }
    }

    throw lastError || new Error('Falha ao comunicar com a API Gemini.');
  }
}
