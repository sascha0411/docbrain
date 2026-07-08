import { NextRequest, NextResponse } from 'next/server';
import { EMPTY_ANALYSIS } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const name = file.name.toLowerCase();

  if (name.includes('onvista') || name.includes('kassamarkt') || name.includes('kostenbericht')) {
    return NextResponse.json({
      mode: 'test',
      analysis: {
        title: 'Kassamarkt-Kostenbericht',
        sender: 'onvista bank',
        documentType: 'Kostenbericht',
        category: 'Finanzen',
        subcategory: 'Broker → onvista bank',
        summary: 'Informationsschreiben über Handelskosten im Kassamarkt. Keine Zahlung und keine Frist erforderlich.',
        status: 'archived',
        amount: null,
        dueDate: null,
        reminderDate: null,
        suggestedActions: ['Archiviert', 'Notiz hinzufügen', 'In Favoriten speichern'],
        searchKeywords: ['onvista bank', 'Kassamarkt', 'Kostenbericht', 'Broker', 'Depot', 'Gebühren', 'Handelskosten'],
        confidence: 0.96,
        needsClarification: false,
        clarificationOptions: [],
        rawDetectedText: ''
      }
    });
  }

  if (name.includes('rechnung') || name.includes('zahnarzt')) {
    return NextResponse.json({
      mode: 'test',
      analysis: {
        title: 'Rechnung',
        sender: name.includes('zahnarzt') ? 'Zahnarztpraxis' : 'Nicht sicher erkannt',
        documentType: 'Rechnung',
        category: 'Rechnungen',
        subcategory: null,
        summary: 'Eine Rechnung wurde erkannt. Betrag und Fälligkeit sollten geprüft werden.',
        status: 'open',
        amount: 'Bitte prüfen',
        dueDate: 'Bitte prüfen',
        reminderDate: 'Nach Prüfung',
        suggestedActions: ['Jetzt bezahlen', 'Erinnerung ändern', 'Als bezahlt markieren'],
        searchKeywords: ['Rechnung'],
        confidence: 0.72,
        needsClarification: true,
        clarificationOptions: ['Rechnung', 'Kostenrechnung', 'Informationsschreiben'],
        rawDetectedText: ''
      }
    });
  }

  return NextResponse.json({ mode: 'test', analysis: EMPTY_ANALYSIS });
}
