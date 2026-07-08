'use client';

import { useMemo, useState } from 'react';

type Doc = {
  id: string;
  title: string;
  sender: string;
  documentType: string;
  category: string;
  subcategory?: string | null;
  summary: string;
  status: 'archived' | 'open' | 'needs_review';
  amount?: string | null;
  dueDate?: string | null;
  reminderDate?: string | null;
  suggestedActions: string[];
  fileName: string;
  fileType: string;
  fileUrl?: string;
  createdAt: string;
};

type Analysis = Omit<Doc, 'id' | 'fileName' | 'fileType' | 'fileUrl' | 'createdAt'> & {
  confidence: number;
  needsClarification: boolean;
};

export default function Home() {
  const [route, setRoute] = useState('welcome');
  const [name, setName] = useState('Sascha');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => Array.from(new Set(docs.map(d => d.category))), [docs]);

  function pickFile(next: File | null) {
    if (!next) return;
    setFile(next);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(URL.createObjectURL(next));
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body });
      const data = await res.json();
      setAnalysis(data.analysis);
      setRoute('result');
    } catch {
      alert('Analyse fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!analysis || !file) return;
    const doc: Doc = {
      ...analysis,
      id: String(Date.now()),
      fileName: file.name,
      fileType: file.type,
      fileUrl,
      createdAt: 'gerade eben',
    };
    setDocs([doc, ...docs]);
    setSelected(doc);
    setBrainOpen(false);
    setRoute('document');
  }

  function openDoc(doc: Doc) {
    setSelected(doc);
    setBrainOpen(false);
    setRoute('document');
  }

  function reset() {
    setFile(null);
    setFileUrl('');
    setAnalysis(null);
    setDocs([]);
    setSelected(null);
    setRoute('welcome');
  }

  const active = selected || (analysis && file ? {
    ...analysis,
    id: 'draft',
    fileName: file.name,
    fileType: file.type,
    fileUrl,
    createdAt: 'gerade eben',
  } as Doc : null);

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brandIcon">🧠</div><div><b>DocBrain</b><span>Vercel Fix v1</span></div></div>
        <button onClick={() => setRoute('dashboard')}>🏠 Übersicht</button>
        <button onClick={() => setRoute('scan')}>📷 Scannen</button>
        <button onClick={() => setRoute('documents')}>📂 Dokumente</button>
        <button onClick={() => setRoute('tasks')}>✅ Aufgaben</button>
        <button onClick={() => setRoute('timeline')}>📅 Chronik</button>
        <button onClick={() => setRoute('settings')}>⚙️ Einstellungen</button>
        <div className="trust"><b>🔒 Stabiler Testmodus</b><span>Diese Version baut auf Vercel ohne API-Key.</span></div>
      </aside>

      <section className="workspace">
        {route === 'welcome' && <Center>
          <div className="logo">🧠</div>
          <p className="eyebrow">DocBrain</p>
          <h1>Dein Papierkram, ruhig geregelt.</h1>
          <p>Stabile Web-App-Version für Vercel. Erst wenn diese läuft, bauen wir die echte KI weiter aus.</p>
          <button className="primary" onClick={() => setRoute('setup')}>Los geht’s</button>
        </Center>}

        {route === 'setup' && <Center>
          <button className="round" onClick={() => setRoute('welcome')}>←</button>
          <p className="eyebrow">Einrichtung</p>
          <h1>Wie dürfen wir dich nennen?</h1>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
          <div className="setupBox">Originale bleiben unverändert. Farben zeigen nur Status. Unternehmen bleiben neutral.</div>
          <button className="primary" onClick={() => setRoute('dashboard')}>Zum Dashboard</button>
        </Center>}

        {route === 'dashboard' && <Screen title="DocBrain" eyebrow="Übersicht" right={<button className="round" onClick={() => setRoute('settings')}>⚙️</button>}>
          {docs.length === 0 ? <div className="statusCard">
            <span className="pill green">🟢 Bereit</span>
            <h2>Noch keine Dokumente vorhanden.</h2>
            <p>Scanne dein erstes Dokument. DocBrain bereitet es vor und legt es passend ab.</p>
            <button className="primary" onClick={() => setRoute('scan')}>📷 Erstes Dokument scannen</button>
          </div> : <>
            <div className="statusCard">
              <span className="pill green">🟢 Alles unter Kontrolle</span>
              <h2>Du musst dich heute um nichts kümmern.</h2>
              <p>Wir melden uns, sobald etwas deine Aufmerksamkeit braucht.</p>
            </div>
            <div className="stats">
              <button onClick={() => setRoute('documents')}><b>{docs.length}</b><span>Dokumente</span></button>
              <button onClick={() => setRoute('documents')}><b>{categories.length}</b><span>Kategorien</span></button>
              <button onClick={() => setRoute('tasks')}><b>{docs.filter(d => d.status !== 'archived').length}</b><span>Aufgaben</span></button>
              <button><b>100%</b><span>analysiert</span></button>
            </div>
            <button className="primary" onClick={() => setRoute('scan')}>📷 Dokument hinzufügen</button>
            <h2>Letzte Aktivität</h2>
            <div className="list">{docs.slice(0,5).map(d => <button className="row" key={d.id} onClick={() => openDoc(d)}>✅ {d.title}<small>{d.sender} · {d.category}</small></button>)}</div>
          </>}
        </Screen>}

        {route === 'scan' && <Screen title="Dokument hinzufügen" eyebrow="Scan" back={() => setRoute('dashboard')}>
          <div className="scanGrid">
            <div className="scanStage">
              {!fileUrl ? <div><div className="scanIcon">📄</div><h2>Foto oder PDF auswählen</h2><p>DocBrain bereitet den Scan vor: Ränder, Lesbarkeit und Ablage.</p></div> : file?.type.startsWith('image/') ? <img src={fileUrl} alt="Vorschau" /> : <div className="pdfBox">📄 {file?.name}</div>}
              {file && <div className="cropHint">✂️ Scan wird vorbereitet · Ränder erkannt</div>}
            </div>
            <div className="panel small">
              <input id="file" type="file" accept="image/*,.pdf" capture="environment" onChange={e => pickFile(e.target.files?.[0] || null)} />
              <label htmlFor="file" className="primary fileLabel">Foto/PDF auswählen</label>
              <p className="muted">Testmodus: Dateinamen mit onvista, kassamarkt, kostenbericht oder rechnung werden erkannt.</p>
              <button className="primary" disabled={!file || loading} onClick={analyze}>{loading ? 'Analysiere ...' : 'Dokument analysieren'}</button>
            </div>
          </div>
        </Screen>}

        {route === 'result' && active && <Screen title="Vorschlag" eyebrow="Ergebnis" back={() => setRoute('scan')}>
          <div className="resultGrid">
            <Preview doc={active} />
            <Summary doc={active} name={name} />
          </div>
          <button className="primary" onClick={save}>Alles speichern</button>
        </Screen>}

        {route === 'document' && active && <div className="docScreen">
          <header className="top overlay"><button className="round" onClick={() => setRoute('documents')}>←</button><div><p className="eyebrow">{active.category}{active.subcategory ? ` → ${active.subcategory}` : ''}</p><h1>{active.title}</h1></div><button className="round" onClick={() => setRoute('documents')}>📂</button></header>
          <div className="paperCanvas"><Preview doc={active} large /></div>
          <button className="brainButton" onClick={() => setBrainOpen(true)}>🧠</button>
          {brainOpen && <div className="sheetBackdrop" onClick={() => setBrainOpen(false)} />}
          {brainOpen && <div className="brainSheet"><div className="handle" /><Summary doc={active} name={name} compact /><div className="actions">{active.suggestedActions.map(a => <button className="secondary" key={a}>{a}</button>)}</div></div>}
        </div>}

        {route === 'documents' && <Screen title="Dokumente" eyebrow="Ablage" back={() => setRoute('dashboard')} right={<span className="pill">{docs.length}</span>}>
          {docs.length === 0 ? <div className="statusCard"><h2>Noch keine Dokumente.</h2><p>Nach dem ersten Scan entsteht die Ablage automatisch.</p><button className="primary" onClick={() => setRoute('scan')}>Dokument hinzufügen</button></div> : <div className="list">{docs.map(d => <button className="row" key={d.id} onClick={() => openDoc(d)}><b>{d.title}</b><small>{d.sender} · {d.category}{d.subcategory ? ` → ${d.subcategory}` : ''}</small></button>)}</div>}
        </Screen>}

        {route === 'tasks' && <Screen title="Was wirklich zählt" eyebrow="Aufgaben" back={() => setRoute('dashboard')}>
          {docs.filter(d => d.status !== 'archived').length === 0 ? <div className="statusCard"><span className="pill green">🟢 Alles erledigt</span><h2>Aktuell ist nichts offen.</h2></div> : <div className="list">{docs.filter(d => d.status !== 'archived').map(d => <button className="row" key={d.id} onClick={() => openDoc(d)}>{d.title}<small>{d.dueDate || 'Bitte prüfen'}</small></button>)}</div>}
        </Screen>}

        {route === 'timeline' && <Screen title="Nachvollziehbar" eyebrow="Chronik" back={() => setRoute('dashboard')}>
          {docs.length === 0 ? <div className="statusCard"><h2>Noch keine Aktivität.</h2></div> : <div className="list">{docs.map(d => <button className="row" key={d.id} onClick={() => openDoc(d)}>✅ {d.title} gespeichert<small>{d.createdAt} · Original unverändert</small></button>)}</div>}
        </Screen>}

        {route === 'settings' && <Screen title="Persönlich" eyebrow="Einstellungen" back={() => setRoute('dashboard')}>
          <div className="list">
            <div className="setting"><b>👤 Name</b><span>{name}</span></div>
            <div className="setting"><b>🎨 Farben</b><span>nur Status</span></div>
            <div className="setting"><b>🔒 Originale</b><span>unverändert</span></div>
            <button className="secondary danger" onClick={reset}>Testdaten löschen</button>
          </div>
        </Screen>}
      </section>

      <nav className="bottomNav">
        <button onClick={() => setRoute('dashboard')}>🏠<span>Home</span></button>
        <button onClick={() => setRoute('documents')}>📂<span>Dokumente</span></button>
        <button className="plus" onClick={() => setRoute('scan')}>＋</button>
        <button onClick={() => setRoute('tasks')}>✅<span>Aufgaben</span></button>
        <button onClick={() => setRoute('timeline')}>📅<span>Chronik</span></button>
      </nav>
    </main>
  );
}

function Center({ children }) {
  return <div className="center"><div className="panel">{children}</div></div>;
}

function Screen({ title, eyebrow, children, back, right }) {
  return <div className="screen"><header className="top">{back ? <button className="round" onClick={back}>←</button> : <span />}<div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{right || <span />}</header>{children}</div>;
}

function Preview({ doc, large = false }) {
  if (doc.fileUrl && doc.fileType?.startsWith('image/')) return <div className={large ? 'docPreview large' : 'docPreview'}><img src={doc.fileUrl} alt="Original" /></div>;
  return <div className={large ? 'docPreview large' : 'docPreview'}><div className="paper"><h2>{doc.title}</h2><p><b>{doc.sender}</b></p><hr /><p>{doc.summary}</p><p>Original bleibt unverändert gespeichert.</p></div></div>;
}

function Summary({ doc, name, compact = false }) {
  const rows = [
    ['🏢 Absender', doc.sender],
    ['📄 Dokument', doc.title],
    ['📂 Ablage', doc.subcategory ? `${doc.category} → ${doc.subcategory}` : doc.category],
    ['🏷️ Typ', doc.documentType],
    ['📝 Inhalt', doc.summary],
  ];
  if (doc.amount) rows.push(['💰 Betrag', doc.amount]);
  if (doc.dueDate) rows.push(['📅 Frist', doc.dueDate]);
  if (doc.reminderDate) rows.push(['🔔 Erinnerung', doc.reminderDate]);
  rows.push(['🟢 Status', doc.status === 'archived' ? 'Archiviert' : doc.status === 'open' ? 'Offen' : 'Bitte prüfen']);

  return <div className={compact ? '' : 'summaryCard'}>
    <p className="eyebrow">DocBrain Übersicht</p>
    <h2>{name}, ich habe „{doc.title}“ erkannt.</h2>
    {rows.map(([a,b]) => <div className="field" key={a}><span>{a}</span><b>{b}</b></div>)}
  </div>;
}
