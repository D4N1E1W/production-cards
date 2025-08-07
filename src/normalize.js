const path = require('path');

const defaultMapping = {
  beatId: ['beatId', 'Beat ID', 'Beat #', 'Beat'],
  scene: ['scene', 'Scene', 'Slugline'],
  logline: ['logline', 'Logline', 'Title'],
  status: ['status', 'Status'],
  estMinutes: ['estMinutes', 'Est mins', 'Estimated Minutes', 'Est Min'],
  shootDay: ['shootDay', 'Shoot Day', 'Day'],
  location: ['location', 'Location'],
  cast: ['cast', 'Cast'],
  intent: ['intent', 'Intent'],
  stakes: ['stakes', 'Stakes'],
  outcome: ['outcome', 'Outcome'],
  risks: ['risks', 'Risks'],
  coverage: ['coverage', 'Coverage plan'],
  lenses: ['lenses', 'Lenses'],
  movement: ['movement', 'Movement'],
  sound_mics: ['mics', 'Mics', 'Sound Mics'],
  checklist: ['checklist', 'Checklist'],
  links_script: ['Script', 'script'],
  links_boards: ['Storyboards', 'boards'],
  links_drive: ['Drive', 'drive'],
  links_floorplan: ['Floorplan', 'floorplan']
};

function pickFirst(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).length > 0) return row[k];
  }
  return undefined;
}

function toArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeBeatsAndShots(beatsRaw, shotsRaw, mapping) {
  const map = mapping && mapping.beats ? mapping.beats : defaultMapping;

  const beats = beatsRaw.map((row) => {
    const beatId = pickFirst(row, map.beatId) || String(pickFirst(row, map.scene) || '').replace(/\s+/g, '-') + '-' + String(row.__rownum || '');
    const lenses = toArray(pickFirst(row, map.lenses)).map((x) => String(x));
    const mics = toArray(pickFirst(row, map.sound_mics));
    const checklist = toArray(pickFirst(row, map.checklist)).map((label) => ({ label, done: false }));
    let risks = pickFirst(row, map.risks);
    if (typeof risks === 'string') {
      risks = toArray(risks).map((note) => ({ level: 'Med', note }));
    } else if (!Array.isArray(risks)) {
      risks = [];
    }

    return {
      beatId: String(beatId).trim(),
      scene: String(pickFirst(row, map.scene) || '').trim(),
      logline: String(pickFirst(row, map.logline) || '').trim(),
      status: String(pickFirst(row, map.status) || 'Prep').trim(),
      estMinutes: Number(pickFirst(row, map.estMinutes) || 0),
      shootDay: Number(pickFirst(row, map.shootDay) || 0),
      location: String(pickFirst(row, map.location) || '').trim(),
      cast: toArray(pickFirst(row, map.cast)),
      intent: String(pickFirst(row, map.intent) || '').trim(),
      stakes: String(pickFirst(row, map.stakes) || '').trim(),
      outcome: String(pickFirst(row, map.outcome) || '').trim(),
      risks,
      camera: {
        coverage: String(pickFirst(row, map.coverage) || '').trim(),
        lenses,
        move: String(pickFirst(row, map.movement) || '').trim()
      },
      sound: {
        mics
      },
      checklist,
      links: {
        script: pickFirst(row, map.links_script) || '',
        boards: pickFirst(row, map.links_boards) || '',
        drive: pickFirst(row, map.links_drive) || '',
        floorplan: pickFirst(row, map.links_floorplan) || ''
      }
    };
  });

  const shotMap = (mapping && mapping.shots) || {
    id: ['id', 'Shot ID', 'Shot'],
    beatId: ['beatId', 'Beat ID', 'Beat #', 'Beat'],
    type: ['type', 'Type'],
    lens: ['lens', 'Lens'],
    move: ['move', 'Movement'],
    est: ['est', 'Est mins', 'Est'],
    status: ['status', 'Status']
  };

  const shots = shotsRaw.map((row) => {
    return {
      id: String(pickFirst(row, shotMap.id) || '').trim(),
      beatId: String(pickFirst(row, shotMap.beatId) || '').trim(),
      type: String(pickFirst(row, shotMap.type) || '').trim(),
      lens: Number(pickFirst(row, shotMap.lens) || 0),
      move: String(pickFirst(row, shotMap.move) || '').trim(),
      est: Number(pickFirst(row, shotMap.est) || 0),
      status: String(pickFirst(row, shotMap.status) || 'todo').trim()
    };
  });

  return { beats, shots };
}

module.exports = { normalizeBeatsAndShots };