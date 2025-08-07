function renderViewer({ beats, shots }) {
  const data = { beats, shots };
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Beat Cards Viewer</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial; margin: 16px; }
  .controls { display:flex; gap:8px; flex-wrap:wrap; margin-bottom: 12px; }
  input, select { padding:6px 8px; }
  .cards { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:12px; }
  .card { border:1px solid #e2e8f0; border-radius:8px; padding:12px; }
  .title { font-weight:700; margin-bottom:4px; }
  .small { color:#475569; font-size: 12px; }
  .pill { border:1px solid #e2e8f0; border-radius:999px; padding:2px 8px; margin-right:6px; font-size:12px; color:#475569; }
</style>
</head>
<body>
<div class="controls">
  <input id="q" placeholder="Search logline/scene…" />
  <select id="day"><option value="">All Days</option></select>
  <select id="status"><option value="">All Status</option></select>
  <select id="location"><option value="">All Locations</option></select>
</div>
<div class="cards" id="cards"></div>
<script>
  const DATA = ${JSON.stringify(data)};
  const q = document.getElementById('q');
  const day = document.getElementById('day');
  const status = document.getElementById('status');
  const locationSel = document.getElementById('location');
  const cardsEl = document.getElementById('cards');

  function initOptions() {
    const days = Array.from(new Set(DATA.beats.map(b=>b.shootDay).filter(Boolean))).sort((a,b)=>a-b);
    days.forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent='Day '+d; day.appendChild(o); });
    const statuses = Array.from(new Set(DATA.beats.map(b=>b.status).filter(Boolean))).sort();
    statuses.forEach(s=>{ const o=document.createElement('option'); o.value=s; o.textContent=s; status.appendChild(o); });
    const locs = Array.from(new Set(DATA.beats.map(b=>b.location).filter(Boolean))).sort();
    locs.forEach(l=>{ const o=document.createElement('option'); o.value=l; o.textContent=l; locationSel.appendChild(o); });
  }

  function render() {
    const query = q.value.toLowerCase();
    const dayVal = day.value; const statusVal = status.value; const locVal = locationSel.value;
    const out = [];
    for (const b of DATA.beats) {
      if (dayVal && String(b.shootDay) !== String(dayVal)) continue;
      if (statusVal && b.status !== statusVal) continue;
      if (locVal && b.location !== locVal) continue;
      const hay = (b.logline+' '+(b.scene||'')).toLowerCase();
      if (query && !hay.includes(query)) continue;
      out.push(b);
    }
    cardsEl.innerHTML = out.map(b=>{
      const shots = DATA.shots.filter(s=>s.beatId===b.beatId);
      const done = shots.filter(s=>String(s.status).toLowerCase()==='done').length;
      return '<div class="card">'+
        '<div class="title">#'+b.beatId+' • '+(b.scene||'')+' — '+b.logline+'</div>'+
        '<div class="small">Est '+(b.estMinutes||0)+'m • Shots '+done+'/'+shots.length+'</div>'+
        '<div style="margin:6px 0;">'+
          (b.location?'<span class="pill">'+b.location+'</span>':'')+
          (b.shootDay?'<span class="pill">Day '+b.shootDay+'</span>':'')+
          (b.status?'<span class="pill">'+b.status+'</span>':'')+
        '</div>'+
        '<div class="small">Intent: '+(b.intent||'-')+'</div>'+
      '</div>';
    }).join('');
  }

  initOptions();
  render();
  q.addEventListener('input', render);
  day.addEventListener('change', render);
  status.addEventListener('change', render);
  locationSel.addEventListener('change', render);
</script>
</body>
</html>`;
  return html;
}

module.exports = { renderViewer };