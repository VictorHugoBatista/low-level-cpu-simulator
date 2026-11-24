import { asWord } from "../core/bytes.js";
import { RESET_VECTOR } from "../core/constants.js";
import type { SystemBus } from "../bus/bus.js";
import { Registers } from "./registers.js";
import { FETCH_OPCODE } from "./microops.js";
import type { MicroOp, MicroOpContext } from "./microops.js";
import { microprogramFor } from "./decoder.js";

/**
 * A CPU da MOS-6502. Cada chamada a tick() executa exatamente UMA micro-operação — um ciclo de
 * clock. A instrução começa sempre pelo fetch do opcode; o resto vem do microprograma.
 */
export class Cpu {
  readonly regs = new Registers();
  halted = false;

  private pending: MicroOp[] = [];
  private readonly ctx: MicroOpContext;

  constructor(bus: SystemBus) {
    this.ctx = {
      regs: this.regs,
      bus,
      halt: () => {
        this.halted = true;
      },
    };
  }

  /** Passo do sequenciador dentro da instrução corrente (0 = acabou de buscar o opcode). */
  get t(): number {
    return this.regs.t;
  }

  tick(): void {
    if (this.halted) return;
    if (this.pending.length === 0) {
      FETCH_OPCODE.run(this.ctx);
      this.regs.t = 0;
      const opcodeAddress = asWord(this.regs.pc - 1);
      this.pending = microprogramFor(this.regs.ir, opcodeAddress);
    } else {
      const op = this.pending.shift();
      if (op !== undefined) {
        this.regs.t++;
        op.run(this.ctx);
      }
    }
  }

  /** Reset de verdade: lê o vetor em 0xFFFC pelo barramento, não recebe PC de presente. */
  reset(bus: SystemBus): void {
    this.regs.clear();
    this.pending = [];
    this.halted = false;
    const lo = bus.readByte(RESET_VECTOR);
    const hi = bus.readByte(RESET_VECTOR + 1);
    this.regs.pc = asWord((hi << 8) | lo);
  }
}
