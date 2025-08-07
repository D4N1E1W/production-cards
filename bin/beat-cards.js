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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
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
        .option('filter', { type: 'array', desc: 'Filters like key=value (e.g., shootDay=3 status=Ready)' })
        .option('qrUrlTemplate', { type: 'string', desc: 'Template for QR link, e.g., https://app.clickup.com/t/{beatId}' })
        .option('template', { type: 'string', default: 'narrative', choices: ['narrative', 'interview'], desc: 'Card template variant' })
        .option('today', { type: 'number', desc: 'Filter beats by shootDay equal to this number' })
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
        const htmlPath = path.join(args.out, 'cards.html');
        const assetsDir = path.join(args.out, 'assets');
        ensureDir(assetsDir);
        const qrTemplate = args.qrUrlTemplate || '';

        const html = await renderHtml({ beats, shots, pageSize: args.page, template: args.template, qrUrlTemplate: qrTemplate });
        fs.writeFileSync(htmlPath, html, 'utf-8');
        console.log(`HTML written: ${htmlPath}`);

        if (args.pdf) {
          const pdfPath = path.join(args.out, 'cards.pdf');
          try {
            await exportPdf({ htmlContent: html, outPath: pdfPath, pageSize: args.page });
            console.log(`PDF written: ${pdfPath}`);
          } catch (e) {
            console.warn('PDF export failed. You can print the HTML to PDF manually. Reason:', e.message);
          }
        }

        if (args.open) {
          const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
          try {
            require('child_process').exec(`${opener} ${htmlPath}`);
          } catch (e) {
            // ignore
          }
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