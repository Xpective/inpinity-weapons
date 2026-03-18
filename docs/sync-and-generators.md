# Sync- und Generator-Workflow

Diese Datei beschreibt den praktischen Workflow für das Offchain-Repo `inpinity-weapons`.

Ziel:
- Live-Daten aus den Base-Mainnet-City-Contracts ins Repo übernehmen
- daraus publizierbare Metadata erzeugen
- alles gegen die JSON-Schemas validieren

---

# Grundprinzip

Es gibt im Repo drei Hauptschritte:

1. **sync**
2. **generate**
3. **validate**

## 1. Sync
`sync` liest bestehende Daten direkt aus den live Contracts und schreibt sie in:

- `data/definitions/...`

Das ist der Schritt, wenn onchain bereits neue Inhalte gesetzt wurden.

## 2. Generate
`generate` baut aus:
- Chain-Daten
- lokalen Definitionsdaten
- Assets
- Overrides

die publizierbaren Metadata-Dateien in:

- `metadata/...`

## 3. Validate
`validate` prüft:
- Definitionsdaten
- Metadata-Dateien

gegen die JSON-Schemas.

---

# Wann nutze ich was?

## Fall A: Neuer Content wurde onchain gesetzt
Dann zuerst:

1. `sync`
2. `validate`
3. `generate`
4. `validate`

## Fall B: Ich möchte nur bestehende Metadata neu bauen
Dann genügt:

1. `generate`
2. `validate`

## Fall C: Ich will nur prüfen, ob alles sauber ist
Dann genügt:

1. `validate`

---

# Der Sync-Befehl

Datei:
- `scripts/sync/sync-from-chain.mjs`

npm-Script:
```bash
npm run sync -- ...