import { OPCODES } from "../cpu/opcodes.js";
import type { AsmProblem, Token } from "./lexer.js";

export type Term = { kind: "num"; value: number } | { kind: "sym"; name: string };

export type Arg =
  | { kind: "imm"; term: Term; part?: "lo" | "hi" }
  | { kind: "plain"; term: Term }
  | { kind: "indexX"; term: Term }
  | { kind: "indexY"; term: Term }
  | { kind: "parens"; term: Term };

export interface Statement {
  file: string;
  line: number;
  /** Linha original, para o listing. */
  raw: string;
  label?: string;
  /** Mnemônico, sempre em maiúsculas. */
  mnemonic?: string;
  /** Diretiva, sempre em minúsculas (.org, .equ, .db, .dw, .ascii). */
  directive?: string;
  dirArgs: Token[];
  arg?: Arg;
  argCol: number;
}

class ParseAbort {}

const MNEMONICS = new Set<string>(Object.values(OPCODES).map((info) => info.mnemonic));

export function parse(
  source: string,
  file: string,
  tokens: Token[][],
  problems: AsmProblem[],
): Statement[] {
  const lines = source.split(/\r?\n/);
  return lines.map((raw, idx) => parseLine(raw, idx + 1, file, tokens[idx] ?? [], problems));
}

function parseLine(
  raw: string,
  line: number,
  file: string,
  toks: Token[],
  problems: AsmProblem[],
): Statement {
  const stmt: Statement = { file, line, raw, dirArgs: [], argCol: 0 };
  const fail = (col: number, message: string): never => {
    problems.push({ file, line, col, message });
    throw new ParseAbort();
  };
  let i = 0;

  const parseTerm = (): Term => {
    const t = toks[i];
    if (t === undefined) fail(toks[i - 1]?.col ?? 1, "operando esperado");
    if (t.kind === "number") {
      i++;
      return { kind: "num", value: t.num ?? 0 };
    }
    if (t.kind === "symbol") {
      i++;
      return { kind: "sym", name: t.value };
    }
    return fail(t.col, `operando inesperado: ${t.value}`);
  };

  const parseArg = (): Arg => {
    const t = toks[i];

    if (t.kind === "hash") {
      i++;
      // #<expr e #>expr: byte baixo / byte alto (bootstrap de ponteiro na página zero)
      let part: "lo" | "hi" | undefined;
      if (toks[i]?.kind === "lt") {
        part = "lo";
        i++;
      } else if (toks[i]?.kind === "gt") {
        part = "hi";
        i++;
      }
      return { kind: "imm", term: parseTerm(), part };
    }

    if (t.kind === "lparen") {
      i++;
      const term = parseTerm();
      if (toks[i]?.kind !== "rparen") fail(t.col, "esperava ) no modo indireto");
      i++;
      if (toks[i]?.kind === "comma") {
        i++;
        const reg = toks[i];
        if (reg === undefined || reg.kind !== "symbol") {
          fail(reg?.col ?? t.col, "esperava X ou Y após a vírgula");
        }
        i++;
        if (reg.value.toUpperCase() === "X") {
          fail(reg.col, "o modo (zp),X não existe na ISA — use abs,X");
        }
        if (reg.value.toUpperCase() !== "Y") {
          fail(reg.col, "esperava Y após a vírgula");
        }
        return { kind: "indexY", term };
      }
      return { kind: "parens", term };
    }

    const term = parseTerm();
    if (toks[i]?.kind === "comma") {
      i++;
      const reg = toks[i];
      if (reg === undefined || reg.kind !== "symbol" || reg.value.toUpperCase() !== "X") {
        fail(reg?.col ?? t.col, "esperava X após a vírgula (o modo ,Y só existe como ($nn),Y)");
      }
      i++;
      return { kind: "indexX", term };
    }
    return { kind: "plain", term };
  };

  try {
    // rótulo: símbolo seguido de ":"
    if (toks[i]?.kind === "symbol" && toks[i + 1]?.kind === "colon") {
      stmt.label = toks[i].value;
      i += 2;
    }

    if (i >= toks.length) return stmt;

    if (toks[i].kind === "directive") {
      stmt.directive = toks[i].value;
      i++;
      stmt.dirArgs = toks.slice(i);
      return stmt;
    }

    if (toks[i].kind === "symbol" && MNEMONICS.has(toks[i].value.toUpperCase())) {
      stmt.mnemonic = toks[i].value.toUpperCase();
      i++;
      if (i < toks.length) {
        stmt.argCol = toks[i].col;
        stmt.arg = parseArg();
        if (i < toks.length) fail(toks[i].col, "conteúdo inesperado após o operando");
      }
      return stmt;
    }

    fail(toks[i].col, `instrução desconhecida: ${toks[i].value}`);
  } catch (e) {
    if (!(e instanceof ParseAbort)) throw e;
  }
  return stmt;
}
