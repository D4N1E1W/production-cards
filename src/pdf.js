const puppeteer = require('puppeteer');

async function exportPdf({ htmlContent, outPath, pageSize }) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  await page.emulateMediaType('print');
  const format = pageSize === 'Letter' ? 'Letter' : pageSize; // Puppeteer supports A5/A6/Letter
  await page.pdf({ path: outPath, format, printBackground: true, preferCSSPageSize: true });
  await browser.close();
}

module.exports = { exportPdf };