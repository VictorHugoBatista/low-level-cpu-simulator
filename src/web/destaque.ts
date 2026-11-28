/**
 * Destaque de sintaxe do fonte em assembly para o editor: produz, por linha
 * física, os trechos com a classe de cor — só dados, sem HTML nem DOM (o
 * componente escapa e renderiza). A tokenização é a do assembler (lexer.ts,
 * fonte única): o que o destaque acende é exatamente o que o montador entende.
 */
import { tokenizeLine, type AsmProblem, type Token } from "../asm/lexer.js";
import { OPCODES } from "../cpu/opcodes.js";

/** Mnemônicos válidos, derivados da tabela congelada de opcodes — nunca uma
 * lista paralela que possa divergir dela. */
const MNEMONICOS: ReadonlySet<string> = new Set(
  Object.values(OPCODES).map((info) => info.mnemonic.toLowerCase()),
);

export type ClasseDestaque = "com" | "num" | "dir" | "mne" | "lab" | "sim" | "str" | "op";

export interface Trecho {
  texto: string;
  /** undefined nos espaços entre tokens: não há cor especial a aplicar. */
  classe?: ClasseDestaque;
}

/** Fonte → trechos por linha física (a mesma quebra "\n" do gutter do editor). */
export function destacar(fonte: string): Trecho[][] {
  return fonte.split("\n").map(destacarLinha);
}

function destacarLinha(texto: string): Trecho[] {
  const problemas: AsmProblem[] = [];
  const tokens = tokenizeLine(texto, 1, "destaque", problemas);
  if (tokens.length === 0) {
    // Sem tokens: linha vazia, só de espaços (nada a acender) ou de comentário
    // (a linha inteira é comentário).
    const comeco = texto.indexOf(";");
    return comeco === -1 ? [] : [{ texto, classe: "com" }];
  }

  const trechos: Trecho[] = [];
  let pos = 0; // início do pedaço ainda não classificado (0-based)
  const ultimo = tokens.length - 1;

  tokens.forEach((token, j) => {
    const inicio = token.col - 1;
    if (inicio > pos) trechos.push({ texto: texto.slice(pos, inicio) });
    // Os tokens intermediários terminam onde o próximo começa (o vão entre eles
    // é só espaço); o último termina onde o lexer parou — o ";" do comentário
    // final, ou o fim da linha.
    const fim =
      j < ultimo ? tokens[j + 1].col - 1 : fimDaUltimaToken(texto, token, inicio);
    trechos.push({
      texto: texto.slice(inicio, fim),
      classe: classeDoToken(token, tokens[j + 1]),
    });
    pos = fim;
  });

  // O que sobrou do último token em diante é o comentário da linha.
  if (pos < texto.length) trechos.push({ texto: texto.slice(pos), classe: "com" });
  return trechos;
}

function classeDoToken(token: Token, seguinte: Token | undefined): ClasseDestaque {
  switch (token.kind) {
    case "number":
      return "num";
    case "directive":
      return "dir";
    case "string":
      return "str";
    case "symbol":
      // Símbolo seguido de ":" define label; se está na tabela congelada, é
      // mnemônico; qualquer outro é símbolo comum (operando, referência).
      if (seguinte?.kind === "colon") return "lab";
      return MNEMONICOS.has(token.value.toLowerCase()) ? "mne" : "sim";
    default:
      return "op"; // #, ( ), vírgula, : , < >
  }
}

/** Fim do último token da linha: o ";" que encerrou a lexação (início do
 * comentário) ou o fim da linha. Para literais entre aspas, o ";" pode ser
 * conteúdo — acha primeiro a aspa de fechamento. */
function fimDaUltimaToken(texto: string, token: Token, inicio: number): number {
  const aspa = texto[inicio];
  const fimBruto = aspa === '"' || aspa === "'" ? fecharLiteral(texto, inicio) : undefined;
  const comecoComentario = texto.indexOf(";", fimBruto ?? inicio);
  return comecoComentario === -1 ? texto.length : comecoComentario;
}

/** Fim bruto de um literal citado: a posição depois da aspa de fechamento,
 * saltando escapes "\\". Sem fechamento, vai até o fim da linha — o lexer já
 * registrou o problema ("string sem fechar"). */
function fecharLiteral(texto: string, inicio: number): number {
  const aspa = texto[inicio];
  for (let i = inicio + 1; i < texto.length; i++) {
    if (texto[i] === "\\") {
      i++;
      continue;
    }
    if (texto[i] === aspa) return i + 1;
  }
  return texto.length;
}
