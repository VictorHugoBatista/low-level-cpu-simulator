import {
  fecharContexto,
  normalizarProgresso,
  progress,
  restaurarProgresso,
  openExercise,
} from "./exerciseState.js";
import type { ExerciseProgress } from "./exerciseState.js";
import { marcadorAtual, normalizarMarcador, restaurarMarcador } from "./marcador.js";
import type { MarcadorState } from "./marcador.js";
import { TRACKS } from "./exerciseCatalog.js";
import type { Store } from "./store.js";

/**
 * Salvar e carregar o progresso da pessoa em arquivo. O progresso (níveis resolvidos,
 * rascunhos, dicas e melhores rodadas) já vive em localStorage — preso ao navegador:
 * trocar de máquina ou limpar os dados do site perde tudo. Aqui ele vira um arquivo
 * `.json` que a pessoa baixa e volta a carregar quando quiser, em qualquer navegador.
 *
 * O arquivo é um save game: carregar SUBSTITUI o estado corrente, sem merge — evita
 * misturar o progresso de duas pessoas num só estado. A validação é em duas camadas,
 * no mesmo espírito dos shape guards do localStorage: os marcadores de topo (app,
 * version) rejeitam o arquivo inteiro com erro claro; os campos internos são
 * normalizados campo a campo e dado estranho vira default, nunca derruba a página.
 */

export const PROGRESSO_APP = "mos6502-simulador";
export const PROGRESSO_VERSION = 1;

export interface ProgressoSalvo {
  app: string;
  version: number;
  /** Data ISO do momento em que foi salvo; informativa. */
  savedAt: string;
  exercises: ExerciseProgress;
  marcador: MarcadorState;
}

/** Erro claro para arquivo que não serve (JSON inválido, de outro app ou de versão
 * que esta página não sabe ler). O campo interno estranho NÃO é erro — é normalizado. */
export class ProgressoInvalidoError extends Error {
  constructor(motivo: string) {
    super(`arquivo de progresso inválido: ${motivo}`);
    this.name = "ProgressoInvalidoError";
  }
}

export function serializarProgresso(p: ProgressoSalvo): string {
  return JSON.stringify(p, null, 2);
}

/** Lê o conteúdo de um arquivo de progresso. Rejeita com erro claro o que não é um
 * progresso deste simulador (ou de versão futura); normaliza o que for, campo a campo. */
export function parseProgresso(texto: string): ProgressoSalvo {
  let parsed: unknown;
  try {
    parsed = JSON.parse(texto);
  } catch {
    throw new ProgressoInvalidoError("o conteúdo não é JSON válido");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ProgressoInvalidoError("o conteúdo não é um objeto");
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.app !== PROGRESSO_APP) {
    throw new ProgressoInvalidoError("este arquivo não é um progresso deste simulador");
  }
  if (obj.version !== PROGRESSO_VERSION) {
    throw new ProgressoInvalidoError(
      `versão ${String(obj.version)} não suportada — esta página lê a versão ${PROGRESSO_VERSION}`,
    );
  }
  return {
    app: PROGRESSO_APP,
    version: PROGRESSO_VERSION,
    savedAt: typeof obj.savedAt === "string" ? obj.savedAt : "",
    exercises: normalizarProgresso(obj.exercises),
    marcador: normalizarMarcador(obj.marcador),
  };
}

/** Nome do arquivo baixado, com a data do dia: ak8-progresso-2026-11-27.json. */
export function nomeArquivoProgresso(agora = new Date()): string {
  return `ak8-progresso-${agora.toISOString().slice(0, 10)}.json`;
}

/** Reúne o progresso corrente (níveis, rascunhos, dicas e marcas) num arquivo. */
export function coletarProgresso(): ProgressoSalvo {
  return {
    app: PROGRESSO_APP,
    version: PROGRESSO_VERSION,
    savedAt: new Date().toISOString(),
    exercises: progress(),
    marcador: marcadorAtual(),
  };
}

/** Restaura o progresso de um arquivo: níveis, rascunhos, dicas e marcas passam a ser
 * os do arquivo, e o último exercício aberto reabre no editor com o rascunho salvo —
 * a pessoa continua de onde parou, mesmo em outra máquina. Sem último exercício
 * conhecido, o contexto velho fecha: nada da sessão anterior sobrevive à troca. */
export function aplicarProgresso(p: ProgressoSalvo, s: Store): void {
  restaurarProgresso(p.exercises);
  restaurarMarcador(p.marcador);
  const id = p.exercises.last;
  const def = id === undefined ? undefined : TRACKS.flatMap((t) => t.exercises).find((d) => d.id === id);
  if (def !== undefined) openExercise(def, s);
  else fecharContexto();
}
