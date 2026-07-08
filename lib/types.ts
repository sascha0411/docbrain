export type DocumentStatus = 'archived' | 'open' | 'needs_review';

export type AnalyzedDocument = {
  title: string;
  sender: string;
  documentType: string;
  category: string;
  subcategory?: string | null;
  summary: string;
  status: DocumentStatus;
  amount?: string | null;
  dueDate?: string | null;
  reminderDate?: string | null;
  suggestedActions: string[];
  searchKeywords: string[];
  confidence: number;
  needsClarification: boolean;
  clarificationOptions?: string[];
  rawDetectedText?: string;
};

export const EMPTY_ANALYSIS: AnalyzedDocument = {
  title: 'Neues Dokument',
  sender: 'Nicht sicher erkannt',
  documentType: 'Dokument',
  category: 'Eingang',
  subcategory: null,
  summary: 'Dieses Dokument konnte im Testmodus noch nicht eindeutig erkannt werden.',
  status: 'needs_review',
  amount: null,
  dueDate: null,
  reminderDate: null,
  suggestedActions: ['Erkennung prüfen', 'Archivieren'],
  searchKeywords: [],
  confidence: 0.5,
  needsClarification: true,
  clarificationOptions: ['Informationsschreiben', 'Rechnung', 'Vertrag', 'Kostenbericht']
};
