import { Byte, Word } from "../core/bytes.js";
import { tokenize } from "./lexer.js";
import type { AsmProblem } from "./lexer.js";
import { parse } from "./parser.js";
import { pass1 } from "./pass1.js";
import { pass2 } from "./pass2.js";
import type { ListingLine } from "./emitter.js";

export interface AsmResult {
  origin: Word;
  bytes: Byte[];
  listing: string;
  /** Listing estruturado, para o painel do programa no navegador. */
  entries: ListingLine[];
}

export class AsmError extends Error {
  constructor(public readonly problems: readonly AsmProblem[]) {
    super(problems.map((p) => `${p.file}:${p.line}:${p.col}: ${p.message}`).join("\n"));
    this.name = "AsmError";
  }
}

/** Monta um fonte completo: lexer → parser → passada 1 → passada 2. */
export function assemble(source: string, file = "programa.asm"): AsmResult {
  const problems: AsmProblem[] = [];
  const tokens = tokenize(source, file, problems);
  const stmts = parse(source, file, tokens, problems);
  const first = pass1(stmts, file, problems);
  const second = pass2(first, file, problems);
  if (problems.length > 0) throw new AsmError(problems);
  return { origin: second.origin, bytes: second.bytes, listing: second.listing, entries: second.entries };
}
