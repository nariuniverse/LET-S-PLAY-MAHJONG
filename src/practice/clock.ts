/** A monotonic active-time clock. Hidden tabs and explicit pauses do not count. */
export class PracticeClock {
  private accumulated = 0;
  private since: number | null = null;
  private finished = false;
  constructor(private readonly now: () => number) {}
  start(): void { this.accumulated = 0; this.finished = false; this.since = this.now(); }
  pause(): void { if (this.since !== null) { this.accumulated += Math.max(0, this.now() - this.since); this.since = null; } }
  resume(): void { if (!this.finished && this.since === null) this.since = this.now(); }
  stop(): number { this.pause(); this.finished = true; return this.elapsed(); }
  elapsed(): number { return this.accumulated + (this.since === null ? 0 : Math.max(0, this.now() - this.since)); }
}
