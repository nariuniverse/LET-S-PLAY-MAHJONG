import fs from 'node:fs';
import crypto from 'node:crypto';
import { parseDocument } from 'yaml';
const names = ['standard-riichi-rules', 'mamamo-rules', 'engine-resolutions'];
const values = names.map(name => {
  const text = fs.readFileSync(`rules/${name}.yaml`, 'utf8');
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(doc.errors.map(e => e.message).join('\n'));
  return doc.toJS();
});
const hash = crypto.createHash('sha256').update(JSON.stringify(values)).digest('hex');
fs.mkdirSync('src/generated', { recursive: true });
fs.writeFileSync('src/generated/catalog.ts', '// Generated from rules YAML. Do not edit.\nexport const catalog: unknown = ' + JSON.stringify({ hash, profiles: values.slice(0, 2), resolutions: values[2] }) + ';\n');
console.log(`Generated rule catalog ${hash}`);
