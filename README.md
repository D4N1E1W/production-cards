### Beat Card Deck (offline, print-ready)

Generates beautiful, print-ready production beat cards from your CSV/JSON tables. No external connections required.

#### Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate sample cards (HTML + PDF):
   ```bash
   npm run generate:sample
   ```
   Output will be in `dist/cards.html` and `dist/cards.pdf`.

#### CLI
```bash
beat-cards generate \
  --beats data/beats.csv \
  --shots data/shots.csv \
  --out dist \
  --pdf true \
  --page A5 \
  --tile 2x \
  --template narrative \
  --qrUrlTemplate "https://app.clickup.com/t/{beatId}" \
  --filter status=Ready \
  --today 3 \
  --bundlePerDay true \
  --viewer true
```

- **--beats/--shots**: CSV or JSON files
- **--mapping**: Optional JSON mapping for your column names
- **--page**: A5 (default), A6, or Letter
- **--tile**: `none` (default), `2x`, or `4x` (best with Letter)
- **--template**: `narrative`, `interview`, or `action`
- **--qrUrlTemplate**: Embed QR per beat (use `{beatId}` placeholder)
- **--filter**: Any number of `key=value` filters (e.g., `status=Ready`)
- **--today**: Filter by `shootDay`
- **--bundlePerDay**: Create `day-N` sub-folders with their own decks
- **--viewer**: Also output a lightweight `viewer.html` with filters

#### Convenience scripts
```bash
npm run generate:today     # Day 3 sample deck
npm run generate:perday    # Split decks per shoot day
npm run generate:letter2x  # Letter PDF, two cards per row (tiled)
```

#### Mapping file (optional)
Map your table columns to fields if they differ from the defaults:
```json
{
  "beats": {
    "beatId": ["Beat ID", "Beat #"],
    "scene": ["Scene"],
    "logline": ["Logline"],
    "shootDay": ["Shoot Day"],
    "location": ["Location"],
    "cast": ["Cast"],
    "coverage": ["Coverage plan"],
    "lenses": ["Lenses"],
    "movement": ["Movement"],
    "checklist": ["Checklist"]
  },
  "shots": {
    "id": ["Shot ID"],
    "beatId": ["Beat ID"],
    "type": ["Type"],
    "lens": ["Lens"],
    "move": ["Movement"],
    "est": ["Est mins"],
    "status": ["Status"]
  }
}
```

If PDF export fails (e.g., headless browser unavailable), use the generated `cards.html` and print to PDF via your browser.

#### Templates
- `narrative`: Story beats, camera and sound, shotlist
- `interview`: Intent, prompts, B-roll/cutaways, tech setup
- `action`: Dense shotlist, risks highlighted, safety + contingency

#### Notes
- All assets are local/offline. No external fonts.
- Color-blind friendly where possible using shapes and labels.
- QR codes generated on-card if `--qrUrlTemplate` is provided.
- `viewer.html` embeds your data for a fast, offline board view with filters.