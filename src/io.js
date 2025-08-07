const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

async function readDataFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');
  if (ext === '.csv') {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true
    });
    return records;
  }
  if (ext === '.json') {
    return JSON.parse(content);
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = { readDataFile };