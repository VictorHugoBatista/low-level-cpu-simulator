import { Byte, Word, hex2, hex4 } from "../core/bytes.js";
import { MICROPROGRAMS } from "./microops.js";
import type { MicroOp } from "./microops.js";
import { OPCODES } from "./opcodes.js";
import type { AddressingMode } from "./opcodes.js";

export type { AddressingMode, OpcodeInfo } from "./opcodes.js";

const MODE_LABEL: Record<AddressingMode, string> = {
  impl: "",
  imm: "#",
  zp: "zp",
  abs: "abs",
  absX: "abs,X",
  indY: "(zp),Y",
  rel: "rel",
};

/**
 * O microprograma de um opcode, SEM o fetch do opcode (que é parte fixa de toda instrução,
 * executado pela própria CPU). Devolve uma cópia própria, pronta para consumo.
 */
export function microprogramFor(opcode: Byte, opcodeAddress: Word): MicroOp[] {
  const info = OPCODES[opcode];
  if (info === undefined) {
    throw new Error(
      `opcode inválido 0x${hex2(opcode)} em 0x${hex4(opcodeAddress)} (tabela congelada em docs/ISA.md)`,
    );
  }
  const program = MICROPROGRAMS[opcode];
  if (program === undefined) {
    throw new Error(
      `0x${hex2(opcode)} (${info.mnemonic} ${MODE_LABEL[info.mode]}): instrução congelada na ISA (docs/ISA.md) e ainda não implementada`,
    );
  }
  return program.slice();
}
