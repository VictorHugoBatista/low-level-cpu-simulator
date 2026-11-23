/** O relógio da máquina: conta ciclos. Um tick é um ciclo de clock, nada mais. */
export class Clock {
  private cycles = 0;

  tick(): void {
    this.cycles++;
  }

  get cycleCount(): number {
    return this.cycles;
  }

  reset(): void {
    this.cycles = 0;
  }
}
