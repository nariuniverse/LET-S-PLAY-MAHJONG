import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { createVisitorStore, visitorMiddleware, koreaDate } from '../../src/server/visitors.js';

const servers: Server[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())))); });
async function file() {
  const root = resolve('tmp/visitor-tests'); await mkdir(root, { recursive: true });
  return join(await mkdtemp(join(root, 'case-')), 'visitors.json');
}
async function serve(store: ReturnType<typeof createVisitorStore>) {
  const middleware = visitorMiddleware(store);
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  servers.push(server); await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
  return `http://127.0.0.1:${address.port}`;
}

describe('site-wide visitor counter', () => {
  it('counts different browsers together, deduplicates refreshes and survives restart', async () => {
    const path = await file(), store = createVisitorStore(path);
    const first = await store.visit(), second = await store.visit();
    expect(second).toMatchObject({ today: 2, total: 2 });
    expect(await store.visit(first.id)).toMatchObject({ today: 2, total: 2 });
    expect(await createVisitorStore(path).visit(first.id)).toMatchObject({ today: 2, total: 2 });
    expect(await readFile(path, 'utf8')).not.toContain(first.id);
  });
  it('resets today at Korean midnight without resetting cumulative unique browsers', async () => {
    let now = new Date('2026-09-23T14:59:59Z');
    const store = createVisitorStore(await file(), () => now), first = await store.visit();
    await store.visit();
    now = new Date('2026-09-23T15:00:00Z');
    expect(koreaDate(now)).toBe('2026-09-24');
    expect(await store.read()).toEqual({ today: 0, total: 2 });
    expect(await store.visit(first.id)).toMatchObject({ today: 1, total: 2 });
    expect(await store.visit()).toMatchObject({ today: 2, total: 3 });
  });
  it('does not lose concurrent visits or double count simultaneous known visitors', async () => {
    const store = createVisitorStore(await file());
    const visitors = await Promise.all(Array.from({ length: 20 }, () => store.visit()));
    await Promise.all(visitors.map(visitor => store.visit(visitor.id)));
    expect(await store.read()).toEqual({ today: 20, total: 20 });
  });
  it('does not overwrite damaged data or leave the queue rejected', async () => {
    const path = await file(), store = createVisitorStore(path);
    await writeFile(path, 'broken');
    await expect(store.visit()).rejects.toThrow();
    expect(await readFile(path, 'utf8')).toBe('broken');
    await writeFile(path, '{"version":1,"visitors":{}}');
    expect(await store.visit()).toMatchObject({ total: 1 });
  });
  it('rejects invalid stored records and ignores malformed visitor cookies', async () => {
    const path = await file(), store = createVisitorStore(path);
    await writeFile(path, '{"version":1,"visitors":{"bad":"bad"}}');
    await expect(store.read()).rejects.toThrow('Invalid visitor record');
    await writeFile(path, '{"version":1,"visitors":{}}');
    expect(await store.visit('__proto__')).toMatchObject({ total: 1 });
  });
  it('shares HTTP counts with a private cookie and a read-only GET', async () => {
    const base = await serve(createVisitorStore(await file()));
    expect(await (await fetch(`${base}/api/visitors`)).json()).toEqual({ today: 0, total: 0 });
    const first = await fetch(`${base}/api/visitors`, { method: 'POST', headers: { 'X-Mahjong-Visit': '1' } });
    const cookie = first.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Lax');
    expect(first.headers.get('cache-control')).toBe('no-store');
    expect(await first.json()).toEqual({ today: 1, total: 1 });
    const repeat = await fetch(`${base}/api/visitors`, { method: 'POST', headers: { 'X-Mahjong-Visit': '1', Cookie: cookie.split(';')[0]! } });
    expect(await repeat.json()).toEqual({ today: 1, total: 1 });
    const other = await fetch(`${base}/api/visitors`, { method: 'POST', headers: { 'X-Mahjong-Visit': '1' } });
    expect(await other.json()).toEqual({ today: 2, total: 2 });
    expect((await fetch(`${base}/api/visitors`, { method: 'POST' })).status).toBe(403);
    expect((await fetch(`${base}/api/visitors`, { method: 'POST', headers: { 'X-Mahjong-Visit': '1', 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403);
    expect((await fetch(`${base}/api/visitors`, { method: 'DELETE' })).status).toBe(405);
  });
  it('reports storage failures as unavailable instead of inventing zero visitors', async () => {
    const path = await file(); await writeFile(path, 'broken');
    const base = await serve(createVisitorStore(path));
    expect((await fetch(`${base}/api/visitors`)).status).toBe(503);
  });
});
