# DocBrain MVP v1 – echte Produktbasis

Das ist kein statischer HTML-Prototyp mehr, sondern eine Next.js-Web-App mit Backend-API.

## Was funktioniert
- Onboarding
- Foto/PDF-Auswahl im Browser
- API-Route `/api/analyze`
- echte KI-Analyse für Bilddateien, wenn `OPENAI_API_KEY` gesetzt ist
- Fallback-Testmodus ohne API-Key
- Dokumentenablage im Browser-State
- Original-First-Dokumentansicht mit 🧠-Zusammenfassung
- Aufgaben, Chronik, Einstellungen
- responsive für iPhone, Samsung/Android und Laptop

## Wichtig
Ohne `OPENAI_API_KEY` kann die App Dokumente nicht echt lesen. Dann nutzt sie nur eine Dateinamen-Heuristik.

## Lokal starten
```bash
npm install
cp .env.example .env.local
# OPENAI_API_KEY eintragen
npm run dev
```

## Bei Vercel hochladen
1. ZIP entpacken
2. Ordner als Projekt importieren
3. Environment Variable `OPENAI_API_KEY` setzen
4. Deploy
5. Link auf iPhone/Samsung/Laptop testen

## Aktueller MVP-Umfang
PDF-OCR ist noch nicht vollständig aktiviert. Für echte Erkennung zunächst Fotos/Screenshots verwenden.
