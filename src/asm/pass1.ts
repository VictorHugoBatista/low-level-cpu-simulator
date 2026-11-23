import { Byte, Word } from "../core/bytes.js";
import { modesFor, opcodeFor, operandBytes } from "../cpu/opcodes.js";
import type { AddressingMode } from "../cpu/opcodes.js";
import type { AsmProblem, Token } from "./lexer.js";
import type { Statement } from "./parser.js";

export interface SymbolEntry {
  value: number;
  kind: "label" | "const";
  line: number;
}

export interface StmtPlan {
  stmt: Statement;
  addr: Word;
  size: number;
  opcode?: Byte;
  mode?: AddressingMode;
  /** Bytes já resolvidos (diretivas .db/.dw/.ascii — sem referência para frente). */
  data?: Byte[];
}

export interface Pass1Result {
  origin: Word;
  plans: StmtPlan[];
  labels: Map<string, SymbolEntry>;
  constants: Map<string, SymbolEntry>;
}

const DEFAULT_ORIGIN = 0x0200;

/**
 * Primeira passada: endereça e mede cada linha, define rótulos e constantes e escolhe o
 * modo de endereçamento. Rótulos podem ser referenciados para frente; constantes (.equ) e
 * valores em .db/.dw/.ascii precisam estar definidos antes de usados.
 */
export function pass1(stmts: Statement[], file: string, problems: AsmProblem[]): Pass1Result {
  const labels = new Map<string, SymbolEntry>();
  const constants = new Map<string, SymbolEntry>();
  const plans: StmtPlan[] = [];
  let pc: number | null = null;
  let origin: Word | null = null;

  const ensurePc = (): number => {
    if (pc === null) pc = DEFAULT_ORIGIN;
    return pc;
  };

  const problem = (stmt: Statement, col: number, message: string): void => {
    problems.push({ file, line: stmt.line, col: col || 1, message });
  };

  const define = (
    name: string,
    value: number,
    kind: "label" | "const",
    line: number,
    col: number,
  ): void => {
    if (labels.has(name) || constants.has(name)) {
      problems.push({ file, line, col, message: `símbolo já definido: ${name}` });
      return;
    }
    (kind === "label" ? labels : constants).set(name, { value, kind, line });
  };

  const termValue = (t: Token | undefined, stmt: Statement): number | null => {
    if (t === undefined) {
      problem(stmt, 1, "valor esperado");
      return null;
    }
    if (t.kind === "number") return t.num ?? 0;
    if (t.kind === "symbol") {
      const entry = constants.get(t.value) ?? labels.get(t.value);
      if (entry === undefined) {
        problem(stmt, t.col, `símbolo não definido (resolva antes de usar): ${t.value}`);
        return null;
      }
      return entry.value;
    }
    problem(stmt, t.col, "valor inesperado");
    return null;
  };

  function selectMode(stmt: Statement): AddressingMode | null {
    const mn = stmt.mnemonic!;
    const available = modesFor(mn);
    const arg = stmt.arg;

    if (arg === undefined) {
      if (available.includes("impl")) return "impl";
      problem(stmt, 1, `${mn} requer operando`);
      return null;
    }

    const col = stmt.argCol;
    const term = arg.term;

    if (arg.kind === "imm") {
      if (available.includes("imm")) return "imm";
      problem(stmt, col, `${mn} não aceita imediato`);
      return null;
    }
    if (arg.kind === "indexX") {
      if (available.includes("absX")) return "absX";
      problem(stmt, col, `${mn} não aceita o modo abs,X`);
      return null;
    }
    if (arg.kind === "indexY") {
      if (available.includes("indY")) return "indY";
      problem(stmt, col, `${mn} não aceita o modo (zp),Y`);
      return null;
    }
    if (arg.kind === "parens") {
      problem(stmt, col, "não há modo indireto simples na ISA — só ($nn),Y");
      return null;
    }

    // Modo "plain": literais e constantes que cabem em um byte vão para o zero page;
    // rótulos (endereços de programa) vão sempre para o absoluto — ou para o relativo,
    // nos desvios.
    let value: number | null = null;
    if (term.kind === "num") value = term.value;
    else {
      const c = constants.get(term.name);
      if (c !== undefined) value = c.value;
    }

    if (value !== null && value < 0) {
      problem(stmt, col, `endereço negativo: ${value} (para valor, escreva #${value & 0xff})`);
      return null;
    }
    if (value !== null && value <= 0xff && available.includes("zp")) return "zp";
    if (available.includes("abs")) return "abs";
    if (available.includes("rel")) return "rel";
    problem(stmt, col, `${mn} não suporta este operando`);
    return null;
  }

  function handleMnemonic(stmt: Statement): void {
    const start = ensurePc();
    const mode = selectMode(stmt);
    if (mode === null) return;
    const opcode = opcodeFor(stmt.mnemonic!, mode);
    if (opcode === undefined) {
      problem(stmt, stmt.argCol, `não há opcode para ${stmt.mnemonic} no modo ${mode}`);
      return;
    }
    const size = 1 + operandBytes(mode);
    if (origin === null) origin = start;
    plans.push({ stmt, addr: start, size, opcode, mode });
    pc = (start + size) & 0xffff;
  }

  function handleDirective(stmt: Statement): void {
    const d = stmt.directive!;
    const args = stmt.dirArgs;

    if (d === ".org") {
      const value = termValue(args[0], stmt);
      if (value === null) return;
      if (value < 0 || value > 0xffff) {
        problem(stmt, args[0]?.col ?? 1, "endereço de .org fora de 16 bits");
        return;
      }
      pc = value;
      plans.push({ stmt, addr: value, size: 0 });
      return;
    }

    if (d === ".equ") {
      const nameTok = args[0];
      if (nameTok === undefined || nameTok.kind !== "symbol") {
        problem(stmt, 1, ".equ espera: .equ nome, valor");
        return;
      }
      const value = termValue(args[2], stmt); // args: [nome, ",", valor]
      if (value === null) return;
      define(nameTok.value, value, "const", stmt.line, nameTok.col);
      plans.push({ stmt, addr: pc ?? DEFAULT_ORIGIN, size: 0 });
      return;
    }

    if (d === ".db" || d === ".dw" || d === ".ascii") {
      const start = ensurePc();
      const data: Byte[] = [];

      if (d === ".ascii") {
        const str = args.find((t) => t.kind === "string");
        if (str === undefined) {
          problem(stmt, args[0]?.col ?? 1, ".ascii espera uma string");
        } else {
          if (args.length > 1) problem(stmt, args[1].col, ".ascii aceita uma única string");
          for (const ch of str.value) data.push(ch.charCodeAt(0) & 0xff);
        }
      } else {
        const unit = d === ".dw" ? 2 : 1;
        const operands = args.filter((t) => t.kind === "number" || t.kind === "symbol");
        if (operands.length === 0) {
          problem(stmt, args[0]?.col ?? 1, `${d} espera ao menos um valor`);
        }
        for (const t of operands) {
          const v = termValue(t, stmt);
          if (v === null) continue;
          if (unit === 1 && (v < -128 || v > 255)) {
            problem(stmt, t.col, `não cabe em um byte: ${v}`);
            continue;
          }
          if (unit === 2 && (v < 0 || v > 0xffff)) {
            problem(stmt, t.col, `não cabe em 16 bits: ${v}`);
            continue;
          }
          if (unit === 1) data.push(v & 0xff);
          else data.push(v & 0xff, (v >>> 8) & 0xff);
        }
      }

      if (origin === null && data.length > 0) origin = start;
      plans.push({ stmt, addr: start, size: data.length, data });
      pc = (start + data.length) & 0xffff;
      return;
    }

    problem(stmt, 1, `diretiva desconhecida: ${d}`);
    plans.push({ stmt, addr: ensurePc(), size: 0 });
  }

  for (const stmt of stmts) {
    if (stmt.label !== undefined) {
      define(stmt.label, ensurePc(), "label", stmt.line, 1);
    }

    if (stmt.directive !== undefined) handleDirective(stmt);
    else if (stmt.mnemonic !== undefined) handleMnemonic(stmt);
    else if (stmt.label !== undefined) {
      plans.push({ stmt, addr: ensurePc(), size: 0 });
    }
  }

  return { origin: origin ?? DEFAULT_ORIGIN, plans, labels, constants };
}
