import { Byte, Word, hex2, hex4 } from "../core/bytes.js";
import type { Pass1Result } from "./pass1.js";
import type { AsmProblem } from "./lexer.js";
import type { Statement, Term } from "./parser.js";

export interface ListingLine {
  addr: Word;
  bytes: Byte[];
  raw: string;
  /** Número da linha no fonte (1-based), para o painel do programa no navegador. */
  line: number;
}

export interface AssembledOutput {
  origin: Word;
  bytes: Byte[];
}

/** Espalha os bytes em um mapa esparso e devolve o bloco contíguo (buracos viram $00). */
export function collectBytes(cells: Map<Word, Byte>): AssembledOutput {
  if (cells.size === 0) return { origin: 0x0200, bytes: [] };
  let min = 0xffff;
  let max = 0;
  for (const k of cells.keys()) {
    if (k < min) min = k;
    if (k > max) max = k;
  }
  const bytes: Byte[] = [];
  for (let a = min; a <= max; a++) bytes.push(cells.get(a) ?? 0x00);
  return { origin: min, bytes };
}

export function buildListing(lines: ListingLine[], p1: Pass1Result): string {
  const out: string[] = [];
  for (const l of lines) {
    const byteStr = l.bytes.map(hex2).join(" ").padEnd(8);
    out.push(`${hex4(l.addr)}  ${byteStr}  ${l.raw.trim()}`);
  }
  const symbols = [...p1.labels, ...p1.constants].sort(([a], [b]) => a.localeCompare(b));
  if (symbols.length > 0) {
    out.push("", "símbolos:");
    for (const [name, entry] of symbols) {
      out.push(`  ${name} = $${hex4(entry.value)}${entry.kind === "const" ? " (const)" : ""}`);
    }
  }
  return out.join("\n") + "\n";
}
