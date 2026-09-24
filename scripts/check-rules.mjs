import fs from 'node:fs';
import { parseDocument } from 'yaml';
for (const file of fs.readdirSync('rules').filter(f => f.endsWith('.yaml'))) {
  const doc = parseDocument(fs.readFileSync(`rules/${file}`, 'utf8'), { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`${file}: ${doc.errors.map(e => e.message).join('; ')}`);
  const data = doc.toJS();
  if (data.yaku) {
    const ids = new Set();
    for (const def of [...data.rules, ...data.yaku]) {
      if (ids.has(def.id)) throw new Error(`Duplicate ID ${def.id}`);
      ids.add(def.id);
      if (!def.sourcePages?.length || !def.confidence) throw new Error(`Missing source ${def.id}`);
    }
    console.log(`${file}: ${data.rules.length} policies, ${data.yaku.length} yaku; valid YAML and sources`);
  } else console.log(`${file}: valid YAML`);
}
