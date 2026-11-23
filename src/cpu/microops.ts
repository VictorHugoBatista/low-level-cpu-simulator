import { Byte, asWord, toSigned } from "../core/bytes.js";
import type { SystemBus } from "../bus/bus.js";
import type { Registers } from "./registers.js";
import { aluAdd, aluSub } from "./alu.js";

/**
 * Uma micro-operação: o que acontece em UM ciclo de clock. Toda micro-operação que move
 * um dado passa por um barramento, e o barramento registra a transferência.
 */
export interface MicroOp {
  readonly name: string;
  run(ctx: MicroOpContext): void;
}

export interface MicroOpContext {
  readonly regs: Registers;
  readonly bus: SystemBus;
  halt(): void;
}

/** T0 de toda instrução: busca do opcode. */
export const FETCH_OPCODE: MicroOp = {
  name: "MAR←PC; MDR←M[PC]; PC++; IR←MDR",
  run: ({ regs, bus }) => {
    regs.mar = regs.pc;
    regs.mdr = bus.readByte(regs.mar);
    regs.pc = asWord(regs.pc + 1);
    regs.ir = regs.mdr;
  },
};

// --- buscas de operando -------------------------------------------------------

const fetchToMdr = (what: string): MicroOp => ({
  name: `MDR←M[PC] (${what}); PC++`,
  run: ({ regs, bus }) => {
    regs.mar = regs.pc;
    regs.mdr = bus.readByte(regs.mar);
    regs.pc = asWord(regs.pc + 1);
  },
});

const fetchTmpLo: MicroOp = {
  name: "TMP←M[PC] (lo); PC++",
  run: ({ regs, bus }) => {
    regs.mar = regs.pc;
    regs.tmp = bus.readByte(regs.mar);
    regs.pc = asWord(regs.pc + 1);
  },
};

const fetchTmpHi: MicroOp = {
  name: "TMP.hi←M[PC]; PC++",
  run: ({ regs, bus }) => {
    regs.mar = regs.pc;
    regs.tmp = asWord(regs.tmp | (bus.readByte(regs.mar) << 8));
    regs.pc = asWord(regs.pc + 1);
  },
};

const readFromTmp: MicroOp = {
  name: "MAR←TMP; MDR←M[TMP]",
  run: ({ regs, bus }) => {
    regs.mar = regs.tmp;
    regs.mdr = bus.readByte(regs.mar);
  },
};

// --- execução -----------------------------------------------------------------

const loadAFromMdr: MicroOp = {
  name: "A←MDR; ZN",
  run: ({ regs }) => {
    regs.a = regs.mdr;
    regs.setZN(regs.a);
  },
};

const storeA: MicroOp = {
  name: "M[TMP]←A",
  run: ({ regs, bus }) => {
    bus.writeByte(regs.tmp, regs.a);
  },
};

const addOrSub = (kind: "add" | "sub"): MicroOp => ({
  name: kind === "add" ? "A←A+MDR; ZNCV" : "A←A-MDR; ZNCV",
  run: ({ regs }) => {
    const r = kind === "add" ? aluAdd(regs.a, regs.mdr) : aluSub(regs.a, regs.mdr);
    regs.a = r.value;
    regs.c = r.c;
    regs.v = r.v;
    regs.setZN(regs.a);
  },
});

const pcFromTmp: MicroOp = {
  name: "PC←TMP",
  run: ({ regs }) => {
    regs.pc = regs.tmp;
  },
};

const branchIf = (cond: string, taken: (regs: Registers) => boolean): MicroOp => ({
  name: `if ${cond}: PC←PC+offset`,
  run: ({ regs }) => {
    if (taken(regs)) regs.pc = asWord(regs.pc + toSigned(regs.mdr));
  },
});

const HALT: MicroOp = {
  name: "HALT",
  run: ({ halt }) => halt(),
};

// --- microprogramas do M1 (o fetch do opcode não está aqui: é parte fixa da CPU) ---
// Tabela completa da ISA congelada: docs/ISA.md.

export const MICROPROGRAMS: Record<Byte, readonly MicroOp[]> = {
  0x10: [fetchToMdr("imediato"), loadAFromMdr], // LDA #
  0x12: [fetchTmpLo, fetchTmpHi, readFromTmp, loadAFromMdr], // LDA abs
  0x22: [fetchTmpLo, fetchTmpHi, storeA], // STA abs
  0x70: [fetchToMdr("imediato"), addOrSub("add")], // ADD #
  0x80: [fetchToMdr("imediato"), addOrSub("sub")], // SUB #
  0xf0: [fetchTmpLo, fetchTmpHi, pcFromTmp], // JMP abs
  0xf2: [fetchToMdr("relativo"), branchIf("Z", (r) => r.z)], // JZ
  0xf3: [fetchToMdr("relativo"), branchIf("Z=0", (r) => !r.z)], // JNZ
  0xff: [HALT], // HLT
};
