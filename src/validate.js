const Ajv = require('ajv');

const beatSchema = {
  type: 'object',
  required: ['beatId', 'logline'],
  properties: {
    beatId: { type: 'string', minLength: 1 },
    scene: { type: 'string' },
    logline: { type: 'string' },
    status: { type: 'string' },
    estMinutes: { type: 'number' },
    shootDay: { type: 'number' },
    location: { type: 'string' },
    cast: { type: 'array', items: { type: 'string' } },
    intent: { type: 'string' },
    stakes: { type: 'string' },
    outcome: { type: 'string' },
    risks: {
      type: 'array',
      items: { type: 'object', properties: { level: { type: 'string' }, note: { type: 'string' } } }
    },
    camera: {
      type: 'object',
      properties: {
        coverage: { type: 'string' },
        lenses: { type: 'array', items: { oneOf: [{ type: 'string' }, { type: 'number' }] } },
        move: { type: 'string' }
      }
    },
    sound: {
      type: 'object',
      properties: {
        mics: { type: 'array', items: { type: 'string' } }
      }
    },
    checklist: {
      type: 'array',
      items: { type: 'object', required: ['label'], properties: { label: { type: 'string' }, done: { type: 'boolean' } } }
    },
    links: {
      type: 'object',
      properties: {
        script: { type: 'string' },
        boards: { type: 'string' },
        drive: { type: 'string' },
        floorplan: { type: 'string' }
      }
    }
  }
};

const shotSchema = {
  type: 'object',
  required: ['id', 'beatId'],
  properties: {
    id: { type: 'string' },
    beatId: { type: 'string' },
    type: { type: 'string' },
    lens: { type: 'number' },
    move: { type: 'string' },
    est: { type: 'number' },
    status: { type: 'string' }
  }
};

function validateData(beats, shots) {
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  const validateBeat = ajv.compile(beatSchema);
  const validateShot = ajv.compile(shotSchema);
  const errors = [];

  for (const b of beats) {
    if (!validateBeat(b)) {
      errors.push({ beatId: b.beatId, errors: validateBeat.errors });
    }
  }
  for (const s of shots) {
    if (!validateShot(s)) {
      errors.push({ shotId: s.id, errors: validateShot.errors });
    }
  }

  // Cross-link shots to beats
  const beatIds = new Set(beats.map((b) => b.beatId));
  for (const s of shots) {
    if (!beatIds.has(s.beatId)) {
      errors.push({ shotId: s.id, errors: [`Shot references missing beatId: ${s.beatId}`] });
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateData };