import { Byte, Word, hiByte, loByte } from "../core/bytes.js";
import { Clock } from "../core/clock.js";
import { RESET_VECTOR } from "../core/constants.js";
import { SystemBus } from "../bus/bus.js";
import type { BusTransaction } from "../bus/bus.js";
import { MemoryMap } from "../memory/memoryMap.js";
import { Ram } from "../memory/ram.js";
import { Cpu } from "../cpu/cpu.js";

/**
 * A máquina inteira ligada: barramento, memória e CPU. É o ponto de entrada do simulador —
 * o CLI e o futuro dashboard no navegador falam com a AK-8 por aqui.
 */
export class Machine {
  readonly clock = new Clock();
  readonly bus = new SystemBus();
  readonly ram = new Ram(64);
  readonly cpu: Cpu;

  constructor() {
    const map = new MemoryMap();
    map.map(0x0000, 0xffff, this.ram);
    this.bus.attach(map);
    this.bus.setCycleProvider(() => this.clock.cycleCount);
    this.cpu = new Cpu(this.bus);
  }

  /**
   * Carrega um programa montado na RAM e grava o vetor de reset apontando para a origem —
   * ligar a máquina não "roda o arquivo", ela lê o vetor e desvia.
   */
  loadProgram(bytes: readonly Byte[], origin: Word = 0x0200): void {
    this.ram.load(origin, bytes);
    this.ram.write(RESET_VECTOR, loByte(origin));
    this.ram.write(RESET_VECTOR + 1, hiByte(origin));
  }

  reset(): void {
    this.clock.reset();
    this.bus.clearHistory();
    this.cpu.reset(this.bus);
  }

  get isHalted(): boolean {
    return this.cpu.halted;
  }

  get cycleCount(): number {
    return this.clock.cycleCount;
  }

  get transactions(): readonly BusTransaction[] {
    return this.bus.transactions;
  }

  /** Avança exatamente um ciclo de clock. */
  tick(): void {
    if (this.cpu.halted) return;
    this.clock.tick();
    this.cpu.tick();
  }

  /** Roda direto até HLT (ou até o teto de ciclos). Devolve os ciclos executados. */
  run(maxCycles = 1_000_000): number {
    let executed = 0;
    while (!this.cpu.halted && executed < maxCycles) {
      this.tick();
      executed++;
    }
    return executed;
  }
}
