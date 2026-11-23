import { Byte, Word, asByte, hiByte, loByte } from "../core/bytes.js";
import type { Pass1Result } from "./pass1.js";
import type { AsmProblem } from "./lexer.js";
import type { Statement, Term } from "./parser.js";
import { buildListing, collectBytes } from "./emitter.js";
import type { ListingLine } from "./emitter.js";

export interface Pass2Result {
  origin: Word;
  bytes: Byte[];
  listing: string;
  entries: ListingLine[];
}

/**
 * Segunda passada: resolve símbolos (rótulos agora estão todos definidos), calcula desvios
 * relativos e emite os bytes finais + listing.
 */
export function pass2(p1: Pass1Result, file: string, problems: AsmProblem[]): Pass2Result {
  const cells = new Map<Word, Byte>();
  const lines: ListingLine[] = [];

  const problem = (stmt: Statement, message: string): void => {
    problems.push({ file, line: stmt.line, col: stmt.argCol || 1, message });
  };

  const resolve = (term: Term, stmt: Statement): number | null => {
    if (term.kind === "num") return term.value;
    const entry = p1.constants.get(term.name) ?? p1.labels.get(term.name);
    if (entry === undefined) {
      problem(stmt, `símbolo não definido: ${term.name}`);
      return null;
    }
    return entry.value;
  };

  for (const plan of p1.plans) {
    const { stmt, addr } = plan;
    const out: Byte[] = [];

    if (plan.data !== undefined) {
      out.push(...plan.data);
    } else if (plan.opcode !== undefined && plan.mode !== undefined) {
      out.push(plan.opcode);
      const arg = stmt.arg;
      let target: number | null = null;
      if (arg !== undefined) {
        target = resolve(arg.term, stmt);
        if (target === null) {
          lines.push({ addr, bytes: out, raw: stmt.raw, line: stmt.line });
          continue; // erro já anotado
        }
      }

      const bad = (message: string): void => problem(stmt, message);

      switch (plan.mode) {
        case "impl":
          break;
        case "imm": {
          const arg = stmt.arg;
          if (arg !== undefined && arg.kind === "imm" && arg.part !== undefined) {
            if (target === null || target < 0 || target > 0xffff) bad("endereço fora de 16 bits");
            else out.push(arg.part === "lo" ? loByte(target) : hiByte(target));
            break;
          }
          if (target === null || target < -128 || target > 255) bad("não cabe em um byte");
          else out.push(asByte(target));
          break;
        }
        case "zp":
        case "indY":
          if (target === null || target < 0 || target > 0xff) {
            bad("endereço de zero page inválido");
          } else out.push(target);
          break;
        case "abs":
        case "absX":
          if (target === null || target < 0 || target > 0xffff) {
            bad("endereço fora de 16 bits");
          } else out.push(loByte(target), hiByte(target));
          break;
        case "rel": {
          const offset = (target ?? 0) - (addr + 2);
          if (offset < -128 || offset > 127) {
            bad(`desvio fora de alcance: ${offset} bytes (máximo 127)`);
          } else out.push(asByte(offset));
          break;
        }
      }
    }

    out.forEach((b, k) => cells.set((addr + k) & 0xffff, b));
    lines.push({ addr, bytes: out, raw: stmt.raw, line: stmt.line });
  }

  const { origin, bytes } = collectBytes(cells);
  return { origin, bytes, listing: buildListing(lines, p1), entries: lines };
}
