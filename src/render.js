const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

async function generateQrDataUrl(url) {
  if (!url) return '';
  try {
    return await QRCode.toDataURL(url, { margin: 0, scale: 3 });
  } catch (e) {
    return '';
  }
}

async function renderHtml({ beats, shots, pageSize, template, qrUrlTemplate, tile }) {
  const templateDir = path.join(__dirname, 'templates');
  const stylePath = path.join(__dirname, 'styles.css');
  const layoutPath = path.join(templateDir, 'layout.ejs');
  const cardPath = path.join(templateDir, `card-${template}.ejs`);
  const style = fs.readFileSync(stylePath, 'utf-8');
  const layout = fs.readFileSync(layoutPath, 'utf-8');
  const card = fs.readFileSync(cardPath, 'utf-8');

  const beatIdToShots = shots.reduce((acc, s) => {
    acc[s.beatId] = acc[s.beatId] || [];
    acc[s.beatId].push(s);
    return acc;
  }, {});

  const beatsWithComputed = await Promise.all(
    beats.map(async (b) => {
      const linkedShots = (beatIdToShots[b.beatId] || []).sort((a, z) => String(a.id).localeCompare(String(z.id)));
      const done = linkedShots.filter((s) => (s.status || '').toLowerCase() === 'done').length;
      const qrUrl = qrUrlTemplate ? qrUrlTemplate.replace('{beatId}', encodeURIComponent(b.beatId)) : '';
      const qrDataUrl = await generateQrDataUrl(qrUrl);
      return { ...b, shots: linkedShots, shotProgress: { done, total: linkedShots.length }, qrDataUrl, qrUrl };
    })
  );

  const renderCard = ejs.compile(card, {});
  const html = ejs.render(
    layout,
    {
      pageSize,
      style,
      renderCard,
      beats: beatsWithComputed,
      tile: tile || 'none'
    },
    { async: false }
  );

  return '<!doctype html>' + html;
}

module.exports = { renderHtml };