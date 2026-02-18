import fs from 'node:fs';
import path from 'node:path';

function extractSchemaObjectLiteral(source) {
  const marker = 'export const DATA_SCHEMA =';
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('DATA_SCHEMA export marker not found in Config_Schema.js');
  }

  const startBrace = source.indexOf('{', markerIndex);
  if (startBrace === -1) {
    throw new Error('DATA_SCHEMA opening brace not found in Config_Schema.js');
  }

  let depth = 0;
  let endBrace = -1;

  for (let i = startBrace; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      endBrace = i;
      break;
    }
  }

  if (endBrace === -1) {
    throw new Error('DATA_SCHEMA closing brace not found in Config_Schema.js');
  }

  return source.slice(startBrace, endBrace + 1);
}

function loadDataSchema() {
  const schemaPath = path.resolve(process.cwd(), '../../src/Config/Config_Schema.js');
  const source = fs.readFileSync(schemaPath, 'utf8');
  const objectLiteral = extractSchemaObjectLiteral(source);

  // Config_Schema.js is trusted project code; evaluate only the extracted object literal.
  return Function(`"use strict"; return (${objectLiteral});`)();
}

export const DATA_SCHEMA = loadDataSchema();
