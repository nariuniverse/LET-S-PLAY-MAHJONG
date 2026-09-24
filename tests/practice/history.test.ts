import { expect, it } from 'vitest';
import { readHistory, recordAttempt, summarize } from '../../src/practice/history.js';
import type { Attempt } from '../../src/practice/history.js';
const a: Attempt = { id:'one', mode:'wait', ruleSet:'mamamo', correct:true, elapsedMs:2000, timestamp:1 };
it('recovers corrupt storage and filters invalid entries', () => {
  expect(readHistory('{broken')).toEqual([]);
  expect(readHistory(JSON.stringify([a, { ...a, elapsedMs:-1 }, { ...a, mode:'unknown' }]))).toEqual([a]);
});
it('does not count retries twice and limits recent records', () => {
  expect(recordAttempt([a], a)).toHaveLength(1);
  const list = Array.from({length:210}, (_,i) => ({...a,id:String(i)}));
  expect(recordAttempt(list, {...a,id:'new'})).toHaveLength(200);
});
it('separates profiles and modes in statistics', () => {
  const s = summarize([a,{...a,id:'two',correct:false,elapsedMs:4000},{...a,ruleSet:'standard-riichi'}], 'mamamo','wait');
  expect(s).toEqual({solved:2,correct:1,accuracy:50,averageMs:3000});
  expect(summarize([], 'mamamo','score').accuracy).toBeNull();
});

it('separates discard levels and keeps legacy attempts at level one', () => {
  const old: Attempt = { ...a, id:'old', mode:'discard' };
  const one: Attempt = { ...old, id:'level1', level:1, correct:false };
  const two: Attempt = { ...old, id:'level2', level:2, elapsedMs:8000 };
  const three: Attempt = { ...old, id:'level3', level:3, correct:false };
  const stored = readHistory(JSON.stringify([old,one,two,three,a]));
  expect(stored).toHaveLength(5);
  expect(summarize(stored,'mamamo','discard',1)).toEqual({solved:2,correct:1,accuracy:50,averageMs:2000});
  expect(summarize(stored,'mamamo','discard',2)).toEqual({solved:1,correct:1,accuracy:100,averageMs:8000});
  expect(summarize(stored,'mamamo','discard',3).accuracy).toBe(0);
  expect(summarize(stored,'mamamo','discard').solved).toBe(4);
  expect(summarize(stored,'mamamo','wait',3).solved).toBe(1);
  expect(recordAttempt(stored,two)).toHaveLength(5);
});
it('rejects corrupted or misplaced difficulty values in saved records', () => {
  expect(readHistory(JSON.stringify([{...a,level:2},{...a,mode:'discard',level:4},{...a,mode:'discard',level:'3'}]))).toEqual([]);
});
