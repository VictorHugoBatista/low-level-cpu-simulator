import { Byte, asByte, asWord, hiByte, loByte, toSigned } from "../core/bytes.js";
import { STACK_PAGE } from "../core/constants.js";
import type { SystemBus } from "../bus/bus.js";
import type { Registers } from "./registers.js";
import { aluAdd, aluAnd, aluNot, aluOra, aluShl, aluShr, aluSub, aluXor } from "./alu.js";

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

// ponteiro indireto ($nn),Y: dois bytes na página zero formam o ponteiro
const readPtrLo: MicroOp = {
  name: "MAR←TMP; MDR←M[TMP]; TMP←MDR (ptr lo)",
  run: ({ regs, bus }) => {
    regs.mar = regs.tmp;
    regs.mdr = bus.readByte(regs.mar);
    regs.tmp = regs.mdr;
  },
};

const readPtrHi: MicroOp = {
  name: "MAR←MAR+1 (na página); MDR←M[MAR]; TMP.hi←MDR",
  run: ({ regs, bus }) => {
    regs.mar = (regs.mar + 1) & 0xff; // ponteiro zp: incrementa dentro da página
    regs.mdr = bus.readByte(regs.mar);
    regs.tmp = asWord(regs.tmp | (regs.mdr << 8));
  },
};

const tmpAddX: MicroOp = {
  name: "TMP←TMP+X",
  run: ({ regs }) => {
    regs.tmp = asWord(regs.tmp + regs.x);
  },
};

const tmpAddY: MicroOp = {
  name: "TMP←TMP+Y",
  run: ({ regs }) => {
    regs.tmp = asWord(regs.tmp + regs.y);
  },
};

// --- execução -----------------------------------------------------------------

const loadRegFromMdr = (reg: "a" | "x" | "y"): MicroOp => ({
  name: `${reg.toUpperCase()}←MDR; ZN`,
  run: ({ regs }) => {
    const v = regs.mdr;
    if (reg === "a") regs.a = v;
    else if (reg === "x") regs.x = v;
    else regs.y = v;
    regs.setZN(v);
  },
});

const storeReg = (reg: "a" | "x" | "y"): MicroOp => ({
  name: `M[TMP]←${reg.toUpperCase()}`,
  run: ({ regs, bus }) => {
    const v = reg === "a" ? regs.a : reg === "x" ? regs.x : regs.y;
    bus.writeByte(regs.tmp, v);
  },
});

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

const logicOp = (kind: "and" | "ora" | "xor"): MicroOp => ({
  name: `A←A${kind === "and" ? "&" : kind === "ora" ? "|" : "⊕"}MDR; ZN`,
  run: ({ regs }) => {
    const f = kind === "and" ? aluAnd : kind === "ora" ? aluOra : aluXor;
    regs.a = f(regs.a, regs.mdr);
    regs.setZN(regs.a);
  },
});

/** CMP: só flags (Z N C); A intacto e V intocado. */
const cmpOp: MicroOp = {
  name: "A−MDR → ZNC (A intacto)",
  run: ({ regs }) => {
    const r = aluSub(regs.a, regs.mdr);
    regs.c = r.c;
    regs.setZN(r.value);
  },
};

const incDecExec = (kind: "inc" | "dec"): MicroOp => ({
  name: kind === "inc" ? "MDR←MDR+1; ZN" : "MDR←MDR-1; ZN",
  run: ({ regs }) => {
    regs.mdr = kind === "inc" ? asByte(regs.mdr + 1) : asByte(regs.mdr - 1);
    regs.setZN(regs.mdr);
  },
});

const writeMdr: MicroOp = {
  name: "M[TMP]←MDR",
  run: ({ regs, bus }) => {
    bus.writeByte(regs.tmp, regs.mdr);
  },
};

const shiftOp = (kind: "shl" | "shr"): MicroOp => ({
  name: kind === "shl" ? "A←A<<1; C←bit7; ZN" : "A←A>>1; C←bit0; ZN",
  run: ({ regs }) => {
    const r = kind === "shl" ? aluShl(regs.a) : aluShr(regs.a);
    regs.a = r.value;
    regs.c = r.c;
    regs.setZN(regs.a);
  },
});

const notOp: MicroOp = {
  name: "A←~A; ZN",
  run: ({ regs }) => {
    regs.a = aluNot(regs.a);
    regs.setZN(regs.a);
  },
};

const NOP: MicroOp = {
  name: "nada",
  run: () => {},
};

// --- transferências -----------------------------------------------------------

const xFromA: MicroOp = {
  name: "X←A; ZN",
  run: ({ regs }) => {
    regs.x = regs.a;
    regs.setZN(regs.x);
  },
};

const aFromX: MicroOp = {
  name: "A←X; ZN",
  run: ({ regs }) => {
    regs.a = regs.x;
    regs.setZN(regs.a);
  },
};

const yFromA: MicroOp = {
  name: "Y←A; ZN",
  run: ({ regs }) => {
    regs.y = regs.a;
    regs.setZN(regs.y);
  },
};

const aFromY: MicroOp = {
  name: "A←Y; ZN",
  run: ({ regs }) => {
    regs.a = regs.y;
    regs.setZN(regs.a);
  },
};

// --- stack (página $0100; PHA escreve antes de decrementar, PLA incrementa antes de ler) ---

const pushA: MicroOp = {
  name: "M[$0100+SP]←A; SP--",
  run: ({ regs, bus }) => {
    bus.writeByte(STACK_PAGE + regs.sp, regs.a);
    regs.sp = asByte(regs.sp - 1);
  },
};

const pushPCH: MicroOp = {
  name: "M[$0100+SP]←PCH; SP--",
  run: ({ regs, bus }) => {
    bus.writeByte(STACK_PAGE + regs.sp, hiByte(regs.pc));
    regs.sp = asByte(regs.sp - 1);
  },
};

const pushPCL: MicroOp = {
  name: "M[$0100+SP]←PCL; SP--",
  run: ({ regs, bus }) => {
    bus.writeByte(STACK_PAGE + regs.sp, loByte(regs.pc));
    regs.sp = asByte(regs.sp - 1);
  },
};

const pullToMdr: MicroOp = {
  name: "SP++; MDR←M[$0100+SP]",
  run: ({ regs, bus }) => {
    regs.sp = asByte(regs.sp + 1);
    regs.mdr = bus.readByte(STACK_PAGE + regs.sp);
  },
};

const pullTmpLo: MicroOp = {
  name: "SP++; TMP←M[$0100+SP] (lo)",
  run: ({ regs, bus }) => {
    regs.sp = asByte(regs.sp + 1);
    regs.tmp = bus.readByte(STACK_PAGE + regs.sp);
  },
};

const pullTmpHi: MicroOp = {
  name: "SP++; TMP.hi←M[$0100+SP]",
  run: ({ regs, bus }) => {
    regs.sp = asByte(regs.sp + 1);
    regs.tmp = asWord(regs.tmp | (bus.readByte(STACK_PAGE + regs.sp) << 8));
  },
};

// --- desvios ------------------------------------------------------------------

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

// --- composição dos microprogramas --------------------------------------------
// O fetch do opcode não está aqui: é parte fixa da CPU. Custos em ciclos conferem
// com docs/ISA.md (loads: 1 + endereço + leitura + write-back; INC/DEC soma o
// write-back; stores terminam na própria escrita).

function addrSeq(mode: "zp" | "abs" | "absX" | "indY"): MicroOp[] {
  switch (mode) {
    case "zp":
      return [fetchTmpLo];
    case "abs":
      return [fetchTmpLo, fetchTmpHi];
    case "absX":
      return [fetchTmpLo, fetchTmpHi, tmpAddX];
    case "indY":
      return [fetchTmpLo, readPtrLo, readPtrHi, tmpAddY];
  }
}

const loadSeq = (reg: "a" | "x" | "y", mode: "zp" | "abs" | "absX" | "indY"): MicroOp[] => [
  ...addrSeq(mode),
  readFromTmp,
  loadRegFromMdr(reg),
];

const storeSeq = (reg: "a" | "x" | "y", mode: "zp" | "abs" | "absX" | "indY"): MicroOp[] => [
  ...addrSeq(mode),
  storeReg(reg),
];

const memExec = (exec: MicroOp, mode: "zp" | "abs" | "absX" | "indY"): MicroOp[] => [
  ...addrSeq(mode),
  readFromTmp,
  exec,
];

const memRmw = (exec: MicroOp, mode: "zp" | "abs" | "absX" | "indY"): MicroOp[] => [
  ...addrSeq(mode),
  readFromTmp,
  exec,
  writeMdr,
];

const immExec = (exec: MicroOp): MicroOp[] => [fetchToMdr("imediato"), exec];

// --- tabela completa (docs/ISA.md) --------------------------------------------

export const MICROPROGRAMS: Record<Byte, readonly MicroOp[]> = {
  // 0x0_ — sem operando
  0x00: [NOP],
  0x01: [xFromA],
  0x02: [aFromX],
  0x03: [yFromA],
  0x04: [aFromY],
  0x05: [pushA],
  0x06: [pullToMdr, loadRegFromMdr("a")],
  0x07: [pullTmpLo, pullTmpHi, pcFromTmp], // RTS
  0x08: [shiftOp("shl")],
  0x09: [shiftOp("shr")],
  0x0a: [notOp],

  // LDA
  0x10: immExec(loadRegFromMdr("a")),
  0x11: loadSeq("a", "zp"),
  0x12: loadSeq("a", "abs"),
  0x13: loadSeq("a", "absX"),
  0x14: loadSeq("a", "indY"),

  // STA
  0x21: storeSeq("a", "zp"),
  0x22: storeSeq("a", "abs"),
  0x23: storeSeq("a", "absX"),
  0x24: storeSeq("a", "indY"),

  // LDX
  0x30: immExec(loadRegFromMdr("x")),
  0x31: loadSeq("x", "zp"),
  0x32: loadSeq("x", "abs"),

  // STX
  0x41: storeSeq("x", "zp"),
  0x42: storeSeq("x", "abs"),

  // LDY
  0x50: immExec(loadRegFromMdr("y")),
  0x51: loadSeq("y", "zp"),
  0x52: loadSeq("y", "abs"),

  // STY
  0x61: storeSeq("y", "zp"),
  0x62: storeSeq("y", "abs"),

  // ADD
  0x70: immExec(addOrSub("add")),
  0x71: memExec(addOrSub("add"), "zp"),
  0x72: memExec(addOrSub("add"), "abs"),
  0x73: memExec(addOrSub("add"), "absX"),
  0x74: memExec(addOrSub("add"), "indY"),

  // SUB
  0x80: immExec(addOrSub("sub")),
  0x81: memExec(addOrSub("sub"), "zp"),
  0x82: memExec(addOrSub("sub"), "abs"),
  0x83: memExec(addOrSub("sub"), "absX"),
  0x84: memExec(addOrSub("sub"), "indY"),

  // AND
  0x90: immExec(logicOp("and")),
  0x91: memExec(logicOp("and"), "zp"),
  0x92: memExec(logicOp("and"), "abs"),
  0x93: memExec(logicOp("and"), "absX"),
  0x94: memExec(logicOp("and"), "indY"),

  // ORA
  0xa0: immExec(logicOp("ora")),
  0xa1: memExec(logicOp("ora"), "zp"),
  0xa2: memExec(logicOp("ora"), "abs"),
  0xa3: memExec(logicOp("ora"), "absX"),
  0xa4: memExec(logicOp("ora"), "indY"),

  // XOR
  0xb0: immExec(logicOp("xor")),
  0xb1: memExec(logicOp("xor"), "zp"),
  0xb2: memExec(logicOp("xor"), "abs"),
  0xb3: memExec(logicOp("xor"), "absX"),
  0xb4: memExec(logicOp("xor"), "indY"),

  // CMP
  0xc0: immExec(cmpOp),
  0xc1: memExec(cmpOp, "zp"),
  0xc2: memExec(cmpOp, "abs"),
  0xc3: memExec(cmpOp, "absX"),
  0xc4: memExec(cmpOp, "indY"),

  // INC
  0xd1: memRmw(incDecExec("inc"), "zp"),
  0xd2: memRmw(incDecExec("inc"), "abs"),
  0xd3: memRmw(incDecExec("inc"), "absX"),

  // DEC
  0xe1: memRmw(incDecExec("dec"), "zp"),
  0xe2: memRmw(incDecExec("dec"), "abs"),
  0xe3: memRmw(incDecExec("dec"), "absX"),

  // fluxo de controle
  0xf0: [fetchTmpLo, fetchTmpHi, pcFromTmp], // JMP abs
  0xf1: [fetchTmpLo, fetchTmpHi, pushPCH, pushPCL, pcFromTmp], // JSR abs
  0xf2: [fetchToMdr("relativo"), branchIf("Z", (r) => r.z)], // JZ
  0xf3: [fetchToMdr("relativo"), branchIf("Z=0", (r) => !r.z)], // JNZ
  0xf4: [fetchToMdr("relativo"), branchIf("C", (r) => r.c)], // JC
  0xf5: [fetchToMdr("relativo"), branchIf("C=0", (r) => !r.c)], // JNC
  0xf6: [fetchToMdr("relativo"), branchIf("N", (r) => r.n)], // JN
  0xff: [HALT],
};
