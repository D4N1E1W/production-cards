#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { readDataFile } = require('../src/io');
const { normalizeBeatsAndShots } = require('../src/normalize');
const { validateData } = require('../src/validate');
const { renderHtml } = require('../src/render');
const { exportPdf } = require('../src/pdf');
const { renderViewer } = require('../src/viewer');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function writeDeck({ beats, shots, outDir, page, template, qrUrlTemplate, pdf, tile, makeViewer }) {
  ensureDir(outDir);
  const html = await renderHtml({ beats, shots, pageSize: page, template, qrUrlTemplate, tile });
  const htmlPath = path.join(outDir, 'cards.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  const dataPath = path.join(outDir, 'data.json');
  fs.writeFileSync(dataPath, JSON.stringify({ beats, shots }, null, 2), 'utf-8');
  if (makeViewer) {
    const viewerHtml = renderViewer({ beats, shots });
    fs.writeFileSync(path.join(outDir, 'viewer.html'), viewerHtml, 'utf-8');
  }
  if (pdf) {
    const pdfPath = path.join(outDir, 'cards.pdf');
    try {
      await exportPdf({ htmlContent: html, outPath: pdfPath, pageSize: page });
    } catch (e) {
      console.warn('PDF export failed:', e.message);
    }
  }
  return { htmlPath };
}

yargs(hideBin(process.argv))
  .command(
    'generate',
    'Generate print-ready cards from beats and shots data',
    (y) =>
      y
        .option('beats', { type: 'string', demandOption: true, desc: 'Path to beats CSV/JSON' })
        .option('shots', { type: 'string', demandOption: true, desc: 'Path to shots CSV/JSON' })
        .option('mapping', { type: 'string', desc: 'Optional column mapping JSON' })
        .option('out', { type: 'string', default: 'dist', desc: 'Output directory' })
        .option('pdf', { type: 'boolean', default: true, desc: 'Also export PDF' })
        .option('page', { type: 'string', default: 'A5', choices: ['A5', 'A6', 'Letter'], desc: 'Page size for print' })
        .option('tile', { type: 'string', default: 'none', choices: ['none', '2x', '4x'], desc: 'Tile multiple cards per Letter page' })
        .option('filter', { type: 'array', desc: 'Filters like key=value (e.g., shootDay=3 status=Ready)' })
        .option('qrUrlTemplate', { type: 'string', desc: 'Template for QR link, e.g., https://app.clickup.com/t/{beatId}' })
        .option('template', { type: 'string', default: 'narrative', choices: ['narrative', 'interview', 'action'], desc: 'Card template variant' })
        .option('today', { type: 'number', desc: 'Filter beats by shootDay equal to this number' })
        .option('bundlePerDay', { type: 'boolean', default: false, desc: 'Create a sub-deck per shootDay' })
        .option('viewer', { type: 'boolean', default: true, desc: 'Also create a lightweight viewer.html with filters' })
        .option('open', { type: 'boolean', default: false, desc: 'Attempt to open the generated HTML in default browser' }),
    async (args) => {
      try {
        const beatsRaw = await readDataFile(args.beats);
        const shotsRaw = await readDataFile(args.shots);
        const mapping = args.mapping ? JSON.parse(fs.readFileSync(args.mapping, 'utf-8')) : null;

        let { beats, shots } = normalizeBeatsAndShots(beatsRaw, shotsRaw, mapping);

        if (args.today !== undefined) {
          beats = beats.filter((b) => Number(b.shootDay) === Number(args.today));
        }
        if (args.filter && args.filter.length) {
          for (const flt of args.filter) {
            const [k, v] = String(flt).split('=');
            beats = beats.filter((b) => String(b[k]) === String(v));
          }
        }

        const valRes = validateData(beats, shots);
        if (!valRes.valid) {
          console.error('Validation failed:', valRes.errors);
          process.exit(1);
        }

        ensureDir(args.out);

        // Main combined deck
        const main = await writeDeck({ beats, shots, outDir: args.out, page: args.page, template: args.template, qrUrlTemplate: args.qrUrlTemplate || '', pdf: args.pdf, tile: args.tile, makeViewer: args.viewer });
        console.log(`HTML written: ${main.htmlPath}`);
        if (args.pdf) console.log(`PDF written: ${path.join(args.out, 'cards.pdf')}`);
        console.log(`Data JSON: ${path.join(args.out, 'data.json')}`);
        if (args.viewer) console.log(`Viewer: ${path.join(args.out, 'viewer.html')}`);

        // Per-day bundles
        if (args.bundlePerDay) {
          const days = Array.from(new Set(beats.map((b) => b.shootDay).filter((d) => d !== undefined)));
          for (const day of days) {
            const dayBeats = beats.filter((b) => b.shootDay === day);
            const dayDir = path.join(args.out, `day-${day}`);
            await writeDeck({ beats: dayBeats, shots, outDir: dayDir, page: args.page, template: args.template, qrUrlTemplate: args.qrUrlTemplate || '', pdf: args.pdf, tile: args.tile, makeViewer: args.viewer });
            console.log(`Day ${day} deck -> ${path.join(dayDir, 'cards.html')}`);
          }
        }

        if (args.open) {
          const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
          try {
            require('child_process').exec(`${opener} ${path.join(args.out, 'cards.html')}`);
          } catch {}
        }
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    }
  )
  .command(
    'validate',
    'Validate beats and shots files against schema',
    (y) =>
      y
        .option('beats', { type: 'string', demandOption: true })
        .option('shots', { type: 'string', demandOption: true }),
    async (args) => {
      const beatsRaw = await readDataFile(args.beats);
      const shotsRaw = await readDataFile(args.shots);
      const { beats, shots } = normalizeBeatsAndShots(beatsRaw, shotsRaw, null);
      const valRes = validateData(beats, shots);
      if (!valRes.valid) {
        console.error('Validation failed:', valRes.errors);
        process.exit(1);
      }
      console.log('Validation passed');
    }
  )
  .demandCommand(1)
  .help()
  .strict()
  .parse();