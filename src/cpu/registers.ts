import { Byte, Word } from "../core/bytes.js";

export const FLAG_C = 0x01;
export const FLAG_Z = 0x02;
export const FLAG_N = 0x04;
export const FLAG_V = 0x08;

/**
 * Os registradores da CPU. Visíveis ao programador: A, X, Y, SP, PC e P (flags).
 * Internos, para o ciclo de máquina: IR, MAR, MDR, TMP e T (passo do sequenciador).
 */
export class Registers {
  a: Byte = 0;
  x: Byte = 0;
  y: Byte = 0;
  sp: Byte = 0xff; // stack na página 0x0100, crescendo para baixo
  pc: Word = 0;

  ir: Byte = 0; // instrução corrente
  mar: Word = 0; // último endereço colocado no barramento
  mdr: Byte = 0; // último dado que passou pelo barramento
  tmp: Word = 0; // trava interna para operandos de mais de um byte
  t = 0; // passo do sequenciador dentro da instrução corrente

  p: Byte = 0; // flags: C | Z | N | V

  get c(): boolean {
    return (this.p & FLAG_C) !== 0;
  }

  set c(v: boolean) {
    this.p = v ? this.p | FLAG_C : this.p & ~FLAG_C;
  }

  get z(): boolean {
    return (this.p & FLAG_Z) !== 0;
  }

  set z(v: boolean) {
    this.p = v ? this.p | FLAG_Z : this.p & ~FLAG_Z;
  }

  get n(): boolean {
    return (this.p & FLAG_N) !== 0;
  }

  set n(v: boolean) {
    this.p = v ? this.p | FLAG_N : this.p & ~FLAG_N;
  }

  get v(): boolean {
    return (this.p & FLAG_V) !== 0;
  }

  set v(v: boolean) {
    this.p = v ? this.p | FLAG_V : this.p & ~FLAG_V;
  }

  setZN(value: Byte): void {
    this.z = value === 0;
    this.n = (value & 0x80) !== 0;
  }

  clear(): void {
    this.a = 0;
    this.x = 0;
    this.y = 0;
    this.sp = 0xff;
    this.pc = 0;
    this.ir = 0;
    this.mar = 0;
    this.mdr = 0;
    this.tmp = 0;
    this.t = 0;
    this.p = 0;
  }
}
