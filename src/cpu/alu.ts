import { Byte, asByte } from "../core/bytes";

export interface AluResult {
  value: Byte;
  c: boolean; // carry (no SUB: ausência de borrow)
  v: boolean; // overflow com sinal
}

export function aluAdd(a: Byte, b: Byte): AluResult {
  const full = a + b;
  const value = asByte(full);
  return {
    value,
    c: full > 0xff,
    v: ((a ^ value) & (b ^ value) & 0x80) !== 0,
  };
}

/** SUB: C=1 quando não houve borrow (a >= b), mesma convenção do SBC do 6502 com carry em 1. */
export function aluSub(a: Byte, b: Byte): AluResult {
  const full = a - b;
  const value = asByte(full);
  return {
    value,
    c: full >= 0,
    v: ((a ^ b) & (a ^ value) & 0x80) !== 0,
  };
}

export function aluAnd(a: Byte, b: Byte): Byte {
  return asByte(a & b);
}

export function aluOra(a: Byte, b: Byte): Byte {
  return asByte(a | b);
}

export function aluXor(a: Byte, b: Byte): Byte {
  return asByte(a ^ b);
}

export function aluNot(a: Byte): Byte {
  return asByte(~a);
}

export function aluShl(a: Byte): AluResult {
  return { value: asByte(a << 1), c: (a & 0x80) !== 0, v: false };
}

export function aluShr(a: Byte): AluResult {
  return { value: asByte(a >>> 1), c: (a & 0x01) !== 0, v: false };
}
