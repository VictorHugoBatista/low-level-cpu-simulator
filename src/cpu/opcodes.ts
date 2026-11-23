import { Byte } from "../core/bytes.js";

export type AddressingMode = "impl" | "imm" | "zp" | "abs" | "absX" | "indY" | "rel";

export interface OpcodeInfo {
  readonly mnemonic: string;
  readonly mode: AddressingMode;
}

/**
 * A tabela de opcodes congelada em docs/ISA.md, espelhada aqui. Fonte única para a CPU
 * (decoder) e para o assembler — as duas pontas do contrato não podem divergir.
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

export const OPCODES: Readonly<Record<Byte, OpcodeInfo>> = TABLE;

const REVERSE = new Map<string, Byte>();
for (const key of Object.keys(TABLE)) {
  const opcode = Number(key);
  const info = TABLE[opcode];
  REVERSE.set(`${info.mnemonic}|${info.mode}`, opcode);
}

export function opcodeFor(mnemonic: string, mode: AddressingMode): Byte | undefined {
  return REVERSE.get(`${mnemonic.toUpperCase()}|${mode}`);
}

export function modesFor(mnemonic: string): AddressingMode[] {
  const upper = mnemonic.toUpperCase();
  const modes = new Set<AddressingMode>();
  for (const key of Object.keys(TABLE)) {
    const info = TABLE[Number(key)];
    if (info.mnemonic === upper) modes.add(info.mode);
  }
  return [...modes];
}

export function operandBytes(mode: AddressingMode): number {
  switch (mode) {
    case "imm":
    case "zp":
    case "indY":
    case "rel":
      return 1;
    case "abs":
    case "absX":
      return 2;
    case "impl":
      return 0;
  }
}
