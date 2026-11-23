import { Byte, Word, hex2, hex4 } from "../core/bytes";
import { MICROPROGRAMS } from "./microops";
import type { MicroOp } from "./microops";

export type AddressingMode = "impl" | "imm" | "zp" | "abs" | "absX" | "indY" | "rel";

export interface OpcodeInfo {
  readonly mnemonic: string;
  readonly mode: AddressingMode;
}

/**
 * A tabela de opcodes congelada em docs/ISA.md, espelhada aqui. Toda a ISA está declarada
 * (é o contrato com o futuro assembler); o que ainda não tem microprograma devolve um erro
 * claro ao ser executado.
 */
const TABLE: Record<Byte, OpcodeInfo> = {};

const def = (opcode: number, mnemonic: string, mode: AddressingMode): void => {
  TABLE[opcode] = { mnemonic, mode };
};

// 0x00–0x0A: instruções sem operando
def(0x00, "NOP", "impl");
def(0x01, "TAX", "impl");
def(0x02, "TXA", "impl");
def(0x03, "TAY", "impl");
def(0x04, "TYA", "impl");
def(0x05, "PHA", "impl");
def(0x06, "PLA", "impl");
def(0x07, "RTS", "impl");
def(0x08, "SHL", "impl");
def(0x09, "SHR", "impl");
def(0x0a, "NOT", "impl");

// 0x10–0xE3: nibble alto = instrução, nibble baixo = modo de endereçamento
const MODES_5: AddressingMode[] = ["imm", "zp", "abs", "absX", "indY"];
const MODES_3: AddressingMode[] = ["imm", "zp", "abs"];
const MODES_2: AddressingMode[] = ["zp", "abs"];
const MODES_STORE: AddressingMode[] = ["zp", "abs", "absX", "indY"];
const MODES_MEM: AddressingMode[] = ["zp", "abs", "absX"];

const GROUPS: Array<readonly [string, AddressingMode[]]> = [
  ["LDA", MODES_5],
  ["STA", MODES_STORE],
  ["LDX", MODES_3],
  ["STX", MODES_2],
  ["LDY", MODES_3],
  ["STY", MODES_2],
  ["ADD", MODES_5],
  ["SUB", MODES_5],
  ["AND", MODES_5],
  ["ORA", MODES_5],
  ["XOR", MODES_5],
  ["CMP", MODES_5],
  ["INC", MODES_MEM],
  ["DEC", MODES_MEM],
];

// nibble baixo canônico de cada modo (docs/ISA.md): 0 imm, 1 zp, 2 abs, 3 abs,X, 4 (zp),Y
const MODE_NIBBLE: Record<AddressingMode, number> = {
  impl: -1,
  imm: 0,
  zp: 1,
  abs: 2,
  absX: 3,
  indY: 4,
  rel: 5,
};

GROUPS.forEach(([mnemonic, modes], group) => {
  const base = (0x1 + group) << 4;
  modes.forEach((mode) => def(base | MODE_NIBBLE[mode], mnemonic, mode));
});

// 0xF0–0xFF: fluxo de controle
def(0xf0, "JMP", "abs");
def(0xf1, "JSR", "abs");
def(0xf2, "JZ", "rel");
def(0xf3, "JNZ", "rel");
def(0xf4, "JC", "rel");
def(0xf5, "JNC", "rel");
def(0xf6, "JN", "rel");
def(0xff, "HLT", "impl");

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
  const info = TABLE[opcode];
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
