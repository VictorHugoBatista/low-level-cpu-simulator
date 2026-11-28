/**
 * Lexer do assembler: transforma o fonte em tokens por linha física.
 * Comentários começam em ";" e são cortados aqui; strings e literais de caractere
 * já saem decodificados. Problemas vão para a lista de problemas, não interrompem.
 */

export type TokenKind =
  | "hash"
  | "lparen"
  | "rparen"
  | "comma"
  | "colon"
  | "lt"
  | "gt"
  | "number"
  | "symbol"
  | "directive"
  | "string";

export interface Token {
  kind: TokenKind;
  /** Texto original (símbolos, diretivas) ou já decodificado (strings). */
  value: string;
  /** Valor decodificado, quando kind é "number". */
  num?: number;
  col: number;
}

export interface AsmProblem {
  file: string;
  line: number;
  col: number;
  message: string;
}

const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  "\\": "\\",
  '"': '"',
  "'": "'",
  "0": "\0",
};

export function tokenize(source: string, file: string, problems: AsmProblem[]): Token[][] {
  return source.split(/\r?\n/).map((raw, i) => tokenizeLine(raw, i + 1, file, problems));
}

export function tokenizeLine(text: string, line: number, file: string, problems: AsmProblem[]): Token[] {
  const tokens: Token[] = [];
  const fail = (col: number, message: string): void => {
    problems.push({ file, line, col, message });
  };
  const pushNumber = (value: number, col: number): void => {
    tokens.push({ kind: "number", value: String(value), num: value, col });
  };

  let i = 0;
  while (i < text.length) {
    const col = i + 1;
    const ch = text[i];

    if (ch === ";") break; // comentário até o fim da linha
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }

    if (ch === "#") {
      tokens.push({ kind: "hash", value: ch, col });
      i++;
      continue;
    }
    if (ch === "(" || ch === ")" || ch === "," || ch === ":") {
      const kind =
        ch === "(" ? "lparen" : ch === ")" ? "rparen" : ch === "," ? "comma" : "colon";
      tokens.push({ kind, value: ch, col });
      i++;
      continue;
    }

    if (ch === "<" || ch === ">") {
      const kind = ch === "<" ? "lt" : "gt";
      tokens.push({ kind, value: ch, col });
      i++;
      continue;
    }

    if (ch === "$") {
      const rest = text.slice(i + 1).match(/^[0-9a-fA-F]+/);
      if (rest === null) {
        fail(col, "número hexadecimal esperado após $");
        i++;
        continue;
      }
      pushNumber(parseInt(rest[0], 16), col);
      i += 1 + rest[0].length;
      continue;
    }

    if (ch === "%") {
      const rest = text.slice(i + 1).match(/^[01]+/);
      if (rest === null) {
        fail(col, "número binário esperado após %");
        i++;
        continue;
      }
      pushNumber(parseInt(rest[0], 2), col);
      i += 1 + rest[0].length;
      continue;
    }

    if (/\d/.test(ch) || (ch === "-" && /\d/.test(text[i + 1] ?? ""))) {
      const rest = text.slice(i).match(/^-?\d+/);
      if (rest === null) {
        fail(col, "número inválido");
        i++;
        continue;
      }
      pushNumber(parseInt(rest[0], 10), col);
      i += rest[0].length;
      continue;
    }

    if (ch === "'") {
      // literal de caractere: 'A' ou escapes como '\n'
      if (text[i + 1] === "\\") {
        const esc = ESCAPES[text[i + 2] ?? ""];
        if (esc === undefined || text[i + 3] !== "'") {
          fail(col, "literal de caractere inválido");
          i = text.length;
          continue;
        }
        pushNumber(esc.charCodeAt(0), col);
        i += 4;
        continue;
      }
      if (text[i + 1] !== undefined && text[i + 2] === "'") {
        pushNumber(text.charCodeAt(i + 1), col);
        i += 3;
        continue;
      }
      fail(col, "literal de caractere inválido");
      i = text.length;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      let out = "";
      let closed = false;
      while (j < text.length) {
        const c = text[j];
        if (c === "\\") {
          const esc = ESCAPES[text[j + 1] ?? ""];
          if (esc === undefined) {
            fail(j + 1, `escape desconhecido: \\${text[j + 1] ?? ""}`);
            j += 2;
            continue;
          }
          out += esc;
          j += 2;
        } else if (c === '"') {
          closed = true;
          j++;
          break;
        } else {
          out += c;
          j++;
        }
      }
      if (!closed) fail(col, "string sem fechar");
      tokens.push({ kind: "string", value: out, col });
      i = j;
      continue;
    }

    if (ch === ".") {
      const rest = text.slice(i).match(/^\.[A-Za-z]+/);
      if (rest === null) {
        fail(col, "diretiva inválida");
        i++;
        continue;
      }
      tokens.push({ kind: "directive", value: rest[0].toLowerCase(), col });
      i += rest[0].length;
      continue;
    }

    const sym = text.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (sym !== null) {
      tokens.push({ kind: "symbol", value: sym[0], col });
      i += sym[0].length;
      continue;
    }

    fail(col, `caractere inesperado: "${ch}"`);
    i++;
  }

  return tokens;
}
