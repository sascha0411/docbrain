import { NextRequest, NextResponse } from 'next/server';
import { EMPTY_ANALYSIS, AnalyzedDocument } from '@/lib/types';

export const runtime = 'nodejs';

function normalizeSender(value: string): string {
  const v = value.toLowerCase();
  if (v.includes('onvista')) return 'onvista bank';
  if (v.includes('ing')) return 'ING';
  if (v.includes('techniker') || v.includes('tk')) return 'Techniker Krankenkasse';
  if (v.includes('aok')) return 'AOK';
  if (v.includes('vodafone')) return 'Vodafone';
  if (v.includes('telekom')) return 'Telekom';
  return value.trim() || 'Nicht erkannt';
}

function heuristicFromFileName(fileName: string): AnalyzedDocument {
  const name = fileName.toLowerCase();
  if (name.includes('onvista') || name.includes('kassamarkt') || name.includes('kostenbericht')) {
    return { title:'Kassamarkt-Kostenbericht', sender:'onvista bank', documentType:'Kostenbericht', category:'Finanzen', subcategory:'Broker → onvista bank', summary:'Informationsschreiben über Handelskosten im Kassamarkt. Keine Zahlung und keine Frist erforderlich.', status:'archived', amount:null, dueDate:null, reminderDate:null, suggestedActions:['Archiviert','Notiz hinzufügen'], searchKeywords:['onvista bank','Kassamarkt','Kostenbericht','Broker','Depot','Gebühren','Handelskosten'], confidence:0.96, needsClarification:false };
  }
  if (name.includes('rechnung')) {
    return { title:'Rechnung', sender:'Nicht sicher erkannt', documentType:'Rechnung', category:'Rechnungen', subcategory:null, summary:'Eine Rechnung wurde erkannt. Bitte Betrag und Fälligkeit prüfen.', status:'open', amount:null, dueDate:null, reminderDate:null, suggestedActions:['Jetzt bezahlen','Erinnerung setzen','Als bezahlt markieren'], searchKeywords:['Rechnung'], confidence:0.72, needsClarification:true, clarificationOptions:['Rechnung','Kostenrechnung','Informationsschreiben'] };
  }
  return EMPTY_ANALYSIS;
}

function forceJson(text: string): AnalyzedDocument {
  const cleaned = text.trim().replace(/^```json/i,'').replace(/^```/i,'').replace(/```$/i,'').trim();
  const parsed = JSON.parse(cleaned);
  return { ...EMPTY_ANALYSIS, ...parsed, sender: normalizeSender(String(parsed.sender ?? '')), amount: parsed.amount ?? null, dueDate: parsed.dueDate ?? null, reminderDate: parsed.reminderDate ?? null, suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [], searchKeywords: Array.isArray(parsed.searchKeywords) ? parsed.searchKeywords : [], confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0, needsClarification: Boolean(parsed.needsClarification) };
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error:'No file uploaded' }, { status:400 });
  const fallback = heuristicFromFileName(file.name);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ mode:'fallback', note:'OPENAI_API_KEY fehlt. Es wurde nur die Dateinamen-Heuristik genutzt.', analysis:fallback });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mime = file.type || 'image/jpeg';
  if (!mime.startsWith('image/')) {
    return NextResponse.json({ mode:'fallback', note:'PDF-OCR ist in diesem MVP noch nicht aktiviert. Für echte Erkennung bitte zunächst Fotos/Screenshots hochladen.', analysis:fallback });
  }

  const prompt = `Du bist die Dokumenten-Analyse-Engine von DocBrain. Gib nur JSON zurück.
Regeln:
- Wenn der Absender klar lesbar ist, übernimm ihn normalisiert.
- Nutze bekannte Markennamen neutral. Beispiel: "onvista bank", "ING", "Techniker Krankenkasse".
- Wenn "Kassamarkt-Kostenbericht" sichtbar ist, muss title exakt "Kassamarkt-Kostenbericht" sein.
- Nutze "Eingang" nur, wenn keine sinnvolle Kategorie möglich ist.
- Zeige amount, dueDate und reminderDate nur, wenn sie sinnvoll sind.
- Informationsschreiben, Kontoauszüge und Kostenberichte sind meist archived.
- Rechnungen sind open.
- Wenn du unsicher bist, setze needsClarification=true und maximal 3 clarificationOptions.
JSON: {"title":"","sender":"","documentType":"","category":"","subcategory":null,"summary":"","status":"archived|open|needs_review","amount":null,"dueDate":null,"reminderDate":null,"suggestedActions":[],"searchKeywords":[],"confidence":0.0,"needsClarification":false,"clarificationOptions":[],"rawDetectedText":""}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', response_format:{ type:'json_object' }, temperature:0, messages:[ { role:'system', content:prompt }, { role:'user', content:[ { type:'text', text:`Analysiere dieses Dokument. Dateiname: ${file.name}` }, { type:'image_url', image_url:{ url:`data:${mime};base64,${base64}` } } ] } ] })
    });
    if (!response.ok) return NextResponse.json({ mode:'fallback', note:(await response.text()).slice(0,300), analysis:fallback });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ mode:'fallback', note:'Keine KI-Antwort erhalten.', analysis:fallback });
    return NextResponse.json({ mode:'ai', analysis:forceJson(content) });
  } catch (error) {
    return NextResponse.json({ mode:'fallback', note:error instanceof Error ? error.message : 'Unbekannter Fehler', analysis:fallback });
  }
}
