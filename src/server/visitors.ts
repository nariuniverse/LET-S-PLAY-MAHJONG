import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface VisitorData { version: 1; visitors: Record<string, string> }
export interface VisitorCounts { today: number; total: number }
const cookieName = 'mahjong_visitor';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export function koreaDate(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function validate(value: unknown): VisitorData {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('visitors' in value) || !value.visitors || typeof value.visitors !== 'object' || Array.isArray(value.visitors)) throw new Error('Invalid visitor database');
  for (const [key, day] of Object.entries(value.visitors)) {
    if (!/^[a-f0-9]{64}$/.test(key) || typeof day !== 'string' || !datePattern.test(day)) throw new Error('Invalid visitor record');
  }
  return value as VisitorData;
}

/** One store instance / Node process per persistent file. Writes are serialized. */
export function createVisitorStore(file: string, now: () => Date = () => new Date()) {
  let queue: Promise<unknown> = Promise.resolve();
  async function read(): Promise<VisitorData> {
    try { return validate(JSON.parse(await readFile(file, 'utf8')) as unknown); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, visitors: {} };
      throw error;
    }
  }
  function serialized<T>(action: () => Promise<T>): Promise<T> {
    const result = queue.then(action); queue = result.catch(() => undefined); return result;
  }
  function counts(data: VisitorData): VisitorCounts {
    const days = Object.values(data.visitors), today = koreaDate(now());
    return { today: days.filter(day => day === today).length, total: days.length };
  }
  return {
    read: () => serialized(async () => counts(await read())),
    visit: (candidate?: string) => serialized(async () => {
      const data = await read();
      const candidateHash = candidate && /^[a-f0-9-]{36}$/.test(candidate) ? createHash('sha256').update(candidate).digest('hex') : '';
      const id = candidateHash && Object.hasOwn(data.visitors, candidateHash) ? candidate! : randomUUID();
      const hash = createHash('sha256').update(id).digest('hex'), today = koreaDate(now());
      if (data.visitors[hash] !== today) {
        data.visitors[hash] = today;
        await mkdir(dirname(file), { recursive: true });
        const temporary = `${file}.${process.pid}.tmp`;
        await writeFile(temporary, JSON.stringify(data), { encoding: 'utf8', mode: 0o600 });
        await rename(temporary, file);
      }
      return { ...counts(data), id };
    }),
  };
}

export function visitorMiddleware(store: ReturnType<typeof createVisitorStore>) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    if (req.url?.split('?')[0] !== '/api/visitors') { next(); return; }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.statusCode = 405; res.setHeader('Allow', 'GET, POST'); res.end('{"error":"method_not_allowed"}'); return;
    }
    if (req.method === 'POST' && (req.headers['x-mahjong-visit'] !== '1' || req.headers['sec-fetch-site'] === 'cross-site')) {
      res.statusCode = 403; res.end('{"error":"forbidden"}'); return;
    }
    const run = async () => {
      if (req.method === 'GET') { res.end(JSON.stringify(await store.read())); return; }
      const candidate = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
      const { id, ...counts } = await store.visit(candidate);
      const secure = 'encrypted' in req.socket && req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
      res.setHeader('Set-Cookie', `${cookieName}=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`);
      res.end(JSON.stringify(counts));
    };
    void run().catch(() => { res.statusCode = 503; res.end('{"error":"counter_unavailable"}'); });
  };
}
